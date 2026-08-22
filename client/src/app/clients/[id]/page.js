import React from "react";
import { notFound } from "next/navigation";
import ClientDetailShell from "@/components/clients/ClientDetailShell";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function fetchClientById(id) {
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  const response = await fetch(`${API_BASE_URL}/clients/${id}`, {
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return data.data;
}

export async function generateStaticParams() {
  return [{ id: "1" }];
}

export default async function ClientDetailPage({ params }) {
  const { id } = await params;
  const client = await fetchClientById(id);

  if (!client) {
    notFound();
  }

  return <ClientDetailShell client={client} clientId={id} />;
}