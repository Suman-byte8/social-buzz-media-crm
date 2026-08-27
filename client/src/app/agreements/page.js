"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import AgreementUploadModal from "@/components/agreements/AgreementUploadModal";
import AgreementViewModal from "@/components/agreements/AgreementViewModal";
import AgreementsToolbar from "@/components/agreements/AgreementsToolbar";
import AgreementsFilters from "@/components/agreements/AgreementsFilters";
import AgreementsTable from "@/components/agreements/AgreementsTable";
import { fetchClients } from "@/redux/slices/clientsSlice";
import { fetchAgreements, deleteAgreement } from "@/redux/slices/documentsSlice";
import RequireAdmin from "@/components/auth/RequireAdmin";

export default function AgreementsPage() {
  const dispatch = useDispatch();
  const { clients, loading: loadingClients } = useSelector((state) => state.clients);
  const { agreements, loadingAgreements, error } = useSelector((state) => state.documents);

  const [search, setSearch] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editingAgreement, setEditingAgreement] = useState(null);
  const [viewingAgreement, setViewingAgreement] = useState(null);

  useEffect(() => {
    dispatch(fetchClients());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchAgreements(clientFilter || undefined));
  }, [dispatch, clientFilter]);

  const handleClientFilterChange = (value) => {
    setClientFilter(value);
  };

  const handleUploadSuccess = () => {
    setUploadModalOpen(false);
  };

  const handleEditSuccess = () => {
    setEditModalOpen(false);
    setEditingAgreement(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this agreement?")) return;
    try {
      await dispatch(deleteAgreement(id)).unwrap();
    } catch (err) {
      // Failure is surfaced via state.documents.error
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
    <RequireAdmin>
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
        </div>
      )}

      <AgreementsTable
        agreements={filteredAgreements}
        loading={loadingClients || loadingAgreements}
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
    </RequireAdmin>
  );
}
