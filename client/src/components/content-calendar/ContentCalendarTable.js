"use client";

import React from "react";
import { getPlatformMeta, getStatusMeta, STATUS_OPTIONS, formatDateDisplay, getWeekDay } from "./constants";

export default function ContentCalendarTable({
  entries,
  loading,
  showClientColumn = true,
  draftRows = [],
}) {
  if (loading) {
    return (
      <div className="py-8 text-center text-gray-500">
        <span className="animate-spin material-symbols-outlined text-[24px]">
          progress_activity
        </span>
      </div>
    );
  }

  if ((!entries || entries.length === 0) && draftRows.length === 0) {
    return (
      <div className="py-12 px-6 text-center text-gray-500">
        <span className="material-symbols-outlined text-[40px] mb-1.5 text-gray-300">
          event_note
        </span>
        <p className="font-semibold text-gray-600 text-sm">No content calendar entries found.</p>
        <p className="text-xs text-gray-400 mt-1">Connect a Google Sheet to see posts here.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="py-2 px-2.5 font-label-sm text-[10px] text-gray-700 uppercase tracking-wider whitespace-nowrap">
              Date
            </th>
            <th className="py-2 px-2 font-label-sm text-[10px] text-gray-700 uppercase tracking-wider whitespace-nowrap">
              Day
            </th>
            {showClientColumn && (
              <th className="py-2 px-2 font-label-sm text-[10px] text-gray-700 uppercase tracking-wider whitespace-nowrap">
                Client
              </th>
            )}
            <th className="py-2 px-2 font-label-sm text-[10px] text-gray-700 uppercase tracking-wider min-w-[90px]">
              Holiday
            </th>
            <th className="py-2 px-2 font-label-sm text-[10px] text-gray-700 uppercase tracking-wider min-w-[140px]">
              Post Title
            </th>
            <th className="py-2 px-2 font-label-sm text-[10px] text-gray-700 uppercase tracking-wider min-w-[220px]">
              Format / Pillar / Banner
            </th>
            <th className="py-2 px-2 font-label-sm text-[10px] text-gray-700 uppercase tracking-wider min-w-[220px]">
              Caption &amp; Copy
            </th>
            <th className="py-2 px-2 font-label-sm text-[10px] text-gray-700 uppercase tracking-wider min-w-[140px]">
              Hashtags
            </th>
            <th className="py-2 px-2 font-label-sm text-[10px] text-gray-700 uppercase tracking-wider whitespace-nowrap">
              Platforms
            </th>
            <th className="py-2 px-2 font-label-sm text-[10px] text-gray-700 uppercase tracking-wider min-w-[100px]">
              Image / Pinterest
            </th>
            <th className="py-2 px-2 font-label-sm text-[10px] text-gray-700 uppercase tracking-wider whitespace-nowrap">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {entries.map((entry, entryIdx) => {
            const creatives = entry.creatives || [];

            // Parse formatted content for badges
            const contentLines = (entry.content || "").split("\n").filter(Boolean);
            const metaHeader = contentLines.find((l) => l.startsWith("[") && l.endsWith("]"));
            const otherContent = contentLines.filter((l) => l !== metaHeader);

            return (
              <tr
                key={entry.id || `entry-${entryIdx}`}
                className={`hover:bg-gray-50/70 transition-colors ${
                  entry.holiday ? "bg-purple-50/30" : ""
                }`}
              >
                {/* Date */}
                <td className="py-3 px-2.5 text-gray-900 whitespace-nowrap font-semibold align-top">
                  {formatDateDisplay(entry.date)}
                </td>

                {/* Day */}
                <td className="py-3 px-2 text-gray-500 whitespace-nowrap align-top text-[11px]">
                  {getWeekDay(entry.date)}
                </td>

                {/* Client (optional) */}
                {showClientColumn && (
                  <td className="py-3 px-2 text-gray-700 whitespace-nowrap font-medium align-top">
                    {entry.clientName || "—"}
                  </td>
                )}

                {/* Holiday */}
                <td className="py-3 px-2 text-gray-700 align-top">
                  {entry.holiday ? (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-800 font-medium text-[10px]">
                      <span className="material-symbols-outlined text-[12px]">celebration</span>
                      {entry.holiday}
                    </span>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>

                {/* Post Title */}
                <td className="py-3 px-2 text-gray-900 font-semibold align-top max-w-[180px] break-words">
                  {entry.postTitle || "—"}
                </td>

                {/* Rich Content — Format / Pillar / Banner */}
                <td className="py-3 px-2 text-gray-700 align-top max-w-[240px]">
                  {metaHeader && (
                    <div className="flex flex-wrap gap-1 mb-1">
                      {metaHeader
                        .slice(1, -1)
                        .split("|")
                        .map((tag, tIdx) => {
                          const trimmed = tag.trim();
                          const isFormat = trimmed.toLowerCase().startsWith("format");
                          const isPillar = trimmed.toLowerCase().startsWith("pillar");
                          const isWeek = trimmed.toLowerCase().startsWith("week");
                          return (
                            <span
                              key={tIdx}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                isFormat
                                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                                  : isPillar
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : isWeek
                                  ? "bg-purple-50 text-purple-700 border border-purple-200"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {trimmed}
                            </span>
                          );
                        })}
                    </div>
                  )}
                  {otherContent.length > 0 ? (
                    <div className="space-y-0.5 text-[11px] text-gray-600 leading-snug">
                      {otherContent.map((line, lIdx) => (
                        <p key={lIdx} className={line.startsWith("Banner Content:") ? "font-medium text-gray-800" : ""}>
                          {line}
                        </p>
                      ))}
                    </div>
                  ) : !metaHeader ? (
                    <span className="text-gray-300">—</span>
                  ) : null}
                </td>

                {/* Caption & Copy */}
                <td className="py-3 px-2 text-gray-700 align-top max-w-[260px]">
                  {entry.caption ? (
                    <p className="text-[11px] leading-snug whitespace-pre-line line-clamp-5 text-gray-700">
                      {entry.caption}
                    </p>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>

                {/* Hashtags */}
                <td className="py-3 px-2 text-gray-600 align-top max-w-[160px]">
                  {entry.hashtags ? (
                    <p className="text-[11px] leading-snug text-blue-600 break-words">
                      {entry.hashtags}
                    </p>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>

                {/* Platforms */}
                <td className="py-3 px-2 align-top">
                  <div className="flex flex-wrap gap-1 items-center">
                    {Array.isArray(entry.platforms) && entry.platforms.length > 0
                      ? entry.platforms.map((p) => {
                          const meta = getPlatformMeta(p);
                          return (
                            <span
                              key={p}
                              title={meta.label}
                              className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white border border-gray-200 overflow-hidden shrink-0 shadow-2xs"
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
                      : <span className="text-gray-300">—</span>}
                  </div>
                </td>

                {/* Creatives / Links */}
                <td className="py-3 px-2 align-top">
                  {creatives.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {creatives.map((creative, cIdx) => {
                        const uniqueKey = creative.fileId || `creative-${entry.id || entryIdx}-${cIdx}`;
                        const linkUrl = creative.webViewLink || creative.driveLink;
                        const isPinterest =
                          creative.isPinterest ||
                          (linkUrl && (linkUrl.includes("pin.it") || linkUrl.includes("pinterest.")));
                        const isInstagram =
                          creative.isInstagram ||
                          (linkUrl && linkUrl.includes("instagram.com"));
                        const isDirectImage =
                          creative.thumbnailLink ||
                          (linkUrl && (/\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(linkUrl) || linkUrl.includes("pinimg.com")));

                        if (isPinterest) {
                          return (
                            <a
                              key={uniqueKey}
                              href={linkUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Open Pinterest Pin"
                              className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 hover:bg-red-100 border border-red-200 text-[#e60023] rounded-lg text-[10px] font-bold transition-all shadow-2xs group"
                            >
                              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                                <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345-.09.375-.291 1.199-.334 1.365-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.546.535 6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" />
                              </svg>
                              <span>Pinterest Pin</span>
                              <span className="material-symbols-outlined text-[12px] opacity-0 group-hover:opacity-100 transition-opacity">
                                open_in_new
                              </span>
                            </a>
                          );
                        }

                        if (isInstagram) {
                          return (
                            <a
                              key={uniqueKey}
                              href={linkUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Open Instagram Reference"
                              className="inline-flex items-center gap-1 px-2 py-1 bg-pink-50 hover:bg-pink-100 border border-pink-200 text-pink-700 rounded-lg text-[10px] font-bold transition-all shadow-2xs group"
                            >
                              <span className="material-symbols-outlined text-[13px] text-pink-600">
                                photo_camera
                              </span>
                              <span>Instagram Post</span>
                              <span className="material-symbols-outlined text-[12px] opacity-0 group-hover:opacity-100 transition-opacity">
                                open_in_new
                              </span>
                            </a>
                          );
                        }

                        if (isDirectImage) {
                          return (
                            <a
                              key={uniqueKey}
                              href={linkUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="View Image"
                              className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-lg text-[10px] font-bold transition-all shadow-2xs group"
                            >
                              <span className="material-symbols-outlined text-[13px]">image</span>
                              <span>Creative</span>
                              <span className="material-symbols-outlined text-[12px] opacity-0 group-hover:opacity-100 transition-opacity">
                                open_in_new
                              </span>
                            </a>
                          );
                        }

                        return linkUrl ? (
                          <a
                            key={uniqueKey}
                            href={linkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={creative.fileName || "View Creative"}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-lg text-[10px] font-medium transition-all shadow-2xs"
                          >
                            <span className="material-symbols-outlined text-[13px] text-blue-600">
                              link
                            </span>
                            <span className="max-w-[80px] truncate">{creative.fileName || "Asset"}</span>
                          </a>
                        ) : null;
                      })}
                    </div>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>

                {/* Status Badge (read-only display) */}
                <td className="py-3 px-2 whitespace-nowrap align-top">
                  <span
                    className={`px-2 py-0.5 rounded-full font-semibold text-[11px] border ${
                      getStatusMeta(entry.status).className
                    }`}
                  >
                    {getStatusMeta(entry.status).label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
