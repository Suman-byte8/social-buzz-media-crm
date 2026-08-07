import React from "react";

const page = () => {
  return (
    <div className="flex-1 flex flex-col  h-full overflow-hidden">
      {/* TopNavBar */}
      <header className="bg-surface dark:bg-surface h-16 w-full sticky top-0 z-40 border-b border-outline-variant shadow-sm flex justify-between items-center px-gutter shrink-0">
        <div className="flex items-center gap-4 flex-1">
          <div className="md:hidden">
            <button className="text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined">menu</span>
            </button>
          </div>
          <div className="relative w-full max-w-md hidden md:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
              search
            </span>
            <input
              className="w-full pl-10 pr-4 py-2 bg-[#F5F5F7] border-none rounded-lg text-body-sm font-body-sm focus:ring-1 focus:ring-primary focus:outline-none placeholder:text-on-surface-variant"
              placeholder="Search..."
              type="text"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer active:opacity-80">
            <span
              className="material-symbols-outlined"
              data-icon="notifications"
            >
              notifications
            </span>
          </button>
          <button className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer active:opacity-80">
            <span className="material-symbols-outlined" data-icon="help">
              help
            </span>
          </button>
          <button className="hidden md:block font-label-md text-label-md font-bold text-on-surface-variant hover:text-primary transition-colors">
            Support
          </button>
          <div className="w-8 h-8 rounded-full overflow-hidden cursor-pointer active:opacity-80 border border-outline-variant">
            <img
              alt="User Avatar"
              className="w-full h-full object-cover"
              data-alt="A professional headshot of a business user in a modern office environment, soft natural lighting, high quality."
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBjr0grdyYdU7BvfST6vn_MQQLDMsQjNGOEIsStj7ifAzdQZq74Ekm5-R0b2covqyM8hIQuaqkgvDmZcZQ4An3O_CsRwzOkuxSCIBSshY9thfnGTLku6SZDWyjP3zjWNO2YuTy_Y47oTVlmL5jpCPoC1zwnj2puY1jar1Y0qocWwmxB7d-d41bO_ECl8yDqOsEmOXRwBUg9R-ACqAQjldoDemjuz_B8JOIEgp-I37hAjJb9kUVkWhZH"
            />
          </div>
        </div>
      </header>
      {/* <!-- Main Canvas --> */}
      <main className="flex-1 overflow-y-auto p-4 md:p-container-margin">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-stack-lg gap-4">
          <div>
            <h2 className="font-display-lg text-display-lg text-on-surface">
              Clients
            </h2>
            <p className="font-body-sm text-body-sm text-secondary mt-1">
              Manage your agency accounts and monitor health scores.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 bg-white border border-[#1A1A1A] text-[#1A1A1A] px-4 py-2 rounded-lg font-label-md text-label-md hover:bg-gray-50 transition-colors shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
              <span className="material-symbols-outlined text-[18px]">
                download
              </span>
              Export
            </button>
            <button className="flex items-center gap-2 bg-[#E8262A] text-white px-4 py-2 rounded-lg font-label-md text-label-md hover:bg-primary-container transition-colors shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
              <span className="material-symbols-outlined text-[18px]">add</span>
              Add Client
            </button>
          </div>
        </div>
        {/* <!-- Filters & Search Bar --> */}
        <div className="bg-white rounded-t-xl p-card-padding border border-b-0 border-[#E5E5E7] shadow-[0_2px_4px_rgba(0,0,0,0.05)] flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-xs">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
              search
            </span>
            <input
              className="w-full pl-10 pr-4 py-2 border border-[#E5E5E7] rounded-lg text-body-sm font-body-sm focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none placeholder:text-on-surface-variant"
              placeholder="Search clients..."
              type="text"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
            <select className="border border-[#E5E5E7] rounded-lg px-3 py-2 text-body-sm font-body-sm bg-white focus:ring-1 focus:ring-primary focus:border-primary outline-none">
              <option>All Industries</option>
              <option>SaaS</option>
              <option>E-commerce</option>
              <option>Healthcare</option>
            </select>
            <select className="border border-[#E5E5E7] rounded-lg px-3 py-2 text-body-sm font-body-sm bg-white focus:ring-1 focus:ring-primary focus:border-primary outline-none">
              <option>Status: All</option>
              <option>Active</option>
              <option>Onboarding</option>
              <option>At Risk</option>
            </select>
            <button className="flex items-center gap-1 text-secondary hover:text-primary transition-colors text-body-sm font-body-sm whitespace-nowrap px-2">
              <span className="material-symbols-outlined text-[18px]">
                filter_list
              </span>{" "}
              More Filters
            </button>
          </div>
        </div>

        {/* <!-- Data Table --> */}

        <div className="bg-white rounded-b-xl border border-[#E5E5E7] shadow-[0_2px_4px_rgba(0,0,0,0.05)] overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[900px] text-left border-collapse">
            <thead className="bg-[#FAFAFA] border-b border-[#F0F0F0]">
              <tr>
                <th className="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider">
                  Client Name
                </th>
                <th className="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider">
                  Industry
                </th>
                <th className="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider">
                  Services
                </th>
                <th className="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider">
                  Account Manager
                </th>
                <th className="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider">
                  Health
                </th>
                <th className="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider">
                  MRR
                </th>
                <th className="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="text-body-sm font-body-sm">
              {/* <!-- Row 1 --> */}

              <tr className="border-b border-[#F0F0F0] hover:bg-[#F9F9F9] transition-colors group">
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg border border-[#E5E5E7] flex items-center justify-center bg-white overflow-hidden shrink-0">
                      <img
                        alt="TechCorp Logo"
                        className="w-full h-full object-cover"
                        data-alt="A stylized logo for a tech company named TechCorp, minimal geometric design in blue and gray, set against a clean white background."
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDaumpYL9oXFGQIN1OE8AUOLZzUS9P9_1MwtDAAP31q4_p7ZHrTqQa3wTUCej9VzYrJXaifl2uolqAKrIKB0Y-zAJVeWkxSJXijqvSHFNl5CByF7QKS3pJ2mrsj-W0FFUyENpDAt6kgKxxHPw-Do0BJDPPcCPf-GddDZMvM1gPHOCvaJjtAgFvJb61OGfNpw425qC78KXZFCizeIMMF0OQMwNKK9SsjPMr5rFL68z1z_8eCV3_aCBX8"
                      />
                    </div>
                    <div>
                      <p className="font-title-lg text-title-lg text-on-surface">
                        TechCorp Inc.
                      </p>
                      <p className="text-secondary text-xs mt-0.5">
                        Active since Jan 2023
                      </p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4 text-secondary">SaaS / Enterprise</td>
                <td className="py-4 px-4">
                  <div className="flex flex-wrap gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs border border-gray-200">
                      SEO
                    </span>
                    <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs border border-gray-200">
                      Content
                    </span>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                      JD
                    </div>
                    <span className="text-on-surface">Jane Doe</span>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span className="px-2.5 py-1 rounded-xl bg-green-100 text-green-800 text-xs font-bold inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>{" "}
                    Excellent
                  </span>
                </td>
                <td className="py-4 px-4 font-title-lg text-title-lg text-on-surface">
                  $12,500
                </td>
                <td className="py-4 px-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      className="text-secondary hover:text-primary transition-colors p-1"
                      title="View Profile"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        visibility
                      </span>
                    </button>
                    <button
                      className="text-secondary hover:text-primary transition-colors p-1"
                      title="Edit"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        edit
                      </span>
                    </button>
                  </div>
                </td>
              </tr>

              {/* <!-- Row 2 --> */}

              <tr className="border-b border-[#F0F0F0] hover:bg-[#F9F9F9] transition-colors group">
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg border border-[#E5E5E7] flex items-center justify-center bg-white overflow-hidden shrink-0">
                      <div className="font-bold text-gray-400">G</div>
                    </div>
                    <div>
                      <p className="font-title-lg text-title-lg text-on-surface">
                        Global Retailers
                      </p>
                      <p className="text-secondary text-xs mt-0.5">
                        Active since Mar 2023
                      </p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4 text-secondary">E-commerce</td>
                <td className="py-4 px-4">
                  <div className="flex flex-wrap gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs border border-gray-200">
                      Meta Ads
                    </span>
                    <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs border border-gray-200">
                      Google Ads
                    </span>
                    <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs border border-gray-200">
                      Design
                    </span>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">
                      MS
                    </div>
                    <span className="text-on-surface">Mike Smith</span>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span className="px-2.5 py-1 rounded-xl bg-yellow-100 text-yellow-800 text-xs font-bold inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>{" "}
                    Fair
                  </span>
                </td>
                <td className="py-4 px-4 font-title-lg text-title-lg text-on-surface">
                  $8,200
                </td>
                <td className="py-4 px-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      className="text-secondary hover:text-primary transition-colors p-1"
                      title="View Profile"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        visibility
                      </span>
                    </button>
                    <button
                      className="text-secondary hover:text-primary transition-colors p-1"
                      title="Edit"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        edit
                      </span>
                    </button>
                  </div>
                </td>
              </tr>

              {/* <!-- Row 3 --> */}

              <tr className="border-b border-[#F0F0F0] hover:bg-[#F9F9F9] transition-colors group">
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg border border-[#E5E5E7] flex items-center justify-center bg-white overflow-hidden shrink-0">
                      <img
                        alt="HealthPlus Logo"
                        className="w-full h-full object-cover"
                        data-alt="A modern abstract logo for a healthcare startup named HealthPlus, using green and teal organic shapes, minimal style."
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuB944ntHJ_ya4c7MnqazyEORH-LZLRZoTP8OarsVAGRQjD2MzQ3D3Ux1-EQYVP0JkXnxnhGM0DRWqWOtlu4spAbng_8I88X-LhbVlF9Xd-d-4mibuKRdNNml8k3t2PNCmEbneVOLNx6p-uq-sPSAsuuIiCkU8Z3E7yGZsbRi3gY4zc-ulQtDBSlJ6Qbyh9Ep0XJZnXsFiOuWr6GipMlwbqlFapiydLdsOUYOXtPPdcq38HukyPegAKo"
                      />
                    </div>
                    <div>
                      <p className="font-title-lg text-title-lg text-on-surface">
                        HealthPlus
                      </p>
                      <p className="text-secondary text-xs mt-0.5">
                        Active since Aug 2023
                      </p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4 text-secondary">Healthcare</td>
                <td className="py-4 px-4">
                  <div className="flex flex-wrap gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs border border-gray-200">
                      SEO
                    </span>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                      JD
                    </div>
                    <span className="text-on-surface">Jane Doe</span>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span className="px-2.5 py-1 rounded-xl bg-red-100 text-red-800 text-xs font-bold inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>{" "}
                    At Risk
                  </span>
                </td>
                <td className="py-4 px-4 font-title-lg text-title-lg text-on-surface">
                  $4,500
                </td>
                <td className="py-4 px-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      className="text-secondary hover:text-primary transition-colors p-1"
                      title="View Profile"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        visibility
                      </span>
                    </button>
                    <button
                      className="text-secondary hover:text-primary transition-colors p-1"
                      title="Edit"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        edit
                      </span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Pagination */}

          <div className="bg-white px-4 py-3 border-t border-[#F0F0F0] flex items-center justify-between sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-secondary">
                  Showing <span className="font-medium text-on-surface">1</span>{" "}
                  to <span className="font-medium text-on-surface">3</span> of{" "}
                  <span className="font-medium text-on-surface">24</span>{" "}
                  results
                </p>
              </div>
              <div>
                <nav
                  aria-label="Pagination"
                  className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                >
                  <a
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-[#E5E5E7] bg-white text-sm font-medium text-secondary hover:bg-gray-50"
                    href="#"
                  >
                    <span className="sr-only">Previous</span>
                    <span className="material-symbols-outlined text-[20px]">
                      chevron_left
                    </span>
                  </a>
                  <a
                    aria-current="page"
                    className="z-10 bg-primary-container text-white relative inline-flex items-center px-4 py-2 border border-primary-container text-sm font-medium"
                    href="#"
                  >
                    1
                  </a>
                  <a
                    className="bg-white border-[#E5E5E7] text-secondary hover:bg-gray-50 relative inline-flex items-center px-4 py-2 border text-sm font-medium"
                    href="#"
                  >
                    2
                  </a>
                  <a
                    className="bg-white border-[#E5E5E7] text-secondary hover:bg-gray-50 relative inline-flex items-center px-4 py-2 border text-sm font-medium"
                    href="#"
                  >
                    3
                  </a>
                  <a
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-[#E5E5E7] bg-white text-sm font-medium text-secondary hover:bg-gray-50"
                    href="#"
                  >
                    <span className="sr-only">Next</span>
                    <span className="material-symbols-outlined text-[20px]">
                      chevron_right
                    </span>
                  </a>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default page;
