import React from "react";

export default function Credentials() {
  return (
    <main className="flex-1 overflow-y-auto p-container-margin">
      <div className="max-w-7xl mx-auto space-y-8">
        <section className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-surface p-6 rounded-3xl border border-outline-variant shadow-sm">
          <div>
            <h1 className="font-headline-md text-headline-md text-on-surface flex items-center gap-3">
              Client Credentials
              <span className="material-symbols-outlined text-primary text-xl">lock</span>
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-2">
              Secure access details and media account credentials for the client.
            </p>
          </div>
          <button className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-on-primary font-label-md text-label-md shadow-sm hover:bg-primary/90 transition-colors">
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add Credential
          </button>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <article className="bg-white rounded-3xl border border-[#E5E5E7] p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-container">
                  <span className="material-symbols-outlined text-[#EA4335]">ads_click</span>
                </div>
                <div>
                  <h2 className="font-title-lg text-title-lg text-on-surface">Google Ads</h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Campaign manager credentials</p>
                </div>
              </div>
              <span className="rounded-full bg-[#E6F4EA] px-3 py-1 text-xs font-medium text-[#137333]">Active</span>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2">Username / Email</label>
                <div className="flex items-center gap-2 rounded-2xl border border-outline-variant bg-surface-container-lowest p-3">
                  <input className="w-full bg-transparent border-none text-body-md text-on-surface focus:outline-none" readOnly type="text" defaultValue="admin@acmecorp.com" />
                  <button className="rounded-full p-2 text-secondary hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[18px]">content_copy</span>
                  </button>
                </div>
              </div>
              <div>
                <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2">Password</label>
                <div className="flex items-center gap-2 rounded-2xl border border-outline-variant bg-surface-container-lowest p-3">
                  <input className="w-full bg-transparent border-none text-body-md text-on-surface focus:outline-none" readOnly type="password" defaultValue="SuperSecretPassword123!" />
                  <div className="flex items-center gap-2">
                    <button className="rounded-full p-2 text-secondary hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-[18px]">visibility</span>
                    </button>
                    <button className="rounded-full p-2 text-secondary hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-[18px]">content_copy</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </article>

          <article className="bg-white rounded-3xl border border-[#E5E5E7] p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-container">
                  <span className="material-symbols-outlined text-[#1877F2]">campaign</span>
                </div>
                <div>
                  <h2 className="font-title-lg text-title-lg text-on-surface">Meta Business</h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Business manager access</p>
                </div>
              </div>
              <span className="rounded-full bg-[#FEF3C7] px-3 py-1 text-xs font-medium text-[#92400E]">2FA Required</span>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2">Username / Email</label>
                <div className="flex items-center gap-2 rounded-2xl border border-outline-variant bg-surface-container-lowest p-3">
                  <input className="w-full bg-transparent border-none text-body-md text-on-surface focus:outline-none" readOnly type="text" defaultValue="social@acmecorp.com" />
                  <button className="rounded-full p-2 text-secondary hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[18px]">content_copy</span>
                  </button>
                </div>
              </div>
              <div>
                <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2">Password</label>
                <div className="flex items-center gap-2 rounded-2xl border border-outline-variant bg-surface-container-lowest p-3">
                  <input className="w-full bg-transparent border-none text-body-md text-on-surface focus:outline-none" readOnly type="password" defaultValue="MetaSecure!@#" />
                  <div className="flex items-center gap-2">
                    <button className="rounded-full p-2 text-secondary hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-[18px]">visibility</span>
                    </button>
                    <button className="rounded-full p-2 text-secondary hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-[18px]">content_copy</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
