"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { flushSync } from "react-dom";
import { uploadInvoiceToDrive, sendDocumentEmail } from "@/services/clientService";
import { exportInvoiceToPdf, getInvoicePdfBlob } from "@/lib/Pdfexport";
import { getApiBaseUrl } from "@/services/apiClient";
import { shareFileNatively, buildWhatsAppUrl } from "@/lib/documentShare";
import { syncInvoice } from "@/services/paymentService";
import { invalidatePaymentsCaches } from "@/redux/slices/paymentsSlice";

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

// Turns the builder's on-screen rows into ledger line items. Any row with
// an amount counts — a blank description falls back to "Item N" rather than
// silently dropping the row (the default rows ship with amounts but no
// description). The ledger stores whole-number quantities, so a fractional
// quantity (e.g. 1.5 hours) is folded into a single line priced at the
// row's exact total, keeping the amount identical to the PDF.
function toLedgerLineItems(rows) {
  return (rows || [])
    .map((r, index) => ({ ...r, position: index + 1 }))
    .filter((r) => (r.qty || 0) > 0 && (r.rate || 0) > 0)
    .map((r) => {
      const description = r.desc?.trim() || `Item ${r.position}`;
      if (Number.isInteger(r.qty)) {
        return { description, quantity: r.qty, unitPricePaise: Math.round(r.rate * 100) };
      }
      return { description: `${description} (${r.qty} × ₹${r.rate})`, quantity: 1, unitPricePaise: Math.round(r.qty * r.rate * 100) };
    });
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
  roundOff,
  selectedClientId,
  selectedClient,
}) {
  const [isSavingPdf, setIsSavingPdf] = useState(false);
  const [isSavingToDrive, setIsSavingToDrive] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  // Sync state shown in the toolbar. syncMessage is the outcome of the most
  // recent attempt — the success summary or the exact reason it failed.
  const [syncStatus, setSyncStatus] = useState("idle"); // idle | syncing | synced | error
  const [syncMessage, setSyncMessage] = useState("");
  const syncedClientIdRef = useRef(null);

  useEffect(() => {
    if (syncedClientIdRef.current && syncedClientIdRef.current !== selectedClientId) {
      setSyncStatus("idle");
      setSyncMessage("");
    }
    syncedClientIdRef.current = selectedClientId;
  }, [selectedClientId]);

  // Pushes the on-screen invoice into the Payments ledger via the
  // idempotent POST /invoices/sync (keyed by invoice number): first sync
  // creates it, every later sync of the same number updates it — including
  // after a page reload. Never throws; resolves { ok, data, message } so
  // callers report the real outcome instead of reading stale state.
  const syncToPayments = useCallback(async () => {
    const fail = (message) => {
      setSyncStatus("error");
      setSyncMessage(message);
      return { ok: false, data: null, message };
    };

    if (!selectedClientId) return fail("Select a client first.");
    const lineItems = toLedgerLineItems(rows);
    if (lineItems.length === 0) return fail("Add at least one line item with a quantity and rate.");
    const parsedDueDate = parseFreeTextDate(dueDate);
    if (!parsedDueDate) return fail(`Couldn't read the due date "${dueDate}" — use a format like "07 Sep 2026".`);

    setSyncStatus("syncing");
    setSyncMessage("");
    try {
      const result = await syncInvoice({
        clientId: selectedClientId,
        invoiceNumber,
        invoiceDate: parseFreeTextDate(issuedDate) || undefined,
        dueDate: parsedDueDate,
        lineItems,
        discountPaise: Math.round((discount || 0) * 100),
        taxRateBasisPoints: Math.round((gstRate || 0) * 100),
        roundToRupee: Boolean(roundOff),
      });

      // The Payments page caches its overview/table briefly — drop that so
      // the next visit shows this invoice immediately.
      invalidatePaymentsCaches();
      setSyncStatus("synced");
      setSyncMessage(result.message);
      // Only when the server had to assign a number (blank field): flushSync
      // commits it to the on-screen sheet before any PDF capture that follows.
      if (onInvoiceNumberSync && result.data.invoiceNumber !== invoiceNumber) {
        flushSync(() => onInvoiceNumberSync(result.data.invoiceNumber));
      }
      return { ok: true, data: result.data, message: result.message };
    } catch (err) {
      return fail(err.message || "Failed to sync this invoice to Payments.");
    }
  }, [selectedClientId, rows, dueDate, issuedDate, discount, gstRate, roundOff, invoiceNumber, onInvoiceNumberSync]);

  const handleSyncToPayments = useCallback(() => syncToPayments(), [syncToPayments]);

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
      const effectiveNumber = syncResult.data?.invoiceNumber || invoiceNumber;
      const pdfBlob = await getInvoicePdfBlob(invoiceSheetRef.current, getReportPageNodes());
      await uploadInvoiceToDrive(pdfBlob, selectedClientId, effectiveNumber);
      alert(
        syncResult.ok
          ? `Invoice saved to Google Drive. ${syncResult.message}.`
          : `Invoice saved to Google Drive, but not synced to Payments: ${syncResult.message}`
      );
    } catch (e) {
      console.error("Google Drive upload failed:", e);
      alert(e.message || "Failed to save invoice to Google Drive. Please try again.");
    } finally {
      setIsSavingToDrive(false);
    }
  }, [invoiceSheetRef, invoiceNumber, selectedClientId, getReportPageNodes, syncToPayments]);

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
    documentRecord?.id ? `${getApiBaseUrl()}/documents/${documentRecord.id}/stream` : null;

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
        const effectiveNumber = syncResult.data?.invoiceNumber || invoiceNumber;
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
      const effectiveNumber = syncResult.data?.invoiceNumber || invoiceNumber;
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
    syncMessage,
    handleSyncToPayments,
    handleSavePdf,
    handleSaveToDrive,
    handleSendWhatsApp,
    handleSendEmail,
  };
}
