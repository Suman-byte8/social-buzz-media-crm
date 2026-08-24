export default function InvoicesPage() {
  return (
    <main className="flex-1 p-container-margin overflow-x-hidden">
      {/* Invoice Generator — only */}
      <section className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-card-padding border-b border-outline-variant bg-surface-container-low">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[28px] text-primary">
              receipt_long
            </span>
            <div>
              <h2 className="font-headline-sm text-headline-sm text-on-surface">
                Invoice Generator
              </h2>
              <p className="font-body-sm text-body-sm text-tertiary">
                Create, edit and export GST-compliant tax invoices — fill in the details and hit Save PDF or Share.
              </p>
            </div>
          </div>
          <a
            href="/invoice-builder.html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-label-md text-label-md hover:bg-primary-container transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">
              open_in_new
            </span>
            Open full screen
          </a>
        </div>
        <div className="p-3 pb-0 bg-[#EAE8E4]">
          <iframe
            src="/invoice-builder.html"
            title="Invoice Generator"
            className="w-full h-[86vh] min-h-[560px] block bg-white rounded-t-lg border border-outline-variant shadow-sm"
            loading="lazy"
          />
          <p className="py-2 text-center font-label-sm text-label-sm text-tertiary bg-[#EAE8E4]">
            Tip: fill manually, then use the Save PDF / Share buttons above the invoice sheet.
          </p>
        </div>
      </section>
    </main>
  );
}
