"use client";

import React, { useState, useEffect, useMemo } from "react";
import AgreementUploadModal from "@/components/agreements/AgreementUploadModal";
import AgreementViewModal from "@/components/agreements/AgreementViewModal";
import AgreementsToolbar from "@/components/agreements/AgreementsToolbar";
import AgreementsFilters from "@/components/agreements/AgreementsFilters";
import AgreementsTable from "@/components/agreements/AgreementsTable";
import { fetchAgreements, fetchClients, deleteAgreement } from "@/services/documentService";

export default function AgreementsPage() {
  const [clients, setClients] = useState([]);
  const [agreements, setAgreements] = useState([]);
  const [search, setSearch] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editingAgreement, setEditingAgreement] = useState(null);
  const [viewingAgreement, setViewingAgreement] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadInitial = async () => {
      setLoading(true);
      try {
        const [clientsData, agreementsData] = await Promise.all([fetchClients(), fetchAgreements()]);
        setClients(clientsData.data || []);
        setAgreements(agreementsData.data || []);
      } catch (err) {
        setError("Failed to load agreements");
      } finally {
        setLoading(false);
      }
    };
    loadInitial();
  }, []);

  const loadAgreements = async (clientId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAgreements(clientId || undefined);
      setAgreements(data.data || []);
    } catch (err) {
      setError("Failed to load agreements");
    } finally {
      setLoading(false);
    }
  };

  const handleClientFilterChange = (value) => {
    setClientFilter(value);
    loadAgreements(value);
  };

  const handleUploadSuccess = (agreement) => {
    setAgreements((prev) => [...prev, agreement]);
  };

  const handleEditSuccess = (updated) => {
    setAgreements((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this agreement?")) return;
    try {
      setError(null);
      await deleteAgreement(id);
      setAgreements((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      setError(err.message || "Failed to delete agreement");
    }
  };

  const handleEdit = (agreement) => {
    setEditingAgreement(agreement);
    setEditModalOpen(true);
  };

  const handleView = (agreement) => {
    setViewingAgreement(agreement);
    setViewModalOpen(true);
  };

  const getClientName = (clientId) => {
    const client = clients.find((c) => c.id === clientId);
    return client ? client.name : "Unknown Client";
  };

  const filteredAgreements = useMemo(() => {
    return agreements.filter((agreement) => {
      const matchesSearch =
        !search ||
        agreement.fileName?.toLowerCase().includes(search.toLowerCase()) ||
        agreement.description?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = !statusFilter || agreement.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [agreements, search, statusFilter]);

  return (
    <main className="flex-1 p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
      <AgreementsToolbar onUpload={() => setUploadModalOpen(true)} />

      <AgreementsFilters
        search={search}
        onSearchChange={setSearch}
        clientFilter={clientFilter}
        onClientChange={handleClientFilterChange}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        clients={clients}
      />

      {error && (
        <div className="mt-3 mb-1 p-4 rounded-lg flex items-center justify-between bg-red-50 text-red-800 border border-red-200">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-lg font-bold leading-none">×</button>
        </div>
      )}

      <AgreementsTable
        agreements={filteredAgreements}
        loading={loading}
        getClientName={getClientName}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <AgreementUploadModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
        clients={clients}
        defaultClientId={clientFilter || null}
      />

      <AgreementUploadModal
        open={editModalOpen}
        isEdit
        agreementToEdit={editingAgreement}
        onClose={() => {
          setEditModalOpen(false);
          setEditingAgreement(null);
        }}
        onSuccess={handleEditSuccess}
        clients={clients}
      />

      <AgreementViewModal
        open={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setViewingAgreement(null);
        }}
        agreement={viewingAgreement}
      />
    </main>
  );
}
