import React from "react";

const Invoices = ({ client }) => {
  const clientName = client?.name || "Client";
  const invoices = Array.isArray(client?.invoices) ? client.invoices :
    (client?.invoices ? client.invoices.split(",") : []);

  const hasInvoices = invoices.length > 0;

  return (
    <main className="flex-1 p-container-margin md:p-container-margin overflow-x-hidden">
      {/* Client Profile Header */}
      <section className="bg-surface-container-lowest rounded-xl border border-outline-variant p-card-padding mb-stack-lg shadow-[0_2px_4px_rgba(0,0,0,0.05)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-surface-container to-transparent opacity-50"></div>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-stack-lg relative z-10">
          <div className="w-20 h-20 rounded-lg overflow-hidden border border-outline-variant bg-primary-container flex items-center justify-center shrink-0">
            <span className="font-display-md text-display-md text-primary font-bold">
              {clientName[0]?.toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="font-display-lg text-display-lg text-on-surface">{clientName}</h2>
              <span className={`px-2 py-1 rounded-full font-label-sm text-label-sm flex items-center gap-1 ${
                (client?.clientHealth ?? 0) >= 80
                  ? 'bg-green-100 text-green-800'
                  : (client?.clientHealth ?? 0) >= 50
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                {(client?.clientHealth ?? 0) >= 80 ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-tertiary font-body-sm text-body-sm">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">domain</span>
                {client?.industry || "N/A"}
              </span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">location_on</span>
                {client?.address || "N/A"}
              </span>
            </div>
          </div>
          <div className="flex gap-stack-md w-full md:w-auto mt-4 md:mt-0">
            <a className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant text-on-surface font-label-md text-label-md hover:bg-surface-container-low transition-colors shadow-sm" href="#">
              <span className="material-symbols-outlined text-[18px]">open_in_new</span> Main Tracker
            </a>
            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-primary/90 transition-colors shadow-sm">
              <span className="material-symbols-outlined text-[18px]">add</span> New Invoice
            </button>
          </div>
        </div>
      </section>

      {/* Financial Summary Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter mb-stack-lg">
        <div className="bg-surface-container-lowest rounded-lg border border-outline-variant p-4 shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
          <h3 className="font-label-sm text-label-sm text-tertiary uppercase mb-2">Total Billed YTD</h3>
          <div className="flex items-end justify-between">
            <span className="font-headline-md text-headline-md text-on-surface">{hasInvoices ? invoices.reduce((total, inv) => total + (parseFloat(inv.amount?.replace(/[$,]/g, '') || 0)), 0).toLocaleString('en-US', {style: 'currency', currency: 'USD'}) : "$0.00"}</span>
            <span className="font-label-md text-label-md text-green-600 flex items-center">
              <span className="material-symbols-outlined text-[16px]">trending_up</span> N/A
            </span>
          </div>
        </div>
        <div className="bg-surface-container-lowest rounded-lg border border-outline-variant p-4 shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
          <h3 className="font-label-sm text-label-sm text-tertiary uppercase mb-2">Outstanding</h3>
          <div className="flex items-end justify-between">
            <span className="font-headline-md text-headline-md text-on-surface">
              {hasInvoices ? invoices.filter(i => i.status === 'pending').reduce((total, inv) => total + (parseFloat(inv.amount?.replace(/[$,]/g, '') || 0)), 0).toLocaleString('en-US', {style: 'currency', currency: 'USD'}) : "$0.00"}
            </span>
            <span className="font-label-md text-label-md text-tertiary">
              {invoices.filter(i => i.status === 'pending').length} Invoice{invoices.filter(i => i.status === 'pending').length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <div className="bg-surface-container-lowest rounded-lg border border-outline-variant p-4 shadow-[0_2px_4px_rgba(0,0,0,0.05)] border-l-4 border-l-error">
          <h3 className="font-label-sm text-label-sm text-error uppercase mb-2 font-bold">Overdue</h3>
          <div className="flex items-end justify-between">
            <span className="font-headline-md text-headline-md text-error">
              {hasInvoices ? invoices.filter(i => i.status === 'overdue').reduce((total, inv) => total + (parseFloat(inv.amount?.replace(/[$,]/g, '') || 0)), 0).toLocaleString('en-US', {style: 'currency', currency: 'USD'}) : "$0.00"}
            </span>
            <span className="font-label-md text-label-md text-error">
              {invoices.filter(i => i.status === 'overdue').length} Invoice{invoices.filter(i => i.status === 'overdue').length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <div className="bg-surface-container-lowest rounded-lg border border-outline-variant p-4 shadow-[0_2px_4px_rgba(0,0,0,0.05)] flex flex-col justify-center items-center cursor-pointer hover:bg-surface-container-low transition-colors">
          <span className="material-symbols-outlined text-tertiary mb-1">download</span>
          <span className="font-label-md text-label-md text-on-surface">Export Statement</span>
        </div>
      </div>

      {/* Invoices Table Area */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-[0_2px_4px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-[#FAFAFA]">
          <h3 className="font-title-lg text-title-lg text-on-surface">Invoice History</h3>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-md hover:bg-surface-container-high transition-colors text-tertiary" title="Filter">
              <span className="material-symbols-outlined text-[20px]">filter_list</span>
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAFAFA] border-b border-outline-variant">
                <th className="py-3 px-4 font-label-sm text-label-sm text-tertiary uppercase tracking-wider">Invoice #</th>
                <th className="py-3 px-4 font-label-sm text-label-sm text-tertiary uppercase tracking-wider">Date</th>
                <th className="py-3 px-4 font-label-sm text-label-sm text-tertiary uppercase tracking-wider">Due Date</th>
                <th className="py-3 px-4 font-label-sm text-label-sm text-tertiary uppercase tracking-wider text-right">Amount</th>
                <th className="py-3 px-4 font-label-sm text-label-sm text-tertiary uppercase tracking-wider text-right">GST (10%)</th>
                <th className="py-3 px-4 font-label-sm text-label-sm text-tertiary uppercase tracking-wider">Status</th>
                <th className="py-3 px-4 font-label-sm text-label-sm text-tertiary uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="font-body-sm text-body-sm">
              {hasInvoices ? (
                invoices.slice(0, 4).map((invoice, idx) => {
                  const isOverdue = invoice.status === 'overdue';
                  const isPending = invoice.status === 'pending';
                  const amount = invoice.amount || "$0.00";
                  const gst = invoice.gst ? `$${parseFloat(invoice.gst).toFixed(2)}` : `$${(parseFloat(amount.replace(/[$,]/g, '')) * 0.1).toFixed(2)}`;
                  return (
                    <tr key={idx} className="border-b border-[#F0F0F0] hover:bg-[#F9F9F9] transition-colors group">
                      <td className="py-4 px-4 font-label-md text-label-md text-on-surface">
                        {invoice.id || invoice.invoiceNumber || `INV-${idx + 1}`}
                      </td>
                      <td className="py-4 px-4 text-tertiary">{invoice.date || "N/A"}</td>
                      <td className={`py-4 px-4 ${isOverdue ? 'text-error font-medium' : 'text-tertiary'}`}>
                        {invoice.dueDate || "N/A"}
                      </td>
                      <td className="py-4 px-4 text-right font-medium">{amount}</td>
                      <td className="py-4 px-4 text-right text-tertiary">{gst}</td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-xl font-label-sm text-label-sm ${
                          isOverdue
                            ? 'bg-error/10 text-error border border-error/20'
                            : isPending
                            ? 'bg-orange-100 text-orange-800 border border-orange-200'
                            : 'bg-green-100 text-green-800 border border-green-200'
                        }`}>
                          {invoice.status?.charAt(0).toUpperCase() + invoice.status?.slice(1) || "Paid"}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {isOverdue && (
                            <button className="p-1.5 rounded text-tertiary hover:text-primary hover:bg-primary/10 transition-colors" title="Send Reminder">
                              <span className="material-symbols-outlined text-[18px]">send</span>
                            </button>
                          )}
                          <button className="p-1.5 rounded text-tertiary hover:text-on-surface hover:bg-surface-container-high transition-colors" title="Download PDF">
                            <span className="material-symbols-outlined text-[18px]">download</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="py-8 px-4 text-center text-on-surface-variant">
                    No invoices yet for {clientName}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-outline-variant flex items-center justify-between bg-surface-container-lowest">
          <span className="font-body-sm text-body-sm text-tertiary">
            {hasInvoices ? `Showing ${Math.min(invoices.length, 4)} of ${invoices.length} invoices` : "No invoices"}
          </span>
          <div className="flex gap-2">
            <button className="px-3 py-1 rounded border border-outline-variant text-tertiary font-label-sm text-label-sm cursor-not-allowed opacity-50">Previous</button>
            <button className="px-3 py-1 rounded border border-outline-variant text-on-surface hover:bg-surface-container-low transition-colors font-label-sm text-label-sm">Next</button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Invoices;
