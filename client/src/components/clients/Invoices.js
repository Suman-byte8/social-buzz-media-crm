"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { fetchInvoiceDocuments, deleteInvoiceDocument } from "@/redux/slices/documentsSlice";
import { getAssetUrl } from "@/services/apiClient";

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const formatSize = (bytes) => {
  if (!bytes) return null;
  return `${(bytes / 1024).toFixed(0)} KB`;
};

const Invoices = ({ client, clientId }) => {
  const dispatch = useDispatch();
  const { invoiceDocuments, loadingInvoiceDocuments } = useSelector((state) => state.documents);
  const clientName = client?.name || "Client";

  useEffect(() => {
    if (clientId) {
      dispatch(fetchInvoiceDocuments(clientId));
    }
  }, [dispatch, clientId]);

  const handleDelete = (id) => {
    if (!window.confirm("Delete this invoice? This will not remove it from Google Drive.")) return;
    dispatch(deleteInvoiceDocument(id));
  };

  const hasInvoices = invoiceDocuments.length > 0;

  return (
    <main className="flex-1 overflow-y-auto p-container-margin">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="font-title-lg text-title-lg text-on-surface">Invoices</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
              Invoices saved to {clientName}&apos;s Drive folder from the Invoice Builder&apos;s &ldquo;Save to Drive&rdquo; action.
            </p>
          </div>
          <Link
            href="/invoices"
            className="shrink-0 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-primary/90 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Invoice
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden">
          {loadingInvoiceDocuments ? (
            <div className="p-12 text-center text-on-surface-variant">
              <span className="animate-spin material-symbols-outlined text-[24px]">progress_activity</span>
            </div>
          ) : hasInvoices ? (
            <div className="divide-y divide-[#F0F0F0]">
              {invoiceDocuments.map((invoice) => {
                const size = formatSize(invoice.fileSize);
                return (
                  <div key={invoice.id} className="p-4 flex items-center gap-3 group">
                    <span className="material-symbols-outlined text-primary text-[22px] shrink-0">receipt_long</span>
                    <div className="min-w-0 flex-1">
                      <a
                        href={getAssetUrl(`/api/documents/${invoice.id}/stream`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-body-sm text-body-sm font-medium text-on-surface hover:text-primary transition-colors truncate block"
                        title={invoice.fileName}
                      >
                        {invoice.fileName}
                      </a>
                      <p className="font-label-sm text-label-sm text-on-surface-variant">
                        {formatDate(invoice.createdAt)}
                        {size ? ` · ${size}` : ""}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(invoice.id)}
                      className="p-1.5 text-on-surface-variant hover:text-red-600 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-on-surface-variant font-body-sm text-body-sm">
              No invoices saved for {clientName} yet. Use &ldquo;Save to Drive&rdquo; from the Invoice Builder.
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default Invoices;
