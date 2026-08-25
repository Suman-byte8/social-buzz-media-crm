"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { fetchClients, uploadInvoiceToDrive } from "@/services/clientService";
import InvoiceToolbar from "./Invoicetoolbar";
import InvoiceDocument from "./Invoicedocument";
import { numberToIndianWords } from "../../lib/Numbertowords";
import { exportInvoiceToPdf, getInvoicePdfBlob } from "../../lib/Pdfexport";

const DEFAULT_ROWS = [
  {
    id: 1,
    desc: "Social media management — 16 posts, 8 reels, 4 platforms",
    sac: "998361",
    qty: 1,
    rate: 45000,
  },
  {
    id: 2,
    desc: "Paid media — Meta & Google (fee on ₹2,00,000 spend)",
    sac: "998365",
    qty: 1,
    rate: 20000,
  },
  {
    id: 3,
    desc: "Content shoot — half day, 1 location",
    sac: "998386",
    qty: 1,
    rate: 15000,
  },
];

const DEFAULT_TERMS = [
  "Payment due within 14 days of the invoice date.",
  "Retainer covers the scope listed above; ad spend is billed separately at cost.",
  "Overdue balances carry 1.5% interest per month.",
  "Subject to Kolkata jurisdiction.",
];

const DEFAULT_BANK = {
  accountName: "Social Buzz Media",
  accountNumber: "0000 0000 0000",
  ifsc: "XXXX0000000",
  bank: "Bank name, Branch",
  upi: "socialbuzzmedia@upi",
};

