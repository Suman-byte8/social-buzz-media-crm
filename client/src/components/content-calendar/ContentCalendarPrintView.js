import React from "react";
import { getPlatformMeta, getStatusMeta, formatDateDisplay, getWeekDay } from "./constants";

const STATUS_PRINT_COLORS = { pending: "#b45309", scheduled: "#1d4ed8", posted: "#15803d" };

export default function ContentCalendarPrintView({ entries, title, showClientColumn }) {
  const generatedOn = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const th = {
    padding: "8px 10px",
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.03em",
    color: "#374151",
    background: "#f3f4f6",
    border: "1px solid #d1d5db",
    textAlign: "left",
    whiteSpace: "nowrap",
  };

  const td = {
    padding: "8px 10px",
    fontSize: "12px",
    color: "#1f2937",
    border: "1px solid #e5e7eb",
    verticalAlign: "top",
    maxWidth: "260px",
    wordBreak: "break-word",
  };

  return (
    <div style={{ width: "fit-content", background: "#ffffff", padding: "28px", fontFamily: "Arial, Helvetica, sans-serif" }}>
      <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#111827", margin: 0 }}>Content Calendar — {title}</h1>
      <p style={{ fontSize: "11px", color: "#6b7280", margin: "4px 0 16px" }}>Generated on {generatedOn} · {entries.length} entries</p>

      <table style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={th}>Date</th>
            <th style={th}>Day</th>
            {showClientColumn && <th style={th}>Client</th>}
            <th style={th}>Holiday</th>
            <th style={th}>Post Title</th>
            <th style={th}>Content</th>
            <th style={th}>Caption</th>
            <th style={th}>Hashtags</th>
            <th style={th}>Platforms</th>
            <th style={th}>Creatives</th>
            <th style={th}>Status</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id}>
              <td style={{ ...td, whiteSpace: "nowrap", fontWeight: 600 }}>{formatDateDisplay(entry.date)}</td>
              <td style={{ ...td, whiteSpace: "nowrap" }}>{getWeekDay(entry.date)}</td>
              {showClientColumn && <td style={{ ...td, whiteSpace: "nowrap" }}>{entry.clientName || "—"}</td>}
              <td style={td}>{entry.holiday || "—"}</td>
              <td style={td}>{entry.postTitle || "—"}</td>
              <td style={td}>{entry.content || "—"}</td>
              <td style={td}>{entry.caption || "—"}</td>
              <td style={{ ...td, color: "#2563eb" }}>{entry.hashtags || "—"}</td>
              <td style={{ ...td, whiteSpace: "nowrap" }}>
                {entry.platforms && entry.platforms.length > 0
                  ? entry.platforms.map((p) => getPlatformMeta(p).label).join(", ")
                  : "—"}
              </td>
              <td style={td}>
                {entry.creatives && entry.creatives.length > 0
                  ? `${entry.creatives.length} file${entry.creatives.length > 1 ? "s" : ""}: ${entry.creatives.map((c) => c.fileName).join(", ")}`
                  : "—"}
              </td>
              <td style={{ ...td, whiteSpace: "nowrap", fontWeight: 600, color: STATUS_PRINT_COLORS[entry.status] || "#b45309" }}>
                {getStatusMeta(entry.status).label}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
