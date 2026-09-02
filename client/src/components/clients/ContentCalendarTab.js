"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchContentCalendarEntries,
  fetchLiveCalendar,
} from "@/redux/slices/contentCalendarSlice";
import ContentCalendarTable from "@/components/content-calendar/ContentCalendarTable";
import MonthTabBar from "@/components/content-calendar/MonthTabBar";
import SheetSyncModal from "@/components/content-calendar/SheetSyncModal";
import CalendarShareModal from "@/components/content-calendar/CalendarShareModal";

export default function ContentCalendarTab({ clientId, client }) {
  const clientName = client?.name || "";

  const dispatch = useDispatch();
  const { entries, loading, clientMonths, savedSheetConfig } = useSelector(
    (state) => state.contentCalendar
  );

  const [selectedMonth, setSelectedMonth] = useState("");
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  useEffect(() => {
    if (clientId) {
      loadCalendar();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const loadCalendar = async () => {
    try {
      const liveRes = await dispatch(fetchLiveCalendar({ clientId })).unwrap();
      if (!liveRes.isLive) {
        dispatch(fetchContentCalendarEntries({ clientId }));
      }
    } catch {
      dispatch(fetchContentCalendarEntries({ clientId }));
    }
  };

  // Instant in-memory month filter
  const displayedEntries = useMemo(() => {
    if (!selectedMonth) return entries;
    return entries.filter((e) => e.date && e.date.startsWith(selectedMonth));
  }, [entries, selectedMonth]);

  const activeMonthLabel = useMemo(() => {
    if (!selectedMonth) return "";
    const [year, m] = selectedMonth.split("-").map(Number);
    return new Date(year, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }, [selectedMonth]);

  const stats = useMemo(() => ({
    total: displayedEntries.length,
    posted: displayedEntries.filter((e) => e.status === "posted").length,
    scheduled: displayedEntries.filter((e) => e.status === "scheduled").length,
    pending: displayedEntries.filter((e) => !e.status || e.status === "pending").length,
  }), [displayedEntries]);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h3 className="font-title-lg text-title-lg text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">event_note</span>
            Content Calendar
          </h3>
          {savedSheetConfig?.googleSheetUrl && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Sheet Connected
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Connect / Sheet Settings */}
          <button
            type="button"
            onClick={() => setIsSyncModalOpen(true)}
            className="px-3 py-1.5 bg-emerald-50 border border-emerald-300 text-emerald-700 rounded-lg text-xs font-semibold hover:bg-emerald-100 flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[15px]">link</span>
            {savedSheetConfig?.googleSheetUrl ? "Sheet Settings" : "Connect Sheet"}
          </button>

          {/* Refresh */}
          <button
            type="button"
            onClick={loadCalendar}
            disabled={loading}
            title="Refresh live data"
            className="p-1.5 bg-emerald-600 text-white rounded-lg text-xs hover:bg-emerald-700 disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-[15px] ${loading ? "animate-spin" : ""}`}>
              refresh
            </span>
          </button>

          {/* Share / Export PDF */}
          <button
            type="button"
            onClick={() => setIsShareModalOpen(true)}
            disabled={displayedEntries.length === 0}
            className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-50 flex items-center gap-1.5 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[15px] text-primary">share</span>
            Share / Export PDF
          </button>
        </div>
      </div>

      {/* Stats Row */}
      {entries.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Total Posts", value: stats.total, icon: "event_note", color: "text-gray-900", bg: "bg-gray-50", border: "border-gray-200" },
            { label: "Posted", value: stats.posted, icon: "check_circle", color: "text-green-700", bg: "bg-green-50", border: "border-green-200" },
            { label: "Scheduled", value: stats.scheduled, icon: "schedule", color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
            { label: "Pending", value: stats.pending, icon: "pending", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
          ].map((s) => (
            <div key={s.label} className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${s.bg} ${s.border}`}>
              <span className={`material-symbols-outlined text-[18px] ${s.color}`}>{s.icon}</span>
              <div>
                <p className="text-[10px] text-gray-500 leading-none">{s.label}</p>
                <p className={`text-lg font-bold leading-tight ${s.color}`}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Month Tab Bar */}
      {clientMonths.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-2xs px-3 pt-2">
          <MonthTabBar
            months={clientMonths}
            selectedMonth={selectedMonth}
            onSelectMonth={(m) => setSelectedMonth(m)}
            totalEntriesCount={entries.length}
          />
        </div>
      )}

      {/* Empty state when no sheet connected */}
      {!savedSheetConfig?.googleSheetUrl && entries.length === 0 && !loading && (
        <div className="py-10 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
          <span className="material-symbols-outlined text-[40px] text-gray-300 mb-2">table_chart</span>
          <p className="font-semibold text-gray-700 text-sm">No Google Sheet connected</p>
          <p className="text-xs text-gray-400 mt-1 mb-3">
            Connect the client&apos;s Google Sheet to display their content calendar here.
          </p>
          <button
            onClick={() => setIsSyncModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors"
          >
            Connect Google Sheet
          </button>
        </div>
      )}

      {/* Read-only Calendar Table */}
      {(entries.length > 0 || loading) && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <ContentCalendarTable
            entries={displayedEntries}
            loading={loading}
            showClientColumn={false}
          />
        </div>
      )}

      {/* Sheet Connect Modal */}
      <SheetSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        clients={[{ id: clientId, name: clientName }]}
        selectedClientId={clientId}
        currentSheetUrl={savedSheetConfig?.googleSheetUrl || ""}
        onSuccess={loadCalendar}
      />

      {/* Share / PDF Modal */}
      <CalendarShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        entries={displayedEntries}
        clientName={clientName}
        clientData={client}
        activeMonthLabel={activeMonthLabel}
      />
    </div>
  );
}
