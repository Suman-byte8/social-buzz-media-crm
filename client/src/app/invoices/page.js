import InvoiceBuilder from "@/components/invoices/InvoiceBuilder";

export default function InvoicesPage() {
  return (
    <main className="flex-1 p-container-margin overflow-x-hidden">
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
        </div>
        <div className="p-0">
          <InvoiceBuilder />
        </div>
      </section>
    </main>
  );
}