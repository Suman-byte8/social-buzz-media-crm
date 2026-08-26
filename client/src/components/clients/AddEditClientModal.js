"use client";

import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { createClient, updateClient } from "@/redux/slices/clientsSlice";

const INDUSTRY_OPTIONS = ["SaaS", "E-commerce", "Healthcare", "Finance", "Education", "Real Estate", "Other"];

const toArray = (value) =>
  Array.isArray(value) ? value : value ? value.split(",").map((s) => s.trim()).filter(Boolean) : [];

export default function AddEditClientModal({ isOpen, client, teamMembers = [], onClose, onSuccess }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="font-title-lg text-title-lg text-on-surface">
            {client ? "Edit Client" : "Add New Client"}
          </h3>
          <button onClick={onClose} className="text-secondary hover:text-primary transition-colors p-1">
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
        </div>
        <ClientForm client={client} teamMembers={teamMembers} onClose={onClose} onSuccess={onSuccess} />
      </div>
    </div>
  );
}

function ClientForm({ client, teamMembers, onClose, onSuccess }) {
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    name: "",
    industry: "",
    phoneNumber: "",
    whatsappNumber: "",
    address: "",
    email: "",
    servicesSelected: [],
    clientManagedBy: "",
    clientHealth: 50,
    notes: "",
    renewal: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || "",
        industry: client.industry || "",
        phoneNumber: client.phoneNumber || "",
        whatsappNumber: client.whatsappNumber || "",
        address: client.address || "",
        email: client.email || "",
        servicesSelected: toArray(client.servicesSelected),
        clientManagedBy: client.clientManagedBy || "",
        clientHealth: client.clientHealth ?? 50,
        notes: client.notes || "",
        renewal: client.renewal ? new Date(client.renewal).toISOString().split("T")[0] : "",
      });
    }
  }, [client]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Client name is required";
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    if (formData.clientHealth < 0 || formData.clientHealth > 100) {
      newErrors.clientHealth = "Health must be between 0 and 100";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = {
        ...formData,
        servicesSelected: formData.servicesSelected.filter(Boolean).join(","),
        clientManagedBy: formData.clientManagedBy ? parseInt(formData.clientManagedBy) : null,
        clientHealth: parseInt(formData.clientHealth),
        renewal: formData.renewal ? new Date(formData.renewal).toISOString() : null,
      };

      if (client) {
        await dispatch(updateClient({ id: client.id, clientData: payload })).unwrap();
      } else {
        await dispatch(createClient(payload)).unwrap();
      }
      onSuccess();
    } catch (error) {
      console.error("Error saving client:", error);
      alert(error?.message || "Failed to save client. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block font-label-sm text-label-sm text-secondary mb-1">Client Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-1 focus:ring-primary focus:border-primary ${errors.name ? "border-red-500" : "border-outline-variant"} bg-white`}
            placeholder="Enter client name"
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>
        <div>
          <label className="block font-label-sm text-label-sm text-secondary mb-1">Industry</label>
          <select
            value={formData.industry}
            onChange={(e) => handleChange("industry", e.target.value)}
            className="w-full px-4 py-2 border border-outline-variant rounded-lg focus:ring-1 focus:ring-primary focus:border-primary bg-white"
          >
            <option value="">Select Industry</option>
            {INDUSTRY_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-label-sm text-label-sm text-secondary mb-1">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-1 focus:ring-primary focus:border-primary ${errors.email ? "border-red-500" : "border-outline-variant"} bg-white`}
            placeholder="client@example.com"
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>
        <div>
          <label className="block font-label-sm text-label-sm text-secondary mb-1">Phone Number</label>
          <input
            type="text"
            value={formData.phoneNumber}
            onChange={(e) => handleChange("phoneNumber", e.target.value)}
            className="w-full px-4 py-2 border border-outline-variant rounded-lg focus:ring-1 focus:ring-primary focus:border-primary bg-white"
            placeholder="+1 (555) 000-0000"
          />
        </div>
        <div>
          <label className="block font-label-sm text-label-sm text-secondary mb-1">WhatsApp Number</label>
          <input
            type="text"
            value={formData.whatsappNumber}
            onChange={(e) => handleChange("whatsappNumber", e.target.value)}
            className="w-full px-4 py-2 border border-outline-variant rounded-lg focus:ring-1 focus:ring-primary focus:border-primary bg-white"
            placeholder="+1 (555) 000-0000"
          />
        </div>
        <div>
          <label className="block font-label-sm text-label-sm text-secondary mb-1">Client Health (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            value={formData.clientHealth}
            onChange={(e) => handleChange("clientHealth", parseInt(e.target.value) || 0)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-1 focus:ring-primary focus:border-primary ${errors.clientHealth ? "border-red-500" : "border-outline-variant"} bg-white`}
          />
          {errors.clientHealth && <p className="text-red-500 text-sm mt-1">{errors.clientHealth}</p>}
        </div>
        <div className="md:col-span-2">
          <label className="block font-label-sm text-label-sm text-secondary mb-1">Address</label>
          <textarea
            value={formData.address}
            onChange={(e) => handleChange("address", e.target.value)}
            rows={2}
            className="w-full px-4 py-2 border border-outline-variant rounded-lg focus:ring-1 focus:ring-primary focus:border-primary bg-white"
            placeholder="Client address"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block font-label-sm text-label-sm text-secondary mb-1">Services Selected (comma separated)</label>
          <textarea
            value={formData.servicesSelected.join(", ")}
            onChange={(e) => handleChange("servicesSelected", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
            rows={2}
            className="w-full px-4 py-2 border border-outline-variant rounded-lg focus:ring-1 focus:ring-primary focus:border-primary bg-white"
            placeholder="SEO, Content Marketing, PPC"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block font-label-sm text-label-sm text-secondary mb-1">Account Manager</label>
          <select
            value={formData.clientManagedBy}
            onChange={(e) => handleChange("clientManagedBy", e.target.value)}
            className="w-full px-4 py-2 border border-outline-variant rounded-lg focus:ring-1 focus:ring-primary focus:border-primary bg-white"
          >
            <option value="">Unassigned</option>
            {teamMembers.map((member) => (
              <option key={member.id} value={member.id}>{member.name}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block font-label-sm text-label-sm text-secondary mb-1">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleChange("notes", e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-outline-variant rounded-lg focus:ring-1 focus:ring-primary focus:border-primary bg-white"
            placeholder="Additional notes about the client"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block font-label-sm text-label-sm text-secondary mb-1">Renewal Date</label>
          <input
            type="date"
            value={formData.renewal}
            onChange={(e) => handleChange("renewal", e.target.value)}
            className="w-full px-4 py-2 border border-outline-variant rounded-lg focus:ring-1 focus:ring-primary focus:border-primary bg-white"
          />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 rounded-lg border border-outline-variant text-secondary font-label-md text-label-md hover:bg-gray-50 transition-colors disabled:opacity-50">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg bg-primary text-white font-label-md text-label-md hover:bg-primary-container transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2">
          {loading ? (
            <>
              <span className="material-symbols-outlined animate-spin">progress_activity</span>
              Saving...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[18px]">save</span>
              {client ? "Update Client" : "Add Client"}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
