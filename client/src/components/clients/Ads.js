import React from "react";

const Ads = ({ client }) => {
  const clientName = client?.name || "Client";
  const campaigns = Array.isArray(client?.campaigns) ? client.campaigns :
    (client?.campaigns ? client.campaigns.split(",") : []);

  return (
    <main className="flex-1 p-container-margin">
      <div className="mb-stack-lg">
        <h2 className="font-title-lg text-title-lg text-on-surface">Google Ads</h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
          Campaign tracking for {clientName}. No live Google Ads account is connected — figures below reflect only what&apos;s recorded here.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-outline-variant shadow-sm overflow-hidden">
        <div className="p-card-padding border-b border-outline-variant flex justify-between items-center bg-[#FAFAFA]">
          <h3 className="font-title-lg text-title-lg text-on-surface">Campaigns</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAFAFA] border-b border-[#F0F0F0]">
                <th className="p-stack-md font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">Campaign Name</th>
              </tr>
            </thead>
            <tbody className="font-body-sm text-body-sm text-on-surface">
              {campaigns.length > 0 ? (
                campaigns.map((campaign, idx) => (
                  <tr key={idx} className="border-b border-[#F0F0F0] hover:bg-[#F9F9F9] transition-colors">
                    <td className="p-stack-md font-medium text-on-surface">
                      {typeof campaign === 'object' ? campaign.name : campaign}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="p-8 text-center text-on-surface-variant">
                    No campaigns recorded for {clientName}.
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

export default Ads;