export default function InvoiceBuilder() {
  const [invoiceNumber, setInvoiceNumber] = useState("SBM-2026-014");
  const [issuedDate, setIssuedDate] = useState("24 Aug 2026");
  const [dueDate, setDueDate] = useState("07 Sep 2026");
  const [period, setPeriod] = useState("Aug 2026");
  const [gstin, setGstin] = useState("19AEXFS2063Q1ZW");

  const [engagement, setEngagement] = useState({
    title: "Social Media Retainer",
    description:
      "Scope: content, community, paid media · PO / Ref: — · Place of supply: West Bengal (19)",
  });

  const [gstMode, setGstMode] = useState("intra");
  const [gstRate, setGstRate] = useState(18);
  const [roundOff, setRoundOff] = useState(true);
  const [stampMode, setStampMode] = useState("none");

  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [isClientLoading, setIsClientLoading] = useState(false);

  const [rows, setRows] = useState(DEFAULT_ROWS);
  const [terms, setTerms] = useState(DEFAULT_TERMS);
  const [bankDetails, setBankDetails] = useState(DEFAULT_BANK);
  const [advancePaid, setAdvancePaid] = useState(0);
  const [isSavingPdf, setIsSavingPdf] = useState(false);
  const [isSavingToDrive, setIsSavingToDrive] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const invoiceSheetRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const loadClients = async () => {
      setIsClientLoading(true);
      try {
        const response = await fetchClients();
        const arr = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : [];
        const clientList = arr.map((c) => ({
          id: c.id,
          name: c.name || c.clientName || "",
          email: c.email || "",
          // Keep both numbers distinct so the share menu can offer the
          // WhatsApp-specific number and the general phone as selectable
          // destinations. `phone` stays as a fallback for older callers.
          phone: c.whatsappNumber || c.phoneNumber || "",
          whatsappNumber: c.whatsappNumber || "",
          phoneNumber: c.phoneNumber || "",
          address: c.address || c.billingAddress || "",
        }));
        if (isMounted) setClients(clientList);
      } catch (e) {
        console.error("Could not load clients:", e);
      } finally {
        if (isMounted) setIsClientLoading(false);
      }
    };

    loadClients();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleClientChange = useCallback((id) => {
    setSelectedClientId(id);
    if (id) {
      setInvoiceNumber((prev) => prev || `SBM-INVOICE-${Date.now()}`);
    }
  }, []);

  const addRow = useCallback(() => {
    setRows((prev) => [
      ...prev,
      { id: Date.now(), desc: "", sac: "", qty: 1, rate: 0 },
    ]);
  }, []);

  const updateRow = useCallback((id, field, value) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    );
  }, []);

  const removeRow = useCallback((id) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const updateTerm = useCallback((index, value) => {
    setTerms((prev) => prev.map((t, i) => (i === index ? value : t)));
  }, []);

  const addTerm = useCallback(() => {
    setTerms((prev) => [...prev, ""]);
  }, []);

  const removeTerm = useCallback((index) => {
    setTerms((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const totals = useMemo(() => {
    const subtotal = rows.reduce(
      (sum, r) => sum + (r.qty || 0) * (r.rate || 0),
      0,
    );
    const discount = 0;
    const taxable = Math.max(subtotal - discount, 0);

    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (gstMode === "intra") {
      cgst = sgst = (taxable * gstRate) / 200;
    } else if (gstMode === "inter") {
      igst = (taxable * gstRate) / 100;
    }

    const grossTotal = taxable + cgst + sgst + igst;
    const grand = roundOff ? Math.round(grossTotal) : grossTotal;
    const roundAmt = grand - grossTotal;

    return {
      subtotal,
      discount,
      taxable,
      cgst,
      sgst,
      igst,
      gstMode,
      roundAmt,
      grand,
    };
  }, [rows, gstMode, gstRate, roundOff]);

  const balance = totals.grand - (advancePaid || 0);
  const amountInWords = numberToIndianWords(totals.grand);

  const selectedClient = useMemo(
    () =>
      clients.find((c) => String(c.id) === String(selectedClientId)) || null,
    [clients, selectedClientId],
  );

  const handleSavePdf = useCallback(async () => {
    if (!invoiceSheetRef.current) return;
    setIsSavingPdf(true);
    try {
      await exportInvoiceToPdf(
        invoiceSheetRef.current,
        `Invoice-${invoiceNumber || "draft"}.pdf`,
      );
    } catch (e) {
      console.error("PDF generation failed:", e);
      window.print();
    } finally {
      setIsSavingPdf(false);
    }
  }, [invoiceNumber]);

  const handleSaveToDrive = useCallback(async () => {
    if (!invoiceSheetRef.current || !selectedClientId) return;
    setIsSavingToDrive(true);
    try {
      const pdfBlob = await getInvoicePdfBlob(invoiceSheetRef.current);
      await uploadInvoiceToDrive(pdfBlob, selectedClientId, invoiceNumber);
      alert("Invoice saved to Google Drive successfully!");
    } catch (e) {
      console.error("Google Drive upload failed:", e);
      alert(
        e.message ||
          "Failed to save invoice to Google Drive. Please try again.",
      );
    } finally {
      setIsSavingToDrive(false);
    }
  }, [invoiceNumber, selectedClientId]);

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
      const result = await uploadInvoiceToDrive(
        pdfBlob,
        selectedClientId,
        invoiceNumber,
      );
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
  }, [selectedClientId, invoiceNumber]);

  const buildShareMessage = useCallback(
    (driveLink, downloadedLocally) => {
      const amount = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
      }).format(totals.grand);

      let message = `Hi, please find your invoice ${invoiceNumber} for ${amount}, due ${dueDate}.`;

      if (driveLink) {
        message += `\n\nView / download: ${driveLink}`;
      } else if (downloadedLocally) {
        message += `\n\n(The PDF has been downloaded on this device — please attach it here.)`;
      }

      return message;
    },
    [invoiceNumber, dueDate, totals.grand],
  );

  const handleSendWhatsApp = useCallback(
    async (destination) => {
      // The share menu passes the exact number the user picked (WhatsApp
      // vs general phone); fall back to the client record's preference.
      const targetNumber =
        destination ||
        selectedClient?.whatsappNumber ||
        selectedClient?.phoneNumber ||
        selectedClient?.phone;
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
          await exportInvoiceToPdf(
            invoiceSheetRef.current,
            `Invoice-${invoiceNumber || "draft"}.pdf`,
          );
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
    [selectedClient, invoiceNumber, getInvoiceDriveLink, buildShareMessage],
  );

  const handleSendEmail = useCallback(async () => {
    if (!selectedClient || !selectedClient.email) return;
    setIsSharing(true);
    try {
      const driveLink = await getInvoiceDriveLink();
      let downloadedLocally = false;
      if (!driveLink && invoiceSheetRef.current) {
        await exportInvoiceToPdf(
          invoiceSheetRef.current,
          `Invoice-${invoiceNumber || "draft"}.pdf`,
        );
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
  }, [selectedClient, invoiceNumber, getInvoiceDriveLink, buildShareMessage]);

  return (
    <div className="min-h-screen bg-[#EAE8E4] font-body text-ink antialiased">
      <InvoiceToolbar
        onAddRow={addRow}
        gstMode={gstMode}
        onGstModeChange={setGstMode}
        gstRate={gstRate}
        onGstRateChange={setGstRate}
        roundOff={roundOff}
        onRoundOffChange={setRoundOff}
        stampMode={stampMode}
        onStampModeChange={setStampMode}
        onSavePdf={handleSavePdf}
        onSaveToDrive={handleSaveToDrive}
        isSavingPdf={isSavingPdf}
        isSavingToDrive={isSavingToDrive}
        selectedClientId={selectedClientId}
        selectedClient={selectedClient}
        isSharing={isSharing}
        onSendWhatsApp={handleSendWhatsApp}
        onSendEmail={handleSendEmail}
      />

      <main className="mx-auto my-8 max-w-full">
        <InvoiceDocument
          ref={invoiceSheetRef}
          gstin={gstin}
          onGstinChange={setGstin}
          invoiceNumber={invoiceNumber}
          onInvoiceNumberChange={setInvoiceNumber}
          issuedDate={issuedDate}
          onIssuedDateChange={setIssuedDate}
          dueDate={dueDate}
          onDueDateChange={setDueDate}
          period={period}
          onPeriodChange={setPeriod}
          clients={clients}
          isClientLoading={isClientLoading}
          selectedClientId={selectedClientId}
          onClientChange={handleClientChange}
          engagement={engagement}
          onEngagementChange={setEngagement}
          rows={rows}
          onUpdateRow={updateRow}
          onRemoveRow={removeRow}
          bankDetails={bankDetails}
          onBankDetailsChange={setBankDetails}
          totals={totals}
          amountInWords={amountInWords}
          advancePaid={advancePaid}
          onAdvancePaidChange={setAdvancePaid}
          balance={balance}
          terms={terms}
          onUpdateTerm={updateTerm}
          onAddTerm={addTerm}
          onRemoveTerm={removeTerm}
          stampMode={stampMode}
        />
      </main>
    </div>
  );
}
