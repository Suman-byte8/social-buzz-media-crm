"use client";

import React, { forwardRef } from "react";
import { formatRupees } from "@/lib/formatCurrency";

const METHOD_LABEL = {
  upi: "UPI",
  bank_transfer: "Bank Transfer / NEFT / IMPS",
  cash: "Cash",
  cheque: "Cheque",
  razorpay: "Razorpay",
  other: "Other",
};

const PaymentReceiptDocument = forwardRef(function PaymentReceiptDocument({ payment, client, allocations = [] }, ref) {
  if (!payment) return null;

  return (
    <article ref={ref} className="sheet relative min-h-[297mm] w-[210mm] bg-white p-[20mm] text-[#1A1A1A]">
      <div className="flex items-start justify-between border-b border-[#1A1A1A] pb-4">
        <div>
          <h1 className="text-2xl font-bold">Social Buzz Media</h1>
          <p className="text-sm text-[#6E6A65]">socialbuzzmedia.in</p>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-bold">PAYMENT RECEIPT</h2>
          <p className="text-sm">#{payment.id}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-6 text-sm">
        <div>
          <p className="font-semibold text-[#6E6A65]">Received From</p>
          <p className="mt-1 font-medium">{client?.legalName || client?.name}</p>
        </div>
        <div className="text-right">
          <p><span className="text-[#6E6A65]">Date:</span> {payment.paymentDate}</p>
          <p><span className="text-[#6E6A65]">Method:</span> {METHOD_LABEL[payment.method] || payment.method}</p>
          {payment.referenceNumber && <p><span className="text-[#6E6A65]">Reference:</span> {payment.referenceNumber}</p>}
        </div>
      </div>

      <div className="mt-8 rounded-lg border border-[#1A1A1A] p-4 text-center">
        <p className="text-sm text-[#6E6A65]">Amount Received</p>
        <p className="text-3xl font-bold">{formatRupees(payment.amountPaise)}</p>
      </div>

      {allocations.length > 0 && (
        <table className="mt-6 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-[#1A1A1A] text-left">
              <th className="py-2">Applied To</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {allocations.map((a) => (
              <tr key={a.id} className="border-b border-[#E5E5E7]">
                <td className="py-2">{a.invoiceId ? `Invoice ${a.invoiceNumber || `#${a.invoiceId}`}` : "Advance (unallocated)"}</td>
                <td className="py-2 text-right">{formatRupees(a.amountPaise)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {payment.notes && (
        <div className="mt-6 text-sm">
          <p className="font-semibold text-[#6E6A65]">Notes</p>
          <p className="whitespace-pre-wrap">{payment.notes}</p>
        </div>
      )}

      <div className="pointer-events-none absolute bottom-[12mm] left-[20mm] right-[20mm] text-center text-[10px] text-[#6E6A65]">
        This is a computer-generated receipt.
      </div>
    </article>
  );
});

export default PaymentReceiptDocument;
