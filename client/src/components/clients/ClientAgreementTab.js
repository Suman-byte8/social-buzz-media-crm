"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import AgreementUploadModal from "@/components/agreements/AgreementUploadModal";
import AgreementViewModal from "@/components/agreements/AgreementViewModal";
import AgreementsTable from "@/components/agreements/AgreementsTable";
import { fetchAgreements, deleteAgreement } from "@/redux/slices/documentsSlice";

export default function ClientAgreementTab({ client, clientId }) {
  const dispatch = useDispatch();
  const { agreements, loadingAgreements, error } = useSelector((state) => state.documents);

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editingAgreement, setEditingAgreement] = useState(null);
  const [viewingAgreement, setViewingAgreement] = useState(null);

  useEffect(() => {
    if (clientId) dispatch(fetchAgreements(clientId));
  }, [dispatch, clientId]);

  // AgreementsTable/modals expect a `clients` array to resolve names —
  // this tab is already scoped to one client, so hand them a single-entry
  // list instead of the full client roster.
  const clientsForLookup = useMemo(
    () => (clientId ? [{ id: clientId, name: client?.name || "This client" }] : []),
    [clientId, client?.name]
  );

  const handleUploadSuccess = () => setUploadModalOpen(false);

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

  return (
    <section>
      <div className="bg-white rounded-t-xl p-card-padding border border-b-0 border-outline-variant shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-title-lg text-title-lg text-on-surface">Agreements</h2>
          <p className="font-body-sm text-body-sm text-secondary mt-0.5">
            Signed contracts for {client?.name || "this client"}, stored on Google Drive.
          </p>
        </div>
        <button
          onClick={() => setUploadModalOpen(true)}
          className="px-4 py-2 rounded-lg bg-primary text-white font-label-md text-label-md hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2 self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[18px]">upload_file</span>
          Upload Agreement
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-800 border-x border-outline-variant flex items-center justify-between">
          <span>{error}</span>
        </div>
      )}

      <AgreementsTable
        agreements={agreements}
        loading={loadingAgreements}
        clients={clientsForLookup}
        getClientName={() => client?.name || "This client"}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <AgreementUploadModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
        clients={clientsForLookup}
        defaultClientId={clientId}
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
        clients={clientsForLookup}
      />

      <AgreementViewModal
        open={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setViewingAgreement(null);
        }}
        agreement={viewingAgreement}
        clients={clientsForLookup}
      />
    </section>
  );
}
