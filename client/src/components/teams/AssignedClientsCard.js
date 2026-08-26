"use client";

import React from "react";
import Link from "next/link";

export default function AssignedClientsCard({ memberName, assignedClientsList, clientHandlingNames, loadingClients, onAssignClient }) {
  return (
    <div className="bg-surface rounded-xl border border-outline-variant p-6 shadow-card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="font-headline-sm text-headline-sm text-on-surface">Assigned Clients</h2>
          <p className="text-body-sm text-on-surface-variant">Clients managed by {memberName}</p>
        </div>
        <button
          onClick={onAssignClient}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white font-label-md text-label-md hover:bg-blue-700 transition-colors flex items-center gap-2 self-start sm:self-auto shadow-card"
        >
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          Assign New Client
        </button>
      </div>

      {loadingClients ? (
        <div className="p-6 text-center text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin text-2xl">progress_activity</span>
        </div>
      ) : assignedClientsList.length > 0 || clientHandlingNames.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assignedClientsList.length > 0
            ? assignedClientsList.map((client) => (
                <div
                  key={client.id ? `client-db-${client.id}` : `client-name-${client.name}`}
                  className="p-4 rounded-xl border border-outline-variant bg-surface hover:shadow-card transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Link href={`/clients/${client.id}`} className="font-title-lg text-title-lg text-on-surface hover:text-primary transition-colors font-bold">
                        {client.name}
                      </Link>
                      <span className="px-2 py-0.5 rounded text-[11px] bg-blue-50 text-blue-700 font-medium border border-blue-100">
                        {client.industry || "Client"}
                      </span>
                    </div>
                    <p className="text-body-sm text-on-surface-variant mb-2">{client.email || client.phoneNumber || "No contact info"}</p>
                  </div>
                  <div className="pt-3 border-t border-outline-variant/30 flex items-center justify-between text-xs text-on-surface-variant">
                    <span>ID: #{client.id}</span>
                    <Link href={`/clients/${client.id}`} className="text-primary hover:underline font-medium flex items-center gap-0.5">
                      View Client
                      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </Link>
                  </div>
                </div>
              ))
            : clientHandlingNames.map((clientName, idx) => (
                <div key={`client-legacy-${idx}-${clientName}`} className="p-4 rounded-xl border border-outline-variant bg-surface">
                  <h4 className="font-title-md text-title-md text-on-surface font-bold">{clientName}</h4>
                  <p className="text-xs text-on-surface-variant">Assigned Client</p>
                </div>
              ))}
        </div>
      ) : (
        <div className="p-6 text-center text-on-surface-variant rounded-lg border border-dashed border-outline-variant">
          <span className="material-symbols-outlined text-3xl mb-2">groups</span>
          <p>No clients currently assigned to {memberName}.</p>
        </div>
      )}
    </div>
  );
}
