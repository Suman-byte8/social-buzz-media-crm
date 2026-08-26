"use client";

import React from "react";

export default function TeamPagination({ currentPage, totalPages, itemsPerPage, totalItems, onPageChange }) {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="px-4 py-3 border-t border-[#F0F0F0] flex items-center justify-between bg-white rounded-b-lg">
      <span className="text-xs text-tertiary">
        Showing {totalItems > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems} members
      </span>
      <div className="flex items-center gap-1">
        <button
          className="p-1 rounded text-tertiary hover:bg-gray-100 disabled:opacity-50"
          disabled={currentPage === 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        >
          <span className="material-symbols-outlined text-[20px]">chevron_left</span>
        </button>
        {pageNumbers.map((page) => (
          <button
            key={page}
            className={`w-8 h-8 rounded font-label-sm text-label-sm flex items-center justify-center ${
              currentPage === page ? "bg-primary text-white" : "text-tertiary hover:bg-gray-100"
            }`}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        ))}
        <button
          className="p-1 rounded text-tertiary hover:bg-gray-100 disabled:opacity-50"
          disabled={currentPage === totalPages || totalPages <= 1}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        >
          <span className="material-symbols-outlined text-[20px]">chevron_right</span>
        </button>
      </div>
    </div>
  );
}
