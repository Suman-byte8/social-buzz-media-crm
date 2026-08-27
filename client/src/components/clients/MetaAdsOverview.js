import React from "react";

const MetaAdsOverview = ({ client }) => {
  const clientName = client?.name || "Client";
  const campaigns = Array.isArray(client?.campaigns) ? client.campaigns :
    (client?.campaigns ? client.campaigns.split(",") : []);
  const metaCampaigns = campaigns.filter((c) => typeof c !== "object" || c.platform === "meta");

  return (
    <main className="flex-1 overflow-y-auto p-gutter md:p-container-margin">
      <div className="mb-stack-lg">
        <h2 className="font-title-lg text-title-lg text-on-surface">Meta Ads</h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
          Campaign tracking for {clientName}. No live Meta Ads account is connected — figures below reflect only what&apos;s recorded here.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-outline-variant shadow-sm overflow-hidden">
        <div className="p-card-padding border-b border-outline-variant flex justify-between items-center bg-[#FAFAFA]">
          <h3 className="font-title-lg text-title-lg text-on-surface">Campaigns</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAFAFA] border-b border-outline-variant font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                <th className="py-3 px-4 font-semibold">Campaign Name</th>
              </tr>
            </thead>
            <tbody className="font-body-sm text-body-sm text-on-surface divide-y divide-[#F0F0F0]">
              {metaCampaigns.length > 0 ? (
                metaCampaigns.map((campaign, idx) => (
                  <tr key={idx} className="hover:bg-[#F9F9F9] transition-colors">
                    <td className="py-4 px-4 font-medium">
                      {typeof campaign === "object" ? campaign.name || "Unnamed Campaign" : campaign}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-8 px-4 text-center text-on-surface-variant">
                    No Meta campaigns recorded for {clientName}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
};

export default MetaAdsOverview;
