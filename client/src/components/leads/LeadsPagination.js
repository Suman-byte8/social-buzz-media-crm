"use client";

import React from "react";

export default function LeadsPagination({ page, limit, totalItems, totalPages, loading, onPageChange }) {
  if (totalItems === 0) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, totalItems);

  return (
    <div className="p-4 border-t border-outline-variant/30 flex items-center justify-between text-body-sm text-on-surface-variant rounded-b-xl bg-surface-container-lowest">
      <span>
        Showing {from} to {to} of {totalItems} entries
      </span>
      <div className="flex gap-1">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1 || loading}
          className="px-2 py-1 rounded border border-outline-variant/30 hover:bg-surface-container-low disabled:opacity-50 flex items-center"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_left</span>
        </button>
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
          let pageNum;
          if (totalPages <= 5) pageNum = i + 1;
          else if (page <= 3) pageNum = i + 1;
          else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
          else pageNum = page - 2 + i;
          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`px-3 py-1 rounded border font-medium ${
                page === pageNum
                  ? "bg-primary-container text-white border-primary-container"
                  : "border-outline-variant/30 hover:bg-surface-container-low"
              }`}
            >
              {pageNum}
            </button>
          );
        })}
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages || loading}
          className="px-2 py-1 rounded border border-outline-variant/30 hover:bg-surface-container-low disabled:opacity-50 flex items-center"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_right</span>
        </button>
      </div>
    </div>
  );
}
