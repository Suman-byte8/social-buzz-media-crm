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
      alert(e.message || "Failed to save invoice to Google Drive. Please try again.");
    } finally {
      setIsSavingToDrive(false);
    }
  }, [invoiceNumber, selectedClientId]);

  const handleShare = useCallback(async () => {
    const shareText = `Invoice ${invoiceNumber} — ${new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
      },
    ).format(totals.grand)} due ${dueDate}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Invoice ${invoiceNumber}`,
          text: shareText,
        });
      } catch (e) {
        // user dismissed the native share sheet — nothing to do
      }
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareText);
      alert("Invoice summary copied to clipboard.");
    }
  }, [invoiceNumber, dueDate, totals.grand]);

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
        onShare={handleShare}
        isSavingPdf={isSavingPdf}
        isSavingToDrive={isSavingToDrive}
        selectedClientId={selectedClientId}
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
