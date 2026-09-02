"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchClients } from "@/redux/slices/clientsSlice";

const toServiceArray = (value) =>
  Array.isArray(value) ? value : value ? value.split(",").map((s) => s.trim()).filter(Boolean) : [];

export function useInvoiceClients({ onClientSelected } = {}) {
  const dispatch = useDispatch();
  const rawClients = useSelector((state) => state.clients.clients);
  const isClientLoading = useSelector((state) => state.clients.loading);
  const [selectedClientId, setSelectedClientId] = useState("");

  useEffect(() => {
    dispatch(fetchClients({ limit: 100 }));
  }, [dispatch]);

  const clients = useMemo(() => {
    const arr = Array.isArray(rawClients) ? rawClients : [];
    return arr.map((c) => ({
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
      services: toServiceArray(c.servicesSelected),
    }));
  }, [rawClients]);

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
