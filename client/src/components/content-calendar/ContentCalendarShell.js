"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchClients } from "@/redux/slices/clientsSlice";
import { fetchContentCalendarEntries, fetchLiveCalendar } from "@/redux/slices/contentCalendarSlice";
import ContentCalendarTable from "./ContentCalendarTable";
import MonthTabBar from "./MonthTabBar";
import SheetSyncModal from "./SheetSyncModal";
import CalendarShareModal from "./CalendarShareModal";
import { PLATFORM_OPTIONS, STATUS_OPTIONS } from "./constants";

export default function ContentCalendarShell() {
  const dispatch = useDispatch();
  const { clients } = useSelector((state) => state.clients);
  const { entries, loading, clientMonths, savedSheetConfig } = useSelector(
    (state) => state.contentCalendar
  );

  const [selectedClientId, setSelectedClientId] = useState("");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [month, setMonth] = useState("");
  const [search, setSearch] = useState("");

  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchClients({ limit: 100 }));
  }, [dispatch]);

  useEffect(() => {
    if (selectedClientId) {
      loadClientCalendar();
    } else {
      dispatch(fetchContentCalendarEntries({ limit: 100 }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, selectedClientId]);

  const loadClientCalendar = async () => {
    if (!selectedClientId) return;
    try {
      const liveRes = await dispatch(fetchLiveCalendar({ clientId: selectedClientId })).unwrap();
      if (!liveRes.isLive) {
        dispatch(fetchContentCalendarEntries({ clientId: selectedClientId }));
      }
    } catch {
      dispatch(fetchContentCalendarEntries({ clientId: selectedClientId }));
    }
  };

  // Instant in-memory filter across the loaded 4-month data
  const filteredEntries = useMemo(() => {
    let result = entries;
    if (month) result = result.filter((e) => e.date && e.date.startsWith(month));
    if (platformFilter !== "all")
      result = result.filter((e) => Array.isArray(e.platforms) && e.platforms.includes(platformFilter));
    if (statusFilter !== "all") result = result.filter((e) => e.status === statusFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (e) =>
          e.postTitle?.toLowerCase().includes(q) ||
          e.content?.toLowerCase().includes(q) ||
          e.caption?.toLowerCase().includes(q) ||
          e.hashtags?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [entries, month, platformFilter, statusFilter, search]);

  const stats = useMemo(() => ({
    total: filteredEntries.length,
    posted: filteredEntries.filter((e) => e.status === "posted").length,
    scheduled: filteredEntries.filter((e) => e.status === "scheduled").length,
    pending: filteredEntries.filter((e) => e.status === "pending" || !e.status).length,
  }), [filteredEntries]);

  const selectedClientObj = useMemo(
    () => clients.find((c) => c.id === parseInt(selectedClientId)) || null,
    [clients, selectedClientId]
  );

  const activeMonthLabel = useMemo(() => {
    if (!month) return "";
    const [year, m] = month.split("-").map(Number);
    return new Date(year, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }, [month]);

  return (
    <div className="flex-1 p-3 lg:p-4 max-w-[1800px] w-full mx-auto">
      {/* Header */}
      <div className="mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900 leading-tight">Content Calendar</h1>
            {savedSheetConfig?.googleSheetUrl && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Google Sheet
              </span>
            )}
          </div>
          <p className="text-gray-500 text-xs">
            Real-time preview — last 4 months from Google Sheet. Select a client to load their calendar.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          {/* Connect Sheet */}
          <button
            type="button"
            onClick={() => setIsSyncModalOpen(true)}
            className="px-3.5 py-1.5 bg-emerald-50 border border-emerald-300 text-emerald-700 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <span className="material-symbols-outlined text-[16px]">link</span>
            {savedSheetConfig?.googleSheetUrl ? "Sheet Settings" : "Connect Sheet"}
          </button>

          {/* Refresh */}
          {selectedClientId && (
            <button
              type="button"
              onClick={loadClientCalendar}
              disabled={loading}
              title="Refresh live data"
              className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center disabled:opacity-50 shadow-2xs"
            >
              <span className={`material-symbols-outlined text-[16px] ${loading ? "animate-spin" : ""}`}>
                refresh
              </span>
            </button>
          )}

          {/* Share / Export PDF */}
          <button
            type="button"
            onClick={() => setIsShareModalOpen(true)}
            disabled={filteredEntries.length === 0}
            className="px-3.5 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-2xs"
          >
            <span className="material-symbols-outlined text-[16px] text-primary">share</span>
            Share / Export PDF
          </button>
        </div>
      </div>

      {/* Month Tab Bar */}
      {clientMonths.length > 0 && (
        <div className="mb-2.5 bg-white rounded-xl border border-gray-200 shadow-2xs px-3 pt-2">
          <MonthTabBar
            months={clientMonths}
            selectedMonth={month}
            onSelectMonth={(m) => setMonth(m)}
            totalEntriesCount={entries.length}
          />
        </div>
      )}

      {/* Stats + Filters Row */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-2.5 mb-2.5">
        <div className="flex flex-wrap items-end gap-2">
          {/* Stats */}
          <div className="flex items-center gap-2 pr-3 mr-1 border-r border-gray-200">
            {[
              { label: "Total", value: stats.total, color: "text-gray-900" },
              { label: "Posted", value: stats.posted, color: "text-green-600" },
              { label: "Scheduled", value: stats.scheduled, color: "text-blue-600" },
              { label: "Pending", value: stats.pending, color: "text-amber-600" },
            ].map((s) => (
              <div key={s.label} className="text-center px-1.5">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider leading-none">{s.label}</p>
                <p className={`text-base font-bold leading-tight ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Client */}
          <div className="min-w-[140px] flex-1">
            <select
              value={selectedClientId}
              onChange={(e) => { setSelectedClientId(e.target.value); setMonth(""); }}
              className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-900 font-medium focus:ring-1 focus:ring-primary focus:border-primary outline-none"
            >
              <option value="">-- Select Client --</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Platform */}
          <div className="min-w-[110px]">
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-700 focus:ring-1 focus:ring-primary focus:border-primary outline-none"
            >
              <option value="all">All Platforms</option>
              {PLATFORM_OPTIONS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div className="min-w-[100px]">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-700 focus:ring-1 focus:ring-primary focus:border-primary outline-none"
            >
              <option value="all">All Status</option>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="min-w-[160px] flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search topic, caption, hashtags..."
              className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-900 focus:ring-1 focus:ring-primary focus:border-primary outline-none"
            />
          </div>
        </div>
      </div>

      {/* Calendar Table (read-only preview) */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <ContentCalendarTable
          entries={filteredEntries}
          loading={loading}
          showClientColumn={!selectedClientId}
        />
      </div>

      {/* Sheet Connect Modal */}
      <SheetSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        clients={clients}
        selectedClientId={selectedClientId}
        currentSheetUrl={savedSheetConfig?.googleSheetUrl || ""}
        onSuccess={loadClientCalendar}
      />

      {/* Share / PDF Export Modal */}
      <CalendarShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        entries={filteredEntries}
        clientName={selectedClientObj?.name || "All Clients"}
        clientData={selectedClientObj}
        activeMonthLabel={activeMonthLabel}
      />
    </div>
  );
}
