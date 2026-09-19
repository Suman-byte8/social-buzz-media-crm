"use client";

import React, { useState, useCallback, useRef, useMemo } from "react";
import SalarySlipToolbar from "./SalarySlipToolbar";
import SalarySlipDocument from "./SalarySlipDocument";
import { numberToIndianWords } from "../../lib/Numbertowords";
import { computeSalaryTotals } from "../../lib/salarySlipTotals";
import { DEFAULT_EARNING_ROWS, DEFAULT_DEDUCTION_ROWS } from "./salarySlipDefaults";
import { useSalarySlipTeamMembers } from "./useSalarySlipTeamMembers";
import { useSalarySlipActions } from "./useSalarySlipActions";

const today = new Date();
const DEFAULT_ISSUED_DATE = today.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
const DEFAULT_PAY_PERIOD = today.toLocaleDateString("en-GB", { month: "short", year: "numeric" });

export default function SalarySlipBuilder() {
  const [slipNumber, setSlipNumber] = useState(`SBM-SAL-${today.getFullYear()}-001`);
  const [issuedDate, setIssuedDate] = useState(DEFAULT_ISSUED_DATE);
  const [payDate, setPayDate] = useState("");
  const [payPeriod, setPayPeriod] = useState(DEFAULT_PAY_PERIOD);
  const [earningRows, setEarningRows] = useState(DEFAULT_EARNING_ROWS);
  const [deductionRows, setDeductionRows] = useState(DEFAULT_DEDUCTION_ROWS);

  const sheetRef = useRef(null);

  const { members, isMembersLoading, selectedMemberId, selectedMember, handleMemberChange } =
    useSalarySlipTeamMembers({
      onMemberSelected: () => setSlipNumber((prev) => prev || `SBM-SAL-${Date.now()}`),
    });

  const addEarningRow = useCallback(() => {
    setEarningRows((prev) => [...prev, { id: Date.now(), label: "", amount: 0 }]);
  }, []);
  const updateEarningRow = useCallback((id, field, value) => {
    setEarningRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }, []);
  const removeEarningRow = useCallback((id) => {
    setEarningRows((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const addDeductionRow = useCallback(() => {
    setDeductionRows((prev) => [...prev, { id: Date.now(), label: "", amount: 0 }]);
  }, []);
  const updateDeductionRow = useCallback((id, field, value) => {
    setDeductionRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }, []);
  const removeDeductionRow = useCallback((id) => {
    setDeductionRows((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const totals = useMemo(() => computeSalaryTotals({ earningRows, deductionRows }), [earningRows, deductionRows]);
  const netInWords = numberToIndianWords(totals.net);

  const { isSavingPdf, isSavingToDrive, handleSavePdf, handleSaveToDrive } = useSalarySlipActions({
    sheetRef,
    slipNumber,
    payPeriod,
    selectedMemberId,
    selectedMember,
  });

  return (
    <div className="min-h-screen bg-[#EAE8E4] font-body text-ink antialiased">
      <SalarySlipToolbar
        onSavePdf={handleSavePdf}
        onSaveToDrive={handleSaveToDrive}
        isSavingPdf={isSavingPdf}
        isSavingToDrive={isSavingToDrive}
        selectedMemberId={selectedMemberId}
      />

      <main className="my-8 overflow-x-auto">
        <SalarySlipDocument
          ref={sheetRef}
          slipNumber={slipNumber}
          onSlipNumberChange={setSlipNumber}
          issuedDate={issuedDate}
          onIssuedDateChange={setIssuedDate}
          payDate={payDate}
          onPayDateChange={setPayDate}
          payPeriod={payPeriod}
          onPayPeriodChange={setPayPeriod}
          members={members}
          isMembersLoading={isMembersLoading}
          selectedMemberId={selectedMemberId}
          onMemberChange={handleMemberChange}
          earningRows={earningRows}
          deductionRows={deductionRows}
          onAddEarningRow={addEarningRow}
          onUpdateEarningRow={updateEarningRow}
          onRemoveEarningRow={removeEarningRow}
          onAddDeductionRow={addDeductionRow}
          onUpdateDeductionRow={updateDeductionRow}
          onRemoveDeductionRow={removeDeductionRow}
          totals={totals}
          netInWords={netInWords}
        />
      </main>
    </div>
  );
}
