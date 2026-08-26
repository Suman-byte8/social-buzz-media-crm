"use client";

import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { createTeamMember } from "@/redux/slices/teamSlice";

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
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    number: "",
    whatsappNumber: "",
    address: "",
    aadharNumber: "",
    avatar: "",
    resume: "",
    resumeName: "",
    bankDetails: {
      bankName: "",
      accountNumber: "",
      ifscCode: "",
      accountHolderName: "",
      upiId: "",
    },
    designation: "",
    department: "",
    employmentType: "",
    hireDate: "",
    managerReportTo: "",
    status: "",
    assignedWorks: [],
    clientHandling: [],
  });

  const [newWorkInput, setNewWorkInput] = useState("");
  const [newClientInput, setNewClientInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [avatarError, setAvatarError] = useState("");

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

  const handleBankChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      bankDetails: {
        ...prev.bankDetails,
        [field]: value,
      },
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Strict PNG check
    const isPng =
      file.type === "image/png" || file.name.toLowerCase().endsWith(".png");
    if (!isPng) {
      setAvatarError("Profile image must be in PNG format.");
      return;
    }

    // Strict 1MB check (1,048,576 bytes)
    if (file.size > 1 * 1024 * 1024) {
      setAvatarError("Profile image size must be less than 1MB.");
      return;
    }

    setAvatarError("");
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, avatar: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleResumeChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({
        ...prev,
        resume: reader.result,
        resumeName: file.name,
      }));
    };
    reader.readAsDataURL(file);
  };

  // Add individual Work item
  const handleAddWorkItem = () => {
    const trimmed = newWorkInput.trim();
    if (!trimmed) return;
    if (!formData.assignedWorks.includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        assignedWorks: [...prev.assignedWorks, trimmed],
      }));
    }
    setNewWorkInput("");
  };

  // Remove individual Work item
  const handleRemoveWorkItem = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      assignedWorks: prev.assignedWorks.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  // Add individual Client item
  const handleAddClientItem = () => {
    const trimmed = newClientInput.trim();
    if (!trimmed) return;
    if (!formData.clientHandling.includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        clientHandling: [...prev.clientHandling, trimmed],
      }));
    }
    setNewClientInput("");
  };

  // Remove individual Client item
  const handleRemoveClientItem = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      clientHandling: prev.clientHandling.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Team member name is required";
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    if (
      formData.aadharNumber &&
      !/^\d{12}$/.test(formData.aadharNumber.replace(/\s/g, ""))
    ) {
      newErrors.aadharNumber = "Aadhar number must be 12 digits";
    }
    if (avatarError) {
      newErrors.avatar = avatarError;
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
        aadharNumber: formData.aadharNumber
          ? formData.aadharNumber.replace(/\s/g, "")
          : null,
        avatar: formData.avatar || null,
        resume: formData.resume || null,
        bankDetails:
          Object.values(formData.bankDetails).some(Boolean)
            ? JSON.stringify(formData.bankDetails)
            : null,
        designation: formData.designation || null,
        department: formData.department || null,
        employmentType: formData.employmentType || null,
        hireDate: formData.hireDate || null,
        managerReportTo: formData.managerReportTo || null,
        status: formData.status === "null" ? null : formData.status || null,
        assignedWorks:
          formData.assignedWorks.length > 0
            ? JSON.stringify(formData.assignedWorks)
            : null,
        clientHandling:
          formData.clientHandling.length > 0
            ? JSON.stringify(formData.clientHandling)
            : null,
      };

      await dispatch(createTeamMember(payload)).unwrap();
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
          {/* Profile Image & Personal Info */}
          <div>
            <h4 className="font-title-md text-title-md text-on-surface-variant mb-3">
              Profile Image &amp; Personal Info
            </h4>
            <div className="flex flex-col sm:flex-row items-start gap-6 mb-4">
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50 relative group">
                  {formData.avatar ? (
                    <img
                      src={formData.avatar}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="material-symbols-outlined text-4xl text-gray-400">
                      account_circle
                    </span>
                  )}
                </div>
                <label className="mt-2 px-3 py-1 bg-surface-container-high text-xs font-medium text-on-surface rounded border border-gray-300 cursor-pointer hover:bg-gray-100 transition-colors">
                  Upload PNG
                  <input
                    type="file"
                    accept="image/png"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
                <span className="text-[10px] text-gray-500 mt-1">
                  PNG format only, &lt; 1MB
                </span>
                {avatarError && (
                  <p className="text-red-500 text-xs mt-1 text-center font-medium">
                    {avatarError}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 w-full">
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
                    placeholder="+91 9876543210"
                  />
                </div>
                <div>
                  <label className="block font-label-sm text-label-sm text-secondary mb-1">
                    WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    value={formData.whatsappNumber}
                    onChange={(e) =>
                      handleChange("whatsappNumber", e.target.value)
                    }
                    className="w-full px-4 py-2 border border-[#E5E5E7] rounded-lg focus:ring-1 focus:ring-primary focus:border-primary bg-white"
                    placeholder="+91 9876543210"
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
            </div>
          </div>

          {/* Identification & Documents (Aadhar & Resume) */}
          <h4 className="font-title-md text-title-md text-on-surface-variant mb-3">
            Identification &amp; Documents
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-label-sm text-label-sm text-secondary mb-1">
                Aadhar Number
              </label>
              <input
                type="text"
                maxLength={14}
                value={formData.aadharNumber}
                onChange={(e) => handleChange("aadharNumber", e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-1 focus:ring-primary focus:border-primary ${
                  errors.aadharNumber ? "border-red-500" : "border-[#E5E5E7]"
                } bg-white`}
                placeholder="1234 5678 9012"
              />
              {errors.aadharNumber && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.aadharNumber}
                </p>
              )}
            </div>

            <div>
              <label className="block font-label-sm text-label-sm text-secondary mb-1">
                Employee Resume
              </label>
              <div className="flex items-center gap-2">
                <label className="px-4 py-2 bg-surface border border-outline-variant rounded-lg text-on-surface font-label-md text-label-md hover:bg-surface-container-low cursor-pointer transition-colors flex items-center gap-2 shrink-0">
                  <span className="material-symbols-outlined text-[18px]">
                    upload_file
                  </span>
                  Choose File
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,image/*"
                    onChange={handleResumeChange}
                    className="hidden"
                  />
                </label>
                <span className="text-xs text-secondary truncate">
                  {formData.resumeName ||
                    (formData.resume ? "Resume Attached" : "No file chosen")}
                </span>
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <h4 className="font-title-md text-title-md text-on-surface-variant mb-3">
            Bank Details
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div>
              <label className="block font-label-sm text-label-sm text-secondary mb-1">
                Account Holder Name
              </label>
              <input
                type="text"
                value={formData.bankDetails.accountHolderName}
                onChange={(e) =>
                  handleBankChange("accountHolderName", e.target.value)
                }
                className="w-full px-4 py-2 border border-[#E5E5E7] rounded-lg focus:ring-1 focus:ring-primary focus:border-primary bg-white"
                placeholder="Name as per bank record"
              />
            </div>
            <div>
              <label className="block font-label-sm text-label-sm text-secondary mb-1">
                Bank Name
              </label>
              <input
                type="text"
                value={formData.bankDetails.bankName}
                onChange={(e) => handleBankChange("bankName", e.target.value)}
                className="w-full px-4 py-2 border border-[#E5E5E7] rounded-lg focus:ring-1 focus:ring-primary focus:border-primary bg-white"
                placeholder="e.g. HDFC Bank, SBI"
              />
            </div>
            <div>
              <label className="block font-label-sm text-label-sm text-secondary mb-1">
                Account Number
              </label>
              <input
                type="text"
                value={formData.bankDetails.accountNumber}
                onChange={(e) =>
                  handleBankChange("accountNumber", e.target.value)
                }
                className="w-full px-4 py-2 border border-[#E5E5E7] rounded-lg focus:ring-1 focus:ring-primary focus:border-primary bg-white"
                placeholder="Bank account number"
              />
            </div>
            <div>
              <label className="block font-label-sm text-label-sm text-secondary mb-1">
                IFSC Code
              </label>
              <input
                type="text"
                value={formData.bankDetails.ifscCode}
                onChange={(e) =>
                  handleBankChange("ifscCode", e.target.value.toUpperCase())
                }
                className="w-full px-4 py-2 border border-[#E5E5E7] rounded-lg focus:ring-1 focus:ring-primary focus:border-primary bg-white uppercase"
                placeholder="e.g. HDFC0001234"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block font-label-sm text-label-sm text-secondary mb-1">
                UPI ID (Optional)
              </label>
              <input
                type="text"
                value={formData.bankDetails.upiId}
                onChange={(e) => handleBankChange("upiId", e.target.value)}
                className="w-full px-4 py-2 border border-[#E5E5E7] rounded-lg focus:ring-1 focus:ring-primary focus:border-primary bg-white"
                placeholder="name@upi"
              />
            </div>
          </div>

          {/* Job & Position Details */}
          <h4 className="font-title-md text-title-md text-on-surface-variant mb-3">
            Job &amp; Position Details
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
            Work &amp; Status Details
          </h4>
          <div className="grid grid-cols-1 gap-4">
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

            {/* Individual Assigned Works */}
            <div>
              <label className="block font-label-sm text-label-sm text-secondary mb-1">
                Assigned Works
              </label>
              <div className="flex flex-wrap gap-2 mb-2 p-2 bg-gray-50 rounded-lg border border-gray-200 min-h-[42px]">
                {formData.assignedWorks.length > 0 ? (
                  formData.assignedWorks.map((work, idx) => (
                    <span
                      key={`work-item-${idx}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 rounded-lg text-xs border border-emerald-200 font-medium"
                    >
                      <span>{work}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveWorkItem(idx)}
                        className="hover:bg-emerald-200 p-0.5 rounded-full text-emerald-700 transition-colors"
                        title="Remove work"
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          close
                        </span>
                      </button>
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-400 italic py-1">
                    No works added yet
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newWorkInput}
                  onChange={(e) => setNewWorkInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddWorkItem();
                    }
                  }}
                  className="flex-1 px-4 py-2 border border-[#E5E5E7] rounded-lg focus:ring-1 focus:ring-primary focus:border-primary bg-white text-sm"
                  placeholder="Type a work item name and press Add"
                />
                <button
                  type="button"
                  onClick={handleAddWorkItem}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-label-md text-label-md hover:bg-emerald-700 transition-colors shrink-0"
                >
                  Add Work
                </button>
              </div>
            </div>

            {/* Individual Clients Handling */}
            <div>
              <label className="block font-label-sm text-label-sm text-secondary mb-1">
                Clients Handling
              </label>
              <div className="flex flex-wrap gap-2 mb-2 p-2 bg-gray-50 rounded-lg border border-gray-200 min-h-[42px]">
                {formData.clientHandling.length > 0 ? (
                  formData.clientHandling.map((client, idx) => (
                    <span
                      key={`client-item-${idx}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-800 rounded-lg text-xs border border-blue-200 font-medium"
                    >
                      <span>{client}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveClientItem(idx)}
                        className="hover:bg-blue-200 p-0.5 rounded-full text-blue-700 transition-colors"
                        title="Remove client"
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          close
                        </span>
                      </button>
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-400 italic py-1">
                    No clients added yet
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newClientInput}
                  onChange={(e) => setNewClientInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddClientItem();
                    }
                  }}
                  className="flex-1 px-4 py-2 border border-[#E5E5E7] rounded-lg focus:ring-1 focus:ring-primary focus:border-primary bg-white text-sm"
                  placeholder="Type client name and press Add"
                />
                <button
                  type="button"
                  onClick={handleAddClientItem}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-label-md text-label-md hover:bg-blue-700 transition-colors shrink-0"
                >
                  Add Client
                </button>
              </div>
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
