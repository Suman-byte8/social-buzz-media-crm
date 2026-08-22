"use client";

import React, { useState, useEffect } from "react";
import { fetchAgreements, deleteAgreement } from "@/services/documentService";
import { formatDistanceToNow } from "date-fns";

const AgreementsList = ({ clientId, onEdit, onView, onDeleteSuccess }) => {
  const [agreements, setAgreements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadAgreements = async () => {
      try {
        setLoading(true);
        const data = await fetchAgreements(clientId);
        setAgreements(data.data || []);
      } catch (err) {
        setError("Failed to fetch agreements");
      } finally {
        setLoading(false);
      }
    };

    if (clientId) {
      loadAgreements();
    }
  }, [clientId, onDeleteSuccess]);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this agreement?")) {
      try {
        await deleteAgreement(id);
        onDeleteSuccess && onDeleteSuccess(id);
      } catch (err) {
        alert("Failed to delete agreement");
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "pending_signature":
        return "bg-amber-100 text-amber-800";
      case "expired":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse border rounded-lg p-4">
            <div className="h-4 w-3/4 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 w-1/2 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (agreements.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No agreements uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {agreements.map((agreement) => (
        <div
          key={agreement.id}
          className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{agreement.fileName}</h3>
              <div className="text-sm text-gray-500 mt-1">
                <span>Issued: {new Date(agreement.issuedDate).toLocaleDateString()}</span>
                <span className="mx-2">·</span>
                <span>Expires: {new Date(agreement.expiryDate).toLocaleDateString()}</span>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Uploaded {formatDistanceToNow(new Date(agreement.createdAt), { addRelative: true })}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(agreement.status)}`}>
                {agreement.status.replace("_", " ")}
              </span>
              
              <button
                onClick={() => onView(agreement)}
                className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                title="View"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.17 8.23 6.58 5 10.5 5c4.34 0 7.83 3.49 8.5 7.75a9.92 9.92 0 01-2.13 4.53L10.5 21l-2.13-3.72A9.92 9.92 0 012.458 12z" />
                </svg>
              </button>
              
              <button
                onClick={() => onEdit(agreement)}
                className="p-1 text-amber-600 hover:bg-amber-100 rounded"
                title="Edit"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-5m-5 0v5m-7-5h2m5-5v5" />
                </svg>
              </button>
              
              <button
                onClick={() => handleDelete(agreement.id)}
                className="p-1 text-red-600 hover:bg-red-100 rounded"
                title="Delete"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AgreementsList;