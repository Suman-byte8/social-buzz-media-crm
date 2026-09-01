"use client";

import React, { useState, useCallback, useRef, useMemo } from "react";
import InvoiceToolbar from "./Invoicetoolbar";
import InvoiceDocument from "./Invoicedocument";
import { numberToIndianWords } from "../../lib/Numbertowords";
import { computeInvoiceTotals } from "../../lib/invoiceTotals";
import { DEFAULT_ROWS, DEFAULT_TERMS } from "./invoiceDefaults";
import { useInvoiceClients } from "./useInvoiceClients";
import { useInvoiceActions } from "./useInvoiceActions";

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

  const [rows, setRows] = useState(DEFAULT_ROWS);
  const [terms, setTerms] = useState(DEFAULT_TERMS);
  const [advancePaid, setAdvancePaid] = useState(0);

  const invoiceSheetRef = useRef(null);

  const { clients, isClientLoading, selectedClientId, selectedClient, handleClientChange } = useInvoiceClients({
    onClientSelected: () => setInvoiceNumber((prev) => prev || `SBM-INVOICE-${Date.now()}`),
  });

  const addRow = useCallback(() => {
    setRows((prev) => [...prev, { id: Date.now(), desc: "", sac: "", qty: 1, rate: 0 }]);
  }, []);

  const updateRow = useCallback((id, field, value) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
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

  const totals = useMemo(
    () => computeInvoiceTotals({ rows, gstMode, gstRate, roundOff }),
    [rows, gstMode, gstRate, roundOff]
  );

  const balance = totals.grand - (advancePaid || 0);
  const amountInWords = numberToIndianWords(totals.grand);

  const { isSavingPdf, isSavingToDrive, isSharing, handleSavePdf, handleSaveToDrive, handleSendWhatsApp, handleSendEmail } =
    useInvoiceActions({
      invoiceSheetRef,
      invoiceNumber,
      dueDate,
      grandTotal: totals.grand,
      selectedClientId,
      selectedClient,
    });

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

      <main className="my-8 overflow-x-auto">
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
