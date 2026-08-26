"use client";

import React from "react";

export default function ClientsPagination({ page, limit, totalItems, totalPages, loading, onPageChange }) {
  if (totalItems === 0) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, totalItems);

  return (
    <div className="bg-white px-4 py-3 border-t border-[#F0F0F0] flex items-center justify-between sm:px-6">
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-secondary">
            Showing <span className="font-medium text-on-surface">{from}</span> to{" "}
            <span className="font-medium text-on-surface">{to}</span> of{" "}
            <span className="font-medium text-on-surface">{totalItems}</span> results
          </p>
        </div>
        <div>
          <nav aria-label="Pagination" className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
            <button
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page === 1 || loading}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-outline-variant bg-white text-sm font-medium text-secondary hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="sr-only">Previous</span>
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
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
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                    page === pageNum
                      ? "z-10 bg-primary-container text-white border-primary-container"
                      : "bg-white border-outline-variant text-secondary hover:bg-gray-50"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page === totalPages || loading}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-outline-variant bg-white text-sm font-medium text-secondary hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="sr-only">Next</span>
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}
