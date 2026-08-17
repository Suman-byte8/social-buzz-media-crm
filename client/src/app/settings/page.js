import React from "react";

export default function SettingsPage() {
  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        {/* General Settings */}
        <section className="card-bg rounded-lg p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-primary">
              business
            </span>
            <h3 className="font-title-lg text-title-lg text-on-surface">
              General Settings
            </h3>
          </div>
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
              <div className="w-24 h-24 rounded-lg bg-surface-container-highest border border-outline-variant flex items-center justify-center relative overflow-hidden group cursor-pointer">
                <img
                  className="w-full h-full object-cover absolute inset-0 z-0"
                  alt="Agency Logo"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDs7w8pd59st2iV4qiHGN_2Y0J9bGgCr5XfWKCSjMnLKv9_N3BEn8cvNnKoZfl93AOUS_BrUV_5QhJyEURkLEkQId1aZuOgcQxuwEpfeOsAXJs_z4unZqe8E9AMulljPCZqetrk0Mp5k60lI3GXuslufdVN_I1Qge-0Ovi7t_NZZK8sM4zEUd20iZ6Zjr1UEAVLQ9h9mU39AEbnSDED4YiKCdWOj82rA7VeUUiUJsOPJz6dADqIYSjs"
                />
                <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center z-10 transition-all">
                  <span className="material-symbols-outlined text-white">
                    upload
                  </span>
                </div>
              </div>
              <div className="flex-1 space-y-1">
                <label className="font-label-md text-label-md text-on-surface block">
                  Agency Logo
                </label>
                <p className="font-body-sm text-body-sm text-secondary">
                  Recommended size: 512x512px (JPG, PNG)
                </p>
                <button className="mt-2 px-4 py-2 bg-white border border-[#1A1A1A] text-[#1A1A1A] rounded font-label-md text-label-md hover:bg-gray-50 transition-colors cursor-pointer">
                  Change Logo
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="font-label-md text-label-md text-on-surface block">
                  Agency Name
                </label>
                <input
                  className="w-full bg-surface border border-outline-variant rounded-md px-4 py-2 font-body-md text-body-md text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                  type="text"
                  defaultValue="Agency OS Workspace"
                />
              </div>
              <div className="space-y-2">
                <label className="font-label-md text-label-md text-on-surface block">
                  Primary Contact Email
                </label>
                <input
                  className="w-full bg-surface border border-outline-variant rounded-md px-4 py-2 font-body-md text-body-md text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                  type="email"
                  defaultValue="hello@agencyos.com"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="font-label-md text-label-md text-on-surface block">
                  Website URL
                </label>
                <input
                  className="w-full bg-surface border border-outline-variant rounded-md px-4 py-2 font-body-md text-body-md text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                  type="url"
                  defaultValue="https://agencyos.com"
                />
              </div>
            </div>
            <div className="pt-4 flex justify-end">
              <button className="px-6 py-2 bg-[#E8262A] text-white rounded font-label-md text-label-md hover:bg-[#c00016] transition-colors cursor-pointer">
                Save Changes
              </button>
            </div>
          </div>
        </section>

        {/* Team Management */}
        <section className="card-bg rounded-lg overflow-hidden">
          <div className="p-6 md:p-8 border-b border-outline-variant flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">
                groups
              </span>
              <h3 className="font-title-lg text-title-lg text-on-surface">
                Team Management
              </h3>
            </div>
            <button className="px-4 py-2 bg-[#E8262A] text-white rounded font-label-md text-label-md hover:bg-[#c00016] transition-colors flex items-center gap-2 cursor-pointer">
              <span className="material-symbols-outlined text-[18px]">add</span>
              Invite New Member
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="table-header-bg py-3 px-6 font-label-sm text-label-sm uppercase text-secondary tracking-wider">
                    Member
                  </th>
                  <th className="table-header-bg py-3 px-6 font-label-sm text-label-sm uppercase text-secondary tracking-wider">
                    Role
                  </th>
                  <th className="table-header-bg py-3 px-6 font-label-sm text-label-sm uppercase text-secondary tracking-wider">
                    Status
                  </th>
                  <th className="table-header-bg py-3 px-6 font-label-sm text-label-sm uppercase text-secondary tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="font-body-sm text-body-sm text-on-surface">
                <tr className="table-row-border table-row-hover transition-colors">
                  <td className="py-4 px-6 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      JD
                    </div>
                    <div>
                      <p className="font-medium">Jane Doe</p>
                      <p className="text-secondary text-xs">jane@agencyos.com</p>
                    </div>
                  </td>
                  <td className="py-4 px-6">Admin</td>
                  <td className="py-4 px-6">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-xl text-xs font-medium">
                      Active
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button className="text-secondary hover:text-primary transition-colors cursor-pointer">
                      <span className="material-symbols-outlined">
                        more_vert
                      </span>
                    </button>
                  </td>
                </tr>
                <tr className="table-row-border table-row-hover transition-colors">
                  <td className="py-4 px-6 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                      JS
                    </div>
                    <div>
                      <p className="font-medium">John Smith</p>
                      <p className="text-secondary text-xs">john@agencyos.com</p>
                    </div>
                  </td>
                  <td className="py-4 px-6">Manager</td>
                  <td className="py-4 px-6">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-xl text-xs font-medium">
                      Active
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button className="text-secondary hover:text-primary transition-colors cursor-pointer">
                      <span className="material-symbols-outlined">
                        more_vert
                      </span>
                    </button>
                  </td>
                </tr>
                <tr className="table-row-hover transition-colors">
                  <td className="py-4 px-6 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold">
                      AL
                    </div>
                    <div>
                      <p className="font-medium">Alice Lee</p>
                      <p className="text-secondary text-xs">
                        alice@agencyos.com
                      </p>
                    </div>
                  </td>
                  <td className="py-4 px-6">Creative</td>
                  <td className="py-4 px-6">
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-xl text-xs font-medium">
                      Pending
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button className="text-secondary hover:text-primary transition-colors cursor-pointer">
                      <span className="material-symbols-outlined">
                        more_vert
                      </span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Billing & Subscription */}
        <section className="card-bg rounded-lg p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-primary">
              credit_card
            </span>
            <h3 className="font-title-lg text-title-lg text-on-surface">
              Billing &amp; Subscription
            </h3>
          </div>
          <div className="bg-surface-container rounded-lg p-6 border border-outline-variant flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h4 className="font-headline-sm text-headline-sm font-bold">
                  Pro Plan
                </h4>
                <span className="bg-primary/10 text-primary px-2 py-1 rounded-xl text-xs font-medium border border-primary/20">
                  Active
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-secondary">
                Billed $199 annually. Next charge on Oct 15, 2024.
              </p>
            </div>
            <button className="px-4 py-2 bg-white border border-[#1A1A1A] text-[#1A1A1A] rounded font-label-md text-label-md hover:bg-gray-50 transition-colors cursor-pointer">
              Upgrade Plan
            </button>
          </div>
          <div className="flex justify-between items-center py-4 border-t border-outline-variant/30">
            <div>
              <p className="font-medium font-body-md">Payment Method</p>
              <p className="text-secondary font-body-sm text-sm">
                Visa ending in 4242
              </p>
            </div>
            <button className="text-primary font-label-md text-label-md hover:underline cursor-pointer">
              Update
            </button>
          </div>
          <div className="flex justify-between items-center py-4 border-t border-outline-variant/30">
            <div>
              <p className="font-medium font-body-md">Invoice History</p>
              <p className="text-secondary font-body-sm text-sm">
                Download past receipts
              </p>
            </div>
            <button className="text-primary font-label-md text-label-md hover:underline cursor-pointer">
              View Invoices
            </button>
          </div>
        </section>

        {/* Notifications */}
        <section className="card-bg rounded-lg p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-primary">
              notifications_active
            </span>
            <h3 className="font-title-lg text-title-lg text-on-surface">
              Notifications
            </h3>
          </div>
          <div className="space-y-6">
            {/* Task Updates */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium font-body-md">Task Updates</p>
                <p className="text-secondary font-body-sm text-sm">
                  Receive alerts when a task status changes.
                </p>
              </div>
              <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                <input
                  defaultChecked
                  className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer z-10 border-gray-300"
                  id="toggle_tasks"
                  name="toggle_tasks"
                  type="checkbox"
                />
                <label
                  className="toggle-label block overflow-hidden h-5 rounded-full bg-gray-300 cursor-pointer"
                  htmlFor="toggle_tasks"
                ></label>
              </div>
            </div>
            {/* Client Updates */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium font-body-md">Client Feedback</p>
                <p className="text-secondary font-body-sm text-sm">
                  Get notified when a client leaves a comment.
                </p>
              </div>
              <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                <input
                  defaultChecked
                  className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer z-10 border-gray-300"
                  id="toggle_client"
                  name="toggle_client"
                  type="checkbox"
                />
                <label
                  className="toggle-label block overflow-hidden h-5 rounded-full bg-gray-300 cursor-pointer"
                  htmlFor="toggle_client"
                ></label>
              </div>
            </div>
            {/* Mentions */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium font-body-md">Team Mentions</p>
                <p className="text-secondary font-body-sm text-sm">
                  Email me when someone @mentions me.
                </p>
              </div>
              <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                <input
                  className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer z-10 border-gray-300"
                  id="toggle_mentions"
                  name="toggle_mentions"
                  type="checkbox"
                />
                <label
                  className="toggle-label block overflow-hidden h-5 rounded-full bg-gray-300 cursor-pointer"
                  htmlFor="toggle_mentions"
                ></label>
              </div>
            </div>
          </div>
        </section>

        {/* Security */}
        <section className="card-bg rounded-lg p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-primary">
              security
            </span>
            <h3 className="font-title-lg text-title-lg text-on-surface">
              Security
            </h3>
          </div>
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-outline-variant/30 gap-4">
              <div>
                <p className="font-medium font-body-md">Password</p>
                <p className="text-secondary font-body-sm text-sm">
                  Last changed 3 months ago
                </p>
              </div>
              <button className="px-4 py-2 bg-white border border-[#1A1A1A] text-[#1A1A1A] rounded font-label-md text-label-md hover:bg-gray-50 transition-colors cursor-pointer">
                Change Password
              </button>
            </div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium font-body-md">
                    Two-Factor Authentication (2FA)
                  </p>
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs font-medium">
                    Inactive
                  </span>
                </div>
                <p className="text-secondary font-body-sm text-sm">
                  Add an extra layer of security to your account.
                </p>
              </div>
              <button className="text-primary font-label-md text-label-md hover:underline cursor-pointer">
                Enable 2FA
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
