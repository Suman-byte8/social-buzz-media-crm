import React from "react";
import Link from "next/link";

export default function AgreementsPage() {
  return (
    <main className="flex-1 p-container-margin w-full max-w-7xl mx-auto">
      {/* Client Header Context */}
      <div className="mb-stack-lg flex flex-col sm:flex-row justify-between items-start sm:items-end gap-stack-md">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/clients"
              className="font-label-sm text-label-sm text-secondary uppercase tracking-wider hover:text-primary transition-colors"
            >
              Client Workspace
            </Link>
            <span className="material-symbols-outlined text-[16px] text-secondary">
              chevron_right
            </span>
            <Link
              href="/clients/1"
              className="font-label-sm text-label-sm text-primary uppercase tracking-wider hover:underline"
            >
              Acme Corp
            </Link>
          </div>
          <h2 className="font-display-lg text-display-lg text-on-background">
            Agreements
          </h2>
        </div>
        <button className="bg-[#E8262A] text-white font-label-md text-label-md px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-primary transition-colors shadow-sm cursor-pointer">
          <span className="material-symbols-outlined text-[18px]">
            upload_file
          </span>
          Upload Agreement
        </button>
      </div>

      {/* Content Area (Table) */}
      <div className="bg-white border border-[#E5E5E7] rounded-xl shadow-[0px_2px_4px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAFAFA] border-b border-[#F0F0F0]">
                <th className="py-4 px-6 font-label-sm text-label-sm text-tertiary uppercase tracking-wider whitespace-nowrap">
                  Document Name
                </th>
                <th className="py-4 px-6 font-label-sm text-label-sm text-tertiary uppercase tracking-wider whitespace-nowrap">
                  Effective Date
                </th>
                <th className="py-4 px-6 font-label-sm text-label-sm text-tertiary uppercase tracking-wider whitespace-nowrap">
                  Expiry Date
                </th>
                <th className="py-4 px-6 font-label-sm text-label-sm text-tertiary uppercase tracking-wider whitespace-nowrap">
                  Status
                </th>
                <th className="py-4 px-6 font-label-sm text-label-sm text-tertiary uppercase tracking-wider text-right whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F0F0]">
              {/* Row 1: Active */}
              <tr className="hover:bg-[#F9F9F9] transition-colors group">
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[20px]">
                        contract
                      </span>
                    </div>
                    <div>
                      <p className="font-title-lg text-title-lg text-on-surface">
                        Master Service Agreement
                      </p>
                      <p className="font-body-sm text-body-sm text-secondary">
                        AcmeCorp_MSA_2023.pdf
                      </p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6 font-body-sm text-body-sm text-on-surface">
                  Jan 01, 2023
                </td>
                <td className="py-4 px-6 font-body-sm text-body-sm text-on-surface">
                  Dec 31, 2025
                </td>
                <td className="py-4 px-6">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                    Active
                  </span>
                </td>
                <td className="py-4 px-6 text-right space-x-2">
                  <button className="inline-flex items-center justify-center px-4 py-2 border border-[#1A1A1A] bg-white text-[#1A1A1A] rounded-lg font-label-md text-label-md hover:bg-gray-50 transition-colors cursor-pointer">
                    View
                  </button>
                </td>
              </tr>
              {/* Row 2: Pending Signature */}
              <tr className="hover:bg-[#F9F9F9] transition-colors group">
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[20px]">
                        signature
                      </span>
                    </div>
                    <div>
                      <p className="font-title-lg text-title-lg text-on-surface">
                        SEO Retainer Q3
                      </p>
                      <p className="font-body-sm text-body-sm text-secondary">
                        AcmeCorp_SEO_Q3_2024.pdf
                      </p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6 font-body-sm text-body-sm text-on-surface">
                  Jul 01, 2024
                </td>
                <td className="py-4 px-6 font-body-sm text-body-sm text-on-surface text-secondary italic">
                  Pending
                </td>
                <td className="py-4 px-6">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200">
                    Pending Signature
                  </span>
                </td>
                <td className="py-4 px-6 text-right space-x-2 whitespace-nowrap">
                  <button className="inline-flex items-center justify-center px-4 py-2 bg-transparent text-primary hover:bg-surface-container-high rounded-lg font-label-md text-label-md transition-colors border border-transparent hover:border-surface-variant cursor-pointer">
                    View
                  </button>
                  <button className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-[#1A1A1A] bg-white text-[#1A1A1A] rounded-lg font-label-md text-label-md hover:bg-gray-50 transition-colors cursor-pointer">
                    <span className="material-symbols-outlined text-[16px]">
                      draw
                    </span>
                    Sign via DocuSign
                  </button>
                </td>
              </tr>
              {/* Row 3: Expired */}
              <tr className="hover:bg-[#F9F9F9] transition-colors group opacity-75">
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-tertiary">
                      <span className="material-symbols-outlined text-[20px]">
                        history
                      </span>
                    </div>
                    <div>
                      <p className="font-title-lg text-title-lg text-on-surface">
                        Initial Consultation NDA
                      </p>
                      <p className="font-body-sm text-body-sm text-secondary">
                        AcmeCorp_NDA_2022.pdf
                      </p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6 font-body-sm text-body-sm text-on-surface">
                  Feb 15, 2022
                </td>
                <td className="py-4 px-6 font-body-sm text-body-sm text-on-surface">
                  Feb 15, 2023
                </td>
                <td className="py-4 px-6">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200">
                    Expired
                  </span>
                </td>
                <td className="py-4 px-6 text-right space-x-2">
                  <button className="inline-flex items-center justify-center px-4 py-2 bg-transparent text-tertiary hover:bg-gray-100 rounded-lg font-label-md text-label-md transition-colors cursor-pointer">
                    View
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        {/* Table Footer/Pagination */}
        <div className="bg-[#FAFAFA] border-t border-[#F0F0F0] px-6 py-4 flex items-center justify-between">
          <p className="font-body-sm text-body-sm text-secondary">
            Showing 1 to 3 of 3 entries
          </p>
          <div className="flex gap-2">
            <button
              className="p-2 rounded border border-[#E5E5E7] bg-white text-tertiary disabled:opacity-50 cursor-not-allowed"
              disabled
            >
              <span className="material-symbols-outlined text-[18px]">
                chevron_left
              </span>
            </button>
            <button
              className="p-2 rounded border border-[#E5E5E7] bg-white text-tertiary disabled:opacity-50 cursor-not-allowed"
              disabled
            >
              <span className="material-symbols-outlined text-[18px]">
                chevron_right
              </span>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
