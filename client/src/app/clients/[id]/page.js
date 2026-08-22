import React from "react";
import { notFound } from "next/navigation";
import ClientDetailShell from "@/components/clients/ClientDetailShell";

async function fetchClientById(id) {
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  const response = await fetch(`${API_BASE_URL}/clients/${id}`, {
    next: { revalidate: 60 },
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
  try {
    const API_BASE_URL =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    const response = await fetch(`${API_BASE_URL}/clients?limit=1000`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return [{ id: "1" }];
    }

    const data = await response.json();
    const clients = data.data || data || [];

    if (!Array.isArray(clients) || clients.length === 0) {
      return [{ id: "1" }];
    }

    return clients.map((client) => ({
      id: String(client.id),
    }));
  } catch {
    return [{ id: "1" }];
  }
}

export default async function ClientDetailPage({ params }) {
  const { id } = await params;
  const client = await fetchClientById(id);

  if (!client) {
    notFound();
  }

  return <ClientDetailShell client={client} clientId={id} />;
}