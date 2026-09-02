"use client";

import React, { useState, useMemo } from "react";
import ContentCalendarPrintView from "./ContentCalendarPrintView";
import { exportContentCalendarToPdf } from "@/lib/ContentCalendarPdfExport";

const COLUMN_DEFINITIONS = [
  { key: "date", label: "Date", default: true, group: "Core" },
  { key: "day", label: "Day of Week", default: true, group: "Core" },
  { key: "client", label: "Client Name", default: false, group: "Core" },
  { key: "holiday", label: "Holiday / Occasion", default: false, group: "Details" },
  { key: "postTitle", label: "Post Title / Topic", default: true, group: "Content" },
  { key: "caption", label: "Caption / Copy", default: true, group: "Content" },
  { key: "content", label: "Suggestions / Ideas / Notes", default: false, group: "Content", highlight: true },
  { key: "hashtags", label: "Hashtags", default: true, group: "Content" },
  { key: "platforms", label: "Platforms", default: true, group: "Publishing" },
  { key: "creatives", label: "Creatives / Image Links", default: false, group: "Publishing", highlight: true },
  { key: "status", label: "Status Badge", default: true, group: "Publishing" },
];

export default function CalendarShareModal({
  isOpen,
  onClose,
  entries = [],
  clientName = "Client",
  clientData = null,
  activeMonthLabel = "",
}) {
  const [visibleColumns, setVisibleColumns] = useState({
    date: true,
    day: true,
    client: false,
    holiday: false,
    postTitle: true,
    caption: true,
    content: false, // Suggestions hidden by default
    hashtags: true,
    platforms: true,
    creatives: false, // Image links hidden by default
    status: true,
  });

  const [title, setTitle] = useState(`Content Calendar — ${clientName}`);
  const [subtitle, setSubtitle] = useState(
    activeMonthLabel ? `${activeMonthLabel} Content Plan` : "Social Media Schedule"
  );
  const [agencyName, setAgencyName] = useState("Social Buzz Media");
  const [compactness, setCompactness] = useState("standard");
  const [brandColor, setBrandColor] = useState("#4f46e5");
  const [exporting, setExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Hidden print reference inside the modal for PDF generation
  const printRef = React.useRef(null);

  if (!isOpen) return null;

  const toggleColumn = (colKey) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [colKey]: !prev[colKey],
    }));
  };

  const applyPreset = (presetName) => {
    if (presetName === "clean") {
      setVisibleColumns({
        date: true,
        day: true,
        client: false,
        holiday: false,
        postTitle: true,
        caption: true,
        content: false, // HIDE suggestions
        hashtags: true,
        platforms: true,
        creatives: false, // HIDE image links
        status: true,
      });
    } else if (presetName === "detailed") {
      setVisibleColumns({
        date: true,
        day: true,
        client: false,
        holiday: true,
        postTitle: true,
        caption: true,
        content: true, // SHOW suggestions
        hashtags: true,
        platforms: true,
        creatives: true, // SHOW image links
        status: true,
      });
    } else if (presetName === "all") {
      const allTrue = {};
      COLUMN_DEFINITIONS.forEach((c) => (allTrue[c.key] = true));
      setVisibleColumns(allTrue);
    }
  };

  const handleExportPdf = async () => {
    if (entries.length === 0) {
      alert("No entries to export.");
      return;
    }
    setExporting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 80));
      const cleanTitle = clientName.replace(/[^a-zA-Z0-9_-]/g, "_");
      const filename = `content-calendar-${cleanTitle}-${new Date().toISOString().slice(0, 10)}.pdf`;
      await exportContentCalendarToPdf(printRef.current, filename);
    } catch (error) {
      console.error("PDF Export error:", error);
      alert("Failed to generate PDF.");
    } finally {
      setExporting(false);
    }
  };

  const handleShareWhatsApp = () => {
    const rawNumber = clientData?.whatsappNumber || clientData?.phoneNumber || "";
    const cleanNumber = rawNumber.replace(/[^0-9]/g, "");

    const intro = `Hi ${clientName},\nHere is your Content Calendar (${subtitle || "Schedule"}):\n\n`;
    const rows = entries.slice(0, 10).map((e) => {
      let line = `• ${e.date}: *${e.postTitle || "Post"}*`;
      if (visibleColumns.caption && e.caption) line += `\n  Caption: ${e.caption.slice(0, 120)}${e.caption.length > 120 ? "..." : ""}`;
      if (visibleColumns.content && e.content) line += `\n  Suggestions: ${e.content}`;
      if (visibleColumns.creatives && e.creatives && e.creatives.length > 0) {
        line += `\n  Creatives: ${e.creatives.map((c) => c.webViewLink || c.driveLink || c.fileName).join(", ")}`;
      }
      return line;
    });

    const moreText = entries.length > 10 ? `\n...and ${entries.length - 10} more posts (see attached PDF).` : "";
    const message = encodeURIComponent(intro + rows.join("\n\n") + moreText);

    if (cleanNumber) {
      window.open(`https://wa.me/${cleanNumber}?text=${message}`, "_blank");
    } else {
      window.open(`https://wa.me/?text=${message}`, "_blank");
    }
  };

  const handleCopySummary = () => {
    const lines = [
      `# ${title}`,
      subtitle ? `## ${subtitle}` : "",
      `Generated on ${new Date().toLocaleDateString()}`,
      "",
      ...entries.map((e) => {
        const parts = [`- **${e.date}** (${e.postTitle || "Untitled"})`];
        if (visibleColumns.caption && e.caption) parts.push(`  *Caption:* ${e.caption}`);
        if (visibleColumns.content && e.content) parts.push(`  *Suggestions:* ${e.content}`);
        if (visibleColumns.hashtags && e.hashtags) parts.push(`  *Hashtags:* ${e.hashtags}`);
        if (visibleColumns.status) parts.push(`  *Status:* ${e.status}`);
        return parts.join("\n");
      }),
    ];

    navigator.clipboard.writeText(lines.filter(Boolean).join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col border border-gray-100 overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">share</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">Export & Share Content Calendar</h3>
              <p className="text-xs text-gray-500">
                Customize column visibility, hide suggestions or image links, and share with {clientName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 rounded-lg p-1 hover:bg-gray-100 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Body: Two Columns */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Presets & Column Controls */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                1. Select Visible Columns (Custom PDF View)
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-gray-400 mr-1">Presets:</span>
                <button
                  type="button"
                  onClick={() => applyPreset("clean")}
                  className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                >
                  Client Clean (Hides Suggestions &amp; Raw Links)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("detailed")}
                  className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
                >
                  Internal / Detailed
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("all")}
                  className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  All
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {COLUMN_DEFINITIONS.map((col) => {
                const isChecked = !!visibleColumns[col.key];
                return (
                  <label
                    key={col.key}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                      isChecked
                        ? col.highlight
                          ? "bg-amber-50/50 border-amber-300 text-amber-900"
                          : "bg-primary/5 border-primary/30 text-primary font-medium"
                        : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100/70"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleColumn(col.key)}
                      className="w-4 h-4 rounded text-primary focus:ring-primary border-gray-300"
                    />
                    <div className="min-w-0">
                      <p className="text-xs truncate">{col.label}</p>
                      {col.highlight && (
                        <p className="text-[10px] text-amber-600 font-normal">
                          {isChecked ? "Visible" : "Hidden from client"}
                        </p>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Branding & Header Settings */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-700 block mb-3">
              2. PDF Header &amp; Formatting Options
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-gray-500 font-medium mb-1">Document Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs rounded-xl border border-gray-200 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-[11px] text-gray-500 font-medium mb-1">Subtitle / Campaign Note</label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full text-xs rounded-xl border border-gray-200 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-[11px] text-gray-500 font-medium mb-1">Table Padding / Sizing</label>
                <select
                  value={compactness}
                  onChange={(e) => setCompactness(e.target.value)}
                  className="w-full text-xs rounded-xl border border-gray-200 px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="compact">Compact (More items per page)</option>
                  <option value="standard">Standard</option>
                  <option value="relaxed">Relaxed / Spacious</option>
                </select>
              </div>
            </div>
          </div>

          {/* Live Preview Snippet */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                3. Live Table Preview ({entries.length} items total)
              </label>
              <span className="text-[11px] text-gray-400">Showing first 3 rows as sample</span>
            </div>
            <div className="border border-gray-200 rounded-xl overflow-hidden overflow-x-auto max-h-48 bg-white shadow-2xs">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead className="bg-gray-100 text-gray-700 uppercase text-[10px] font-bold border-b border-gray-200">
                  <tr>
                    {visibleColumns.date && <th className="p-2">Date</th>}
                    {visibleColumns.day && <th className="p-2">Day</th>}
                    {visibleColumns.client && <th className="p-2">Client</th>}
                    {visibleColumns.holiday && <th className="p-2">Holiday</th>}
                    {visibleColumns.postTitle && <th className="p-2">Title</th>}
                    {visibleColumns.content && <th className="p-2 text-amber-700 bg-amber-50/80">Format / Pillar / Banner</th>}
                    {visibleColumns.caption && <th className="p-2">Caption</th>}
                    {visibleColumns.hashtags && <th className="p-2">Hashtags</th>}
                    {visibleColumns.platforms && <th className="p-2">Platforms</th>}
                    {visibleColumns.creatives && <th className="p-2 text-amber-700 bg-amber-50/80">Pinterest / Image</th>}
                    {visibleColumns.status && <th className="p-2">Status</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {entries.slice(0, 3).map((e, idx) => (
                    <tr key={e.id || `share-row-${idx}`} className="hover:bg-gray-50/50">
                      {visibleColumns.date && <td className="p-2 whitespace-nowrap font-medium">{e.date}</td>}
                      {visibleColumns.day && <td className="p-2 whitespace-nowrap text-gray-500">—</td>}
                      {visibleColumns.client && <td className="p-2 whitespace-nowrap">{e.clientName || clientName}</td>}
                      {visibleColumns.holiday && <td className="p-2 text-purple-600">{e.holiday || "—"}</td>}
                      {visibleColumns.postTitle && <td className="p-2 font-medium text-gray-900 max-w-[120px] truncate">{e.postTitle || "—"}</td>}
                      {visibleColumns.content && <td className="p-2 italic text-gray-600 bg-amber-50/40 max-w-[140px] truncate">{e.content || "—"}</td>}
                      {visibleColumns.caption && <td className="p-2 text-gray-600 max-w-[150px] truncate">{e.caption || "—"}</td>}
                      {visibleColumns.hashtags && <td className="p-2 text-blue-600 max-w-[100px] truncate">{e.hashtags || "—"}</td>}
                      {visibleColumns.platforms && <td className="p-2 whitespace-nowrap">{Array.isArray(e.platforms) ? e.platforms.join(", ") : "—"}</td>}
                      {visibleColumns.creatives && <td className="p-2 bg-amber-50/40 max-w-[100px] truncate">{Array.isArray(e.creatives) ? `${e.creatives.length} link(s)` : "—"}</td>}
                      {visibleColumns.status && <td className="p-2 uppercase text-[9px] font-bold text-emerald-700">{e.status || "pending"}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Hidden Container for exact DOM rendering during PDF capture */}
        <div style={{ position: "fixed", left: "-9999px", top: 0 }}>
          <div ref={printRef}>
            <ContentCalendarPrintView
              entries={entries}
              title={title}
              subtitle={subtitle}
              visibleColumns={visibleColumns}
              compactness={compactness}
              brandColor={brandColor}
              agencyName={agencyName}
            />
          </div>
        </div>

        {/* Modal Footer: Action Buttons */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCopySummary}
              className="flex-1 sm:flex-none px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-medium rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">
                {copied ? "check" : "content_copy"}
              </span>
              {copied ? "Copied!" : "Copy Text Summary"}
            </button>
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="flex-1 sm:flex-none px-3.5 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-1.5 shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px]">chat</span>
              Share via WhatsApp
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={exporting}
              className="px-3.5 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 rounded-xl"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={exporting}
              className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]">
                {exporting ? "progress_activity" : "picture_as_pdf"}
              </span>
              {exporting ? "Generating PDF..." : "Download Custom PDF"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
