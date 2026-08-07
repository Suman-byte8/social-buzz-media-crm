import React from "react";

const Ads = () => {
  return (
    <main className="flex-1 p-container-margin bg-[#F5F5F7]">
      {/* Client Header */}
      <div className="mb-stack-lg flex justify-between items-end">
        <div>
          <h2 className="font-display-lg text-display-lg text-on-background mb-unit">Acme Corp</h2>
          <div className="flex gap-stack-md border-b border-outline-variant pb-unit mt-stack-md">
            <span className="font-label-md text-label-md text-on-surface-variant cursor-pointer hover:text-primary">Overview</span>
            <span className="font-label-md text-label-md text-primary font-bold border-b-2 border-primary cursor-pointer pb-unit -mb-[5px]">Google Ads</span>
            <span className="font-label-md text-label-md text-on-surface-variant cursor-pointer hover:text-primary">Meta Ads</span>
            <span className="font-label-md text-label-md text-on-surface-variant cursor-pointer hover:text-primary">Assets</span>
          </div>
        </div>
        <button className="bg-primary text-on-primary font-label-md text-label-md px-stack-md py-stack-sm rounded-lg flex items-center gap-unit hover:bg-surface-tint transition-colors shadow-sm">
          Open Google Ads Manager <span className="material-symbols-outlined text-[16px]" data-icon="open_in_new">open_in_new</span>
        </button>
      </div>
      {/* Metrics Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-stack-md mb-stack-lg">
        {/* Spend */}
        <div className="bg-white p-card-padding rounded-lg border border-[#E5E5E7] shadow-[0px_2px_4px_rgba(0,0,0,0.05)] relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-container/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex justify-between items-start mb-stack-md relative z-10">
            <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Spend</span>
            <span className="material-symbols-outlined text-on-surface-variant" data-icon="payments">payments</span>
          </div>
          <div className="font-display-lg text-display-lg text-on-surface relative z-10">$12,450</div>
          <div className="font-label-md text-label-md text-[#16a34a] mt-unit flex items-center gap-1 relative z-10">
            <span className="material-symbols-outlined text-[14px]" data-icon="trending_up">trending_up</span> 14% vs last mo
          </div>
        </div>
        {/* Conversions */}
        <div className="bg-white p-card-padding rounded-lg border border-[#E5E5E7] shadow-[0px_2px_4px_rgba(0,0,0,0.05)] relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-container/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex justify-between items-start mb-stack-md relative z-10">
            <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Conversions</span>
            <span className="material-symbols-outlined text-on-surface-variant" data-icon="add_shopping_cart">add_shopping_cart</span>
          </div>
          <div className="font-display-lg text-display-lg text-on-surface relative z-10">842</div>
          <div className="font-label-md text-label-md text-[#16a34a] mt-unit flex items-center gap-1 relative z-10">
            <span className="material-symbols-outlined text-[14px]" data-icon="trending_up">trending_up</span> 5% vs last mo
          </div>
        </div>
        {/* ROAS */}
        <div className="bg-white p-card-padding rounded-lg border border-[#E5E5E7] shadow-[0px_2px_4px_rgba(0,0,0,0.05)] relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-container/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex justify-between items-start mb-stack-md relative z-10">
            <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">ROAS</span>
            <span className="material-symbols-outlined text-on-surface-variant" data-icon="monitoring">monitoring</span>
          </div>
          <div className="font-display-lg text-display-lg text-on-surface relative z-10">4.2x</div>
          <div className="font-label-md text-label-md text-[#dc2626] mt-unit flex items-center gap-1 relative z-10">
            <span className="material-symbols-outlined text-[14px]" data-icon="trending_down">trending_down</span> 2% vs last mo
          </div>
        </div>
        {/* CPC */}
        <div className="bg-white p-card-padding rounded-lg border border-[#E5E5E7] shadow-[0px_2px_4px_rgba(0,0,0,0.05)] relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-container/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex justify-between items-start mb-stack-md relative z-10">
            <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Avg. CPC</span>
            <span className="material-symbols-outlined text-on-surface-variant" data-icon="touch_app">touch_app</span>
          </div>
          <div className="font-display-lg text-display-lg text-on-surface relative z-10">$1.45</div>
          <div className="font-label-md text-label-md text-on-surface-variant mt-unit flex items-center gap-1 relative z-10">
            <span className="material-symbols-outlined text-[14px]" data-icon="horizontal_rule">horizontal_rule</span> 0% vs last mo
          </div>
        </div>
      </div>
      {/* Campaigns Table */}
      <div className="bg-white rounded-lg border border-[#E5E5E7] shadow-[0px_2px_4px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="p-card-padding border-b border-[#F0F0F0] flex justify-between items-center bg-[#FAFAFA]">
          <h3 className="font-title-lg text-title-lg text-on-surface">Active Campaigns</h3>
          <div className="flex gap-stack-sm">
            <button className="bg-white border border-[#1A1A1A] text-[#1A1A1A] font-label-md text-label-md px-stack-sm py-unit rounded flex items-center gap-unit hover:bg-surface-container-low transition-colors">
              <span className="material-symbols-outlined text-[16px]" data-icon="filter_list">filter_list</span> Filter
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAFAFA] border-b border-[#F0F0F0]">
                <th className="p-stack-md font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">Campaign Name</th>
                <th className="p-stack-md font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">Status</th>
                <th className="p-stack-md font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold text-right">Budget/Day</th>
                <th className="p-stack-md font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold text-right">Impressions</th>
                <th className="p-stack-md font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold text-right">Clicks</th>
                <th className="p-stack-md font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold text-right">Conversions</th>
              </tr>
            </thead>
            <tbody className="font-body-sm text-body-sm text-on-surface">
              <tr className="border-b border-[#F0F0F0] hover:bg-[#F9F9F9] transition-colors">
                <td className="p-stack-md font-medium text-primary cursor-pointer hover:underline">Q3_Search_Brand_US</td>
                <td className="p-stack-md">
                  <span className="inline-flex items-center px-2 py-1 rounded-xl text-xs font-medium bg-[#16a34a]/10 text-[#16a34a]">Active</span>
                </td>
                <td className="p-stack-md text-right">$150.00</td>
                <td className="p-stack-md text-right">45,231</td>
                <td className="p-stack-md text-right">2,104</td>
                <td className="p-stack-md text-right font-medium">142</td>
              </tr>
              <tr className="border-b border-[#F0F0F0] hover:bg-[#F9F9F9] transition-colors">
                <td className="p-stack-md font-medium text-primary cursor-pointer hover:underline">Q3_Display_Retargeting_All</td>
                <td className="p-stack-md">
                  <span className="inline-flex items-center px-2 py-1 rounded-xl text-xs font-medium bg-[#16a34a]/10 text-[#16a34a]">Active</span>
                </td>
                <td className="p-stack-md text-right">$75.00</td>
                <td className="p-stack-md text-right">120,450</td>
                <td className="p-stack-md text-right">840</td>
                <td className="p-stack-md text-right font-medium">56</td>
              </tr>
              <tr className="border-b border-[#F0F0F0] hover:bg-[#F9F9F9] transition-colors">
                <td className="p-stack-md font-medium text-primary cursor-pointer hover:underline">Pmax_Holiday_Promo_Test</td>
                <td className="p-stack-md">
                  <span className="inline-flex items-center px-2 py-1 rounded-xl text-xs font-medium bg-[#eab308]/10 text-[#ca8a04]">Learning</span>
                </td>
                <td className="p-stack-md text-right">$200.00</td>
                <td className="p-stack-md text-right">12,400</td>
                <td className="p-stack-md text-right">450</td>
                <td className="p-stack-md text-right font-medium">12</td>
              </tr>
              <tr className="border-b border-[#F0F0F0] hover:bg-[#F9F9F9] transition-colors opacity-60">
                <td className="p-stack-md font-medium text-primary cursor-pointer hover:underline">Q2_Search_NonBrand_Competitor</td>
                <td className="p-stack-md">
                  <span className="inline-flex items-center px-2 py-1 rounded-xl text-xs font-medium bg-tertiary-fixed-dim/20 text-tertiary">Paused</span>
                </td>
                <td className="p-stack-md text-right">$50.00</td>
                <td className="p-stack-md text-right">8,900</td>
                <td className="p-stack-md text-right">120</td>
                <td className="p-stack-md text-right font-medium">4</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
};

export default Ads;
