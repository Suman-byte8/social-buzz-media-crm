"use client";

import React, { useState } from "react";
import ClientDetailContent from "@/components/clients/ClientDetailContent";

export default function ClientDetailShell() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <ClientDetailContent activeTab={activeTab} setActiveTab={setActiveTab} />
  );
}
