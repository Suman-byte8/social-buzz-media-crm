import React from "react";
import SmartList from "./SmartList";

const ClientList = ({
  clients,
  columns = [
    { key: "name", label: "Client Name", render: null },
    { key: "industry", label: "Industry", render: null },
    { key: "services", label: "Services", render: null },
    { key: "healthStatus", label: "Health", render: null },
    { key: "mrr", label: "MRR", render: null },
    { key: "accountManager", label: "Account Manager", render: null },
  ],
  onRowClick,
  filters = [],
  showActions = true
}) => {
  return (
    <div className="flex-1 overflow-y-auto bg-background">
      <SmartList
        items={clients}
        filterOptions={filters}
        onFilterChange={(filterType, value) => {
          // Handle filter changes
          console.log(`${filterType}: ${value}`);
        }}
        renderItem={(client, idx) => (
          <div className="flex items-center gap-3 py-3 px-4 rounded-md hover:bg-surface-container-low transition-colors cursor-pointer">
            <div className="w-10 h-10 rounded-lg border border-[#E5E5E7] flex items-center justify-center bg-white overflow-hidden shrink-0">
              <img
                alt={client.name}
                className="w-full h-full object-cover"
                src={client.avatar || "/placeholder.svg"}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-title-lg text-title-lg text-on-surface line-clamp-1 font-medium">
                {client.name}
              </p>
              {client.industry && (
                <p className="font-label-sm text-label-sm text-on-surface-variant">
                  {client.industry}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {client.services?.map((service, si) => (
                <span key={si} className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs border border-gray-200">
                  {service}
                </span>
              ))}
            </div>
            {client.healthStatus && (
              <StatusBadge status={client.healthStatus} color={client.healthColor || "primary"} />
            )}
            <div className="font-title-lg text-title-lg text-on-surface ml-2">
              {client.mrr ? `$${Number(client.mrr).toLocaleString()}` : "-"}
            </div>
            {client.accountManager && (
              <p className="font-label-sm text-label-sm text-on-surface-variant">
                {client.accountManager}
              </p>
            )}
          </div>
        )}
      />
    </div>
  );
};

export default ClientList;