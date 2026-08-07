import React from "react";

const SocialMedia = () => {
    return (
        <main className="flex-1 p-4 md:p-container-margin overflow-y-auto">
            {/* Page Header & Tabs */}
           
            {/* Content Area */}
            <div className="flex flex-col gap-stack-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-title-lg text-title-lg text-on-surface">Connected Channels</h3>
                        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Manage and monitor active social media profiles for Acme Corp.</p>
                    </div>
                    <div className="flex items-center gap-2 font-label-sm text-label-sm text-on-surface-variant bg-white px-3 py-1.5 rounded-full border border-outline-variant shadow-sm">
                        <span className="material-symbols-outlined text-[14px]">sync</span>
                        Last synced: Today, 09:41 AM
                    </div>
                </div>
                {/* Bento Grid for Channels */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* LinkedIn Card */}
                    <div className="bg-white rounded-xl border border-[#E5E5E7] p-card-padding shadow-[0px_2px_4px_rgba(0,0,0,0.05)] hover:shadow-[0px_10px_20px_rgba(0,0,0,0.08)] transition-all flex flex-col h-full group relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-[#0077b5]"></div>
                        <div className="flex justify-between items-start mb-6 mt-2">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg bg-[#0077b5]/10 flex items-center justify-center text-[#0077b5]">
                                    <span className="material-symbols-outlined text-2xl">work</span>
                                </div>
                                <div>
                                    <h4 className="font-headline-sm text-headline-sm text-on-surface">LinkedIn</h4>
                                    <p className="font-body-sm text-body-sm text-on-surface-variant">Company Page</p>
                                </div>
                            </div>
                            <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-800 font-label-sm text-label-sm flex items-center gap-1">
                                <span className="material-symbols-outlined text-[12px] fill-current">check_circle</span> Active
                            </span>
                        </div>
                        <div className="space-y-4 mb-6 flex-1">
                            <div>
                                <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Handle</p>
                                <div className="flex items-center gap-2">
                                    <p className="font-body-md text-body-md font-medium">@acmecorp-official</p>
                                    <a className="text-primary hover:text-surface-tint" href="#" title="Open Profile">
                                        <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                                    </a>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-surface rounded-lg p-3 border border-outline-variant/50">
                                    <p className="font-label-sm text-label-sm text-on-surface-variant mb-1">Followers</p>
                                    <p className="font-title-lg text-title-lg text-on-surface flex items-center gap-2">
                                        24.5k
                                        <span className="text-green-600 font-label-sm text-label-sm flex items-center"><span className="material-symbols-outlined text-[12px]">trending_up</span> 2%</span>
                                    </p>
                                </div>
                                <div className="bg-surface rounded-lg p-3 border border-outline-variant/50">
                                    <p className="font-label-sm text-label-sm text-on-surface-variant mb-1">Last Post</p>
                                    <p className="font-body-sm text-body-sm font-medium text-on-surface">Oct 24, 2023</p>
                                </div>
                            </div>
                        </div>
                        <div className="pt-4 border-t border-[#F0F0F0] mt-auto">
                            <button className="w-full py-2 bg-white border border-[#1A1A1A] text-black rounded-lg font-body-sm text-body-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined text-sm">edit</span> Manually Edit
                            </button>
                        </div>
                    </div>
                    {/* Instagram Card */}
                    <div className="bg-white rounded-xl border border-[#E5E5E7] p-card-padding shadow-[0px_2px_4px_rgba(0,0,0,0.05)] hover:shadow-[0px_10px_20px_rgba(0,0,0,0.08)] transition-all flex flex-col h-full group relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#f09433] via-[#e6683c] to-[#bc1888]"></div>
                        <div className="flex justify-between items-start mb-6 mt-2">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg bg-pink-50 flex items-center justify-center text-[#bc1888]">
                                    <span className="material-symbols-outlined text-2xl">photo_camera</span>
                                </div>
                                <div>
                                    <h4 className="font-headline-sm text-headline-sm text-on-surface">Instagram</h4>
                                    <p className="font-body-sm text-body-sm text-on-surface-variant">Business Account</p>
                                </div>
                            </div>
                            <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-800 font-label-sm text-label-sm flex items-center gap-1">
                                <span className="material-symbols-outlined text-[12px] fill-current">check_circle</span> Active
                            </span>
                        </div>
                        <div className="space-y-4 mb-6 flex-1">
                            <div>
                                <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Handle</p>
                                <div className="flex items-center gap-2">
                                    <p className="font-body-md text-body-md font-medium">@acme_creative</p>
                                    <a className="text-primary hover:text-surface-tint" href="#" title="Open Profile">
                                        <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                                    </a>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-surface rounded-lg p-3 border border-outline-variant/50">
                                    <p className="font-label-sm text-label-sm text-on-surface-variant mb-1">Followers</p>
                                    <p className="font-title-lg text-title-lg text-on-surface flex items-center gap-2">
                                        12.1k
                                        <span className="text-green-600 font-label-sm text-label-sm flex items-center"><span className="material-symbols-outlined text-[12px]">trending_up</span> 5%</span>
                                    </p>
                                </div>
                                <div className="bg-surface rounded-lg p-3 border border-outline-variant/50">
                                    <p className="font-label-sm text-label-sm text-on-surface-variant mb-1">Last Post</p>
                                    <p className="font-body-sm text-body-sm font-medium text-on-surface">Oct 26, 2023</p>
                                </div>
                            </div>
                        </div>
                        <div className="pt-4 border-t border-[#F0F0F0] mt-auto">
                            <button className="w-full py-2 bg-white border border-[#1A1A1A] text-black rounded-lg font-body-sm text-body-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined text-sm">edit</span> Manually Edit
                            </button>
                        </div>
                    </div>
                    {/* Twitter/X Card */}
                    <div className="bg-white rounded-xl border border-[#E5E5E7] p-card-padding shadow-[0px_2px_4px_rgba(0,0,0,0.05)] hover:shadow-[0px_10px_20px_rgba(0,0,0,0.08)] transition-all flex flex-col h-full group relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-black"></div>
                        <div className="flex justify-between items-start mb-6 mt-2">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-black">
                                    <span className="material-symbols-outlined text-2xl">alternate_email</span>
                                </div>
                                <div>
                                    <h4 className="font-headline-sm text-headline-sm text-on-surface">X (Twitter)</h4>
                                    <p className="font-body-sm text-body-sm text-on-surface-variant">Brand Profile</p>
                                </div>
                            </div>
                            <span className="px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-800 font-label-sm text-label-sm flex items-center gap-1">
                                <span className="material-symbols-outlined text-[12px] fill-current">warning</span> Needs Reauth
                            </span>
                        </div>
                        <div className="space-y-4 mb-6 flex-1">
                            <div>
                                <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Handle</p>
                                <div className="flex items-center gap-2">
                                    <p className="font-body-md text-body-md font-medium">@AcmeHQ</p>
                                    <a className="text-primary hover:text-surface-tint" href="#" title="Open Profile">
                                        <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                                    </a>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-surface rounded-lg p-3 border border-outline-variant/50 opacity-70 grayscale">
                                    <p className="font-label-sm text-label-sm text-on-surface-variant mb-1">Followers</p>
                                    <p className="font-title-lg text-title-lg text-on-surface flex items-center gap-2">
                                        8.4k
                                        <span className="text-gray-500 font-label-sm text-label-sm flex items-center">--</span>
                                    </p>
                                </div>
                                <div className="bg-surface rounded-lg p-3 border border-outline-variant/50 opacity-70 grayscale">
                                    <p className="font-label-sm text-label-sm text-on-surface-variant mb-1">Last Post</p>
                                    <p className="font-body-sm text-body-sm font-medium text-on-surface">Oct 12, 2023</p>
                                </div>
                            </div>
                        </div>
                        <div className="pt-4 border-t border-[#F0F0F0] mt-auto">
                            <button className="w-full py-2 bg-white border border-[#1A1A1A] text-black rounded-lg font-body-sm text-body-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined text-sm">edit</span> Manually Edit
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default SocialMedia;