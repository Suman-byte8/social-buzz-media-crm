"use client";

import React, { useState } from "react";
import ClientDetailContent from "@/components/clients/ClientDetailContent";

export default function ClientDetailShell({ client, clientId }) {
  const [activeTab, setActiveTab] = useState("overview");
  const clientData = client || {};

  return (
    <ClientDetailContent 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      client={clientData}
      clientId={clientId}
    />
  );
}
