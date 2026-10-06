"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import {
  fetchReports,
  duplicateReport,
  trashReport,
  restoreReport,
  permanentlyDeleteReport,
  renameReportTitle,
} from "@/redux/slices/reportsSlice";
import { fetchClients } from "@/redux/slices/clientsSlice";
import ReportCard from "./ReportCard";
import CreateReportModal from "./CreateReportModal";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "generating", label: "Generating" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
];

export default function ReportsDashboard() {
  const dispatch = useDispatch();
  const router = useRouter();

  const { reports, pagination, loading, error } = useSelector((s) => s.reports);
  const rawClients = useSelector((s) => s.clients.clients);

  const [view, setView] = useState("grid");
  const [search, setSearch] = useState("");
  const [clientId, setClientId] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [isTrashView, setIsTrashView] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const clients = useMemo(() => (Array.isArray(rawClients) ? rawClients : []), [rawClients]);

  useEffect(() => {
    dispatch(fetchClients({ limit: 100 }));
  }, [dispatch]);

  useEffect(() => {
    const params = { page, limit: 24, trashed: isTrashView ? "true" : undefined };
    if (search.trim()) params.search = search.trim();
    if (clientId) params.clientId = clientId;
    if (status) params.status = status;
    dispatch(fetchReports(params));
  }, [dispatch, page, search, clientId, status, isTrashView]);

  const refresh = () => {
    const params = { page, limit: 24, trashed: isTrashView ? "true" : undefined };
    if (search.trim()) params.search = search.trim();
    if (clientId) params.clientId = clientId;
    if (status) params.status = status;
    dispatch(fetchReports(params));
  };

  const handleOpen = (report) => router.push(`/reports/${report.id}`);
  const handleExport = (report) => router.push(`/reports/${report.id}?autoExport=1`);
  const handleDownload = (report) => window.open(report.driveWebViewLink, "_blank");

  const handleDuplicate = async (report) => {
    try {
      const res = await dispatch(duplicateReport(report.id)).unwrap();
      router.push(`/reports/${res.data.id}`);
    } catch {
      // error surfaced via slice state
    }
  };

  const handleRename = async (report) => {
    const newTitle = window.prompt("Rename report", report.title);
    if (!newTitle || !newTitle.trim() || newTitle.trim() === report.title) return;
    await dispatch(renameReportTitle({ id: report.id, title: newTitle.trim() }));
  };

  const handleTrash = async (report) => {
    if (!window.confirm(`Move "${report.title}" to trash?`)) return;
    await dispatch(trashReport(report.id));
  };

  const handleRestore = async (report) => {
    await dispatch(restoreReport(report.id));
    refresh();
  };

  const handlePermanentDelete = async (report) => {
    if (!window.confirm(`Permanently delete "${report.title}"? This cannot be undone. Any already-exported PDFs stay in the client's Drive folder.`)) return;
    await dispatch(permanentlyDeleteReport(report.id));
  };

  return (
    <main className="flex-1 p-container-margin overflow-x-hidden">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-headline-md text-headline-md text-on-surface">Reports</h1>
            <p className="mt-1 text-body-sm text-on-surface-variant">Build, customize, and export branded client reports.</p>
          </div>
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-label-md text-label-md text-white shadow-sm hover:bg-primary/90"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Create New Report
          </button>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-outline-variant bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:flex-wrap">
          <div className="relative min-w-[220px] flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">search</span>
            <input
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              placeholder="Search by title, client, or creator…"
              className="w-full rounded-lg border border-outline-variant py-2 pl-10 pr-3 text-body-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <select
            value={clientId}
            onChange={(e) => {
              setPage(1);
              setClientId(e.target.value);
            }}
            className="rounded-lg border border-outline-variant px-3 py-2 text-body-sm outline-none focus:border-primary"
          >
            <option value="">All clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
            className="rounded-lg border border-outline-variant px-3 py-2 text-body-sm outline-none focus:border-primary"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => {
              setIsTrashView((p) => !p);
              setPage(1);
            }}
            className={`rounded-lg border px-3 py-2 text-body-sm ${isTrashView ? "border-primary bg-primary/10 text-primary" : "border-outline-variant text-on-surface-variant hover:bg-surface-variant"}`}
          >
            <span className="material-symbols-outlined mr-1 align-middle text-[16px]">delete</span>
            {isTrashView ? "Viewing Trash" : "Trash"}
          </button>

          <div className="ml-auto flex items-center gap-1 rounded-lg border border-outline-variant p-0.5">
            <button
              type="button"
              onClick={() => setView("grid")}
              className={`rounded p-1.5 ${view === "grid" ? "bg-primary/10 text-primary" : "text-on-surface-variant"}`}
            >
              <span className="material-symbols-outlined text-[18px]">grid_view</span>
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              className={`rounded p-1.5 ${view === "list" ? "bg-primary/10 text-primary" : "text-on-surface-variant"}`}
            >
              <span className="material-symbols-outlined text-[18px]">view_list</span>
            </button>
          </div>
        </div>

        {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-body-sm text-red-700">{error}</div>}

        {loading ? (
          <div className={view === "grid" ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "space-y-3"}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={`animate-pulse rounded-xl border border-outline-variant bg-white ${view === "grid" ? "h-48" : "h-20"}`} />
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-outline-variant bg-white py-16 text-center">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant">{isTrashView ? "delete" : "description"}</span>
            <h3 className="font-title-lg text-title-lg text-on-surface">{isTrashView ? "Trash is empty" : "No reports yet"}</h3>
            <p className="text-body-sm text-on-surface-variant">
              {isTrashView ? "Reports you move to trash will show up here." : "Create your first report to get started."}
            </p>
          </div>
        ) : (
          <div className={view === "grid" ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "space-y-3"}>
            {reports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                view={view}
                isTrashView={isTrashView}
                onOpen={() => handleOpen(report)}
                onDuplicate={() => handleDuplicate(report)}
                onRename={() => handleRename(report)}
                onExport={() => handleExport(report)}
                onDownload={() => handleDownload(report)}
                onTrash={() => handleTrash(report)}
                onRestore={() => handleRestore(report)}
                onPermanentDelete={() => handlePermanentDelete(report)}
              />
            ))}
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-md border border-outline-variant px-3 py-1.5 text-body-sm disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-body-sm text-on-surface-variant">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              type="button"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-md border border-outline-variant px-3 py-1.5 text-body-sm disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {createModalOpen && <CreateReportModal onClose={() => setCreateModalOpen(false)} />}
    </main>
  );
}
