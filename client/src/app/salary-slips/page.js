import SalarySlipBuilder from "@/components/salary-slip/SalarySlipBuilder";
import RequireAdmin from "@/components/auth/RequireAdmin";

export default function SalarySlipsPage() {
  return (
    <RequireAdmin>
      <main className="flex-1 p-container-margin overflow-x-hidden">
        <section className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden shadow-card">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-card-padding border-b border-outline-variant bg-surface-container-low">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[28px] text-primary">
                payments
              </span>
              <div>
                <h2 className="font-headline-sm text-headline-sm text-on-surface">
                  Salary Slip Generator
                </h2>
                <p className="font-body-sm text-body-sm text-tertiary">
                  Pick a team member, fill in the salary breakdown, and save the slip straight to their Drive folder.
                </p>
              </div>
            </div>
          </div>
          <div className="p-0">
            <SalarySlipBuilder />
          </div>
        </section>
      </main>
    </RequireAdmin>
  );
}
