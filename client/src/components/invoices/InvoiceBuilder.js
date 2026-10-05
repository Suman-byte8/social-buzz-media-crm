"use client";

import React, { useState, useCallback, useRef, useMemo } from "react";
import InvoiceToolbar from "./Invoicetoolbar";
import InvoiceDocument from "./Invoicedocument";
import ReportPagesEditor from "./ReportPagesEditor";
import ReportImagePage from "./ReportImagePage";
import CustomReportPage from "./CustomReportPage";
import { numberToIndianWords } from "../../lib/Numbertowords";
import { computeInvoiceTotals } from "../../lib/invoiceTotals";
import { layoutImagesIntoPages } from "../../lib/imageGridLayout";
import { DEFAULT_ROWS, DEFAULT_TERMS } from "./invoiceDefaults";
import { useInvoiceClients } from "./useInvoiceClients";
import { useInvoiceActions } from "./useInvoiceActions";
import { useReportImages } from "./useReportImages";
import { useCustomReportPages } from "./useCustomReportPages";

export default function InvoiceBuilder() {
  const [invoiceNumber, setInvoiceNumber] = useState("SBM-2026-014");
  const [issuedDate, setIssuedDate] = useState("24 Aug 2026");
  const [dueDate, setDueDate] = useState("07 Sep 2026");
  const [period, setPeriod] = useState("Aug 2026");
  const [gstin, setGstin] = useState("19AEXFS2063Q1ZW");

  const [engagement, setEngagement] = useState({
    title: "Digital Marketing Retainer",
  });

  const [gstMode, setGstMode] = useState("intra");
  const [gstRate, setGstRate] = useState(18);
  const [roundOff, setRoundOff] = useState(true);
  const [stampMode, setStampMode] = useState("none");

  const [rows, setRows] = useState(DEFAULT_ROWS);
  const [terms, setTerms] = useState(DEFAULT_TERMS);
  const [advancePaid, setAdvancePaid] = useState(0);

  const invoiceSheetRef = useRef(null);
  const reportPageRefs = useRef([]);

  // Two independent ways to attach screenshots to the invoice: Auto
  // (existing behavior — pasted/uploaded images get packed into justified
  // rows automatically) or Freeform (full creative control — drag, resize,
  // and rotate each image anywhere on the page). Each mode keeps its own
  // images; switching modes doesn't migrate between them. Whichever mode is
  // active is what actually renders (and exports) below.
  const [reportLayoutMode, setReportLayoutMode] = useState("auto");

  const { images: reportImages, addFiles: addReportImages, removeImage: removeReportImage, error: reportImagesError } =
    useReportImages();
  const reportPages = useMemo(() => layoutImagesIntoPages(reportImages), [reportImages]);

  const {
    pages: customPages,
    activePageId: activeCustomPageId,
    setActivePage: setActiveCustomPageId,
    addPage: addCustomPage,
    removePage: removeCustomPage,
    addImages: addCustomImages,
    updateTile: updateCustomTile,
    removeTile: removeCustomTile,
    bringToFront: bringCustomTileToFront,
    shufflePage: shuffleCustomPage,
    tidyPage: tidyCustomPage,
    imageCount: customImageCount,
    error: customReportError,
  } = useCustomReportPages();

  const isFreeformLayout = reportLayoutMode === "freeform";

  const { clients, isClientLoading, selectedClientId, selectedClient, handleClientChange } = useInvoiceClients({
    onClientSelected: () => setInvoiceNumber((prev) => prev || `SBM-INVOICE-${Date.now()}`),
  });

  const addRow = useCallback(() => {
    setRows((prev) => [...prev, { id: Date.now(), desc: "", qty: 1, rate: 0 }]);
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
      reportPageRefs,
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

        <ReportPagesEditor
          layoutMode={reportLayoutMode}
          onLayoutModeChange={setReportLayoutMode}
          onAddFiles={isFreeformLayout ? addCustomImages : addReportImages}
          onAddPage={addCustomPage}
          imageCount={isFreeformLayout ? customImageCount : reportImages.length}
          error={isFreeformLayout ? customReportError : reportImagesError}
        />

        {isFreeformLayout
          ? customPages.map((page, index) => (
              <div key={page.id} className="mt-8">
                <CustomReportPage
                  ref={(el) => {
                    reportPageRefs.current[index] = el;
                  }}
                  tiles={page.tiles}
                  pageNumber={index + 2}
                  totalPages={customPages.length + 1}
                  isActive={page.id === activeCustomPageId}
                  onActivate={() => setActiveCustomPageId(page.id)}
                  onUpdateTile={(tileId, patch) => updateCustomTile(page.id, tileId, patch)}
                  onRemoveTile={(tileId) => removeCustomTile(page.id, tileId)}
                  onBringToFront={(tileId) => bringCustomTileToFront(page.id, tileId)}
                  onShuffle={() => shuffleCustomPage(page.id)}
                  onTidy={() => tidyCustomPage(page.id)}
                  onRemovePage={() => removeCustomPage(page.id)}
                />
              </div>
            ))
          : reportPages.map((page, index) => (
              <div key={index} className="mt-8">
                <ReportImagePage
                  ref={(el) => {
                    reportPageRefs.current[index] = el;
                  }}
                  rows={page.rows}
                  pageNumber={index + 2}
                  totalPages={reportPages.length + 1}
                  onRemoveImage={removeReportImage}
                />
              </div>
            ))}
      </main>
    </div>
  );
}
