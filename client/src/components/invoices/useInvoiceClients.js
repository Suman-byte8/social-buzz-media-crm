"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { fetchClients } from "@/services/clientService";

export function useInvoiceClients({ onClientSelected } = {}) {
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [isClientLoading, setIsClientLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadClients = async () => {
      setIsClientLoading(true);
      try {
        const response = await fetchClients();
        const arr = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : [];
        const clientList = arr.map((c) => ({
          id: c.id,
          name: c.name || c.clientName || "",
          email: c.email || "",
          // Keep both numbers distinct so the share menu can offer the
          // WhatsApp-specific number and the general phone as selectable
          // destinations. `phone` stays as a fallback for older callers.
          phone: c.whatsappNumber || c.phoneNumber || "",
          whatsappNumber: c.whatsappNumber || "",
          phoneNumber: c.phoneNumber || "",
          address: c.address || c.billingAddress || "",
        }));
        if (isMounted) setClients(clientList);
      } catch (e) {
        console.error("Could not load clients:", e);
      } finally {
        if (isMounted) setIsClientLoading(false);
      }
    };

    loadClients();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleClientChange = useCallback(
    (id) => {
      setSelectedClientId(id);
      if (id && onClientSelected) onClientSelected();
    },
    [onClientSelected]
  );

  const selectedClient = useMemo(
    () => clients.find((c) => String(c.id) === String(selectedClientId)) || null,
    [clients, selectedClientId]
  );

  return { clients, isClientLoading, selectedClientId, selectedClient, handleClientChange };
}
