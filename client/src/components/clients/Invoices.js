import React from "react";

const Invoices = () => {
  return (
    <main className="flex-1 p-container-margin md:p-container-margin overflow-x-hidden">
 
      {/* Client Profile Header (Bento Style Card) */}
      <section className="bg-surface-container-lowest rounded-xl border border-outline-variant p-card-padding mb-stack-lg shadow-[0_2px_4px_rgba(0,0,0,0.05)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-surface-container to-transparent opacity-50"></div>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-stack-lg relative z-10">
          <img className="w-20 h-20 rounded-lg object-contain bg-white border border-outline-variant p-2 shadow-sm" data-alt="A sleek logo" src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150" />
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="font-display-lg text-display-lg text-on-surface">Acme Corporation</h2>
              <span className="px-2 py-1 rounded-full bg-green-100 text-green-800 font-label-sm text-label-sm border border-green-200 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">check_circle</span> Active
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-tertiary font-body-sm text-body-sm">
              <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">domain</span> Enterprise SaaS</span>
              <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">location_on</span> New York, USA</span>
              <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">link</span> acmecorp.com</span>
            </div>
          </div>
          <div className="flex gap-stack-md w-full md:w-auto mt-4 md:mt-0">
            <a className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-surface-container-lowest border border-on-surface text-on-surface font-label-md text-label-md hover:bg-surface-container-low transition-colors shadow-sm" href="#">
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
            <span className="font-headline-md text-headline-md text-on-surface">$124,500</span>
            <span className="font-label-md text-label-md text-green-600 flex items-center"><span className="material-symbols-outlined text-[16px]">trending_up</span> 12%</span>
          </div>
        </div>
        <div className="bg-surface-container-lowest rounded-lg border border-outline-variant p-4 shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
          <h3 className="font-label-sm text-label-sm text-tertiary uppercase mb-2">Outstanding</h3>
          <div className="flex items-end justify-between">
            <span className="font-headline-md text-headline-md text-on-surface">$18,200</span>
            <span className="font-label-md text-label-md text-tertiary">2 Invoices</span>
          </div>
        </div>
        <div className="bg-surface-container-lowest rounded-lg border border-outline-variant p-4 shadow-[0_2px_4px_rgba(0,0,0,0.05)] border-l-4 border-l-error">
          <h3 className="font-label-sm text-label-sm text-error uppercase mb-2 font-bold">Overdue</h3>
          <div className="flex items-end justify-between">
            <span className="font-headline-md text-headline-md text-error">$4,500</span>
            <span className="font-label-md text-label-md text-error">1 Invoice</span>
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
              {/* Row 1: Overdue */}
              <tr className="border-b border-[#F0F0F0] hover:bg-[#F9F9F9] transition-colors group">
                <td className="py-4 px-4 font-label-md text-label-md text-on-surface">INV-2023-042</td>
                <td className="py-4 px-4 text-tertiary">Oct 01, 2023</td>
                <td className="py-4 px-4 text-error font-medium">Oct 15, 2023</td>
                <td className="py-4 px-4 text-right font-medium">$4,500.00</td>
                <td className="py-4 px-4 text-right text-tertiary">$450.00</td>
                <td className="py-4 px-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-xl font-label-sm text-label-sm bg-error/10 text-error border border-error/20">Overdue</span>
                </td>
                <td className="py-4 px-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 rounded text-tertiary hover:text-primary hover:bg-primary/10 transition-colors" title="Send Reminder">
                      <span className="material-symbols-outlined text-[18px]">send</span>
                    </button>
                    <button className="p-1.5 rounded text-tertiary hover:text-on-surface hover:bg-surface-container-high transition-colors" title="Download PDF">
                      <span className="material-symbols-outlined text-[18px]">download</span>
                    </button>
                  </div>
                </td>
              </tr>
              {/* Row 2: Pending */}
              <tr className="border-b border-[#F0F0F0] hover:bg-[#F9F9F9] transition-colors group">
                <td className="py-4 px-4 font-label-md text-label-md text-on-surface">INV-2023-045</td>
                <td className="py-4 px-4 text-tertiary">Oct 15, 2023</td>
                <td className="py-4 px-4 text-tertiary">Oct 30, 2023</td>
                <td className="py-4 px-4 text-right font-medium">$13,700.00</td>
                <td className="py-4 px-4 text-right text-tertiary">$1,370.00</td>
                <td className="py-4 px-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-xl font-label-sm text-label-sm bg-orange-100 text-orange-800 border border-orange-200">Pending</span>
                </td>
                <td className="py-4 px-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 rounded text-tertiary hover:text-primary hover:bg-primary/10 transition-colors" title="Send Reminder">
                      <span className="material-symbols-outlined text-[18px]">send</span>
                    </button>
                    <button className="p-1.5 rounded text-tertiary hover:text-on-surface hover:bg-surface-container-high transition-colors" title="Download PDF">
                      <span className="material-symbols-outlined text-[18px]">download</span>
                    </button>
                  </div>
                </td>
              </tr>
              {/* Row 3: Paid */}
              <tr className="border-b border-[#F0F0F0] hover:bg-[#F9F9F9] transition-colors group">
                <td className="py-4 px-4 font-label-md text-label-md text-on-surface">INV-2023-038</td>
                <td className="py-4 px-4 text-tertiary">Sep 01, 2023</td>
                <td className="py-4 px-4 text-tertiary">Sep 15, 2023</td>
                <td className="py-4 px-4 text-right font-medium">$12,000.00</td>
                <td className="py-4 px-4 text-right text-tertiary">$1,200.00</td>
                <td className="py-4 px-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-xl font-label-sm text-label-sm bg-green-100 text-green-800 border border-green-200">Paid</span>
                </td>
                <td className="py-4 px-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 rounded text-tertiary hover:text-on-surface hover:bg-surface-container-high transition-colors" title="Download PDF">
                      <span className="material-symbols-outlined text-[18px]">download</span>
                    </button>
                  </div>
                </td>
              </tr>
              {/* Row 4: Paid */}
              <tr className="border-b border-[#F0F0F0] hover:bg-[#F9F9F9] transition-colors group">
                <td className="py-4 px-4 font-label-md text-label-md text-on-surface">INV-2023-031</td>
                <td className="py-4 px-4 text-tertiary">Aug 01, 2023</td>
                <td className="py-4 px-4 text-tertiary">Aug 15, 2023</td>
                <td className="py-4 px-4 text-right font-medium">$8,500.00</td>
                <td className="py-4 px-4 text-right text-tertiary">$850.00</td>
                <td className="py-4 px-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-xl font-label-sm text-label-sm bg-green-100 text-green-800 border border-green-200">Paid</span>
                </td>
                <td className="py-4 px-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 rounded text-tertiary hover:text-on-surface hover:bg-surface-container-high transition-colors" title="Download PDF">
                      <span className="material-symbols-outlined text-[18px]">download</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-outline-variant flex items-center justify-between bg-surface-container-lowest">
          <span className="font-body-sm text-body-sm text-tertiary">Showing 4 of 24 invoices</span>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 rounded border border-outline-variant text-tertiary font-label-sm text-label-sm cursor-not-allowed opacity-50">Previous</button>
            <button className="px-3 py-1 rounded border border-outline-variant text-on-surface hover:bg-surface-container-low transition-colors font-label-sm text-label-sm">Next</button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Invoices;
