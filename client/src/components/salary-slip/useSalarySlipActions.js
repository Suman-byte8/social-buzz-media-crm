"use client";

import { useState, useCallback } from "react";
import { uploadSalarySlipToDrive } from "@/services/documentService";
import { exportInvoiceToPdf, getInvoicePdfBlob } from "@/lib/Pdfexport";

// Same generic PDF export functions the invoice builder uses (the names are
// invoice-flavored but the underlying code just rasterizes whatever DOM
// node it's handed — see Pdfexport.js) — reused as-is rather than
// duplicated. Mirrors useInvoiceActions.js's Save PDF / Save to Drive pair;
// salary slips have no WhatsApp/email share flow.
export function useSalarySlipActions({ sheetRef, slipNumber, payPeriod, selectedMemberId, selectedMember }) {
  const [isSavingPdf, setIsSavingPdf] = useState(false);
  const [isSavingToDrive, setIsSavingToDrive] = useState(false);

  const handleSavePdf = useCallback(async () => {
    if (!sheetRef.current) return;
    setIsSavingPdf(true);
    try {
      const fileName = `SalarySlip-${selectedMember?.name || "draft"}-${payPeriod || slipNumber}.pdf`;
      await exportInvoiceToPdf(sheetRef.current, fileName);
    } catch (e) {
      console.error("PDF generation failed:", e);
      window.print();
    } finally {
      setIsSavingPdf(false);
    }
  }, [sheetRef, selectedMember, payPeriod, slipNumber]);

  const handleSaveToDrive = useCallback(async () => {
    if (!sheetRef.current || !selectedMemberId) return;
    setIsSavingToDrive(true);
    try {
      const pdfBlob = await getInvoicePdfBlob(sheetRef.current);
      await uploadSalarySlipToDrive(pdfBlob, selectedMemberId, payPeriod || slipNumber);
      alert("Salary slip saved to Google Drive successfully!");
    } catch (e) {
      console.error("Google Drive upload failed:", e);
      alert(e.message || "Failed to save the salary slip to Google Drive. Please try again.");
    } finally {
      setIsSavingToDrive(false);
    }
  }, [sheetRef, selectedMemberId, payPeriod, slipNumber]);

  return { isSavingPdf, isSavingToDrive, handleSavePdf, handleSaveToDrive };
}
