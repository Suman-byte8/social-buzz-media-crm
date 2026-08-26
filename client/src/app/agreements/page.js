"use client";

import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import AgreementUploadModal from "@/components/clients/AgreementUploadModal";
import AgreementViewModal from "@/components/clients/AgreementViewModal";
import { fetchClients } from "@/redux/slices/clientsSlice";
import { fetchAgreements, deleteAgreement } from "@/redux/slices/documentsSlice";

export default function AgreementsPage() {
  const dispatch = useDispatch();
  const { clients, loading: loadingClients } = useSelector((state) => state.clients);
  const { agreements, loadingAgreements, error } = useSelector((state) => state.documents);

  const [selectedClientId, setSelectedClientId] = useState(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editingAgreement, setEditingAgreement] = useState(null);
  const [viewingAgreement, setViewingAgreement] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState({});

  useEffect(() => {
    dispatch(fetchClients());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchAgreements(selectedClientId || undefined));
  }, [dispatch, selectedClientId]);

  const handleClientChange = (e) => {
    const rawValue = e.target.value;
    const clientId = rawValue === "" ? null : Number(rawValue);
    if (clientId !== null && isNaN(clientId)) return;
    setSelectedClientId(clientId);
  };

  const handleResetFilter = () => {
    setSelectedClientId(null);
  };

  const handleUploadSuccess = () => {
    setUploadModalOpen(false);
  };

  const handleEditSuccess = () => {
    setEditModalOpen(false);
    setEditingAgreement(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this agreement?"))
      return;
    try {
      await dispatch(deleteAgreement(id)).unwrap();
      setDeleteLoading((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
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

  const statusColors = {
    active: "bg-green-100 text-green-800",
    pending_signature: "bg-amber-100 text-amber-800",
    expired: "bg-red-100 text-red-800",
  };

  const statusLabels = {
    active: "Active",
    pending_signature: "Pending Signature",
    expired: "Expired",
  };

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'Unknown Client';
  };

  const getClientNameForAgreement = (agreement) => {
    if (!agreement) return null;
    return getClientName(agreement.clientId);
  };

  if ((loadingClients || loadingAgreements) && (!clients.length || !agreements.length)) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Agreements</h1>
          <p className="text-gray-600 mb-4">
            Loading agreements...
          </p>
          <div className="grid gap-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse border rounded-lg p-4"
              >
                <div className="h-4 w-3/4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 w-1/2 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Agreements</h1>

          <div className="flex gap-2 items-center">
            <select
              value={selectedClientId || ""}
              onChange={handleClientChange}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- All Clients --</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>

            <button
              onClick={handleResetFilter}
              className="px-4 py-2 text-sm bg-gray-500 text-white hover:bg-gray-600 rounded-md"
            >
              Show All
            </button>

            <button
              onClick={() => {
                console.log("Upload button clicked, setting modal open");
                setUploadModalOpen(true);
              }}
              disabled={!selectedClientId}
              className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Upload Agreement
            </button>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded mb-4">
              {error}
            </div>
          )}

          {!selectedClientId && agreements.length === 0 && clients.length > 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                No agreements found. Upload your first agreement to get started.
              </p>
              <button
                onClick={() => setUploadModalOpen(true)}
                disabled={!selectedClientId}
                className="mt-4 px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Upload First Agreement
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {agreements.map((agreement) => (
                <div
                  key={agreement.id}
                  className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        <a
                          href={agreement.driveLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {agreement.fileName}
                        </a>
                      </h3>
                      <div className="text-sm text-gray-500 mt-1 flex flex-wrap gap-4">
                        <span>
                          Issued:{" "}
                          {new Date(agreement.issuedDate).toLocaleDateString()}
                        </span>
                        <span>
                          Expires:{" "}
                          {new Date(agreement.expiryDate).toLocaleDateString()}
                        </span>
                        <span className="ml-2">
                          Client:{" "}
                          <strong>{getClientName(agreement.clientId)}</strong>
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Description:{" "}
                        {agreement.description || "No description provided"}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          statusColors[agreement.status] ||
                          "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {statusLabels[agreement.status] || agreement.status}
                      </span>

                      <button
                        onClick={() => handleView(agreement)}
                        className="p-1 text-blue-600 hover:bg-blue-100 rounded-md"
                        title="View Agreement"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.17 8.23 6.58 5 10.5 5c4.34 0 7.83 3.49 8.5 7.75a9.92 9.92 0 01-2.13 4.53L10.5 21l-2.13-3.72A9.92 9.92 0 012.458 12z" />
                        </svg>
                      </button>

                      <button
                        onClick={() => handleEdit(agreement)}
                        className="p-1 text-amber-600 hover:bg-amber-100 rounded-md"
                        title="Edit Agreement"
                      >
                        <Edit3 size={16} />
                      </button>

                      <button
                        onClick={() => handleDelete(agreement.id)}
                        disabled={deleteLoading[agreement.id]}
                        className="p-1 text-red-600 hover:bg-red-100 rounded-md"
                        title="Delete Agreement"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AgreementUploadModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
        clientId={selectedClientId}
        clientName={selectedClientId ? getClientName(selectedClientId) : null}
      />

      <AgreementUploadModal
        open={editModalOpen}
        isEdit={true}
        agreementToEdit={editingAgreement}
        onClose={() => {
          setEditModalOpen(false);
          setEditingAgreement(null);
        }}
        onSuccess={handleEditSuccess}
        clientId={selectedClientId || editingAgreement?.clientId}
        clientName={getClientNameForAgreement(editingAgreement)}
      />

      <AgreementViewModal
        open={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setViewingAgreement(null);
        }}
        agreement={viewingAgreement}
      />
    </div>
  );
}

const Edit3 = ({ size = 24, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 8v7l4 2v-5l-4-2z" />
    <path d="M15 3.5a2.525 2.525 0 1 1 3.5 3.5A2.525 2.525 0 1 1 15 3.5z" />
    <path d="M17 3.5h-1" />
    <path d="M12 21h-7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h4l4 4v9" />
  </svg>
);
