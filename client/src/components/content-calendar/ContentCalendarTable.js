"use client";

import React from "react";
import { getPlatformMeta, formatDateDisplay, getWeekDay } from "./constants";
import ContentCalendarRowEditor from "./ContentCalendarRowEditor";

export default function ContentCalendarTable({
  entries,
  loading,
  showClientColumn = true,
  clients = [],
  onEdit,
  onDelete,
  onTogglePosted,
  onShare,

  // Draft (new, unsaved) rows rendered inline at the top of the table.
  draftRows = [],
  onDraftChange,
  onDraftTogglePlatform,
  onDraftStageFiles,
  onDraftRemoveStagedFile,
  onSaveDraft,
  onDiscardDraft,
  savingDraftId,
  draftErrors = {},
  draftClientName,

  // Inline editing of an existing, already-saved entry.
  editingId,
  editValues,
  editExistingCreatives,
  editStagedFiles,
  onEditChange,
  onEditTogglePlatform,
  onEditStageFiles,
  onEditRemoveStagedFile,
  onEditRemoveExistingCreative,
  onSaveEdit,
  onCancelEdit,
  savingEdit,
  editError,
  editClientName,
}) {
  const hasDrafts = draftRows.length > 0;

  if (loading) {
    return (
      <div className="py-8 text-center text-gray-500">
        <span className="animate-spin material-symbols-outlined text-[24px]">
          progress_activity
        </span>
      </div>
    );
  }

  if ((!entries || entries.length === 0) && !hasDrafts) {
    return (
      <div className="py-8 px-6 text-center text-gray-500">
        <span className="material-symbols-outlined text-[40px] mb-1.5">
          event_note
        </span>
        <p className="font-body-sm text-xs">
          No content calendar entries found.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="py-1.5 px-2 font-label-sm text-[10px] text-gray-700 uppercase tracking-wider whitespace-nowrap">
              Date
            </th>
            <th className="py-1.5 px-2 font-label-sm text-[10px] text-gray-700 uppercase tracking-wider whitespace-nowrap">
              Day
            </th>
            {showClientColumn && (
              <th className="py-1.5 px-2 font-label-sm text-[10px] text-gray-700 uppercase tracking-wider whitespace-nowrap">
                Client
              </th>
            )}
            <th className="py-1.5 px-2 font-label-sm text-[10px] text-gray-700 uppercase tracking-wider min-w-[110px]">
              Holiday
            </th>
            <th className="py-1.5 px-2 font-label-sm text-[10px] text-gray-700 uppercase tracking-wider min-w-[150px]">
              Post Title
            </th>
            <th className="py-1.5 px-2 font-label-sm text-[10px] text-gray-700 uppercase tracking-wider min-w-[220px]">
              Content
            </th>
            <th className="py-1.5 px-2 font-label-sm text-[10px] text-gray-700 uppercase tracking-wider min-w-[220px]">
              Caption
            </th>
            <th className="py-1.5 px-2 font-label-sm text-[10px] text-gray-700 uppercase tracking-wider min-w-[160px]">
              Hashtags
            </th>
            <th className="py-1.5 px-2 font-label-sm text-[10px] text-gray-700 uppercase tracking-wider whitespace-nowrap">
              Platforms
            </th>
            <th className="py-1.5 px-2 font-label-sm text-[10px] text-gray-700 uppercase tracking-wider whitespace-nowrap">
              Creatives
            </th>
            <th className="py-1.5 px-2 font-label-sm text-[10px] text-gray-700 uppercase tracking-wider whitespace-nowrap">
              Posted
            </th>
            <th className="py-1.5 px-2 font-label-sm text-[10px] text-gray-700 uppercase tracking-wider text-right whitespace-nowrap">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {draftRows.map((draft) => (
            <ContentCalendarRowEditor
              key={draft.tempId}
              showClientColumn={showClientColumn}
              clients={clients}
              clientEditable={!draftClientName}
              fixedClientName={draftClientName}
              values={draft}
              stagedFiles={draft.stagedFiles || []}
              onChange={(field, value) =>
                onDraftChange(draft.tempId, field, value)
              }
              onTogglePlatform={(platform) =>
                onDraftTogglePlatform(draft.tempId, platform)
              }
              onStageFiles={(files) => onDraftStageFiles(draft.tempId, files)}
              onRemoveStagedFile={(index) =>
                onDraftRemoveStagedFile(draft.tempId, index)
              }
              onSave={() => onSaveDraft(draft.tempId)}
              onCancel={() => onDiscardDraft(draft.tempId)}
              saving={savingDraftId === draft.tempId}
              error={draftErrors[draft.tempId]}
              saveLabel="Create entry"
            />
          ))}

          {entries.map((entry) => {
            if (editingId === entry.id) {
              return (
                <ContentCalendarRowEditor
                  key={entry.id}
                  showClientColumn={showClientColumn}
                  clients={clients}
                  clientEditable={false}
                  fixedClientName={editClientName || entry.clientName}
                  values={editValues}
                  existingCreatives={editExistingCreatives}
                  stagedFiles={editStagedFiles}
                  onChange={onEditChange}
                  onTogglePlatform={onEditTogglePlatform}
                  onStageFiles={onEditStageFiles}
                  onRemoveStagedFile={onEditRemoveStagedFile}
                  onRemoveExistingCreative={onEditRemoveExistingCreative}
                  onSave={onSaveEdit}
                  onCancel={onCancelEdit}
                  saving={savingEdit}
                  error={editError}
                  saveLabel="Save changes"
                />
              );
            }

            const creatives = entry.creatives || [];

            return (
              <tr
                key={entry.id}
                className={`hover:bg-gray-50 ${entry.holiday ? "bg-amber-50/60" : ""}`}
              >
                <td className="py-4 px-2 text-gray-900 whitespace-nowrap font-medium align-top">
                  {formatDateDisplay(entry.date)}
                </td>
                <td className="py-4 px-2 text-gray-600 whitespace-nowrap align-top">
                  {getWeekDay(entry.date)}
                </td>
                {showClientColumn && (
                  <td className="py-4 px-2 text-gray-600 whitespace-nowrap align-top">
                    {entry.clientName || "—"}
                  </td>
                )}
                <td className="py-4 px-2 text-gray-700 align-top">
                  {entry.holiday ? (
                    <span className="inline-flex items-start gap-1 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium whitespace-normal break-words">
                      <span className="material-symbols-outlined text-[12px] shrink-0">
                        celebration
                      </span>
                      <span>{entry.holiday}</span>
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="py-4 px-2 text-gray-900 whitespace-normal break-words align-top">
                  {entry.postTitle || "—"}
                </td>
                <td className="py-4 px-2 text-gray-600 whitespace-normal break-words align-top">
                  {entry.content || "—"}
                </td>
                <td className="py-4 px-2 text-gray-600 whitespace-normal break-words align-top">
                  {entry.caption || "—"}
                </td>
                <td className="py-4 px-2 text-blue-600 whitespace-normal break-words align-top">
                  {entry.hashtags || "—"}
                </td>
                <td className="py-4 px-2 align-top">
                  <div className="flex flex-wrap gap-1">
                    {entry.platforms && entry.platforms.length > 0
                      ? entry.platforms.map((p) => {
                          const meta = getPlatformMeta(p);
                          return (
                            <span
                              key={p}
                              title={meta.label}
                              className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white border border-gray-200 overflow-hidden shrink-0"
                            >
                              {meta.logo ? (
                                <img
                                  src={meta.logo}
                                  alt={meta.label}
                                  className="w-4 h-4 object-contain"
                                />
                              ) : (
                                <span className="material-symbols-outlined text-[13px]">
                                  {meta.icon}
                                </span>
                              )}
                            </span>
                          );
                        })
                      : "—"}
                  </div>
                </td>
                <td className="py-3 px-2 align-top">
                  {creatives.length > 0
                    ? (() => {
                        const thumbSize =
                          creatives.length === 1
                            ? "w-24 h-24"
                            : creatives.length === 2
                              ? "w-16 h-16"
                              : "w-12 h-12";
                        const iconSize =
                          creatives.length === 1
                            ? "text-[32px]"
                            : creatives.length === 2
                              ? "text-[22px]"
                              : "text-[16px]";
                        const playSize =
                          creatives.length === 1
                            ? "text-[26px]"
                            : creatives.length === 2
                              ? "text-[18px]"
                              : "text-[13px]";
                        const gap = creatives.length > 2 ? "gap-1" : "gap-2";
                        return (
                          <div className={`grid grid-cols-3 ${gap} w-fit`}>
                            {creatives.map((creative) => (
                              <a
                                key={creative.fileId}
                                href={
                                  creative.webViewLink || creative.driveLink
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                title={creative.fileName}
                                className={`relative ${thumbSize} aspect-square rounded-lg border border-gray-200 shadow-sm overflow-hidden bg-gray-100 hover:ring-2 hover:ring-primary/50 transition-shadow shrink-0`}
                              >
                                {creative.thumbnailLink ? (
                                  <img
                                    src={creative.thumbnailLink}
                                    alt={creative.fileName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span
                                    className={`material-symbols-outlined ${iconSize} text-gray-400 flex items-center justify-center w-full h-full`}
                                  >
                                    {creative.mimeType?.startsWith("video/")
                                      ? "movie"
                                      : "image"}
                                  </span>
                                )}
                                {creative.mimeType?.startsWith("video/") && (
                                  <span className="absolute inset-0 flex items-center justify-center bg-black/20">
                                    <span
                                      className={`material-symbols-outlined ${playSize} text-white`}
                                    >
                                      play_arrow
                                    </span>
                                  </span>
                                )}
                              </a>
                            ))}
                          </div>
                        );
                      })()
                    : "—"}
                </td>
                <td className="py-4 px-2 whitespace-nowrap align-top">
                  <button
                    onClick={() => onTogglePosted(entry)}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium border transition-colors ${
                      entry.posted
                        ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                        : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"
                    }`}
                    title="Click to toggle posted status"
                  >
                    <span className="material-symbols-outlined text-[12px]">
                      {entry.posted ? "check_circle" : "schedule"}
                    </span>
                    {entry.posted ? "Posted" : "Pending"}
                  </button>
                </td>
                <td className="py-4 px-2 text-right whitespace-nowrap align-top">
                  <div className="flex items-center justify-end gap-0.5">
                    <button
                      onClick={() => onEdit(entry)}
                      className="p-1 text-gray-600 hover:text-primary hover:bg-gray-100 rounded"
                      title="Edit"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        edit
                      </span>
                    </button>
                    <button
                      onClick={() => onDelete(entry)}
                      className="p-1 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Delete"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        delete
                      </span>
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
