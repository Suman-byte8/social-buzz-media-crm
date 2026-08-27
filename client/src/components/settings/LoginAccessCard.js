"use client";

import React, { useEffect, useState } from "react";
import { fetchUsers, revealUserPassword, updateUserPassword } from "@/services/authService";

const ROLE_LABEL = { admin: "Admin", team_member: "Team Member" };

function UserRow({ user, onPasswordChanged }) {
  const [revealed, setRevealed] = useState(null);
  const [revealing, setRevealing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleReveal = async () => {
    if (revealed !== null) {
      setRevealed(null);
      return;
    }
    setRevealing(true);
    setError("");
    try {
      const res = await revealUserPassword(user.id);
      setRevealed(res.password);
    } catch (err) {
      setError((typeof err === "string" ? err : err?.message) || "Failed to reveal password");
    } finally {
      setRevealing(false);
    }
  };

  const handleSave = async () => {
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await updateUserPassword(user.id, newPassword);
      setEditing(false);
      setNewPassword("");
      setRevealed(null);
      onPasswordChanged?.(user);
    } catch (err) {
      setError((typeof err === "string" ? err : err?.message) || "Failed to update password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 bg-surface-container/50 rounded-lg border border-outline-variant/40 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="font-title-sm text-title-sm text-on-surface">{user.name}</p>
          <p className="font-body-sm text-body-sm text-secondary">{user.email}</p>
        </div>
        <span className="px-2.5 py-1 rounded-full font-label-sm text-label-sm bg-primary/10 text-primary">
          {ROLE_LABEL[user.role] || user.role}
        </span>
      </div>

      {!editing ? (
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-[160px] bg-surface border border-outline-variant rounded-md px-3 py-1.5 font-body-sm text-body-sm text-on-surface">
            {revealing ? "Loading..." : revealed !== null ? revealed : "••••••••"}
          </div>
          <button
            type="button"
            onClick={handleReveal}
            disabled={revealing}
            className="px-3 py-1.5 border border-outline-variant rounded-md font-label-sm text-label-sm hover:bg-gray-50 transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">
              {revealed !== null ? "visibility_off" : "visibility"}
            </span>
            {revealed !== null ? "Hide" : "Reveal"}
          </button>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="px-3 py-1.5 border border-outline-variant rounded-md font-label-sm text-label-sm hover:bg-gray-50 transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">edit</span>
            Change
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="text"
            autoFocus
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password (min 6 characters)"
            className="flex-1 min-w-[160px] bg-surface border border-outline-variant rounded-md px-3 py-1.5 font-body-sm text-body-sm text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none"
          />
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-1.5 bg-primary text-white rounded-md font-label-sm text-label-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing(false);
              setNewPassword("");
              setError("");
            }}
            className="px-3 py-1.5 border border-outline-variant rounded-md font-label-sm text-label-sm hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
      {error && <p className="font-body-sm text-xs text-red-600">{error}</p>}
    </div>
  );
}

export default function LoginAccessCard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchUsers();
      setUsers(res.data || []);
    } catch (err) {
      setError((typeof err === "string" ? err : err?.message) || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <section className="card-bg rounded-lg p-6 md:p-8 border border-outline-variant/50 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <span className="material-symbols-outlined text-primary">admin_panel_settings</span>
        <div>
          <h3 className="font-title-lg text-title-lg text-on-surface">Login Access</h3>
          <p className="font-body-sm text-body-sm text-secondary mt-0.5">
            View or rotate the admin and team member login passwords, so you can hand the team member theirs.
          </p>
        </div>
      </div>

      {loading ? (
        <p className="font-body-sm text-body-sm text-secondary">Loading...</p>
      ) : error ? (
        <p className="font-body-sm text-body-sm text-red-600">{error}</p>
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <UserRow key={user.id} user={user} onPasswordChanged={load} />
          ))}
        </div>
      )}
    </section>
  );
}
