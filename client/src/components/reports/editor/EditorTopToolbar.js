"use client";
import React, { useState } from "react";
import { FONT_PAIRING_PRESETS } from "@/lib/reportDesignPresets";
import { THANK_YOU_VARIANTS } from "@/lib/reportPageLayouts";

const SAVE_STATUS_LABEL = {
  idle: "",
  saving: "Saving…",
  saved: "Saved",
  error: "Save failed — retrying",
  conflict: "Changed elsewhere — reload to see the latest",
};

const ADD_ELEMENT_OPTIONS = [
  { type: "text", icon: "text_fields", label: "Text" },
  { type: "image", icon: "image", label: "Image" },
  { type: "shape-rect", icon: "rectangle", label: "Rectangle" },
  { type: "shape-circle", icon: "circle", label: "Circle" },
  { type: "shape-line", icon: "horizontal_rule", label: "Line" },
  { type: "table", icon: "table_chart", label: "Table" },
  { type: "kpi", icon: "insights", label: "KPI Card" },
];

export default function EditorTopToolbar({
  title,
  onTitleChange,
  clientName,
  saveStatus,
  onSave,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  zoom,
  onZoomChange,
  onAddElement,
  onPreview,
  onSaveAsTemplate,
  onDownloadPdf,
  onExportToDrive,
  isExporting,
  onBackToDashboard,
  onApplyFontPairing,
  onReplaceThankYouPage,
}) {
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [typographySubmenuOpen, setTypographySubmenuOpen] = useState(false);
  const [thankYouSubmenuOpen, setThankYouSubmenuOpen] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-outline-variant bg-surface px-4 py-2">
      <button type="button" onClick={onBackToDashboard} title="Back to dashboard" className="rounded p-1.5 text-on-surface-variant hover:bg-surface-variant">
        <span className="material-symbols-outlined text-[20px]">arrow_back</span>
      </button>

      <input
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        className="min-w-[160px] max-w-[280px] rounded px-2 py-1 font-title-md text-title-md text-on-surface outline-none hover:bg-surface-variant focus:bg-surface-variant"
        placeholder="Untitled Report"
      />

      {clientName && (
        <span className="rounded-full bg-primary/10 px-3 py-1 font-label-sm text-label-sm text-primary">{clientName}</span>
      )}

      <div className="mx-1 h-6 w-px bg-outline-variant" />

      <div className="relative">
        <button
          type="button"
          onClick={() => setAddMenuOpen((p) => !p)}
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 font-label-md text-label-md text-white hover:bg-primary/90"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          Add element
        </button>
        {addMenuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setAddMenuOpen(false)} />
            <div className="absolute left-0 z-20 mt-1 w-44 rounded-lg border border-outline-variant bg-white py-1 shadow-lg">
              {ADD_ELEMENT_OPTIONS.map((opt) => (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => {
                    onAddElement(opt.type);
                    setAddMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-body-sm text-on-surface hover:bg-surface-variant"
                >
                  <span className="material-symbols-outlined text-[16px] text-primary">{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-0.5">
        <button type="button" onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)" className="rounded p-1.5 text-on-surface-variant hover:bg-surface-variant disabled:opacity-30">
          <span className="material-symbols-outlined text-[18px]">undo</span>
        </button>
        <button type="button" onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Y)" className="rounded p-1.5 text-on-surface-variant hover:bg-surface-variant disabled:opacity-30">
          <span className="material-symbols-outlined text-[18px]">redo</span>
        </button>
      </div>

      <div className="flex items-center gap-1 rounded-md border border-outline-variant px-1 py-0.5">
        <button type="button" onClick={() => onZoomChange(Math.max(0.4, zoom - 0.1))} className="rounded p-1 text-on-surface-variant hover:bg-surface-variant">
          <span className="material-symbols-outlined text-[16px]">remove</span>
        </button>
        <span className="w-10 text-center font-label-sm text-label-sm text-on-surface-variant">{Math.round(zoom * 100)}%</span>
        <button type="button" onClick={() => onZoomChange(Math.min(2, zoom + 0.1))} className="rounded p-1 text-on-surface-variant hover:bg-surface-variant">
          <span className="material-symbols-outlined text-[16px]">add</span>
        </button>
        <button type="button" onClick={() => onZoomChange(1)} title="Reset zoom" className="rounded p-1 text-on-surface-variant hover:bg-surface-variant">
          <span className="material-symbols-outlined text-[16px]">fit_screen</span>
        </button>
      </div>

      <span className={`font-label-sm text-label-sm ${saveStatus === "error" || saveStatus === "conflict" ? "text-red-600" : "text-on-surface-variant"}`}>
        {SAVE_STATUS_LABEL[saveStatus]}
      </span>

      <div className="ml-auto flex items-center gap-2">
        <button type="button" onClick={onPreview} className="rounded-md border border-outline-variant px-3 py-1.5 font-label-md text-label-md text-on-surface hover:bg-surface-variant">
          Preview
        </button>

        <div className="relative">
          <button type="button" onClick={() => setMoreMenuOpen((p) => !p)} title="More" className="rounded p-1.5 text-on-surface-variant hover:bg-surface-variant">
            <span className="material-symbols-outlined text-[18px]">more_vert</span>
          </button>
          {moreMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMoreMenuOpen(false)} />
              <div className="absolute right-0 z-20 mt-1 w-56 rounded-lg border border-outline-variant bg-white py-1 shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    onSaveAsTemplate();
                    setMoreMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-body-sm text-on-surface hover:bg-surface-variant"
                >
                  <span className="material-symbols-outlined text-[16px]">bookmark_add</span>
                  Save as template
                </button>

                <div className="relative" onMouseEnter={() => setTypographySubmenuOpen(true)} onMouseLeave={() => setTypographySubmenuOpen(false)}>
                  <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-left text-body-sm text-on-surface hover:bg-surface-variant">
                    <span className="material-symbols-outlined text-[16px]">font_download</span>
                    Typography
                    <span className="material-symbols-outlined ml-auto text-[16px]">chevron_right</span>
                  </button>
                  {typographySubmenuOpen && (
                    <div className="absolute right-full top-0 w-52 rounded-lg border border-outline-variant bg-white py-1 shadow-lg">
                      {FONT_PAIRING_PRESETS.map((preset) => (
                        <button
                          key={preset.key}
                          type="button"
                          onClick={() => {
                            onApplyFontPairing(preset);
                            setMoreMenuOpen(false);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-body-sm text-on-surface hover:bg-surface-variant"
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative" onMouseEnter={() => setThankYouSubmenuOpen(true)} onMouseLeave={() => setThankYouSubmenuOpen(false)}>
                  <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-left text-body-sm text-on-surface hover:bg-surface-variant">
                    <span className="material-symbols-outlined text-[16px]">volunteer_activism</span>
                    Thank-you style
                    <span className="material-symbols-outlined ml-auto text-[16px]">chevron_right</span>
                  </button>
                  {thankYouSubmenuOpen && (
                    <div className="absolute right-full top-0 w-52 rounded-lg border border-outline-variant bg-white py-1 shadow-lg">
                      {Object.entries(THANK_YOU_VARIANTS).map(([key, variant]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            onReplaceThankYouPage(variant.build);
                            setMoreMenuOpen(false);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-body-sm text-on-surface hover:bg-surface-variant"
                        >
                          {variant.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setExportMenuOpen((p) => !p)}
            disabled={isExporting}
            className="flex items-center gap-1.5 rounded-md bg-[#4285F4] px-3 py-1.5 font-label-md text-label-md text-white hover:bg-[#3367D6] disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-[16px]">{isExporting ? "progress_activity" : "picture_as_pdf"}</span>
            {isExporting ? "Exporting…" : "Export PDF"}
          </button>
          {exportMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setExportMenuOpen(false)} />
              <div className="absolute right-0 z-20 mt-1 w-56 rounded-lg border border-outline-variant bg-white py-1 shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    onDownloadPdf();
                    setExportMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-body-sm text-on-surface hover:bg-surface-variant"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  Download PDF
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onExportToDrive();
                    setExportMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-body-sm text-on-surface hover:bg-surface-variant"
                >
                  <span className="material-symbols-outlined text-[16px]">cloud_upload</span>
                  Save to Google Drive
                </button>
              </div>
            </>
          )}
        </div>

        <button type="button" onClick={onSave} className="rounded-md border border-outline-variant px-3 py-1.5 font-label-md text-label-md text-on-surface hover:bg-surface-variant">
          Save
        </button>
      </div>
    </div>
  );
}
