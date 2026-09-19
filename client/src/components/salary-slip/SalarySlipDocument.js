"use client";
import React, { forwardRef } from "react";
import SalarySlipHeaderBlock from "./SalarySlipHeaderBlock";
import EmployeeDetails from "./EmployeeDetails";
import SalaryComponentsTable from "./SalaryComponentsTable";
import SalarySignature from "./SalarySignature";

// Same literal A4-mm-sized sheet as invoices/Invoicedocument.js — this is
// the exact node html2canvas rasterizes for PDF export.
const SalarySlipDocument = forwardRef(function SalarySlipDocument(props, ref) {
  const {
    slipNumber,
    onSlipNumberChange,
    issuedDate,
    onIssuedDateChange,
    payDate,
    onPayDateChange,
    payPeriod,
    onPayPeriodChange,
    members,
    isMembersLoading,
    selectedMemberId,
    onMemberChange,
    earningRows,
    deductionRows,
    onAddEarningRow,
    onUpdateEarningRow,
    onRemoveEarningRow,
    onAddDeductionRow,
    onUpdateDeductionRow,
    onRemoveDeductionRow,
    totals,
    netInWords,
  } = props;

  return (
    <article
      ref={ref}
      id="salarySlipSheet"
      className="sheet relative mx-auto w-[210mm] min-h-[297mm] shrink-0 bg-white p-[14mm] shadow-[0_18px_50px_rgba(26,26,26,.16)]"
    >
      <div
        data-html2canvas-ignore="true"
        className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-[#FFB4AC]/20 blur-3xl"
      ></div>
      <div className="absolute inset-x-0 top-0 h-[5px] bg-[#E8262A]"></div>

      <SalarySlipHeaderBlock
        slipNumber={slipNumber}
        onSlipNumberChange={onSlipNumberChange}
        issuedDate={issuedDate}
        onIssuedDateChange={onIssuedDateChange}
        payDate={payDate}
        onPayDateChange={onPayDateChange}
        payPeriod={payPeriod}
        onPayPeriodChange={onPayPeriodChange}
      />

      <EmployeeDetails
        members={members}
        isMembersLoading={isMembersLoading}
        selectedMemberId={selectedMemberId}
        onMemberChange={onMemberChange}
      />

      <SalaryComponentsTable
        earningRows={earningRows}
        deductionRows={deductionRows}
        onAddEarningRow={onAddEarningRow}
        onUpdateEarningRow={onUpdateEarningRow}
        onRemoveEarningRow={onRemoveEarningRow}
        onAddDeductionRow={onAddDeductionRow}
        onUpdateDeductionRow={onUpdateDeductionRow}
        onRemoveDeductionRow={onRemoveDeductionRow}
        totals={totals}
      />

      <div className="mt-4 border-l-[3px] border-[#E8262A] bg-[#F5F4F2] px-3 py-2.5">
        <p className="font-display text-[9px] font-700 uppercase tracking-[.2em] text-[#6E6A65]">
          Net pay in words
        </p>
        <p className="mt-1 text-[11px] font-semibold leading-snug">{netInWords}</p>
      </div>

      <SalarySignature />

      <p className="mt-6 text-center font-display text-[8.5px] uppercase tracking-[.28em] text-[#6E6A65]">
        socialbuzzmedia.in &middot; This is a computer-generated salary slip
      </p>
    </article>
  );
});

export default SalarySlipDocument;
