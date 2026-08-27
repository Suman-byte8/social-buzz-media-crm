"use client";

import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import {
  FaFacebook,
  FaInstagram,
  FaGoogle,
  FaYoutube,
  FaLinkedin,
  FaXTwitter,
  FaTiktok,
  FaPinterest,
  FaWhatsapp,
} from "react-icons/fa6";
import { SiMeta, SiGoogleads } from "react-icons/si";
import { updateClient, fetchClientById } from "@/redux/slices/clientsSlice";

export const PLATFORMS = [
  { id: "facebook", label: "Facebook", color: "#1877F2", Icon: FaFacebook },
  { id: "instagram", label: "Instagram", color: "#E4405F", Icon: FaInstagram },
  { id: "google_business", label: "Google Business Profile", color: "#4285F4", Icon: FaGoogle },
  { id: "google_ads", label: "Google Ads", color: "#EA4335", Icon: SiGoogleads },
  { id: "meta_business", label: "Meta Business Suite", color: "#0668E1", Icon: SiMeta },
  { id: "youtube", label: "YouTube", color: "#FF0000", Icon: FaYoutube },
  { id: "linkedin", label: "LinkedIn", color: "#0A66C2", Icon: FaLinkedin },
  { id: "twitter_x", label: "X (Twitter)", color: "#000000", Icon: FaXTwitter },
  { id: "tiktok", label: "TikTok", color: "#000000", Icon: FaTiktok },
  { id: "pinterest", label: "Pinterest", color: "#E60023", Icon: FaPinterest },
  { id: "whatsapp_business", label: "WhatsApp Business", color: "#25D366", Icon: FaWhatsapp },
  { id: "other", label: "Other", color: "#6B7280", Icon: null },
];

const getPlatformMeta = (id) => PLATFORMS.find((p) => p.id === id) || PLATFORMS[PLATFORMS.length - 1];

function PlatformIcon({ platformId, size = 40 }) {
  const meta = getPlatformMeta(platformId);
  const iconSize = Math.round(size * 0.5);
  return (
    <div
      className="flex items-center justify-center rounded-2xl shrink-0"
      style={{ width: size, height: size, backgroundColor: `${meta.color}1A` }}
    >
      {meta.Icon ? (
        <meta.Icon size={iconSize} style={{ color: meta.color }} />
      ) : (
        <span className="material-symbols-outlined" style={{ color: meta.color, fontSize: iconSize }}>
          apps
        </span>
      )}
    </div>
  );
}

