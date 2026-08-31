"use client";

import React, { useRef } from "react";
import { PLATFORM_OPTIONS, STATUS_OPTIONS, getStatusMeta, getWeekDay } from "./constants";

export default function ContentCalendarRowEditor({
  showClientColumn,
  clients,
  clientEditable,
  fixedClientName,
  values,
  existingCreatives = [],
  stagedFiles = [],
  onChange,
  onTogglePlatform,
  onStageFiles,
  onRemoveStagedFile,
  onRemoveExistingCreative,
  onSave,
  onCancel,
  saving,
  error,
  saveLabel = "Save",
}) {
  const fileInputRef = useRef(null);
  const weekDay = getWeekDay(values.date);

  const inputClass =
    "w-full px-2 py-1 border border-gray-300 rounded text-xs text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none";

  return (
    <tr className="bg-primary-container/10">
      <td className="py-2 px-2 align-top">
        <input
          type="date"
          value={values.date || ""}
          onChange={(e) => onChange("date", e.target.value)}
          className={inputClass}
          disabled={saving}
        />
      </td>
      <td className="py-2 px-2 align-top text-gray-600 whitespace-nowrap">{weekDay || "—"}</td>
      {showClientColumn && (
        <td className="py-2 px-2 align-top">
          {clientEditable ? (
            <select
              value={values.clientId || ""}
              onChange={(e) => onChange("clientId", e.target.value)}
              className={inputClass}
              disabled={saving}
            >
              <option value="">Client...</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-xs text-gray-600 whitespace-nowrap">{fixedClientName}</span>
          )}
        </td>
      )}
      <td className="py-2 px-2 align-top">
        <input
          type="text"
          value={values.holiday || ""}
          onChange={(e) => onChange("holiday", e.target.value)}
          placeholder="Holiday..."
          className={inputClass}
          disabled={saving}
        />
      </td>
      <td className="py-2 px-2 align-top">
        <input
          type="text"
          value={values.postTitle || ""}
          onChange={(e) => onChange("postTitle", e.target.value)}
          placeholder="Post title..."
          className={inputClass}
          disabled={saving}
        />
      </td>
      <td className="py-2 px-2 align-top">
        <textarea
          value={values.content || ""}
          onChange={(e) => onChange("content", e.target.value)}
          placeholder="Content..."
          rows={2}
          className={inputClass}
          disabled={saving}
        />
      </td>
      <td className="py-2 px-2 align-top">
        <textarea
          value={values.caption || ""}
          onChange={(e) => onChange("caption", e.target.value)}
          placeholder="Caption..."
          rows={2}
          className={inputClass}
          disabled={saving}
        />
      </td>
      <td className="py-2 px-2 align-top">
        <input
          type="text"
          value={values.hashtags || ""}
          onChange={(e) => onChange("hashtags", e.target.value)}
          placeholder="#tags..."
          className={inputClass}
          disabled={saving}
        />
      </td>
      <td className="py-2 px-2 align-top">
        <div className="flex flex-wrap gap-1">
          {PLATFORM_OPTIONS.map((platform) => {
            const isSelected = (values.platforms || []).includes(platform.value);
            return (
              <button
                key={platform.value}
                type="button"
                onClick={() => onTogglePlatform(platform.value)}
                disabled={saving}
                title={platform.label}
                className={`inline-flex items-center justify-center w-6 h-6 rounded-full bg-white border overflow-hidden shrink-0 transition-opacity ${
                  isSelected ? "border-primary ring-1 ring-primary" : "border-gray-200 opacity-40 hover:opacity-70"
                }`}
              >
                <img src={platform.logo} alt={platform.label} className="w-4 h-4 object-contain" />
              </button>
            );
          })}
        </div>
      </td>
      <td className="py-2 px-2 align-top">
        <div className="flex flex-wrap items-center gap-1.5 max-w-[160px]">
          {existingCreatives.map((creative) => (
            <div key={creative.fileId} className="relative w-10 h-10 rounded-md border border-gray-200 overflow-hidden bg-gray-100 shrink-0">
              {creative.thumbnailLink ? (
                <img src={creative.thumbnailLink} alt={creative.fileName} className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-[16px] text-gray-400 flex items-center justify-center w-full h-full">
                  {creative.mimeType?.startsWith("video/") ? "movie" : "image"}
                </span>
              )}
              {onRemoveExistingCreative && (
                <button
                  type="button"
                  onClick={() => onRemoveExistingCreative(creative.fileId)}
                  disabled={saving}
                  className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-red-500 text-white flex items-center justify-center"
                  title="Remove"
                >
                  <span className="material-symbols-outlined text-[10px]">close</span>
                </button>
              )}
            </div>
          ))}
          {stagedFiles.map((file, index) => (
            <div key={`${file.name}-${index}`} className="relative w-10 h-10 rounded-md border border-dashed border-primary/50 bg-primary-container/20 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[16px] text-primary">
                {file.type.startsWith("video/") ? "movie" : "image"}
              </span>
              <button
                type="button"
                onClick={() => onRemoveStagedFile(index)}
                disabled={saving}
                className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-red-500 text-white flex items-center justify-center"
                title="Remove"
              >
                <span className="material-symbols-outlined text-[10px]">close</span>
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={saving}
            className="w-10 h-10 rounded-md border border-dashed border-gray-300 text-gray-400 hover:text-primary hover:border-primary flex items-center justify-center shrink-0"
            title="Add creatives"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={(e) => {
              onStageFiles(Array.from(e.target.files || []));
              e.target.value = "";
            }}
          />
        </div>
      </td>
      <td className="py-2 px-2 align-top">
        <select
          value={values.status || "pending"}
          onChange={(e) => onChange("status", e.target.value)}
          disabled={saving}
          className={`px-2 py-0.5 rounded-full font-medium border transition-colors text-xs outline-none cursor-pointer ${getStatusMeta(values.status).className}`}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </td>
      <td className="py-2 px-2 align-top text-right">
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="px-2 py-1 bg-primary text-white rounded text-[11px] font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1"
              title={saveLabel}
            >
              <span className="material-symbols-outlined text-[14px]">
                {saving ? "progress_activity" : "check"}
              </span>
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="px-2 py-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded text-[11px]"
              title="Cancel"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          </div>
          {error && <p className="text-[10px] text-red-600 max-w-[140px] whitespace-normal text-right">{error}</p>}
        </div>
      </td>
    </tr>
  );
}
