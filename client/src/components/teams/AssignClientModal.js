"use client";

import React from "react";

export default function AssignClientModal({ isOpen, onClose, memberName, allClients, selectedClientId, onChange, onSubmit, loading }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gray-200 pb-3">
          <h3 className="font-title-lg text-title-lg text-on-surface font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600">person_add</span>
            Assign Client to {memberName}
          </h3>
          <button onClick={onClose} className="text-secondary hover:text-primary transition-colors p-1">
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block font-label-sm text-label-sm text-secondary mb-1">Select Client *</label>
            <select
              required
              value={selectedClientId}
              onChange={(e) => onChange(e.target.value)}
              className="w-full px-4 py-2 border border-outline-variant rounded-lg focus:ring-1 focus:ring-primary focus:border-primary bg-white"
            >
              <option value="">Choose a client...</option>
              {allClients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name} {client.industry ? `(${client.industry})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-3 border-t border-outline-variant flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-outline-variant rounded-lg text-secondary font-label-md hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg font-label-md hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {loading && <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>}
              Assign Client
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
