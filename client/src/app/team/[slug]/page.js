import React from "react";

export default function TeamMemberProfilePage({ params }) {
  const { slug } = params;

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
      <div className="max-w-6xl mx-auto space-y-8 pb-12">

        {/* Profile Header Card (Hero) */}
        <div className="bg-surface rounded-xl border border-outline-variant overflow-hidden shadow-sm">
          {/* Banner */}
          <div className="h-32 w-full bg-gradient-to-r from-surface-variant to-surface-container-highest relative">
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: "radial-gradient(#926f6b 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            />
          </div>

          <div className="px-8 pb-8 relative">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              {/* Avatar & Title */}
              <div className="flex flex-col md:flex-row gap-6 -mt-16 md:-mt-12 relative z-10">
                <div className="w-32 h-32 rounded-xl border-4 border-surface bg-surface-container-high overflow-hidden shadow-sm shrink-0">
                  <img
                    className="w-full h-full object-cover"
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
                    alt="Marcus Allen"
                  />
                </div>
                <div className="pb-2">
                  <h1 className="font-display-lg text-display-lg text-on-surface mb-1">Marcus Allen</h1>
                  <p className="font-title-lg text-title-lg text-on-surface-variant mb-3">Lead UI/UX Designer</p>
                  <div className="flex flex-wrap items-center gap-4 text-on-surface-variant font-body-sm text-body-sm">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">location_on</span>
                      <span>New York Office</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">schedule</span>
                      <span>EST (Local Time: 10:42 AM)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pb-2">
                <button className="px-4 py-2 rounded-lg bg-surface border border-outline-variant text-on-surface font-label-md text-label-md hover:bg-surface-container-low transition-colors flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">mail</span>
                  Message
                </button>
                <button className="px-4 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container transition-colors flex items-center gap-2 shadow-sm">
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Contact Info Card */}
          <div className="bg-surface rounded-xl border border-outline-variant p-8 shadow-sm">
            <h2 className="font-headline-sm text-headline-sm text-on-surface mb-6">Contact Information</h2>
            <ul className="space-y-6">
              <li className="flex items-center gap-4 text-on-surface-variant">
                <span className="material-symbols-outlined text-[24px] text-primary">mail</span>
                <a
                  className="font-body-md text-body-md hover:text-primary transition-colors hover:underline"
                  href="mailto:marcus.allen@agencyos.com"
                >
                  marcus.allen@agencyos.com
                </a>
              </li>
              <li className="flex items-center gap-4 text-on-surface-variant">
                <span className="material-symbols-outlined text-[24px] text-primary">call</span>
                <span className="font-body-md text-body-md">+1 (555) 123-4567</span>
              </li>
              <li className="flex items-center gap-4 text-on-surface-variant">
                <span className="material-symbols-outlined text-[24px] text-primary">language</span>
                <a
                  className="font-body-md text-body-md hover:text-primary transition-colors hover:underline"
                  href="#"
                >
                  marcusdesigns.dev
                </a>
              </li>
            </ul>
          </div>

          {/* Internal Details Card */}
          <div className="bg-surface rounded-xl border border-outline-variant p-8 shadow-sm">
            <h2 className="font-headline-sm text-headline-sm text-on-surface mb-6">Internal Details</h2>
            <div className="space-y-6">
              <div>
                <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-2">
                  Department
                </p>
                <p className="font-body-md text-body-md text-on-surface font-medium flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-primary"></span>
                  Product &amp; Design
                </p>
              </div>

              <div>
                <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-2">
                  Reports To
                </p>
                <div className="flex items-center gap-3 mt-2 p-3 rounded-xl hover:bg-surface-container-low transition-colors cursor-pointer border border-transparent hover:border-outline-variant">
                  <div className="w-10 h-10 rounded-full bg-surface-variant overflow-hidden shrink-0">
                    <img
                      className="w-full h-full object-cover"
                      src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"
                      alt="Sarah Jenkins"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-body-md text-body-md text-on-surface font-medium">Sarah Jenkins</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Director of Design</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-2">
                <div>
                  <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-2">
                    Hire Date
                  </p>
                  <p className="font-body-md text-body-md text-on-surface">Oct 12, 2021</p>
                </div>
                <div>
                  <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-2">
                    Emp. Type
                  </p>
                  <p className="font-body-md text-body-md text-on-surface">Full-Time</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Assigned Tasks Card */}
        <div className="bg-surface rounded-xl border border-outline-variant p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Assigned Tasks</h2>
            <button className="text-primary font-label-md text-label-md hover:underline flex items-center gap-1">
              View All Tasks
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant">
                  <th className="pb-3 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                    Task Name
                  </th>
                  <th className="pb-3 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                    Client
                  </th>
                  <th className="pb-3 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                    Status
                  </th>
                  <th className="pb-3 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                    Due Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30">
                <tr className="group hover:bg-surface-container-low transition-colors">
                  <td className="py-4 font-body-md text-body-md text-on-surface">Mobile App UI Kit Refinement</td>
                  <td className="py-4 font-body-md text-body-md text-on-surface-variant">Stellar Tech</td>
                  <td className="py-4">
                    <span className="px-2 py-1 rounded-full bg-primary-container text-on-primary-container text-label-sm font-medium">
                      In Progress
                    </span>
                  </td>
                  <td className="py-4 font-body-md text-body-md text-on-surface-variant">Oct 24, 2023</td>
                </tr>
                <tr className="group hover:bg-surface-container-low transition-colors">
                  <td className="py-4 font-body-md text-body-md text-on-surface">Brand Identity Guidelines</td>
                  <td className="py-4 font-body-md text-body-md text-on-surface-variant">Nova Retail</td>
                  <td className="py-4">
                    <span className="px-2 py-1 rounded-full bg-surface-variant text-on-surface-variant text-label-sm font-medium">
                      Pending
                    </span>
                  </td>
                  <td className="py-4 font-body-md text-body-md text-on-surface-variant">Oct 28, 2023</td>
                </tr>
                <tr className="group hover:bg-surface-container-low transition-colors">
                  <td className="py-4 font-body-md text-body-md text-on-surface">Dashboard Accessibility Audit</td>
                  <td className="py-4 font-body-md text-body-md text-on-surface-variant">Internal Project</td>
                  <td className="py-4">
                    <span className="px-2 py-1 rounded-full bg-primary-container text-on-primary-container text-label-sm font-medium">
                      In Progress
                    </span>
                  </td>
                  <td className="py-4 font-body-md text-body-md text-on-surface-variant">Nov 02, 2023</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
