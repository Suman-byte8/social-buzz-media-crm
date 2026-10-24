"use client";

import React, { useEffect, useState } from "react";
import { fetchReminderDraftText, createReminder } from "@/services/paymentService";
import { buildWhatsAppUrl } from "@/lib/documentShare";

export default function PaymentReminderComposer({ invoiceId, clientId, onClose, onSent }) {
  const [draft, setDraft] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetchReminderDraftText(invoiceId);
        setDraft(res.data);
        setMessage(res.data.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [invoiceId]);

  const logSend = async (sentVia) => {
    try {
      await createReminder({ invoiceId, clientId, note: note.trim() || undefined, sentVia });
      onSent?.();
    } catch {
      // Logging failure shouldn't block the user from having already sent it.
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard permission denied — nothing else to do.
    }
  };

  const handleWhatsApp = () => {
    if (!draft?.clientPhone) return;
    window.open(buildWhatsAppUrl(draft.clientPhone, message), "_blank");
    logSend("whatsapp");
  };

  const handleEmail = () => {
    if (!draft?.clientEmail) return;
    window.location.href = `mailto:${draft.clientEmail}?subject=${encodeURIComponent(`Payment reminder: Invoice ${draft.invoiceNumber}`)}&body=${encodeURIComponent(message)}`;
    logSend("email");
  };

  const handleAddNote = async () => {
    if (!note.trim()) return;
    await createReminder({ invoiceId, clientId, note: note.trim() });
    onSent?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-headline-sm text-headline-sm text-on-surface">Payment Reminder</h2>

        {loading ? (
          <p className="mt-4 text-body-sm text-on-surface-variant">Loading…</p>
        ) : (
          <>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} className="mt-4 w-full resize-none rounded-md border border-outline-variant px-3 py-2 text-body-sm" />

            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={handleCopy} className="flex items-center gap-1.5 rounded-md border border-outline-variant px-3 py-1.5 text-body-sm hover:bg-surface-variant">
                <span className="material-symbols-outlined text-[16px]">{copied ? "check" : "content_copy"}</span>
                {copied ? "Copied" : "Copy text"}
              </button>
              <button type="button" onClick={handleWhatsApp} disabled={!draft?.clientPhone} className="flex items-center gap-1.5 rounded-md border border-outline-variant px-3 py-1.5 text-body-sm hover:bg-surface-variant disabled:opacity-50">
                <span className="material-symbols-outlined text-[16px]">share</span>
                WhatsApp
              </button>
              <button type="button" onClick={handleEmail} disabled={!draft?.clientEmail} className="flex items-center gap-1.5 rounded-md border border-outline-variant px-3 py-1.5 text-body-sm hover:bg-surface-variant disabled:opacity-50">
                <span className="material-symbols-outlined text-[16px]">mail</span>
                Email
              </button>
            </div>

            <div className="mt-4 border-t border-outline-variant pt-3">
              <label className="mb-1 block font-label-sm text-label-sm text-on-surface-variant">Or just log a follow-up note (no send)</label>
              <div className="flex gap-2">
                <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Called, client will pay Friday" className="flex-1 rounded-md border border-outline-variant px-3 py-2 text-body-sm" />
                <button type="button" onClick={handleAddNote} className="rounded-md bg-primary px-3 py-2 text-body-sm font-semibold text-white hover:bg-primary/90">
                  Save Note
                </button>
              </div>
            </div>
          </>
        )}

        <div className="mt-6 flex justify-end">
          <button type="button" onClick={onClose} className="rounded-md border border-outline-variant px-4 py-2 text-body-sm hover:bg-surface-variant">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
