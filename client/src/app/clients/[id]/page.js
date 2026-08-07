import React from "react";
import ClientDetailShell from "@/components/clients/ClientDetailShell";

export async function generateStaticParams() {
  return [
    { id: "1" },
    { id: "2" },
    { id: "3" },
    { id: "123" },
    { id: "novatech" },
  ];
}

export default function ClientDetailPage() {
  return <ClientDetailShell />;
}
