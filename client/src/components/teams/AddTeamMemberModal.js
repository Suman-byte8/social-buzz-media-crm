"use client";

import React, { useState, useEffect } from "react";
import { createTeamMember } from "@/services/teamService";

const DEPARTMENTS = [
  "Social Media",
  "Tech & Dev",
  "Creative & Design",
  "Strategy",
  "Operations",
];

const EMPLOYMENT_TYPES = ["full-time", "internship", "freelance"];
const STATUSES = ["active", "inactive", "null"];

export default function AddTeamMemberModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    number: "",
    whatsappNumber: "",
    address: "",
    designation: "",
    department: "",
    employmentType: "",
    hireDate: "",
    managerReportTo: "",
    status: "",
    assignedWorks: [],
    clientHandling: [],
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Team member name is required";
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
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
        name: formData.name,
        email: formData.email || null,
        number: formData.number || null,
        whatsappNumber: formData.whatsappNumber || null,
        address: formData.address || null,
        designation: formData.designation || null,
        department: formData.department || null,
        employmentType: formData.employmentType || null,
        hireDate: formData.hireDate || null,
        managerReportTo: formData.managerReportTo || null,
        status: formData.status === "null" ? null : formData.status || null,
        assignedWorks: formData.assignedWorks.length > 0 ? JSON.stringify(formData.assignedWorks) : null,
        clientHandling: formData.clientHandling.length > 0 ? JSON.stringify(formData.clientHandling) : null,
      };

      await createTeamMember(payload);
      onSuccess();
    } catch (error) {
      console.error("Error adding team member:", error);
      alert("Failed to add team member. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="font-title-lg text-title-lg text-on-surface">
            Add New Team Member
          </h3>
          <button
            onClick={onClose}
            className="text-secondary hover:text-primary transition-colors p-1"
          >
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <h4 className="font-title-md text-title-md text-on-surface-variant mb-3">
            Personal &amp; Contact Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-label-sm text-label-sm text-secondary mb-1">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-1 focus:ring-primary focus:border-primary ${
                  errors.name ? "border-red-500" : "border-[#E5E5E7]"
                } bg-white`}
                placeholder="Enter full name"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>
            <div>
              <label className="block font-label-sm text-label-sm text-secondary mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-1 focus:ring-primary focus:border-primary ${
                  errors.email ? "border-red-500" : "border-[#E5E5E7]"
                } bg-white`}
                placeholder="name@example.com"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>
            <div>
              <label className="block font-label-sm text-label-sm text-secondary mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.number}
                onChange={(e) => handleChange("number", e.target.value)}
                className="w-full px-4 py-2 border border-[#E5E5E7] rounded-lg focus:ring-1 focus:ring-primary focus:border-primary bg-white"
                placeholder="+1 (555) 000-0000"
              />
            </div>
            <div>
              <label className="block font-label-sm text-label-sm text-secondary mb-1">
                WhatsApp Number
              </label>
              <input
                type="tel"
                value={formData.whatsappNumber}
                onChange={(e) => handleChange("whatsappNumber", e.target.value)}
                className="w-full px-4 py-2 border border-[#E5E5E7] rounded-lg focus:ring-1 focus:ring-primary focus:border-primary bg-white"
                placeholder="+1 (555) 000-0000"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block font-label-sm text-label-sm text-secondary mb-1">
                Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                className="w-full px-4 py-2 border border-[#E5E5E7] rounded-lg focus:ring-1 focus:ring-primary focus:border-primary bg-white"
                placeholder="123 Main St, City, Country"
              />
            </div>
          </div>

          <h4 className="font-title-md text-title-md text-on-surface-variant mb-3">
            Job & Position Details
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-label-sm text-label-sm text-secondary mb-1">
                Job Title / Designation
              </label>
              <input
                type="text"
                value={formData.designation}
                onChange={(e) => handleChange("designation", e.target.value)}
                className="w-full px-4 py-2 border border-[#E5E5E7] rounded-lg focus:ring-1 focus:ring-primary focus:border-primary bg-white"
                placeholder="e.g. Senior Social Media Manager"
              />
            </div>
            <div>
              <label className="block font-label-sm text-label-sm text-secondary mb-1">
                Department
              </label>
              <select
                value={formData.department}
                onChange={(e) => handleChange("department", e.target.value)}
                className="w-full px-4 py-2 border border-[#E5E5E7] rounded-lg focus:ring-1 focus:ring-primary focus:border-primary bg-white"
              >
                <option value="">Select Department</option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-label-sm text-label-sm text-secondary mb-1">
                Employment Type
              </label>
              <select
                value={formData.employmentType}
                onChange={(e) =>
                  handleChange("employmentType", e.target.value)
                }
                className="w-full px-4 py-2 border border-[#E5E5E7] rounded-lg focus:ring-1 focus:ring-primary focus:border-primary bg-white"
              >
                <option value="">Select Type</option>
                {EMPLOYMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-label-sm text-label-sm text-secondary mb-1">
                Hire Date
              </label>
              <input
                type="date"
                value={formData.hireDate}
                onChange={(e) => handleChange("hireDate", e.target.value)}
                className="w-full px-4 py-2 border border-[#E5E5E7] rounded-lg focus:ring-1 focus:ring-primary focus:border-primary bg-white"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block font-label-sm text-label-sm text-secondary mb-1">
                Manager / Reports To
              </label>
              <input
                type="text"
                value={formData.managerReportTo}
                onChange={(e) =>
                  handleChange("managerReportTo", e.target.value)
                }
                className="w-full px-4 py-2 border border-[#E5E5E7] rounded-lg focus:ring-1 focus:ring-primary focus:border-primary bg-white"
                placeholder="e.g. Sarah Jenkins"
              />
            </div>
          </div>

          <h4 className="font-title-md text-title-md text-on-surface-variant mb-3">
            Work & Status Details
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-label-sm text-label-sm text-secondary mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleChange("status", e.target.value)}
                className="w-full px-4 py-2 border border-[#E5E5E7] rounded-lg focus:ring-1 focus:ring-primary focus:border-primary bg-white"
              >
                <option value="">Select Status</option>
                <option value="null">No Status</option>
                {STATUSES.map((status) =>
                  status !== "null" ? (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ) : null
                )}
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-[#E5E5E7] flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#E5E5E7] rounded-lg text-secondary font-label-md text-label-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-[#e8262a] text-white rounded-lg font-label-md text-label-md hover:bg-[#c00016] transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {loading ? (
                <span className="material-symbols-outlined text-[18px] animate-spin">
                  progress_activity
                </span>
              ) : null}
              {loading ? "Adding..." : "Add Team Member"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
