"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { flushSync } from "react-dom";
import { uploadInvoiceToDrive, sendDocumentEmail } from "@/services/clientService";
import { exportInvoiceToPdf, getInvoicePdfBlob } from "@/lib/Pdfexport";
import { API_BASE_URL } from "@/services/apiClient";
import { shareFileNatively, buildWhatsAppUrl } from "@/lib/documentShare";
import { createInvoice, updateInvoice } from "@/services/paymentService";

const MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };

// The invoice document's own date fields are free text (they're part of
// the printed sheet, styled as invoice copy — not a real <input type=date>,
// which would visually break the template). This turns the "24 Aug 2026"
// style text this app already defaults to (and whatever close variant a
// user might type) into a real ISO date for the Payments ledger, without
// changing how the field looks or behaves on the invoice itself.
function parseFreeTextDate(text) {
  if (!text) return null;
  const trimmed = text.trim();
  const m = trimmed.match(/^(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})$/);
  if (m) {
    const month = MONTHS[m[2].slice(0, 3).toLowerCase()];
    const day = parseInt(m[1], 10);
    const year = parseInt(m[3], 10);
    if (month !== undefined && day >= 1 && day <= 31) {
      const date = new Date(Date.UTC(year, month, day));
      if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 10);
    }
  }
  const fallback = new Date(trimmed);
  return Number.isNaN(fallback.getTime()) ? null : fallback.toISOString().slice(0, 10);
}

