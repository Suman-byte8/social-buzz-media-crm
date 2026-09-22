"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchClients, fetchClientById } from "@/redux/slices/clientsSlice";

const toServiceArray = (value) =>
  Array.isArray(value) ? value : value ? value.split(",").map((s) => s.trim()).filter(Boolean) : [];

export function useInvoiceClients({ onClientSelected } = {}) {
  const dispatch = useDispatch();
  const rawClients = useSelector((state) => state.clients.clients);
  const isClientLoading = useSelector((state) => state.clients.loading);
  const [selectedClientId, setSelectedClientId] = useState("");
  // Holds the individually-fetched client detail (fresh servicesSelected)
  const [fetchedClientDetail, setFetchedClientDetail] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

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
    async (id) => {
      setSelectedClientId(id);
      setFetchedClientDetail(null);
      if (id && onClientSelected) onClientSelected();

      if (id) {
        // Fetch the individual client to get the freshest servicesSelected,
        // in case the list response has stale/missing data for that field.
        setIsDetailLoading(true);
        try {
          const result = await dispatch(fetchClientById(id)).unwrap();
          const data = result?.data ?? result;
          if (data) {
            setFetchedClientDetail({
              id: data.id,
              name: data.name || data.clientName || "",
              email: data.email || "",
              phone: data.whatsappNumber || data.phoneNumber || "",
              whatsappNumber: data.whatsappNumber || "",
              phoneNumber: data.phoneNumber || "",
              address: data.address || data.billingAddress || "",
              services: toServiceArray(data.servicesSelected),
            });
          }
        } catch {
          // Fall through: selectedClient will use the list-based data below
        } finally {
          setIsDetailLoading(false);
        }
      }
    },
    [dispatch, onClientSelected]
  );

  // Prefer the freshly-fetched individual client detail; fall back to list data.
  const selectedClient = useMemo(() => {
    if (selectedClientId && fetchedClientDetail && String(fetchedClientDetail.id) === String(selectedClientId)) {
      return fetchedClientDetail;
    }
    return clients.find((c) => String(c.id) === String(selectedClientId)) || null;
  }, [clients, selectedClientId, fetchedClientDetail]);

  return {
    clients,
    isClientLoading,
    isDetailLoading,
    selectedClientId,
    selectedClient,
    handleClientChange,
  };
}
