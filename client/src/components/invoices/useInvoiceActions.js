"use client";

import { useState, useCallback } from "react";
import { uploadInvoiceToDrive, sendDocumentEmail } from "@/services/clientService";
import { exportInvoiceToPdf, getInvoicePdfBlob } from "@/lib/Pdfexport";
import { API_BASE_URL } from "@/services/apiClient";
import { shareFileNatively, buildWhatsAppUrl } from "@/lib/documentShare";

export function useInvoiceActions({ invoiceSheetRef, invoiceNumber, dueDate, grandTotal, selectedClientId, selectedClient }) {
  const [isSavingPdf, setIsSavingPdf] = useState(false);
  const [isSavingToDrive, setIsSavingToDrive] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const handleSavePdf = useCallback(async () => {
    if (!invoiceSheetRef.current) return;
    setIsSavingPdf(true);
    try {
      await exportInvoiceToPdf(invoiceSheetRef.current, `Invoice-${invoiceNumber || "draft"}.pdf`);
    } catch (e) {
      console.error("PDF generation failed:", e);
      window.print();
    } finally {
      setIsSavingPdf(false);
    }
  }, [invoiceSheetRef, invoiceNumber]);

  const handleSaveToDrive = useCallback(async () => {
    if (!invoiceSheetRef.current || !selectedClientId) return;
    setIsSavingToDrive(true);
    try {
      const pdfBlob = await getInvoicePdfBlob(invoiceSheetRef.current);
      await uploadInvoiceToDrive(pdfBlob, selectedClientId, invoiceNumber);
      alert("Invoice saved to Google Drive successfully!");
    } catch (e) {
      console.error("Google Drive upload failed:", e);
      alert(e.message || "Failed to save invoice to Google Drive. Please try again.");
    } finally {
      setIsSavingToDrive(false);
    }
  }, [invoiceSheetRef, invoiceNumber, selectedClientId]);

  // Uploads the invoice and returns the created Document record (id,
  // fileName, ...), used by both the WhatsApp and Email link-based
  // fallbacks below to build a direct PDF link or attach the file.
  const uploadInvoiceDocument = useCallback(
    async (pdfBlob) => {
      if (!selectedClientId) return null;
      const result = await uploadInvoiceToDrive(pdfBlob, selectedClientId, invoiceNumber);
      return result?.data || null;
    },
    [selectedClientId, invoiceNumber]
  );

  // This intentionally does NOT use the Google Drive webViewLink — that
  // opens the Drive UI (a "preview" page), not the PDF itself. Instead it
  // points at this app's own /documents/:id/stream endpoint, which serves
  // the file with Content-Type: application/pdf so it opens/downloads as a
  // plain PDF. That route is public (no auth) by design — see
  // PUBLIC_ASSET_PATHS in server/index.js — specifically so links shared
  // with clients work without a login.
  const getDocumentPdfLink = (documentRecord) =>
    documentRecord?.id ? `${API_BASE_URL}/documents/${documentRecord.id}/stream` : null;

  const buildShareMessage = useCallback(
    ({ attached, pdfLink, downloadedLocally } = {}) => {
      const amount = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(grandTotal);

      let message = `Hi, please find your invoice ${invoiceNumber} for ${amount}, due ${dueDate}.`;

      if (attached) {
        // The PDF is attached directly (Web Share / real email send) — no
        // link needed.
      } else if (pdfLink) {
        message += `\n\nView / download: ${pdfLink}`;
      } else if (downloadedLocally) {
        message += `\n\n(The PDF has been downloaded on this device — please attach it here.)`;
      }

      return message;
    },
    [invoiceNumber, dueDate, grandTotal]
  );

  const handleSendWhatsApp = useCallback(
    async (destination) => {
      // The share menu passes the exact number the user picked (WhatsApp
      // vs general phone); fall back to the client record's preference.
      const targetNumber = destination || selectedClient?.whatsappNumber || selectedClient?.phoneNumber || selectedClient?.phone;
      if (!selectedClient || !targetNumber || !invoiceSheetRef.current) return;
      setIsSharing(true);
      try {
        const fileName = `Invoice-${invoiceNumber || "draft"}.pdf`;
        const pdfBlob = await getInvoicePdfBlob(invoiceSheetRef.current);

        // Preferred path: hand the actual PDF file to the OS/browser share
        // sheet so the user picks WhatsApp and the real file gets attached —
        // not a link. The trade-off is that the target chat can't be
        // pre-selected the way wa.me does, since the share sheet doesn't
        // accept a phone number. Any failure here falls through to the
        // upload+link flow below instead of aborting the whole share.
        try {
          const shareResult = await shareFileNatively({
            blob: pdfBlob,
            fileName,
            mimeType: "application/pdf",
            title: `Invoice ${invoiceNumber}`,
            text: buildShareMessage({ attached: true }),
          });
          if (shareResult === "shared" || shareResult === "cancelled") return;
        } catch {
          // Expected on browsers/devices without file-sharing support — the
          // upload+link flow below handles it. Deliberately not logged as a
          // warning/error: this is a normal, already-handled fallback path,
          // not a problem to surface.
        }

        // Fallback for browsers without file-sharing support (or where the
        // native attempt above failed): open a
        // placeholder tab synchronously (browsers block window.open() calls
        // that happen after async work like the upload below, since they're
        // no longer tied to the user's click), then navigate it to wa.me
        // once the message is ready.
        const waWindow = window.open("about:blank", "_blank");
        try {
          const documentRecord = await uploadInvoiceDocument(pdfBlob);
          const pdfLink = getDocumentPdfLink(documentRecord);
          let downloadedLocally = false;
          if (!pdfLink) {
            await exportInvoiceToPdf(invoiceSheetRef.current, fileName);
            downloadedLocally = true;
          }
          const message = buildShareMessage({ pdfLink, downloadedLocally });
          const waUrl = buildWhatsAppUrl(targetNumber, message);
          if (waWindow && !waWindow.closed) {
            waWindow.location.href = waUrl;
          } else {
            // Popup blocker removed even the placeholder tab — fall back to
            // same-tab navigation so sharing still works.
            window.location.href = waUrl;
          }
        } catch (e) {
          if (waWindow && !waWindow.closed) waWindow.close();
          throw e;
        }
      } catch (e) {
        console.error("Could not share via WhatsApp:", e);
        alert(e.message || "Could not share the invoice via WhatsApp. Please try again.");
      } finally {
        setIsSharing(false);
      }
    },
    [selectedClient, invoiceNumber, invoiceSheetRef, uploadInvoiceDocument, buildShareMessage]
  );

  const handleSendEmail = useCallback(async () => {
    if (!selectedClient || !selectedClient.email || !invoiceSheetRef.current) return;
    setIsSharing(true);
    try {
      const fileName = `Invoice-${invoiceNumber || "draft"}.pdf`;
      const pdfBlob = await getInvoicePdfBlob(invoiceSheetRef.current);
      const subject = `Invoice ${invoiceNumber} from Social Buzz Media`;

      let documentRecord = null;
      try {
        documentRecord = await uploadInvoiceDocument(pdfBlob);
      } catch {
        // Handled below: documentRecord stays null, so both the SMTP send
        // and the link fallback are skipped in favor of a local download.
      }

      // Preferred path: have the backend actually send the email with the
      // PDF attached, via SMTP (see server/src/utils/mailer.js). Requires
      // SMTP_HOST/SMTP_USER/SMTP_PASS to be configured in server/.env.
      if (documentRecord?.id) {
        try {
          await sendDocumentEmail(documentRecord.id, {
            to: selectedClient.email,
            subject,
            text: buildShareMessage({ attached: true }),
          });
          alert(`Invoice emailed to ${selectedClient.email}.`);
          return;
        } catch {
          // Expected when SMTP isn't configured yet or a send fails — the
          // mailto: fallback below handles it. Deliberately not logged as a
          // warning/error: this is a normal, already-handled fallback path.
        }
      }

      // Fallback: open the user's own mail app. mailto: can't carry an
      // attachment, so link to the direct PDF (or note it was downloaded)
      // instead.
      const pdfLink = getDocumentPdfLink(documentRecord);
      let downloadedLocally = false;
      if (!pdfLink) {
        await exportInvoiceToPdf(invoiceSheetRef.current, fileName);
        downloadedLocally = true;
      }
      const body = buildShareMessage({ pdfLink, downloadedLocally });
      // Navigating the current tab to a mailto: URL is not treated as a
      // popup, so this works even after the async upload above (unlike
      // window.open). If no mail client is configured the browser shows
      // its own "choose an app" prompt or does nothing gracefully.
      window.location.href = `mailto:${selectedClient.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    } catch (e) {
      console.error("Could not share via email:", e);
      alert(e.message || "Could not send the invoice email. Please try again.");
    } finally {
      setIsSharing(false);
    }
  }, [selectedClient, invoiceNumber, invoiceSheetRef, uploadInvoiceDocument, buildShareMessage]);

  return {
    isSavingPdf,
    isSavingToDrive,
    isSharing,
    handleSavePdf,
    handleSaveToDrive,
    handleSendWhatsApp,
    handleSendEmail,
  };
}
