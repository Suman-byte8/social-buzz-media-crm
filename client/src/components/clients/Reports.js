import React from "react";

const Reports = ({ client }) => {
    const clientName = client?.name || "Client";
    const reports = Array.isArray(client?.reports) ? client.reports :
        (client?.reports ? client.reports.split(",") : []);

    const hasReports = reports.length > 0;

    return (
        <main className="flex-1 overflow-y-auto p-container-margin">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-stack-lg gap-4">
                <div>
                    <h2 className="font-display-lg text-display-lg text-on-background">Client Reports</h2>
                    <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                        {hasReports
                            ? `Review and manage performance reports for ${clientName}.`
                            : `No reports have been generated for ${clientName} yet.`}
                    </p>
                </div>
                {/* Filter & Action */}
                <div className="flex items-center gap-stack-md">
                    <div className="relative">
                        <select className="appearance-none bg-surface border border-outline-variant rounded-lg px-4 py-2 pr-10 font-label-md text-label-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer shadow-sm hover:bg-surface-variant transition-colors">
                            <option>2026</option>
                            <option>2025</option>
                            <option>2024</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[20px]">expand_more</span>
                    </div>
                    <button className="bg-primary text-on-primary font-label-md text-label-md px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        New Report
                    </button>
                </div>
            </div>

            {/* Reports Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-gutter">
                {hasReports ? (
                    reports.map((report, idx) => (
                        <div key={idx} className="bg-surface rounded-xl border border-outline-variant p-card-padding shadow-sm hover:shadow-md transition-shadow flex flex-col group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -z-10 group-hover:bg-primary/10 transition-colors"></div>
                            <div className="flex justify-between items-start mb-stack-md">
                                <div className="bg-surface-variant text-on-surface px-3 py-1 rounded-full font-label-sm text-label-sm inline-flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[14px]">
                                        {typeof report === 'object' && report.type ? report.type : 'analytics'}
                                    </span>
                                    {typeof report === 'object' ? report.type || 'Comprehensive' : 'Comprehensive'}
                                </div>
                                <button className="text-on-surface-variant hover:text-primary transition-colors">
                                    <span className="material-symbols-outlined">more_vert</span>
                                </button>
                            </div>
                            <h3 className="font-title-lg text-title-lg text-on-background mb-1">
                                {typeof report === 'object' && report.title ? report.title : report}
                            </h3>
                            <p className="font-body-sm text-body-sm text-on-surface-variant mb-stack-lg flex-1">
                                {typeof report === 'object' && report.description ? report.description : `${clientName} - Performance report`}
                            </p>
                            <div className="flex items-center gap-stack-sm pt-stack-md border-t border-outline-variant mt-auto">
                                <button className="flex-1 bg-surface border border-outline-variant text-on-surface font-label-md text-label-md py-2 rounded-lg hover:bg-surface-variant transition-colors flex justify-center items-center gap-2">
                                    <span className="material-symbols-outlined text-[18px]">download</span>
                                    PDF
                                </button>
                                <button className="flex-1 bg-surface border border-outline-variant text-on-surface font-label-md text-label-md py-2 rounded-lg hover:bg-surface-variant transition-colors flex justify-center items-center gap-2">
                                    <span className="material-symbols-outlined text-[18px]">share</span>
                                    Link
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="bg-surface rounded-xl border-2 border-dashed border-outline-variant p-card-padding hover:border-primary/50 transition-colors flex flex-col items-center justify-center text-center min-h-[240px] cursor-pointer group col-span-full">
                        <div className="w-12 h-12 rounded-full bg-surface-variant flex items-center justify-center text-on-surface-variant mb-stack-sm group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                            <span className="material-symbols-outlined text-[24px]">add_circle</span>
                        </div>
                        <h3 className="font-title-lg text-title-lg text-on-background mb-1">Generate Report</h3>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">
                            No reports have been generated for {clientName} yet. Click to create one.
                        </p>
                    </div>
                )}
            </div>
        </main>
    );
};

export default Reports;