function CredentialField({ label, value, isPassword }) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard access denied; nothing to fall back to
    }
  };

  return (
    <div>
      <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2">{label}</label>
      <div className="flex items-center gap-2 rounded-2xl border border-outline-variant bg-surface-container-lowest p-3">
        <input
          className="w-full bg-transparent border-none text-body-md text-on-surface focus:outline-none"
          readOnly
          type={isPassword && !visible ? "password" : "text"}
          value={value || "N/A"}
        />
        <div className="flex items-center gap-1 shrink-0">
          {isPassword && (
            <button
              type="button"
              onClick={() => setVisible((v) => !v)}
              className="rounded-full p-2 text-secondary hover:text-primary transition-colors"
              title={visible ? "Hide" : "Show"}
            >
              <span className="material-symbols-outlined text-[18px]">
                {visible ? "visibility_off" : "visibility"}
              </span>
            </button>
          )}
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-full p-2 text-secondary hover:text-primary transition-colors"
            title="Copy"
          >
            <span className="material-symbols-outlined text-[18px]">
              {copied ? "check" : "content_copy"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

function CredentialFormModal({ open, onClose, onSave, saving, error, entryToEdit }) {
  const [platform, setPlatform] = useState("facebook");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    if (entryToEdit) {
      setPlatform(entryToEdit.platform || "facebook");
      setUsername(entryToEdit.username || "");
      setPassword(entryToEdit.password || "");
      setNotes(entryToEdit.notes || "");
    } else {
      setPlatform("facebook");
      setUsername("");
      setPassword("");
      setNotes("");
    }
  }, [open, entryToEdit]);

  if (!open) return null;

  const inputClass = "w-full px-4 py-2 border border-outline-variant rounded-lg focus:ring-1 focus:ring-primary focus:border-primary bg-white";

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ platform, username: username.trim(), password, notes: notes.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="font-title-lg text-title-lg text-on-surface">
            {entryToEdit ? "Edit Credential" : "Add Credential"}
          </h3>
          <button onClick={onClose} className="text-secondary hover:text-primary transition-colors p-1">
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">{error}</div>}

          <div>
            <label className="block font-label-sm text-label-sm text-secondary mb-2">Platform</label>
            <div className="grid grid-cols-4 gap-2">
              {PLATFORMS.map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setPlatform(p.id)}
                  title={p.label}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-colors ${
                    platform === p.id ? "border-primary bg-primary/5" : "border-outline-variant hover:bg-gray-50"
                  }`}
                >
                  {p.Icon ? (
                    <p.Icon size={20} style={{ color: p.color }} />
                  ) : (
                    <span className="material-symbols-outlined text-[20px]" style={{ color: p.color }}>
                      apps
                    </span>
                  )}
                  <span className="font-label-sm text-[10px] text-on-surface-variant text-center leading-tight">
                    {p.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-label-sm text-label-sm text-secondary mb-1">Username / Email *</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={inputClass}
              placeholder="account@example.com"
              required
            />
          </div>

          <div>
            <label className="block font-label-sm text-label-sm text-secondary mb-1">Password *</label>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              placeholder="Enter password"
              required
            />
          </div>

          <div>
            <label className="block font-label-sm text-label-sm text-secondary mb-1">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className={inputClass}
              placeholder="Any additional access notes"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={onClose} disabled={saving} className="px-4 py-2 rounded-lg border border-outline-variant text-secondary font-label-md text-label-md hover:bg-gray-50 transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-primary text-white font-label-md text-label-md hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>}
              {entryToEdit ? "Update Credential" : "Save Credential"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Credentials({ client, clientId }) {
  const dispatch = useDispatch();
  const clientName = client?.name || "Client";
  const credentials = Array.isArray(client?.credentials) ? client.credentials : [];

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const persist = async (nextCredentials) => {
    setSaving(true);
    setError("");
    try {
      await dispatch(updateClient({ id: clientId, clientData: { credentials: nextCredentials } })).unwrap();
      dispatch(fetchClientById(clientId));
      setModalOpen(false);
      setEditingEntry(null);
    } catch (err) {
      setError((typeof err === "string" ? err : err?.message) || "Failed to save credential");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = (entryData) => {
    if (editingEntry) {
      persist(credentials.map((c) => (c.id === editingEntry.id ? { ...c, ...entryData } : c)));
    } else {
      persist([...credentials, { id: crypto.randomUUID(), ...entryData }]);
    }
  };

  const handleDelete = (id) => {
    if (!window.confirm("Delete this credential?")) return;
    persist(credentials.filter((c) => c.id !== id));
  };

  return (
    <main className="flex-1 overflow-y-auto p-container-margin">
      <div className="max-w-7xl mx-auto space-y-8">
        <section className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-surface p-6 rounded-3xl border border-outline-variant shadow-sm">
          <div>
            <h1 className="font-headline-md text-headline-md text-on-surface flex items-center gap-3">
              Client Credentials
              <span className="material-symbols-outlined text-primary text-xl">lock</span>
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-2">
              Secure access details and social media account credentials for {clientName}.
            </p>
          </div>
          <button
            onClick={() => {
              setEditingEntry(null);
              setModalOpen(true);
            }}
            className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-label-md text-label-md hover:bg-primary/90 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add Credential
          </button>
        </section>

        {error && !modalOpen && (
          <p className="text-red-600 font-body-sm text-body-sm px-1">{error}</p>
        )}

        {credentials.length === 0 ? (
          <div className="bg-surface rounded-xl border border-outline-variant p-8 text-center">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-4">lock</span>
            <h3 className="font-title-lg text-title-lg text-on-surface mb-2">No Credentials Configured</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              No social media or platform credentials have been added for {clientName} yet.
            </p>
          </div>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {credentials.map((entry) => {
              const meta = getPlatformMeta(entry.platform);
              return (
                <article key={entry.id} className="bg-white rounded-3xl border border-[#E5E5E7] p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                      <PlatformIcon platformId={entry.platform} />
                      <div>
                        <h2 className="font-title-lg text-title-lg text-on-surface">{meta.label}</h2>
                        {entry.notes && (
                          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{entry.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => {
                          setEditingEntry(entry);
                          setModalOpen(true);
                        }}
                        className="rounded-full p-2 text-secondary hover:text-primary hover:bg-surface-variant transition-colors"
                        title="Edit"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="rounded-full p-2 text-secondary hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>
                  <div className="space-y-5">
                    <CredentialField label="Username / Email" value={entry.username} />
                    <CredentialField label="Password" value={entry.password} isPassword />
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>

      <CredentialFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingEntry(null);
          setError("");
        }}
        onSave={handleSave}
        saving={saving}
        error={error}
        entryToEdit={editingEntry}
      />
    </main>
  );
}
