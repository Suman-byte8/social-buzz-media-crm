import React from "react";

export default function Credentials({ client }) {
  const clientName = client?.name || "Client";
  const credentials = client?.credentials && typeof client.credentials === "object"
    ? client.credentials
    : (client?.credentials ? JSON.parse(client.credentials) : {});

  const googleAdsCred = credentials.googleAds || credentials["google-ads"] || null;
  const metaBusinessCred = credentials.meta || credentials["meta-business"] || null;

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
              Secure access details and media account credentials for {clientName}.
            </p>
          </div>
        </section>

        {!googleAdsCred && !metaBusinessCred ? (
          <div className="bg-surface rounded-xl border border-outline-variant p-8 text-center">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-4">lock</span>
            <h3 className="font-title-lg text-title-lg text-on-surface mb-2">No Credentials Configured</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              No media account credentials have been set up for {clientName} yet.
            </p>
          </div>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {googleAdsCred && (
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
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                    googleAdsCred.status === 'active' || !googleAdsCred.status
                      ? 'bg-[#E6F4EA] text-[#137333]'
                      : 'bg-[#FFEBEE] text-[#C62828]'
                  }`}>
                    {googleAdsCred.status || "Active"}
                  </span>
                </div>
                <div className="space-y-5">
                  <div>
                    <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2">Username / Email</label>
                    <div className="flex items-center gap-2 rounded-2xl border border-outline-variant bg-surface-container-lowest p-3">
                      <input className="w-full bg-transparent border-none text-body-md text-on-surface focus:outline-none" readOnly type="text" defaultValue={googleAdsCred.username || googleAdsCred.email || "N/A"} />
                      <button className="rounded-full p-2 text-secondary hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-[18px]">content_copy</span>
                      </button>
                    </div>
                  </div>
                  {googleAdsCred.password && (
                    <div>
                      <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2">Password</label>
                      <div className="flex items-center gap-2 rounded-2xl border border-outline-variant bg-surface-container-lowest p-3">
                        <input className="w-full bg-transparent border-none text-body-md text-on-surface focus:outline-none" readOnly type="password" defaultValue={googleAdsCred.password} />
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
                  )}
                </div>
              </article>
            )}

            {metaBusinessCred && (
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
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                    metaBusinessCred.status === '2fa' || metaBusinessCred.status === 'required'
                      ? 'bg-[#FEF3C7] text-[#92400E]'
                      : 'bg-[#E6F4EA] text-[#137333]'
                  }`}>
                    {metaBusinessCred.status === '2fa' || metaBusinessCred.status === 'required' ? "2FA Required" : (metaBusinessCred.status || "Active")}
                  </span>
                </div>
                <div className="space-y-5">
                  <div>
                    <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2">Username / Email</label>
                    <div className="flex items-center gap-2 rounded-2xl border border-outline-variant bg-surface-container-lowest p-3">
                      <input className="w-full bg-transparent border-none text-body-md text-on-surface focus:outline-none" readOnly type="text" defaultValue={metaBusinessCred.username || metaBusinessCred.email || "N/A"} />
                      <button className="rounded-full p-2 text-secondary hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-[18px]">content_copy</span>
                      </button>
                    </div>
                  </div>
                  {metaBusinessCred.password && (
                    <div>
                      <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2">Password</label>
                      <div className="flex items-center gap-2 rounded-2xl border border-outline-variant bg-surface-container-lowest p-3">
                        <input className="w-full bg-transparent border-none text-body-md text-on-surface focus:outline-none" readOnly type="password" defaultValue={metaBusinessCred.password} />
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
                  )}
                </div>
              </article>
            )}
          </section>
        )}
      </div>
    </main>
  );
}