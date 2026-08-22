"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import ClientDetailShell from "@/components/clients/ClientDetailShell";
import { fetchClientById } from "@/services/clientService";

// Fetches the client in the browser after the page loads (static export safe).
// ClientDetailShell stays untouched, so existing UI/styling/behavior is preserved.
export default function ClientDetailView({ clientId }) {
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!clientId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadClient = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchClientById(clientId);
        if (cancelled) return;
        setClient(response?.data || response || null);
      } catch (err) {
        if (cancelled) return;
        console.error("Error fetching client:", err);
        setError(err?.message || "Failed to load client");
        setClient(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadClient();

    return () => {
      cancelled = true;
    };
  }, [clientId]);

  if (loading) {
    return (
      <main className="flex-1 p-container-margin flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined animate-spin text-primary text-4xl">
            progress_activity
          </span>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Loading client...
          </p>
        </div>
      </main>
    );
  }

  if (error || !client) {
    return (
      <main className="flex-1 p-container-margin flex items-center justify-center min-h-[60vh]">
        <div className="text-center flex flex-col items-center gap-3 max-w-sm">
          <span className="material-symbols-outlined text-4xl text-secondary">
            error_outline
          </span>
          <p className="font-title-md text-title-md text-on-surface">
            Client not found
          </p>
          <p className="font-body-sm text-body-sm text-secondary">
            {error || `No client found with id "${clientId}".`}
          </p>
          <Link
            href="/clients"
            className="px-4 py-2 rounded-lg bg-primary text-white font-label-md text-label-md hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">
              arrow_back
            </span>
            Back to Clients
          </Link>
        </div>
      </main>
    );
  }

  return <ClientDetailShell client={client} clientId={clientId} />;
}