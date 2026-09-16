"use client";

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchServices, createService, updateService, deleteService, clearMessages } from "@/redux/slices/servicesSlice";

function ServiceRow({ service, onDelete }) {
  const dispatch = useDispatch();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(service.name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await dispatch(updateService({ id: service.id, serviceData: { name: name.trim() } })).unwrap();
      setEditing(false);
    } catch (err) {
      setError((typeof err === "string" ? err : err?.message) || "Failed to update service");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-3 bg-surface-container/50 rounded-lg border border-outline-variant/40">
      {editing ? (
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="text"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
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
              setName(service.name);
              setError("");
            }}
            disabled={saving}
            className="px-3 py-1.5 border border-outline-variant rounded-md font-label-sm text-label-sm hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <span className="font-body-md text-body-md text-on-surface">{service.name}</span>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setEditing(true)}
              title="Edit"
              className="p-1.5 text-secondary hover:text-primary hover:bg-primary/10 rounded transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
            </button>
            <button
              type="button"
              onClick={() => onDelete(service)}
              title="Delete"
              className="p-1.5 text-secondary hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
            </button>
          </div>
        </div>
      )}
      {error && <p className="font-body-sm text-xs text-red-600 mt-1.5">{error}</p>}
    </div>
  );
}

// Lets an admin manage the master service list clients get assigned from
// (AddEditClientModal.js's "Services Provided" picker) instead of it being
// a hardcoded array in the client codebase — same card-based layout as
// LoginAccessCard.js on this Settings page.
export default function ServicesCard() {
  const dispatch = useDispatch();
  const { services, loading, error, successMessage } = useSelector((state) => state.services);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");

  useEffect(() => {
    dispatch(fetchServices());
  }, [dispatch]);

  useEffect(() => {
    if (successMessage || error) {
      const timer = setTimeout(() => dispatch(clearMessages()), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, error, dispatch]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) {
      setAddError("Service name is required");
      return;
    }
    setAdding(true);
    setAddError("");
    try {
      await dispatch(createService({ name: newName.trim() })).unwrap();
      setNewName("");
    } catch (err) {
      setAddError((typeof err === "string" ? err : err?.message) || "Failed to add service");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = (service) => {
    if (!window.confirm(`Delete "${service.name}"? Clients that already have it selected will keep showing it.`)) return;
    dispatch(deleteService(service.id));
  };

  return (
    <section className="card-bg rounded-lg p-6 md:p-8 border border-outline-variant/50 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <span className="material-symbols-outlined text-primary">design_services</span>
        <div>
          <h3 className="font-title-lg text-title-lg text-on-surface">Services</h3>
          <p className="font-body-sm text-body-sm text-secondary mt-0.5">
            Manage the services clients can be assigned — shows up in the client form's &quot;Services Provided&quot; field.
          </p>
        </div>
      </div>

      {(successMessage || error) && (
        <div
          className={`mb-4 p-3 rounded-lg font-body-sm text-body-sm ${
            successMessage ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {successMessage || error}
        </div>
      )}

      <form onSubmit={handleAdd} className="flex items-center gap-3 mb-4">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New service name..."
          className="flex-1 bg-surface border border-outline-variant rounded-md px-3 py-2 font-body-sm text-body-sm text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none"
        />
        <button
          type="submit"
          disabled={adding}
          className="px-4 py-2 bg-primary text-white rounded-md font-label-sm text-label-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1.5 shrink-0"
        >
          <span className="material-symbols-outlined text-base">add</span>
          {adding ? "Adding..." : "Add Service"}
        </button>
      </form>
      {addError && <p className="font-body-sm text-xs text-red-600 mb-3">{addError}</p>}

      {loading ? (
        <p className="font-body-sm text-body-sm text-secondary">Loading...</p>
      ) : services.length === 0 ? (
        <p className="font-body-sm text-body-sm text-secondary">No services yet — add one above.</p>
      ) : (
        <div className="space-y-2">
          {services.map((service) => (
            <ServiceRow key={service.id} service={service} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </section>
  );
}
