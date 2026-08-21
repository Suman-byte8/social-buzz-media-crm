import React from "react";

const MetaAdsOverview = ({ client }) => {
  const clientName = client?.name || "Client";
  const campaigns = Array.isArray(client?.campaigns) ? client.campaigns :
    (client?.campaigns ? client.campaigns.split(",") : []);

  return (
    <main className="flex-1 overflow-y-auto p-gutter md:p-container-margin bg-background">
      <div className="flex justify-between items-end mb-stack-lg">
        <div>
          <h2 className="font-display-lg text-display-lg text-on-background">
            Meta Ads Overview
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-unit">
            Performance metrics for {clientName} (Last 30 Days)
          </p>
        </div>
        <div className="flex gap-stack-sm hidden md:flex">
          <button className="flex items-center gap-unit bg-white border border-outline-variant px-4 py-2 rounded-lg font-label-md text-label-md text-on-surface hover:bg-surface-container-low transition-colors shadow-sm">
            <span
              className="material-symbols-outlined text-[18px]"
              data-icon="calendar_today"
            >
              calendar_today
            </span>
            Last 30 Days
          </button>
          <button className="flex items-center gap-unit bg-primary text-on-primary px-4 py-2 rounded-lg font-label-md text-label-md hover:bg-surface-tint transition-colors shadow-sm">
            <span
              className="material-symbols-outlined text-[18px]"
              data-icon="add"
            >
              add
            </span>
            New Campaign
          </button>
        </div>
      </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-stack-md mb-stack-lg">
        {/* <!-- Amount Spent --> */}
        <div className="bg-white p-card-padding rounded-lg border border-outline-variant shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-stack-sm">
            <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
              Amount Spent
            </span>
            <span className="material-symbols-outlined text-primary" data-icon="payments">
              payments
            </span>
          </div>
          <div>
            <div className="font-headline-md text-headline-md text-on-background">
              {client?.metaAdsData?.amountSpent || "$12,450.00"}
            </div>
            <div className="flex items-center gap-unit mt-unit text-[#10B981] font-label-sm text-label-sm">
              <span className="material-symbols-outlined text-[14px]" data-icon="trending_down">
                trending_down
              </span>
              <span>{client?.metaAdsData?.spendChange || "4.2% vs last month"}</span>
            </div>
          </div>
        </div>
        {/* <!-- Reach --> */}
        <div className="bg-white p-card-padding rounded-lg border border-outline-variant shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-stack-sm">
            <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
              Reach
            </span>
            <span className="material-symbols-outlined text-primary" data-icon="visibility">
              visibility
            </span>
          </div>
          <div>
            <div className="font-headline-md text-headline-md text-on-background">
              {client?.metaAdsData?.reach || "452K"}
            </div>
            <div className="flex items-center gap-unit mt-unit text-[#10B981] font-label-sm text-label-sm">
              <span className="material-symbols-outlined text-[14px]" data-icon="trending_up">
                trending_up
              </span>
              <span>{client?.metaAdsData?.reachChange || "12.5% vs last month"}</span>
            </div>
          </div>
        </div>
        {/* <!-- Link Clicks --> */}
        <div className="bg-white p-card-padding rounded-lg border border-outline-variant shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-stack-sm">
            <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
              Link Clicks
            </span>
            <span className="material-symbols-outlined text-primary" data-icon="touch_app">
              touch_app
            </span>
          </div>
          <div>
            <div className="font-headline-md text-headline-md text-on-background">
              {client?.metaAdsData?.linkClicks || "18,245"}
            </div>
            <div className="flex items-center gap-unit mt-unit text-error font-label-sm text-label-sm">
              <span className="material-symbols-outlined text-[14px]" data-icon="trending_down">
                trending_down
              </span>
              <span>{client?.metaAdsData?.clicksChange || "2.1% vs last month"}</span>
            </div>
          </div>
        </div>
        {/* <!-- Purchases --> */}
        <div className="bg-white p-card-padding rounded-lg border border-outline-variant shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-stack-sm">
            <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
              Purchases
            </span>
            <span className="material-symbols-outlined text-primary" data-icon="shopping_cart">
              shopping_cart
            </span>
          </div>
          <div>
            <div className="font-headline-md text-headline-md text-on-background">
              {client?.metaAdsData?.purchases || "1,142"}
            </div>
            <div className="flex items-center gap-unit mt-unit text-[#10B981] font-label-sm text-label-sm">
              <span className="material-symbols-outlined text-[14px]" data-icon="trending_up">
                trending_up
              </span>
              <span>{client?.metaAdsData?.purchasesChange || "8.4% vs last month"}</span>
            </div>
          </div>
        </div>
        {/* <!-- ROAS --> */}
        <div className="bg-white p-card-padding rounded-lg border border-outline-variant shadow-sm flex flex-col justify-between bg-gradient-to-br from-surface-container-low to-surface-container">
          <div className="flex justify-between items-start mb-stack-sm">
            <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
              ROAS
            </span>
            <span className="material-symbols-outlined text-primary" data-icon="finance">
              finance
            </span>
          </div>
          <div>
            <div className="font-headline-md text-headline-md text-primary font-bold">
              {client?.metaAdsData?.roas || "3.4x"}
            </div>
            <div className="flex items-center gap-unit mt-unit text-[#10B981] font-label-sm text-label-sm">
              <span className="material-symbols-outlined text-[14px]" data-icon="trending_up">
                trending_up
              </span>
              <span>{client?.metaAdsData?.roasChange || "0.2x vs last month"}</span>
            </div>
          </div>
        </div>
      </div>
      {/* <!-- Campaign Table --> */}
      <div className="bg-white rounded-lg border border-outline-variant shadow-sm overflow-hidden">
        <div className="p-card-padding border-b border-outline-variant flex justify-between items-center bg-[#FAFAFA]">
          <h3 className="font-title-lg text-title-lg text-on-background">
            Active Campaigns
          </h3>
          <button className="text-primary font-label-md text-label-md hover:underline flex items-center gap-unit">
            View All in Meta Ads Manager
            <span className="material-symbols-outlined text-[16px]" data-icon="open_in_new">open_in_new</span>
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAFAFA] border-b border-outline-variant font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                <th className="py-3 px-4 font-semibold">Campaign Name</th>
                <th className="py-3 px-4 font-semibold">Ad Set</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Amount Spent</th>
                <th className="py-3 px-4 font-semibold text-right">Results (Purchases)</th>
                <th className="py-3 px-4 font-semibold text-right">Cost per Result</th>
              </tr>
            </thead>
            <tbody className="font-body-sm text-body-sm text-on-background divide-y divide-[#F0F0F0]">
              {campaigns.length > 0 ? (
                campaigns.filter(c => typeof c === 'object' && c.platform === 'meta').map((campaign, idx) => (
                  <tr key={idx} className="hover:bg-[#F9F9F9] transition-colors group cursor-pointer">
                    <td className="py-4 px-4">
                      <div className="font-semibold text-on-background group-hover:text-primary transition-colors">
                        {campaign.name || "Unnamed Campaign"}
                      </div>
                      <div className="text-on-surface-variant text-[12px] mt-0.5">
                        ID: {campaign.id || "N/A"}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-on-surface-variant">
                      {campaign.adSet || campaign.ad_set || "N/A"}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-label-sm text-label-sm ${
                        campaign.status === 'Active' || campaign.status === 'active'
                          ? 'bg-[#10B981]/10 text-[#10B981]'
                          : campaign.status === 'Completed' || campaign.status === 'completed'
                          ? 'bg-[#6B7280]/10 text-[#6B7280]'
                          : 'bg-error/10 text-error'
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        {campaign.status || "Active"}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right tabular-nums">{campaign.spend || "N/A"}</td>
                    <td className="py-4 px-4 text-right tabular-nums font-medium">{campaign.results || campaign.purchases || "N/A"}</td>
                    <td className="py-4 px-4 text-right tabular-nums">{campaign.cpc || campaign.costPerResult || "N/A"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 px-4 text-center text-on-surface-variant">
                    No Meta campaigns configured for {clientName}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-outline-variant bg-[#FAFAFA] flex justify-between items-center">
          <span className="font-body-sm text-body-sm text-on-surface-variant">
            Showing data for active campaigns
          </span>
        </div>
      </div>
    </main>
  );
};

export default MetaAdsOverview;