export function useInvoiceActions({
  invoiceSheetRef,
  reportPageRefs,
  invoiceNumber,
  onInvoiceNumberSync,
  issuedDate,
  dueDate,
  grandTotal,
  rows,
  discount,
  gstRate,
  selectedClientId,
  selectedClient,
}) {
  const [isSavingPdf, setIsSavingPdf] = useState(false);
  const [isSavingToDrive, setIsSavingToDrive] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  // Tracks the Payments-ledger Invoice this builder session is keeping in
  // sync, so a second "Save to Drive" on the same invoice updates it
  // instead of creating a duplicate. Reset whenever the selected client
  // changes — a different client means a genuinely different invoice.
  const [syncStatus, setSyncStatus] = useState("idle"); // idle | syncing | synced | error
  const [syncError, setSyncError] = useState("");
  const syncedInvoiceIdRef = useRef(null);
  const syncedClientIdRef = useRef(null);

  useEffect(() => {
    if (syncedClientIdRef.current && syncedClientIdRef.current !== selectedClientId) {
      syncedInvoiceIdRef.current = null;
      setSyncStatus("idle");
      setSyncError("");
    }
    syncedClientIdRef.current = selectedClientId;
  }, [selectedClientId]);

  // Creates (first time) or updates (every time after) the real, persisted
  // Invoice record behind this on-screen document, so it shows up in the
  // Payments module's dues/overdue/outstanding tracking immediately —
  // never just the exported PDF. Non-fatal on failure: the caller still
  // gets its PDF either way, just with a visible warning that the ledger
  // wasn't updated.
  const syncToPayments = useCallback(async () => {
    if (!selectedClientId) return null;
    const validRows = (rows || []).filter((r) => r.desc?.trim() && r.qty > 0 && r.rate > 0);
    if (validRows.length === 0) {
      setSyncStatus("error");
      setSyncError("Add at least one priced line item to sync this invoice to Payments.");
      return null;
    }
    const parsedDueDate = parseFreeTextDate(dueDate);
    if (!parsedDueDate) {
      setSyncStatus("error");
      setSyncError(`Could not read the due date "${dueDate}" as a date — try a format like "07 Sep 2026".`);
      return null;
    }
    const parsedInvoiceDate = parseFreeTextDate(issuedDate);

    setSyncStatus("syncing");
    setSyncError("");
    try {
      const payload = {
        invoiceDate: parsedInvoiceDate || undefined,
        dueDate: parsedDueDate,
        lineItems: validRows.map((r) => ({ description: r.desc.trim(), quantity: r.qty, unitPricePaise: Math.round(r.rate * 100) })),
        discountPaise: Math.round((discount || 0) * 100),
        taxRateBasisPoints: Math.round((gstRate || 0) * 100),
      };
      const result = syncedInvoiceIdRef.current
        ? await updateInvoice(syncedInvoiceIdRef.current, payload)
        : await createInvoice({ clientId: selectedClientId, invoiceNumber, issueImmediately: true, ...payload });

      syncedInvoiceIdRef.current = result.data.id;
      setSyncStatus("synced");
      // flushSync forces this state update to commit and re-render before
      // we return — the caller captures invoiceSheetRef.current into a PDF
      // right after this resolves, so the on-screen number (part of the
      // printed sheet itself) must already match what's now in the ledger.
      if (onInvoiceNumberSync && result.data.invoiceNumber !== invoiceNumber) {
        flushSync(() => onInvoiceNumberSync(result.data.invoiceNumber));
      }
      return result.data;
    } catch (err) {
      setSyncStatus("error");
      setSyncError(err.message || "Failed to sync this invoice to Payments.");
      return null;
    }
  }, [selectedClientId, rows, dueDate, issuedDate, discount, gstRate, invoiceNumber, onInvoiceNumberSync]);

  // reportPageRefs.current can briefly contain nulls (a page unmounting/
  // remounting as the image layout recomputes) — filter those out right
  // before every use rather than trying to keep the array itself pristine.
  // [reportPageRefs] is a correct, stable dependency (ref objects never
  // change identity) even though the callback reads .current — a known
  // false-positive shape for the React Compiler's stricter static check.
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const getReportPageNodes = useCallback(() => (reportPageRefs?.current || []).filter(Boolean), [reportPageRefs]);

  const handleSavePdf = useCallback(async () => {
    if (!invoiceSheetRef.current) return;
    setIsSavingPdf(true);
    try {
      await exportInvoiceToPdf(invoiceSheetRef.current, `Invoice-${invoiceNumber || "draft"}.pdf`, getReportPageNodes());
    } catch (e) {
      console.error("PDF generation failed:", e);
      window.print();
    } finally {
      setIsSavingPdf(false);
    }
  }, [invoiceSheetRef, invoiceNumber, getReportPageNodes]);

  const handleSaveToDrive = useCallback(async () => {
    if (!invoiceSheetRef.current || !selectedClientId) return;
    setIsSavingToDrive(true);
    try {
      // Synced first: if this is the invoice's first save, its displayed
      // number is replaced with the real ledger-assigned one (and the DOM
      // is force-updated via flushSync inside syncToPayments) before the
      // PDF below is captured, so the saved file and the Payments record
      // always agree on the same number.
      const syncResult = await syncToPayments();
      const effectiveNumber = syncResult?.invoiceNumber || invoiceNumber;
      const pdfBlob = await getInvoicePdfBlob(invoiceSheetRef.current, getReportPageNodes());
      await uploadInvoiceToDrive(pdfBlob, selectedClientId, effectiveNumber);
      alert(
        syncResult
          ? "Invoice saved to Google Drive and synced to Payments."
          : `Invoice saved to Google Drive. ${syncError || "It was not synced to Payments."}`
      );
    } catch (e) {
      console.error("Google Drive upload failed:", e);
      alert(e.message || "Failed to save invoice to Google Drive. Please try again.");
    } finally {
      setIsSavingToDrive(false);
    }
  }, [invoiceSheetRef, invoiceNumber, selectedClientId, getReportPageNodes, syncToPayments, syncError]);

  // Uploads the invoice (+ any report pages) and returns the created
  // Document record (id, fileName, ...), used by both the WhatsApp and
  // Email link-based fallbacks below to build a direct PDF link or attach
  // the file.
  const uploadInvoiceDocument = useCallback(
    async (pdfBlob, invoiceNumberOverride) => {
      if (!selectedClientId) return null;
      const result = await uploadInvoiceToDrive(pdfBlob, selectedClientId, invoiceNumberOverride || invoiceNumber);
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
    ({ attached, pdfLink, downloadedLocally, invoiceNumberOverride } = {}) => {
      const amount = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(grandTotal);

      let message = `Hi, please find your invoice ${invoiceNumberOverride || invoiceNumber} for ${amount}, due ${dueDate}.`;

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
        const syncResult = await syncToPayments();
        const effectiveNumber = syncResult?.invoiceNumber || invoiceNumber;
        const fileName = `Invoice-${effectiveNumber || "draft"}.pdf`;
        const pdfBlob = await getInvoicePdfBlob(invoiceSheetRef.current, getReportPageNodes());

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
            title: `Invoice ${effectiveNumber}`,
            text: buildShareMessage({ attached: true, invoiceNumberOverride: effectiveNumber }),
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
          const documentRecord = await uploadInvoiceDocument(pdfBlob, effectiveNumber);
          const pdfLink = getDocumentPdfLink(documentRecord);
          let downloadedLocally = false;
          if (!pdfLink) {
            await exportInvoiceToPdf(invoiceSheetRef.current, fileName, getReportPageNodes());
            downloadedLocally = true;
          }
          const message = buildShareMessage({ pdfLink, downloadedLocally, invoiceNumberOverride: effectiveNumber });
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
    [selectedClient, invoiceNumber, invoiceSheetRef, uploadInvoiceDocument, buildShareMessage, getReportPageNodes, syncToPayments]
  );

  const handleSendEmail = useCallback(async () => {
    if (!selectedClient || !selectedClient.email || !invoiceSheetRef.current) return;
    setIsSharing(true);
    try {
      const syncResult = await syncToPayments();
      const effectiveNumber = syncResult?.invoiceNumber || invoiceNumber;
      const fileName = `Invoice-${effectiveNumber || "draft"}.pdf`;
      const pdfBlob = await getInvoicePdfBlob(invoiceSheetRef.current, getReportPageNodes());
      const subject = `Invoice ${effectiveNumber} from Social Buzz Media`;

      let documentRecord = null;
      try {
        documentRecord = await uploadInvoiceDocument(pdfBlob, effectiveNumber);
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
            text: buildShareMessage({ attached: true, invoiceNumberOverride: effectiveNumber }),
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
        await exportInvoiceToPdf(invoiceSheetRef.current, fileName, getReportPageNodes());
        downloadedLocally = true;
      }
      const body = buildShareMessage({ pdfLink, downloadedLocally, invoiceNumberOverride: effectiveNumber });
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
  }, [selectedClient, invoiceNumber, invoiceSheetRef, uploadInvoiceDocument, buildShareMessage, getReportPageNodes, syncToPayments]);

  return {
    isSavingPdf,
    isSavingToDrive,
    isSharing,
    syncStatus,
    syncError,
    handleSavePdf,
    handleSaveToDrive,
    handleSendWhatsApp,
    handleSendEmail,
  };
}
