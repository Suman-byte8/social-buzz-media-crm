import React, { useState, useEffect } from "react";

const DatePicker = ({ value, onChange, disabled, min }) => {
  const handleDateChange = (e) => {
    onChange(e.target.value);
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Date
      </label>
      <input
        type="date"
        value={value || ""}
        onChange={handleDateChange}
        className="py-2 px-3 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        disabled={disabled}
        min={min}
      />
    </div>
  );
};

const Edit3 = ({ size = 24, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 8v7l4 2v-5l-4-2z" />
    <path d="M15 3.5a2.525 2.525 0 1 1 3.5 3.5A2.525 2.525 0 1 1 15 3.5z" />
    <path d="M17 3.5h-1" />
    <path d="M12 21h-7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h4l4 4v9" />
  </svg>
);

export default function AgreementUploadModal({
  open,
  onClose,
  onSuccess,
  clientId,
  clientName,
  agreementToEdit = null,
  documentService,
  isEdit = false,
}) {
  const [title, setTitle] = useState(isEdit ? "Edit Agreement" : "Upload Agreement");
  const [formData, setFormData] = useState({
    file: null,
    issuedDate: new Date().toISOString().split("T")[0],
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    status: "active",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const { uploadAgreement, updateAgreement } = documentService || {};

  useEffect(() => {
    if (agreementToEdit) {
      setFormData({
        file: agreementToEdit.fileId ? null : agreementToEdit.file,
        issuedDate: agreementToEdit.issuedDate || "",
        expiryDate: agreementToEdit.expiryDate || "",
        status: agreementToEdit.status || "active",
        description: agreementToEdit.description || "",
      });
      
      if (agreementToEdit.fileId) {
        setSelectedFile(agreementToEdit);
      }
    }
  }, [agreementToEdit]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type !== "application/pdf" && 
          !selectedFile.name.toLowerCase().endsWith(".pdf")) {
        setError("Only PDF files are allowed");
        return;
      }
      
      if (selectedFile.size > 2 * 1024 * 1024) { // 2MB
        setError("File size must be less than 2MB");
        return;
      }
      
      setSelectedFile(selectedFile);
      setFormData((prev) => ({ ...prev, file: selectedFile }));
      setError(null);
    } else {
      setSelectedFile(null);
      setFormData((prev) => ({ ...prev, file: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!clientId) {
      setError("Please select a client first");
      setLoading(false);
      return;
    }

    const { file, issuedDate, expiryDate, status, description } = formData;

    if (!file && !agreementToEdit?.fileId) {
      setError("Please select a PDF file");
      setLoading(false);
      return;
    }

    if (!issuedDate || !expiryDate) {
      setError("Please select both issued and expiry dates");
      setLoading(false);
      return;
    }

    try {
      if (isEdit && agreementToEdit?.id) {
        if (file) {
          const formDataToSend = new FormData();
          formDataToSend.append("file", file);
          formDataToSend.append("id", agreementToEdit.id);
          formDataToSend.append("clientId", clientId);
          formDataToSend.append("issuedDate", issuedDate);
          formDataToSend.append("expiryDate", expiryDate);
          formDataToSend.append("status", status);
          formDataToSend.append("description", description);
          const result = await uploadAgreement(formDataToSend);
          setLoading(false);
          onSuccess(result);
          onClose();
        } else {
          const updateData = {
            issuedDate,
            expiryDate,
            status,
            description,
          };
          const response = await updateAgreement(agreementToEdit.id, updateData);
          setLoading(false);
          onSuccess(response.data);
          onClose();
        }
      } else {
        const formDataToSend = new FormData();
        if (file) {
          formDataToSend.append("file", file);
        }
        formDataToSend.append("clientId", clientId);
        formDataToSend.append("issuedDate", issuedDate);
        formDataToSend.append("expiryDate", expiryDate);
        formDataToSend.append("status", status);
        formDataToSend.append("description", description);

        const result = await uploadAgreement(formDataToSend);
        setLoading(false);
        onSuccess(result);
        onClose();
      }
    } catch (err) {
      setLoading(false);
      setError(err.message || "Failed to process agreement");
    }
  };

  const handleStatusChange = (e) => {
    setFormData((prev) => ({ ...prev, status: e.target.value }));
  };

  const handleDescriptionChange = (e) => {
    setFormData((prev) => ({ ...prev, description: e.target.value }));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            title="Cancel"
          >
            <Edit3 size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Client Info */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Client
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  value={clientName || "Loading..."}
                  readOnly
                  className="w-full py-2 px-3 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>
            </div>

            {/* File Upload */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Agreement File (PDF, Max 2MB)
              </label>
              <div className="flex flex-col">
                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="flex-1 border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={loading}
                  />
                  {selectedFile && (
                    <span className="text-sm text-green-600">
                      {selectedFile.name}
                    </span>
                  )}
                </div>
                {!selectedFile && agreementToEdit?.fileId && (
                  <p className="mt-2 text-sm text-gray-500">
                    Current file: {agreementToEdit.fileName} ({Math.round(agreementToEdit.fileSize / 1024)} KB)
                  </p>
                )}
                {!selectedFile && !agreementToEdit?.fileId && (
                  <p className="mt-2 text-sm text-gray-500">
                    Select a PDF file to upload
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Dates */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Issued Date
              </label>
              <DatePicker
                value={formData.issuedDate}
                onChange={(date) => setFormData({ ...formData, issuedDate: date })}
                disabled={loading}
              />
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Expiry Date
              </label>
              <DatePicker
                value={formData.expiryDate}
                onChange={(date) => setFormData({ ...formData, expiryDate: date })}
                disabled={loading}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Status */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                value={formData.status || "active"}
                onChange={handleStatusChange}
                className="w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              >
                <option value="active">Active</option>
                <option value="pending_signature">Pending Signature</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            {/* Description */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Description (optional)
              </label>
              <textarea
                value={formData.description || ""}
                onChange={handleDescriptionChange}
                rows="4"
                className="w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                disabled={loading}
                placeholder="Add any additional notes about this agreement"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 pt-4 border-t border-gray-200 flex justify-end space-x-3">
<button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 text-sm font-medium border border-gray-300 rounded-md hover:bg-gray-50"
          >
            {loading ? "Processing..." : isEdit ? "Cancel Edit" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {loading ? "Processing..." : isEdit ? "Update Agreement" : "Upload Agreement"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}