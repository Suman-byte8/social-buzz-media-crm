"use client";

import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import AgreementUploadModal from "@/components/agreements/AgreementUploadModal";
import AgreementViewModal from "@/components/agreements/AgreementViewModal";
import AgreementsToolbar from "@/components/agreements/AgreementsToolbar";
import AgreementsFilters from "@/components/agreements/AgreementsFilters";
import AgreementsTable from "@/components/agreements/AgreementsTable";
import Pagination from "@/components/ui/Pagination";
import { fetchClients } from "@/redux/slices/clientsSlice";
import { fetchAgreements, deleteAgreement } from "@/redux/slices/documentsSlice";
import RequireAdmin from "@/components/auth/RequireAdmin";

const LIMIT = 15;

export default function AgreementsPage() {
  const dispatch = useDispatch();
  const { clients, loading: loadingClients } = useSelector((state) => state.clients);
  const {
    agreements,
    loadingAgreements,
    error,
    agreementsTotalPages,
    agreementsTotalItems,
  } = useSelector((state) => state.documents);

  const [search, setSearch] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editingAgreement, setEditingAgreement] = useState(null);
  const [viewingAgreement, setViewingAgreement] = useState(null);

  useEffect(() => {
    dispatch(fetchClients({ limit: 100 }));
  }, [dispatch]);

  useEffect(() => {
    dispatch(
      fetchAgreements({
        clientId: clientFilter || undefined,
        status: statusFilter || undefined,
        search: search || undefined,
        page,
        limit: LIMIT,
      })
    );
  }, [dispatch, clientFilter, statusFilter, search, page]);

  const handleSearchChange = (value) => {
    setSearch(value);
    setPage(1);
  };

  const handleClientFilterChange = (value) => {
    setClientFilter(value);
    setPage(1);
  };

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleUploadSuccess = () => {
    setUploadModalOpen(false);
  };

  const handleEditSuccess = () => {
    setEditModalOpen(false);
    setEditingAgreement(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this agreement? It will be moved to the Drive trash and removed from here.")) return;
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

  return (
    <RequireAdmin>
    <main className="flex-1 p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
      <AgreementsToolbar onUpload={() => setUploadModalOpen(true)} />

      <AgreementsFilters
        search={search}
        onSearchChange={handleSearchChange}
        clientFilter={clientFilter}
        onClientChange={handleClientFilterChange}
        statusFilter={statusFilter}
        onStatusChange={handleStatusFilterChange}
        clients={clients}
      />

      {error && (
        <div className="mt-3 mb-1 p-4 rounded-lg flex items-center justify-between bg-red-50 text-red-800 border border-red-200">
          <span>{error}</span>
        </div>
      )}

      <AgreementsTable
        agreements={agreements}
        loading={loadingClients || loadingAgreements}
        clients={clients}
        getClientName={getClientName}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <Pagination
        page={page}
        limit={LIMIT}
        totalItems={agreementsTotalItems}
        totalPages={agreementsTotalPages}
        loading={loadingAgreements}
        onPageChange={setPage}
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
        clients={clients}
      />
    </main>
    </RequireAdmin>
  );
}
