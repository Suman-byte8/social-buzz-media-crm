"use client";

import React from "react";

const SocialMedia = ({ client }) => {
    const clientName = client?.name || "Client";
    const socialAccounts = Array.isArray(client?.socialMediaAccounts) ? client.socialMediaAccounts :
        (client?.socialMediaAccounts ? client.socialMediaAccounts.split(",") : []);

    const hasSocialData = socialAccounts.length > 0;

    return (
        <main className="flex-1 p-4 md:p-container-margin overflow-y-auto">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                <div>
                    <h3 className="font-title-lg text-title-lg text-on-surface">Connected Channels</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                        {hasSocialData
                            ? `Manage and monitor active social media profiles for ${clientName}.`
                            : `No social media accounts connected for ${clientName}.`}
                    </p>
                </div>
                <div className="flex items-center gap-2 font-label-sm text-label-sm text-on-surface-variant bg-white px-3 py-1.5 rounded-full border border-outline-variant shadow-sm">
                    <span className="material-symbols-outlined text-[14px]">sync</span>
                    Last synced: {new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>

            {/* Bento Grid for Channels */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {!hasSocialData ? (
                    <div className="bg-white rounded-xl border border-[#E5E5E7] p-card-padding shadow-[0px_2px_4px_rgba(0,0,0,0.05)] flex flex-col items-center justify-center text-center min-h-[200px] col-span-full">
                        <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-4">public</span>
                        <h4 className="font-title-md text-title-md text-on-surface mb-2">No Connected Accounts</h4>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">
                            Connect social media accounts to manage and monitor them from this dashboard.
                        </p>
                    </div>
                ) : (
                    socialAccounts.map((account, idx) => {
                        const palettes = [
                            { bg: "bg-[#0077b5]/10", text: "text-[#0077b5]", icon: "work", label: "LinkedIn" },
                            { bg: "bg-pink-50", text: "text-pink-600", icon: "photo_camera", label: "Instagram" },
                            { bg: "bg-gray-100", text: "text-black", icon: "alternate_email", label: "X (Twitter)" },
                            { bg: "bg-blue-50", text: "text-[#1877F2]", icon: "facebook", label: "Facebook" },
                        ];
                        const palette = palettes[idx % palettes.length];
                        return (
                            <div key={idx} className="bg-white rounded-xl border border-[#E5E5E7] p-card-padding shadow-[0px_2px_4px_rgba(0,0,0,0.05)] hover:shadow-[0px_10px_20px_rgba(0,0,0,0.08)] transition-all flex flex-col h-full group relative overflow-hidden">
                                <div className={`absolute top-0 left-0 w-full h-1 ${palette.bg.replace('/10', '')}/20`}></div>
                                <div className="flex justify-between items-start mb-6 mt-2">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded-lg ${palette.bg} flex items-center justify-center ${palette.text}`}>
                                            <span className="material-symbols-outlined text-2xl">{palette.icon}</span>
                                        </div>
                                        <div>
                                            <h4 className="font-headline-sm text-headline-sm text-on-surface">{palette.label}</h4>
                                            <p className="font-body-sm text-body-sm text-on-surface-variant">{typeof account === 'object' ? account.type || 'Account' : account}</p>
                                        </div>
                                    </div>
                                    <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-800 font-label-sm text-label-sm flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[12px] fill-current">check_circle</span> Active
                                    </span>
                                </div>
                                <div className="space-y-4 mb-6 flex-1">
                                    {typeof account === 'object' && account.handle ? (
                                        <div>
                                            <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Handle</p>
                                            <div className="flex items-center gap-2">
                                                <p className="font-body-md text-body-md font-medium">{account.handle}</p>
                                                <a className="text-primary hover:text-surface-tint" href="#" title="Open Profile">
                                                    <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                                                </a>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Handle</p>
                                            <p className="font-body-md text-body-md font-medium">{typeof account === 'string' ? account : "N/A"}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </main>
    );
};

export default SocialMedia;
