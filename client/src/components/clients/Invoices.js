import React from "react";
import Link from "next/link";

const Invoices = ({ client }) => {
  const clientName = client?.name || "Client";
  const invoices = Array.isArray(client?.invoices) ? client.invoices :
    (client?.invoices ? client.invoices.split(",") : []);

  const hasInvoices = invoices.length > 0;

  return (
    <main className="flex-1 overflow-y-auto p-container-margin">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="font-title-lg text-title-lg text-on-surface">Invoices</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
              Invoice references saved on {clientName}&apos;s record. Create and manage full invoices from the Invoices page.
            </p>
          </div>
          <Link
            href="/invoices"
            className="shrink-0 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-primary/90 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Invoice
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden">
          <div className="divide-y divide-[#F0F0F0]">
            {hasInvoices ? (
              invoices.map((invoice, idx) => (
                <div key={idx} className="p-4 flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-[20px]">receipt_long</span>
                  <span className="font-body-sm text-body-sm text-on-surface">
                    {typeof invoice === "object" ? invoice.name || invoice.invoiceNumber : invoice}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-on-surface-variant font-body-sm text-body-sm">
                No invoices recorded for {clientName} yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default Invoices;
