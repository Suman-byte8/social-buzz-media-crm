"use client";

import React from "react";
import ClientAgreementTab from "@/components/clients/ClientAgreementTab";
import ProposalTab from "@/components/clients/ProposalTab";

// Combines the old standalone Agreement and Proposal tabs into a single
// "Documents" tab, side by side. They still upload to separate Drive
// subfolders (Agreements / Proposals, see documentRoutes.js) and remain
// otherwise unchanged — this is purely a layout merge, not a data-model one.
export default function DocumentsTab({ client, clientId }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      <div className="min-w-0">
        <ClientAgreementTab client={client} clientId={clientId} />
      </div>
      <div className="min-w-0">
        <ProposalTab client={client} clientId={clientId} />
      </div>
    </div>
  );
}
