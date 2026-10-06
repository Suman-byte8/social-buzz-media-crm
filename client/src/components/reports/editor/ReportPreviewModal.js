"use client";
import React from "react";
import { PAGE_SIZES } from "./EditorCanvas";
import { getAssetUrl } from "@/services/apiClient";

// A plain, non-interactive read of every page — no drag handles, no
// click-to-select, no edit affordances — so the user can see exactly what
// the exported PDF will look like before committing to an export.
function StaticElement({ element }) {
  const style = {
    position: "absolute",
    left: `${element.x}mm`,
    top: `${element.y}mm`,
    width: `${element.width}mm`,
    height: `${element.height}mm`,
    transform: `rotate(${element.rotation || 0}deg)`,
    transformOrigin: "center center",
  };

  if (element.type === "text") {
    return (
      <div
        style={{
          ...style,
          fontSize: `${element.fontSize || 12}px`,
          color: element.color || "#1A1A1A",
          textAlign: element.align || "left",
          fontWeight: element.bold ? 700 : 400,
          fontStyle: element.italic ? "italic" : "normal",
          textDecoration: element.underline ? "underline" : "none",
          lineHeight: element.lineHeight || 1.4,
          letterSpacing: `${element.letterSpacing || 0}px`,
          overflow: "hidden",
        }}
        dangerouslySetInnerHTML={{ __html: element.html || "" }}
      />
    );
  }
  if (element.type === "image") {
    return (
      <div style={{ ...style, overflow: "hidden", borderRadius: `${element.borderRadius || 0}px` }}>
        {element.src && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={getAssetUrl(element.src)} alt="" className="h-full w-full" style={{ objectFit: element.fit === "cover" ? "cover" : "contain" }} />
        )}
      </div>
    );
  }
  if (element.type === "shape") {
    return (
      <div
        style={{
          ...style,
          backgroundColor: element.shapeType === "line" ? "transparent" : element.fill,
          borderRadius: element.shapeType === "circle" ? "50%" : 0,
          borderBottom: element.shapeType === "line" ? `${element.strokeWidth || 2}px solid ${element.fill}` : "none",
        }}
      />
    );
  }
  if (element.type === "table") {
    return (
      <table style={{ ...style, borderCollapse: "collapse", fontSize: "9px", tableLayout: "fixed" }}>
        <tbody>
          {(element.rows || []).map((row, r) => (
            <tr key={r} style={r === 0 && element.headerRow ? { background: "#1A1A1A", color: "#fff" } : {}}>
              {row.map((cell, c) => (
                <td key={c} style={{ border: "0.5px solid #DEDBD6", padding: "2px 4px" }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
  if (element.type === "kpi") {
    return (
      <div style={{ ...style, borderLeft: `3px solid ${element.accentColor || "#E8262A"}`, background: "#F5F4F2", padding: "4px 8px" }}>
        <p style={{ fontSize: "7px", textTransform: "uppercase", color: "#6E6A65" }}>{element.label}</p>
        <p style={{ fontSize: "14px", fontWeight: 700 }}>{element.value}</p>
      </div>
    );
  }
  return null;
}

export default function ReportPreviewModal({ open, onClose, documentData }) {
  if (!open || !documentData) return null;
  const { width, height } = PAGE_SIZES[documentData.pageSize] || PAGE_SIZES["a4-portrait"];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/70">
      <div className="flex items-center justify-between bg-ink px-5 py-3 text-white">
        <h3 className="font-label-md text-label-md uppercase tracking-wide">Preview</h3>
        <button type="button" onClick={onClose} className="rounded p-1 hover:bg-white/10">
          <span className="material-symbols-outlined text-[22px]">close</span>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-10">
        <div className="flex flex-col items-center gap-8">
          {documentData.pages.map((page) => {
            const background = page.background || { type: "color", value: "#FFFFFF" };
            return (
              <div
                key={page.id}
                className="relative overflow-hidden bg-white shadow-xl"
                style={{
                  width: `${width}mm`,
                  height: `${height}mm`,
                  backgroundColor: background.type === "color" ? background.value : "#FFFFFF",
                  backgroundImage: background.type === "image" && background.value ? `url(${getAssetUrl(background.value)})` : "none",
                  backgroundSize: "cover",
                }}
              >
                {page.elements.map((element) => (
                  <StaticElement key={element.id} element={element} />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
