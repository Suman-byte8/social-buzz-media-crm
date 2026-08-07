import React from "react";

const MetaAdsOverview = () => {
  return (
    <main className="flex-1 overflow-y-auto p-gutter md:p-container-margin bg-background">
      <div className="flex justify-between items-end mb-stack-lg">
        <div>
          <h2 className="font-display-lg text-display-lg text-on-background">
            Meta Ads Overview
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-unit">
            Performance metrics for Acme Corp (Last 30 Days)
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
      {/* <!-- Metrics Bento Grid --> */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-stack-md mb-stack-lg">
        {/* <!-- Amount Spent --> */}
        <div className="bg-white p-card-padding rounded-lg border border-outline-variant shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-stack-sm">
            <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
              Amount Spent
            </span>
            <span
              className="material-symbols-outlined text-primary"
              data-icon="payments"
            >
              payments
            </span>
          </div>
          <div>
            <div className="font-headline-md text-headline-md text-on-background">
              $12,450.00
            </div>
            <div className="flex items-center gap-unit mt-unit text-[#10B981] font-label-sm text-label-sm">
              <span
                className="material-symbols-outlined text-[14px]"
                data-icon="trending_down"
              >
                trending_down
              </span>
              <span>4.2% vs last month</span>
            </div>
          </div>
        </div>
        {/* <!-- Reach --> */}
        <div className="bg-white p-card-padding rounded-lg border border-outline-variant shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-stack-sm">
            <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
              Reach
            </span>
            <span
              className="material-symbols-outlined text-primary"
              data-icon="visibility"
            >
              visibility
            </span>
          </div>
          <div>
            <div className="font-headline-md text-headline-md text-on-background">
              452K
            </div>
            <div className="flex items-center gap-unit mt-unit text-[#10B981] font-label-sm text-label-sm">
              <span
                className="material-symbols-outlined text-[14px]"
                data-icon="trending_up"
              >
                trending_up
              </span>
              <span>12.5% vs last month</span>
            </div>
          </div>
        </div>
        {/* <!-- Link Clicks --> */}
        <div className="bg-white p-card-padding rounded-lg border border-outline-variant shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-stack-sm">
            <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
              Link Clicks
            </span>
            <span
              className="material-symbols-outlined text-primary"
              data-icon="touch_app"
            >
              touch_app
            </span>
          </div>
          <div>
            <div className="font-headline-md text-headline-md text-on-background">
              18,245
            </div>
            <div className="flex items-center gap-unit mt-unit text-error font-label-sm text-label-sm">
              <span
                className="material-symbols-outlined text-[14px]"
                data-icon="trending_down"
              >
                trending_down
              </span>
              <span>2.1% vs last month</span>
            </div>
          </div>
        </div>
        {/* <!-- Purchases --> */}
        <div className="bg-white p-card-padding rounded-lg border border-outline-variant shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-stack-sm">
            <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
              Purchases
            </span>
            <span
              className="material-symbols-outlined text-primary"
              data-icon="shopping_cart"
            >
              shopping_cart
            </span>
          </div>
          <div>
            <div className="font-headline-md text-headline-md text-on-background">
              1,142
            </div>
            <div className="flex items-center gap-unit mt-unit text-[#10B981] font-label-sm text-label-sm">
              <span
                className="material-symbols-outlined text-[14px]"
                data-icon="trending_up"
              >
                trending_up
              </span>
              <span>8.4% vs last month</span>
            </div>
          </div>
        </div>
        {/* <!-- ROAS --> */}
        <div className="bg-white p-card-padding rounded-lg border border-outline-variant shadow-sm flex flex-col justify-between bg-gradient-to-br from-surface-container-low to-surface-container">
          <div className="flex justify-between items-start mb-stack-sm">
            <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
              ROAS
            </span>
            <span
              className="material-symbols-outlined text-primary"
              data-icon="finance"
            >
              finance
            </span>
          </div>
          <div>
            <div className="font-headline-md text-headline-md text-primary font-bold">
              3.4x
            </div>
            <div className="flex items-center gap-unit mt-unit text-[#10B981] font-label-sm text-label-sm">
              <span
                className="material-symbols-outlined text-[14px]"
                data-icon="trending_up"
              >
                trending_up
              </span>
              <span>0.2x vs last month</span>
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
            <span
              className="material-symbols-outlined text-[16px]"
              data-icon="open_in_new"
            >
              open_in_new
            </span>
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAFAFA] border-b border-outline-variant font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                <th className="py-3 px-4 font-semibold">Campaign Name</th>
                <th className="py-3 px-4 font-semibold">Ad Set</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">
                  Amount Spent
                </th>
                <th className="py-3 px-4 font-semibold text-right">
                  Results (Purchases)
                </th>
                <th className="py-3 px-4 font-semibold text-right">
                  Cost per Result
                </th>
              </tr>
            </thead>
            <tbody className="font-body-sm text-body-sm text-on-background divide-y divide-[#F0F0F0]">
              <tr className="hover:bg-[#F9F9F9] transition-colors group cursor-pointer">
                <td className="py-4 px-4">
                  <div className="font-semibold text-on-background group-hover:text-primary transition-colors">
                    Q3 Retargeting - Dynamic
                  </div>
                  <div className="text-on-surface-variant text-[12px] mt-0.5">
                    ID: 23849920192
                  </div>
                </td>
                <td className="py-4 px-4 text-on-surface-variant">
                  Website Visitors 30D
                </td>
                <td className="py-4 px-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#10B981]/10 text-[#10B981] font-label-sm text-label-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
                    Active
                  </span>
                </td>
                <td className="py-4 px-4 text-right tabular-nums">$3,240.50</td>
                <td className="py-4 px-4 text-right tabular-nums font-medium">
                  342
                </td>
                <td className="py-4 px-4 text-right tabular-nums">$9.47</td>
              </tr>
              <tr className="hover:bg-[#F9F9F9] transition-colors group cursor-pointer">
                <td className="py-4 px-4">
                  <div className="font-semibold text-on-background group-hover:text-primary transition-colors">
                    Broad Prospecting - Video
                  </div>
                  <div className="text-on-surface-variant text-[12px] mt-0.5">
                    ID: 23849920331
                  </div>
                </td>
                <td className="py-4 px-4 text-on-surface-variant">
                  US/CA - 25-44 - Broad
                </td>
                <td className="py-4 px-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#10B981]/10 text-[#10B981] font-label-sm text-label-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
                    Active
                  </span>
                </td>
                <td className="py-4 px-4 text-right tabular-nums">$5,100.00</td>
                <td className="py-4 px-4 text-right tabular-nums font-medium">
                  415
                </td>
                <td className="py-4 px-4 text-right tabular-nums">$12.28</td>
              </tr>
              <tr className="hover:bg-[#F9F9F9] transition-colors group cursor-pointer">
                <td className="py-4 px-4">
                  <div className="font-semibold text-on-background group-hover:text-primary transition-colors">
                    Lookalike 1% - Purchasers
                  </div>
                  <div className="text-on-surface-variant text-[12px] mt-0.5">
                    ID: 23849920887
                  </div>
                </td>
                <td className="py-4 px-4 text-on-surface-variant">LAL 1% US</td>
                <td className="py-4 px-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-error/10 text-error font-label-sm text-label-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
                    Learning Limited
                  </span>
                </td>
                <td className="py-4 px-4 text-right tabular-nums">$1,850.25</td>
                <td className="py-4 px-4 text-right tabular-nums font-medium">
                  120
                </td>
                <td className="py-4 px-4 text-right tabular-nums">$15.41</td>
              </tr>
              <tr className="hover:bg-[#F9F9F9] transition-colors group cursor-pointer">
                <td className="py-4 px-4">
                  <div className="font-semibold text-on-background group-hover:text-primary transition-colors">
                    Flash Sale Weekend
                  </div>
                  <div className="text-on-surface-variant text-[12px] mt-0.5">
                    ID: 23849921102
                  </div>
                </td>
                <td className="py-4 px-4 text-on-surface-variant">
                  Engaged Audience 180D
                </td>
                <td className="py-4 px-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-tertiary-fixed-dim/30 text-on-surface-variant font-label-sm text-label-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-tertiary-fixed-dim"></span>
                    Completed
                  </span>
                </td>
                <td className="py-4 px-4 text-right tabular-nums">$2,259.25</td>
                <td className="py-4 px-4 text-right tabular-nums font-medium">
                  265
                </td>
                <td className="py-4 px-4 text-right tabular-nums">$8.52</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-outline-variant bg-[#FAFAFA] flex justify-between items-center">
          <span className="font-body-sm text-body-sm text-on-surface-variant">
            Showing 4 of 12 campaigns
          </span>
          <div className="flex gap-2">
            <button className="p-2 border border-outline-variant rounded bg-white text-on-surface-variant disabled:opacity-50 cursor-not-allowed">
              <span
                className="material-symbols-outlined text-[16px]"
                data-icon="chevron_left"
              >
                chevron_left
              </span>
            </button>
            <button className="p-2 border border-outline-variant rounded bg-white text-on-surface hover:border-primary transition-colors">
              <span
                className="material-symbols-outlined text-[16px]"
                data-icon="chevron_right"
              >
                chevron_right
              </span>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default MetaAdsOverview;
