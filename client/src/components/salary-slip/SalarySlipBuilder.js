"use client";

import React, { useState, useCallback, useRef, useMemo } from "react";
import SalarySlipToolbar from "./SalarySlipToolbar";
import SalarySlipDocument from "./SalarySlipDocument";
import { numberToIndianWords } from "../../lib/Numbertowords";
import { computeSalaryTotals } from "../../lib/salarySlipTotals";
import { useSalarySlipTeamMembers } from "./useSalarySlipTeamMembers";
import { useSalarySlipActions } from "./useSalarySlipActions";

const today = new Date();
const DEFAULT_ISSUED_DATE = today.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
const DEFAULT_PAY_PERIOD = today.toLocaleDateString("en-GB", { month: "short", year: "numeric" });

const DEFAULT_COMPONENTS = {
  basicSalary: 0,
  hra: 0,
  otherAllowances: 0,
  employeePf: 0,
  professionalTax: 0,
  tds: 0,
  otherDeductions: 0,
};

export default function SalarySlipBuilder() {
  const [slipNumber, setSlipNumber] = useState(`SBM-SAL-${today.getFullYear()}-001`);
  const [issuedDate, setIssuedDate] = useState(DEFAULT_ISSUED_DATE);
  const [payDate, setPayDate] = useState("");
  const [payPeriod, setPayPeriod] = useState(DEFAULT_PAY_PERIOD);
  const [components, setComponents] = useState(DEFAULT_COMPONENTS);

  const sheetRef = useRef(null);

  const { members, isMembersLoading, selectedMemberId, selectedMember, handleMemberChange } =
    useSalarySlipTeamMembers({
      onMemberSelected: () => setSlipNumber((prev) => prev || `SBM-SAL-${Date.now()}`),
    });

  const updateComponent = useCallback((key, value) => {
    setComponents((prev) => ({ ...prev, [key]: value }));
  }, []);

  const totals = useMemo(() => computeSalaryTotals(components), [components]);
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
          components={components}
          onUpdateComponent={updateComponent}
          totals={totals}
          netInWords={netInWords}
        />
      </main>
    </div>
  );
}
