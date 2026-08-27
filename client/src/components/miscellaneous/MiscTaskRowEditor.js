"use client";

import React, { useRef } from "react";
import { TYPE_OF_WORK_OPTIONS, STATUS_OPTIONS } from "./constants";

export default function MiscTaskRowEditor({
  clients,
  teamMembers,
  values,
  existingFile,
  stagedFile,
  onChange,
  onStageFile,
  onRemoveStagedFile,
  onSave,
  onCancel,
  saving,
  error,
  saveLabel = "Save",
}) {
  const fileInputRef = useRef(null);

  const inputClass =
    "w-full px-2 py-1 border border-gray-300 rounded text-xs text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none";

  return (
    <tr className="bg-primary-container/10">
      <td className="py-2 px-2 align-top min-w-[160px]">
        <select
          value={values.clientId || ""}
          onChange={(e) => onChange("clientId", e.target.value)}
          className={inputClass}
          disabled={saving}
        >
          <option value="">Client...</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>{client.name}</option>
          ))}
        </select>
      </td>
      <td className="py-2 px-2 align-top min-w-[150px]">
        <select
          value={values.typeOfWork || "banner"}
          onChange={(e) => onChange("typeOfWork", e.target.value)}
          className={inputClass}
          disabled={saving}
        >
          {TYPE_OF_WORK_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </td>
      <td className="py-2 px-2 align-top">
        <input
          type="date"
          value={values.assignedDate || ""}
          onChange={(e) => onChange("assignedDate", e.target.value)}
          className={inputClass}
          disabled={saving}
        />
      </td>
      <td className="py-2 px-2 align-top">
        <input
          type="date"
          value={values.deliveryDate || ""}
          onChange={(e) => onChange("deliveryDate", e.target.value)}
          className={inputClass}
          disabled={saving}
        />
      </td>
      <td className="py-2 px-2 align-top min-w-[140px]">
        <select
          value={values.assignedTo || ""}
          onChange={(e) => onChange("assignedTo", e.target.value)}
          className={inputClass}
          disabled={saving}
        >
          <option value="">Unassigned</option>
          {teamMembers.map((member) => (
            <option key={member.id} value={member.id}>{member.name}</option>
          ))}
        </select>
      </td>
      <td className="py-2 px-2 align-top min-w-[120px]">
        <select
          value={values.status || "pending"}
          onChange={(e) => onChange("status", e.target.value)}
          className={inputClass}
          disabled={saving}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </td>
      <td className="py-2 px-2 align-top min-w-[130px]">
        {stagedFile ? (
          <div className="flex items-center gap-1 max-w-[130px]">
            <span className="material-symbols-outlined text-[16px] text-primary shrink-0">
              {stagedFile.type.startsWith("video/") ? "movie" : stagedFile.type.startsWith("image/") ? "image" : "description"}
            </span>
            <span className="truncate text-[11px]" title={stagedFile.name}>{stagedFile.name}</span>
            <button type="button" onClick={onRemoveStagedFile} disabled={saving} className="shrink-0 text-red-500 hover:text-red-700">
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          </div>
        ) : existingFile?.fileName ? (
          <div className="flex items-center gap-1 max-w-[130px]">
            <span className="material-symbols-outlined text-[16px] text-secondary shrink-0">description</span>
            <span className="truncate text-[11px]" title={existingFile.fileName}>{existingFile.fileName}</span>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={saving}
              className="shrink-0 text-secondary hover:text-primary"
              title="Replace file"
            >
              <span className="material-symbols-outlined text-[14px]">sync</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={saving}
            className="w-8 h-8 rounded-md border border-dashed border-gray-300 text-gray-400 hover:text-primary hover:border-primary flex items-center justify-center"
            title="Attach file"
          >
            <span className="material-symbols-outlined text-[16px]">attach_file</span>
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,.pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onStageFile(file);
            e.target.value = "";
          }}
        />
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
