"use client";

import { useState, useCallback } from "react";
import { uploadInvoiceToDrive } from "@/services/clientService";
import { exportInvoiceToPdf, getInvoicePdfBlob } from "@/lib/Pdfexport";

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

  // Uploads the invoice to Drive and returns a link to it, so WhatsApp/
  // Email messages can include a working "view / download" link instead
  // of requiring the recipient to receive a manually-attached file
  // (browsers don't allow a webpage to attach files to WhatsApp or a
  // mailto: link automatically — this is the practical workaround).
  //
  // NOTE: adjust the field names below if your /documents/upload endpoint
  // returns the file's shareable link under a different key.
  const getInvoiceDriveLink = useCallback(async () => {
    if (!invoiceSheetRef.current || !selectedClientId) return null;
    try {
      const pdfBlob = await getInvoicePdfBlob(invoiceSheetRef.current);
      const result = await uploadInvoiceToDrive(pdfBlob, selectedClientId, invoiceNumber);
      return (
        result?.url ||
        result?.fileUrl ||
        result?.webViewLink ||
        result?.driveLink ||
        result?.googleUserContentLink ||
        result?.data?.url ||
        result?.data?.webViewLink ||
        result?.data?.driveLink ||
        result?.data?.googleUserContentLink ||
        result?.document?.url ||
        null
      );
    } catch (e) {
      console.error("Could not upload invoice for sharing:", e);
      return null;
    }
  }, [invoiceSheetRef, selectedClientId, invoiceNumber]);

  const buildShareMessage = useCallback(
    (driveLink, downloadedLocally) => {
      const amount = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(grandTotal);

      let message = `Hi, please find your invoice ${invoiceNumber} for ${amount}, due ${dueDate}.`;

      if (driveLink) {
        message += `\n\nView / download: ${driveLink}`;
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
      if (!selectedClient || !targetNumber) return;
      setIsSharing(true);
      // Browsers block window.open() calls that happen after async work
      // (canvas render + Drive upload) because they're no longer tied to
      // the user's click — that's why only the PDF download used to
      // happen. Open a placeholder tab synchronously inside the click
      // handler, then navigate it to wa.me once the message is ready.
      const waWindow = window.open("about:blank", "_blank");
      try {
        const driveLink = await getInvoiceDriveLink();
        let downloadedLocally = false;
        if (!driveLink && invoiceSheetRef.current) {
          await exportInvoiceToPdf(invoiceSheetRef.current, `Invoice-${invoiceNumber || "draft"}.pdf`);
          downloadedLocally = true;
        }
        const message = buildShareMessage(driveLink, downloadedLocally);
        // wa.me expects digits only, with country code, no "+" — same format
        // used for the WhatsApp click-to-chat button elsewhere on your sites.
        const digitsOnly = String(targetNumber).replace(/\D/g, "");
        const waUrl = `https://wa.me/${digitsOnly}?text=${encodeURIComponent(message)}`;
        if (waWindow && !waWindow.closed) {
          waWindow.location.href = waUrl;
        } else {
          // Popup blocker removed even the placeholder tab — fall back to
          // same-tab navigation so sharing still works.
          window.location.href = waUrl;
        }
      } catch (e) {
        if (waWindow && !waWindow.closed) waWindow.close();
        console.error("Could not share via WhatsApp:", e);
        alert(e.message || "Could not open WhatsApp. Please try again.");
      } finally {
        setIsSharing(false);
      }
    },
    [selectedClient, invoiceNumber, invoiceSheetRef, getInvoiceDriveLink, buildShareMessage]
  );

  const handleSendEmail = useCallback(async () => {
    if (!selectedClient || !selectedClient.email) return;
    setIsSharing(true);
    try {
      const driveLink = await getInvoiceDriveLink();
      let downloadedLocally = false;
      if (!driveLink && invoiceSheetRef.current) {
        await exportInvoiceToPdf(invoiceSheetRef.current, `Invoice-${invoiceNumber || "draft"}.pdf`);
        downloadedLocally = true;
      }
      const subject = `Invoice ${invoiceNumber} from Social Buzz Media`;
      const body = buildShareMessage(driveLink, downloadedLocally);
      // Navigating the current tab to a mailto: URL is not treated as a
      // popup, so this works even after the async upload above (unlike
      // window.open). If no mail client is configured the browser shows
      // its own "choose an app" prompt or does nothing gracefully.
      window.location.href = `mailto:${selectedClient.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    } catch (e) {
      console.error("Could not share via email:", e);
      alert(e.message || "Could not open your mail app. Please try again.");
    } finally {
      setIsSharing(false);
    }
  }, [selectedClient, invoiceNumber, invoiceSheetRef, getInvoiceDriveLink, buildShareMessage]);

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
