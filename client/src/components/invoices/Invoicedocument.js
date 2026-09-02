"use client";
import React, { forwardRef } from "react";
import InvoiceHeaderBlock from "./Invoiceheaderblock";
import BillingDetails from "./Billingdetails";
import LineItemsTable from "./Lineitemstable";
import PaymentAndTotals from "./Paymentandtotals";
import TermsAndSignature from "./Termsandsignature";
import InvoiceStamp from "./Invoicestamp";

const InvoiceDocument = forwardRef(function InvoiceDocument(props, ref) {
  const {
    gstin,
    onGstinChange,
    invoiceNumber,
    onInvoiceNumberChange,
    issuedDate,
    onIssuedDateChange,
    dueDate,
    onDueDateChange,
    period,
    onPeriodChange,
    clients,
    isClientLoading,
    selectedClientId,
    selectedClient,
    onClientChange,
    engagement,
    onEngagementChange,
    rows,
    onUpdateRow,
    onRemoveRow,
    totals,
    amountInWords,
    advancePaid,
    onAdvancePaidChange,
    balance,
    terms,
    onUpdateTerm,
    onAddTerm,
    onRemoveTerm,
    stampMode,
  } = props;

  return (
    <article
      ref={ref}
      id="invoiceSheet"
      className="sheet relative mx-auto w-[210mm] min-h-[297mm] shrink-0 bg-white p-[14mm] shadow-[0_18px_50px_rgba(26,26,26,.16)]"
    >
      {/*
        data-html2canvas-ignore: html2canvas can't render CSS blur() filters
        correctly — it paints this as a hard, opaque circle instead of a
        soft translucent one, which ends up covering text underneath it in
        the exported PDF. It's purely decorative, so we just skip it during
        capture and keep it for on-screen viewing only.
      */}
      <div
        data-html2canvas-ignore="true"
        className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-[#FFB4AC]/20 blur-3xl"
      ></div>
      <div className="absolute inset-x-0 top-0 h-[5px] bg-[#E8262A]"></div>

      <InvoiceHeaderBlock
        gstin={gstin}
        onGstinChange={onGstinChange}
        invoiceNumber={invoiceNumber}
        onInvoiceNumberChange={onInvoiceNumberChange}
        issuedDate={issuedDate}
        onIssuedDateChange={onIssuedDateChange}
        dueDate={dueDate}
        onDueDateChange={onDueDateChange}
        period={period}
        onPeriodChange={onPeriodChange}
      />

      <BillingDetails
        clients={clients}
        isClientLoading={isClientLoading}
        selectedClientId={selectedClientId}
        onClientChange={onClientChange}
        engagement={engagement}
        onEngagementChange={onEngagementChange}
      />

      <LineItemsTable
        rows={rows}
        onUpdateRow={onUpdateRow}
        onRemoveRow={onRemoveRow}
        services={selectedClient?.services || []}
      />

      <PaymentAndTotals
        totals={totals}
        amountInWords={amountInWords}
        advancePaid={advancePaid}
        onAdvancePaidChange={onAdvancePaidChange}
        balance={balance}
      />

      <TermsAndSignature
        terms={terms}
        onUpdateTerm={onUpdateTerm}
        onAddTerm={onAddTerm}
        onRemoveTerm={onRemoveTerm}
      />

      <p className="mt-6 text-center font-display text-[8.5px] uppercase tracking-[.28em] text-[#6E6A65]">
        socialbuzzmedia.in &middot; This is a computer-generated invoice
      </p>

      <InvoiceStamp mode={stampMode} />
    </article>
  );
});

export default InvoiceDocument;
