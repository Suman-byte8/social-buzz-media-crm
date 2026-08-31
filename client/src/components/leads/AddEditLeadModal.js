"use client";

import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { updateLead } from "@/redux/slices/leadsSlice";

const SOURCE_OPTIONS = ["LinkedIn", "Website Organic", "Referral", "Cold Outreach", "Other"];
const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "hot", label: "Hot Prospect" },
  { value: "lost", label: "Lost" },
];

const toDateTimeLocal = (value) => {
  if (!value) return "";
  const d = new Date(value);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// Editing an existing lead only — adding a new one now happens inline in
// the table via LeadRowEditor.js, spreadsheet-style, instead of a modal.
export default function EditLeadModal({ isOpen, lead, onClose, onSuccess }) {
  if (!isOpen || !lead) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="font-title-lg text-title-lg text-on-surface">Edit Lead</h3>
          <button onClick={onClose} className="text-secondary hover:text-primary transition-colors p-1">
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
        </div>
        <LeadForm lead={lead} onClose={onClose} onSuccess={onSuccess} />
      </div>
    </div>
  );
}

function LeadForm({ lead, onClose, onSuccess }) {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    source: "",
    status: "new",
    notes: "",
    nextFollowUpAt: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (lead) {
      setFormData({
        companyName: lead.companyName || "",
        contactName: lead.contactName || "",
        email: lead.email || "",
        phone: lead.phone || "",
        source: lead.source || "",
        status: lead.status || "new",
        notes: lead.notes || "",
        nextFollowUpAt: toDateTimeLocal(lead.nextFollowUpAt),
      });
    } else {
      setFormData({ companyName: "", contactName: "", email: "", phone: "", source: "", status: "new", notes: "", nextFollowUpAt: "" });
    }
    setErrors({});
  }, [lead]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.companyName.trim()) newErrors.companyName = "Company name is required";
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        ...formData,
        nextFollowUpAt: formData.nextFollowUpAt ? new Date(formData.nextFollowUpAt).toISOString() : null,
      };

      await dispatch(updateLead({ id: lead.id, leadData: payload })).unwrap();
      onSuccess();
    } catch (error) {
      alert((typeof error === "string" ? error : error?.message) || "Failed to save lead. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <div>
        <label className="block font-label-sm text-label-sm text-secondary mb-1">Company Name *</label>
        <input
          type="text"
          value={formData.companyName}
          onChange={(e) => handleChange("companyName", e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-1 focus:ring-primary focus:border-primary bg-white ${errors.companyName ? "border-red-500" : "border-outline-variant"}`}
          placeholder="Acme Inc."
        />
        {errors.companyName && <p className="text-red-500 text-sm mt-1">{errors.companyName}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block font-label-sm text-label-sm text-secondary mb-1">Contact Name</label>
          <input
            type="text"
            value={formData.contactName}
            onChange={(e) => handleChange("contactName", e.target.value)}
            className="w-full px-4 py-2 border border-outline-variant rounded-lg focus:ring-1 focus:ring-primary focus:border-primary bg-white"
            placeholder="Jane Doe"
          />
        </div>
        <div>
          <label className="block font-label-sm text-label-sm text-secondary mb-1">Source</label>
          <input
            list="lead-source-options"
            type="text"
            value={formData.source}
            onChange={(e) => handleChange("source", e.target.value)}
            className="w-full px-4 py-2 border border-outline-variant rounded-lg focus:ring-1 focus:ring-primary focus:border-primary bg-white"
            placeholder="LinkedIn"
          />
          <datalist id="lead-source-options">
            {SOURCE_OPTIONS.map((opt) => (
              <option key={opt} value={opt} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="block font-label-sm text-label-sm text-secondary mb-1">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-1 focus:ring-primary focus:border-primary bg-white ${errors.email ? "border-red-500" : "border-outline-variant"}`}
            placeholder="jane@acme.com"
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>
        <div>
          <label className="block font-label-sm text-label-sm text-secondary mb-1">Phone</label>
          <input
            type="text"
            value={formData.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            className="w-full px-4 py-2 border border-outline-variant rounded-lg focus:ring-1 focus:ring-primary focus:border-primary bg-white"
            placeholder="+1 (555) 000-0000"
          />
        </div>
        <div>
          <label className="block font-label-sm text-label-sm text-secondary mb-1">Status</label>
          <select
            value={formData.status}
            onChange={(e) => handleChange("status", e.target.value)}
            className="w-full px-4 py-2 border border-outline-variant rounded-lg focus:ring-1 focus:ring-primary focus:border-primary bg-white"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-label-sm text-label-sm text-secondary mb-1">Next Follow-up</label>
          <input
            type="datetime-local"
            value={formData.nextFollowUpAt}
            onChange={(e) => handleChange("nextFollowUpAt", e.target.value)}
            className="w-full px-4 py-2 border border-outline-variant rounded-lg focus:ring-1 focus:ring-primary focus:border-primary bg-white"
          />
        </div>
      </div>

      <div>
        <label className="block font-label-sm text-label-sm text-secondary mb-1">Notes</label>
        <textarea
          value={formData.notes}
          onChange={(e) => handleChange("notes", e.target.value)}
          rows={3}
          className="w-full px-4 py-2 border border-outline-variant rounded-lg focus:ring-1 focus:ring-primary focus:border-primary bg-white"
          placeholder="Additional context about this lead"
        />
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
              Update Lead
            </>
          )}
        </button>
      </div>
    </form>
  );
}
