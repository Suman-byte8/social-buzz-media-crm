"use client";

import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { saveClientSheetUrl, fetchLiveCalendar, importCalendarFile } from "@/redux/slices/contentCalendarSlice";

export default function SheetSyncModal({
  isOpen,
  onClose,
  clients = [],
  selectedClientId,
  currentSheetUrl = "",
  onSuccess,
}) {
  const dispatch = useDispatch();
  const { importingFile } = useSelector((state) => state.contentCalendar);

  const [activeTab, setActiveTab] = useState("google"); // "google" | "file"
  const [clientId, setClientId] = useState(selectedClientId || "");
  const [sheetUrl, setSheetUrl] = useState(currentSheetUrl || "");
  const [selectedFile, setSelectedFile] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  useEffect(() => {
    if (selectedClientId) {
      setClientId(selectedClientId);
    }
    if (currentSheetUrl) {
      setSheetUrl(currentSheetUrl);
    }
  }, [selectedClientId, currentSheetUrl]);

  if (!isOpen) return null;

  const handleSaveGoogleSheet = async (e) => {
    e.preventDefault();
    if (!clientId) {
      setErrorMsg("Please select a client.");
      return;
    }
    if (!sheetUrl.trim()) {
      setErrorMsg("Please paste a valid Google Sheet URL.");
      return;
    }

    setErrorMsg("");
    setSyncResult(null);
    setSaving(true);

    try {
      // 1. Save URL in client record
      await dispatch(
        saveClientSheetUrl({ clientId, sheetUrl: sheetUrl.trim() })
      ).unwrap();

      // 2. Immediately fetch live 4-month data
      const liveRes = await dispatch(
        fetchLiveCalendar({ clientId, sheetUrl: sheetUrl.trim() })
      ).unwrap();

      setSyncResult({
        message: "Google Sheet successfully connected! Displaying the 4 most recent months live.",
        tabs: liveRes.tabs || [],
        totalEntries: liveRes.totalEntries || 0,
      });

      if (onSuccess) onSuccess();
    } catch (err) {
      setErrorMsg(err || "Failed to connect Google Sheet. Please check the URL and sharing permissions.");
    } finally {
      setSaving(false);
    }
  };

  const handleImportFile = async (e) => {
    e.preventDefault();
    if (!clientId) {
      setErrorMsg("Please select a client.");
      return;
    }
    if (!selectedFile) {
      setErrorMsg("Please select an Excel (.xlsx) or CSV file.");
      return;
    }

    setErrorMsg("");
    setSyncResult(null);

    try {
      const res = await dispatch(
        importCalendarFile({ clientId, file: selectedFile, clearExisting: true })
      ).unwrap();
      setSyncResult({
        message: res.message || "File successfully imported!",
        tabs: res.data?.tabs || [],
        totalEntries: res.data?.totalEntries || 0,
      });
      if (onSuccess) onSuccess();
    } catch (err) {
      setErrorMsg(err || "Failed to import workbook file.");
    }
  };

  const isSubmitting = saving || importingFile;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">table_chart</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">Connect Google Sheet</h3>
              <p className="text-xs text-gray-500">Live on-demand sync (last 4 months, 0 database stress)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 rounded-lg p-1 hover:bg-gray-100 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="px-5 pt-4">
          <div className="flex rounded-lg bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => {
                setActiveTab("google");
                setErrorMsg("");
                setSyncResult(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "google" ? "bg-white text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <span className="material-symbols-outlined text-[16px] text-emerald-600">link</span>
              Google Sheet Link (Real-Time)
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("file");
                setErrorMsg("");
                setSyncResult(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "file" ? "bg-white text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <span className="material-symbols-outlined text-[16px] text-blue-600">upload_file</span>
              Upload File (.xlsx)
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-start gap-2">
              <span className="material-symbols-outlined text-[16px] mt-0.5 shrink-0">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {syncResult && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-start gap-2">
              <span className="material-symbols-outlined text-[16px] mt-0.5 shrink-0">check_circle</span>
              <div>
                <p className="font-semibold">{syncResult.message}</p>
                {syncResult.tabs && syncResult.tabs.length > 0 && (
                  <p className="text-[11px] text-emerald-600 mt-1">
                    Active tabs: {syncResult.tabs.map((t) => t.name).join(", ")} ({syncResult.totalEntries} total posts)
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Client Selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Select Client <span className="text-red-500">*</span>
            </label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              disabled={isSubmitting}
              className="w-full text-xs rounded-xl border border-gray-200 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="">-- Choose a Client --</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {activeTab === "google" ? (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Google Sheet URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                placeholder="https://docs.google.com/spreadsheets/d/..."
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                disabled={isSubmitting}
                className="w-full text-xs rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                The CRM connects directly to this sheet and displays the 4 most recent months live. Ensure the sheet is shared as &quot;Anyone with the link can view&quot;.
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Upload File (.xlsx, .xls, .csv) <span className="text-red-500">*</span>
              </label>
              <div className="border-2 border-dashed border-gray-200 hover:border-primary/50 rounded-xl p-4 text-center cursor-pointer bg-gray-50/50 hover:bg-primary/5 transition-all relative">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => setSelectedFile(e.target.files[0] || null)}
                  disabled={isSubmitting}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <span className="material-symbols-outlined text-gray-400 text-[28px] mb-1">cloud_upload</span>
                <p className="text-xs font-medium text-gray-700">
                  {selectedFile ? selectedFile.name : "Click or drag & drop Excel workbook"}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">The last 4 month tabs inside the workbook will be loaded</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-3.5 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-200/60 rounded-xl transition-colors"
          >
            {syncResult ? "Done" : "Cancel"}
          </button>
          <button
            type="button"
            onClick={activeTab === "google" ? handleSaveGoogleSheet : handleImportFile}
            disabled={isSubmitting || !clientId || (activeTab === "google" ? !sheetUrl : !selectedFile)}
            className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                Connecting...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">
                  {activeTab === "google" ? "link" : "file_upload"}
                </span>
                {activeTab === "google" ? "Connect & Load Live" : "Import Workbook"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
