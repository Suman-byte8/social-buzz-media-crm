"use client";

import React, { forwardRef } from "react";
import { formatRupees } from "@/lib/formatCurrency";

// A4 printable invoice — captured via the existing, unchanged
// getNodesPdfBlob/exportNodesToPdf from lib/Pdfexport.js, same ".sheet"
// convention every other document template in this app uses.
const InvoiceDocument = forwardRef(function InvoiceDocument({ invoice, client }, ref) {
  if (!invoice) return null;
  const balance = invoice.totalPaise - invoice.amountPaidPaise;

  return (
    <article ref={ref} className="sheet relative min-h-[297mm] w-[210mm] bg-white p-[20mm] text-[#1A1A1A]">
      <div className="flex items-start justify-between border-b border-[#1A1A1A] pb-4">
        <div>
          <h1 className="text-2xl font-bold">Social Buzz Media</h1>
          <p className="text-sm text-[#6E6A65]">socialbuzzmedia.in</p>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-bold">INVOICE</h2>
          <p className="text-sm">{invoice.invoiceNumber}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-6 text-sm">
        <div>
          <p className="font-semibold text-[#6E6A65]">Bill To</p>
          <p className="mt-1 font-medium">{client?.legalName || client?.name}</p>
          {client?.address && <p>{client.address}</p>}
          {client?.gstin && <p>GSTIN: {client.gstin}</p>}
          {client?.email && <p>{client.email}</p>}
        </div>
        <div className="text-right">
          <p><span className="text-[#6E6A65]">Invoice date:</span> {invoice.invoiceDate}</p>
          <p><span className="text-[#6E6A65]">Due date:</span> {invoice.dueDate}</p>
          <p><span className="text-[#6E6A65]">Status:</span> <span className="capitalize">{invoice.status?.replace("_", " ")}</span></p>
        </div>
      </div>

      <table className="mt-6 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-[#1A1A1A] text-left">
            <th className="py-2">Description</th>
            <th className="py-2 text-right">Qty</th>
            <th className="py-2 text-right">Unit Price</th>
            <th className="py-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {(invoice.lineItems || []).map((item) => (
            <tr key={item.id} className="border-b border-[#E5E5E7]">
              <td className="py-2">{item.description}</td>
              <td className="py-2 text-right">{item.quantity}</td>
              <td className="py-2 text-right">{formatRupees(item.unitPricePaise)}</td>
              <td className="py-2 text-right">{formatRupees(item.lineTotalPaise)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 ml-auto w-64 space-y-1 text-sm">
        <div className="flex justify-between"><span>Subtotal</span><span>{formatRupees(invoice.subtotalPaise)}</span></div>
        <div className="flex justify-between"><span>Discount</span><span>-{formatRupees(invoice.discountPaise)}</span></div>
        <div className="flex justify-between"><span>Tax</span><span>{formatRupees(invoice.taxPaise)}</span></div>
        {invoice.roundOffPaise ? (
          <div className="flex justify-between"><span>Round off</span><span>{formatRupees(invoice.roundOffPaise)}</span></div>
        ) : null}
        <div className="flex justify-between border-t border-[#1A1A1A] pt-1 font-semibold"><span>Total</span><span>{formatRupees(invoice.totalPaise)}</span></div>
        <div className="flex justify-between"><span>Paid</span><span>{formatRupees(invoice.amountPaidPaise)}</span></div>
        <div className="flex justify-between font-semibold"><span>Balance Due</span><span>{formatRupees(balance)}</span></div>
      </div>

      {invoice.notes && (
        <div className="mt-6 text-sm">
          <p className="font-semibold text-[#6E6A65]">Notes</p>
          <p className="whitespace-pre-wrap">{invoice.notes}</p>
        </div>
      )}

      <div className="pointer-events-none absolute bottom-[12mm] left-[20mm] right-[20mm] text-center text-[10px] text-[#6E6A65]">
        This is a computer-generated invoice.
      </div>
    </article>
  );
});

export default InvoiceDocument;
