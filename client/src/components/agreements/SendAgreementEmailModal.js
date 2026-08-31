"use client";

import React from "react";

/**
 * Controlled confirm → sending → result dialog for emailing an agreement.
 * Replaces window.confirm()/alert() with an in-app modal so the loading
 * state (and the outcome) is visible in the UI, not a native browser popup.
 */
export default function SendAgreementEmailModal({ open, agreement, client, status, resultMessage, onConfirm, onClose }) {
  if (!open || !agreement || !client) return null;

  const isSending = status === "sending";

  return (
    <div
      className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center p-4 z-70"
      onClick={isSending ? undefined : onClose}
    >
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        {status === "confirm" && (
          <>
            <h3 className="text-lg font-semibold text-on-surface mb-2">Send agreement by email?</h3>
            <p className="text-sm text-secondary mb-6">
              Send <span className="font-medium text-on-surface">&ldquo;{agreement.fileName}&rdquo;</span> to{" "}
              <span className="font-medium text-on-surface">{client.email}</span>?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm font-medium text-secondary hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:opacity-90 transition-opacity"
              >
                Send
              </button>
            </div>
          </>
        )}

        {status === "sending" && (
          <div className="flex flex-col items-center py-4 text-center">
            <span className="material-symbols-outlined text-[36px] text-primary animate-spin mb-3">progress_activity</span>
            <p className="text-sm text-secondary">Sending to {client.email}…</p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center py-2 text-center">
            <span className="material-symbols-outlined text-[36px] text-green-600 mb-3">check_circle</span>
            <p className="text-sm text-on-surface mb-6">{resultMessage}</p>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:opacity-90 transition-opacity"
            >
              Done
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center py-2 text-center">
            <span className="material-symbols-outlined text-[36px] text-red-600 mb-3">error</span>
            <p className="text-sm text-on-surface mb-6">{resultMessage}</p>
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm font-medium text-secondary hover:bg-gray-100 transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:opacity-90 transition-opacity"
              >
                Retry
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
