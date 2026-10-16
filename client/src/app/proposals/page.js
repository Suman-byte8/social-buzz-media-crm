"use client";

import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import ProposalUploadModal from "@/components/proposals/ProposalUploadModal";
import GenerateProposalModal from "@/components/proposals/GenerateProposalModal";
import ProposalsToolbar from "@/components/proposals/ProposalsToolbar";
import ProposalsFilters from "@/components/proposals/ProposalsFilters";
import ProposalsTable from "@/components/proposals/ProposalsTable";
import Pagination from "@/components/ui/Pagination";
import { fetchClients } from "@/redux/slices/clientsSlice";
import { fetchProposals, deleteProposal } from "@/redux/slices/documentsSlice";
import RequireAdmin from "@/components/auth/RequireAdmin";

// Mirrors agreements/page.js — the top-level cross-client dashboard
// counterpart to the per-client ProposalTab.js.
const LIMIT = 15;

export default function ProposalsPage() {
  const dispatch = useDispatch();
  const { clients, loading: loadingClients } = useSelector((state) => state.clients);
  const { proposals, loadingProposals, error, proposalsTotalPages, proposalsTotalItems } = useSelector((state) => state.documents);

  const [search, setSearch] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [page, setPage] = useState(1);

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchClients({ limit: 100 }));
  }, [dispatch]);

  useEffect(() => {
    dispatch(
      fetchProposals({
        clientId: clientFilter || undefined,
        search: search || undefined,
        page,
        limit: LIMIT,
      })
    );
  }, [dispatch, clientFilter, search, page]);

  const handleSearchChange = (value) => {
    setSearch(value);
    setPage(1);
  };

  const handleClientFilterChange = (value) => {
    setClientFilter(value);
    setPage(1);
  };

  const handleUploadSuccess = () => {
    setUploadModalOpen(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this proposal? This will not remove the file from Google Drive.")) return;
    try {
      await dispatch(deleteProposal(id)).unwrap();
    } catch (err) {
      // Failure is surfaced via state.documents.error
    }
  };

  const getClientName = (clientId) => {
    const client = clients.find((c) => c.id === clientId);
    return client ? client.name : "Unknown Client";
  };

  return (
    <RequireAdmin>
      <main className="flex-1 p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
        <ProposalsToolbar onUpload={() => setUploadModalOpen(true)} onGenerate={() => setGenerateModalOpen(true)} />

        <ProposalsFilters
          search={search}
          onSearchChange={handleSearchChange}
          clientFilter={clientFilter}
          onClientChange={handleClientFilterChange}
          clients={clients}
        />

        {error && (
          <div className="mt-3 mb-1 p-4 rounded-lg flex items-center justify-between bg-red-50 text-red-800 border border-red-200">
            <span>{error}</span>
          </div>
        )}

        <ProposalsTable
          proposals={proposals}
          loading={loadingClients || loadingProposals}
          clients={clients}
          getClientName={getClientName}
          onDelete={handleDelete}
        />

        <Pagination
          page={page}
          limit={LIMIT}
          totalItems={proposalsTotalItems}
          totalPages={proposalsTotalPages}
          loading={loadingProposals}
          onPageChange={setPage}
        />

        {uploadModalOpen && (
          <ProposalUploadModal
            onClose={() => setUploadModalOpen(false)}
            onSuccess={handleUploadSuccess}
            clients={clients}
            defaultClientId={clientFilter || null}
          />
        )}

        {generateModalOpen && <GenerateProposalModal onClose={() => setGenerateModalOpen(false)} />}
      </main>
    </RequireAdmin>
  );
}
