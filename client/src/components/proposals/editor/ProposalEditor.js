"use client";
import React, { useState, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useProposalEditor } from "./useProposalEditor";
import ProposalPlaceholderSidebar from "./ProposalPlaceholderSidebar";
import AgreementPage from "@/components/agreements/editor/AgreementPage";
import AgreementPageSidebar from "@/components/agreements/editor/AgreementPageSidebar";
import EditorToolbar from "@/components/agreements/editor/EditorToolbar";
import VersionHistoryPanel from "@/components/agreements/editor/VersionHistoryPanel";
import ActivityLogPanel from "@/components/agreements/editor/ActivityLogPanel";
import ProposalEmailButton from "@/components/proposals/ProposalEmailButton";
import { tiptapPagesToDocxBlob } from "@/lib/tiptapToDocx";
import { getNodesPdfBlob, exportNodesToPdf } from "@/lib/Pdfexport";
import { shareFileNatively, buildWhatsAppUrl } from "@/lib/documentShare";
import { saveProposalTemplate } from "@/services/proposalService";

// Mirrors agreements/editor/AgreementEditor.js — same toolbar/page-sidebar/
// placeholder-sidebar layout and export/save/share actions, reusing the
// Agreement Generator's own page-shell components directly (AgreementPage/
// AgreementPageSidebar/EditorToolbar/VersionHistoryPanel/ActivityLogPanel
// have zero agreement-specific logic — see the Proposal Generator plan's
// Context section). Drops AI-fill (no upstream document for a first-contact
// proposal to extract from) and "Upload signed copy" (that's specifically
// about executing an Agreement, not a proposal).

const SAVE_STATUS_LABEL = {
  idle: "",
  saving: "Saving…",
  saved: "Saved",
  error: "Save failed — retrying",
  conflict: "Changed elsewhere — reload to see the latest",
};

const EMPTY_PAGE_DOC = { type: "doc", content: [{ type: "paragraph", content: [] }] };

function safeFileName(name) {
  return (name || "Proposal").replace(/[\\/:*?"<>|]/g, "_");
}

const genPageId = () => `page-${Date.now()}-${Math.round(Math.random() * 1e6)}`;

const Divider = () => <div className="mx-1 h-6 w-px shrink-0 bg-outline-variant" />;

export default function ProposalEditor({ proposalId }) {
  const router = useRouter();
  const data = useProposalEditor(proposalId);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [selectedPageId, setSelectedPageId] = useState(null);

  // One Tiptap editor instance per page (see AgreementPage.js) — kept in
  // real state (not a ref) so binding the shared toolbar/sidebar to
  // whichever page is active actually re-renders them.
  const [pageEditors, setPageEditors] = useState({});
  const pageDomRefsRef = useRef({});

  const handleEditorReady = useCallback((pageId, editor) => {
    setPageEditors((prev) => {
      if (!editor) {
        if (!(pageId in prev)) return prev;
        const next = { ...prev };
        delete next[pageId];
        return next;
      }
      return { ...prev, [pageId]: editor };
    });
  }, []);

  const registerPageDomRef = useCallback((pageId, el) => {
    if (el) pageDomRefsRef.current[pageId] = el;
    else delete pageDomRefsRef.current[pageId];
  }, []);

  const pages = useMemo(() => data.documentData?.pages || [], [data.documentData]);
  // Falls back to the first page until the user explicitly picks another —
  // derived on every render rather than synced via an effect.
  const activePageId = selectedPageId && pages.some((p) => p.id === selectedPageId) ? selectedPageId : pages[0]?.id || null;
  const activeEditor = activePageId ? pageEditors[activePageId] : null;

  const handlePageContentUpdate = useCallback(
    (pageId, json) => {
      data.setDocumentData((prev) => ({
        ...prev,
        pages: prev.pages.map((p) => (p.id === pageId ? { ...p, content: json } : p)),
      }));
    },
    [data]
  );

  const handleAddPage = useCallback(() => {
    const newPage = { id: genPageId(), content: EMPTY_PAGE_DOC };
    data.setDocumentData((prev) => ({ ...prev, pages: [...prev.pages, newPage] }));
    setSelectedPageId(newPage.id);
  }, [data]);

  const handleDeletePage = useCallback(
    (pageId) => {
      data.setDocumentData((prev) => {
        if (prev.pages.length <= 1) return prev;
        return { ...prev, pages: prev.pages.filter((p) => p.id !== pageId) };
      });
    },
    [data]
  );

  const handleReorderPages = useCallback(
    (fromIndex, toIndex) => {
      data.setDocumentData((prev) => {
        const next = [...prev.pages];
        const [moved] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, moved);
        return { ...prev, pages: next };
      });
    },
    [data]
  );

  // No dedicated top-level /proposals dashboard exists (Proposals only
  // lives as a per-client tab) — router.back() returns to wherever the
  // user actually came from (the client's Proposals tab) instead of
  // guessing a hardcoded destination.
  const handleBack = useCallback(() => {
    if (data.isDirty && !window.confirm("You have unsaved changes. Leave anyway?")) return;
    router.back();
  }, [data.isDirty, router]);

  // Real page DOM nodes, in the document's current order.
  const orderedPageNodes = useCallback(() => pages.map((p) => pageDomRefsRef.current[p.id]).filter(Boolean), [pages]);

  const buildExportBlobs = useCallback(
    async ({ pdf = true, docx = true } = {}) => {
      const pdfBlob = pdf ? await getNodesPdfBlob(orderedPageNodes(), { orientation: "portrait" }) : null;
      const docxBlob = docx ? await tiptapPagesToDocxBlob(pages, { title: data.title }) : null;
      return { pdfBlob, docxBlob };
    },
    [orderedPageNodes, pages, data.title]
  );

  const handleDownloadPdf = useCallback(async () => {
    await exportNodesToPdf(orderedPageNodes(), `${safeFileName(data.title)}.pdf`, { orientation: "portrait" });
  }, [orderedPageNodes, data.title]);

  const handleDownloadDocx = useCallback(async () => {
    const blob = await tiptapPagesToDocxBlob(pages, { title: data.title });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${safeFileName(data.title)}.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [pages, data.title]);

  const handleExportToDrive = useCallback(async () => {
    try {
      const { pdfBlob, docxBlob } = await buildExportBlobs();
      await data.exportProposal({ pdfBlob, docxBlob });
      window.alert("Proposal exported and saved to the client's Google Drive folder.");
    } catch (err) {
      window.alert(err.message || "Failed to export the proposal");
    }
  }, [buildExportBlobs, data]);

  const handleFinalize = useCallback(async () => {
    if (!window.confirm("Finalize this proposal? This saves a version snapshot and freezes the client details used.")) return;
    try {
      await data.finalize();
      window.alert("Proposal finalized.");
    } catch (err) {
      window.alert(err.message || "Failed to finalize the proposal");
    }
  }, [data]);

  // Same already-fixed WhatsApp flow as AgreementEditor.js: a fresh PDF is
  // always built first (never gated on a prior Drive export existing), so
  // the "export first" bug that flow originally had is never reintroduced.
  const handleShareWhatsApp = useCallback(async () => {
    const phone = data.proposal?.client?.whatsappNumber || data.proposal?.client?.phoneNumber;
    if (!phone) {
      window.alert("No WhatsApp or phone number on file for this client.");
      return;
    }
    const { pdfBlob } = await buildExportBlobs({ docx: false });
    const message = `Hi, please find the proposal "${data.title}" attached.`;
    const shareResult = await shareFileNatively({ blob: pdfBlob, fileName: `${safeFileName(data.title)}.pdf`, mimeType: "application/pdf", title: data.title, text: message });
    if (shareResult === "shared" || shareResult === "cancelled") return;

    const latestExport = data.proposal?.exports?.[0];
    if (latestExport?.webViewLink) {
      window.open(buildWhatsAppUrl(phone, `${message}\n\n${latestExport.webViewLink}`), "_blank");
      return;
    }
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${safeFileName(data.title)}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    window.open(buildWhatsAppUrl(phone, message), "_blank");
    window.alert("Downloaded the PDF — attach it to the WhatsApp chat that just opened.");
  }, [data, buildExportBlobs]);

  const handleSaveAsTemplate = useCallback(async () => {
    const name = window.prompt("Template name:", `${data.title} Template`);
    if (!name || !name.trim()) return;
    setIsSavingTemplate(true);
    try {
      await data.save();
      await saveProposalTemplate({ proposalId, name: name.trim(), isShared: true });
      window.alert("Saved as a reusable template.");
    } catch (err) {
      window.alert(err.message || "Failed to save template");
    } finally {
      setIsSavingTemplate(false);
    }
  }, [proposalId, data]);

  if (data.loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#EAE8E4]">
        <span className="material-symbols-outlined animate-spin text-[32px] text-on-surface-variant">progress_activity</span>
      </div>
    );
  }

  if (data.loadError || !data.documentData || pages.length === 0) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-[#EAE8E4]">
        <p className="text-body-md text-red-700">{data.loadError || "This proposal could not be loaded."}</p>
        <button onClick={() => router.back()} className="rounded-md bg-primary px-4 py-2 text-white">
          Back
        </button>
      </div>
    );
  }

  const latestExport = data.proposal?.exports?.[0];

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#EAE8E4]">
      <div className="flex flex-wrap items-center gap-2 border-b border-outline-variant bg-surface px-4 py-2.5">
        {/* Identity group: where am I, what is this */}
        <button type="button" onClick={handleBack} title="Back" className="rounded p-1.5 text-on-surface-variant hover:bg-surface-variant">
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>
        <input
          value={data.title}
          onChange={(e) => data.setTitle(e.target.value)}
          className="min-w-40 max-w-[320px] rounded px-2 py-1 font-title-md text-title-md text-on-surface outline-none hover:bg-surface-variant focus:bg-surface-variant"
        />
        <div className="flex items-center gap-1.5">
          {data.proposal?.client?.name && <span className="rounded-full bg-primary/10 px-3 py-1 font-label-sm text-label-sm text-primary">{data.proposal.client.name}</span>}
          <span className="rounded-full bg-surface-variant px-3 py-1 font-label-sm text-label-sm text-on-surface-variant">{data.proposal?.proposalNumber}</span>
          <span className="rounded-full border border-outline-variant px-3 py-1 font-label-sm text-label-sm capitalize text-on-surface-variant">{data.proposal?.status?.replace(/_/g, " ")}</span>
        </div>
        <span className={`font-label-sm text-label-sm ${data.saveStatus === "error" || data.saveStatus === "conflict" ? "text-red-600" : "text-on-surface-variant"}`}>
          {SAVE_STATUS_LABEL[data.saveStatus]}
        </span>

        <div className="ml-auto flex items-center gap-1.5">
          {/* Share group */}
          {latestExport && <ProposalEmailButton proposal={latestExport} client={data.proposal?.client} />}
          <button type="button" onClick={handleShareWhatsApp} title="Share via WhatsApp" className="rounded p-1.5 text-on-surface-variant hover:bg-surface-variant">
            <span className="material-symbols-outlined text-[20px]">share</span>
          </button>

          <Divider />

          {/* Lifecycle group */}
          <button
            type="button"
            onClick={handleFinalize}
            title="Snapshot a version and freeze the client details used"
            className="rounded-md border border-outline-variant px-3 py-1.5 font-label-md text-label-md text-on-surface hover:bg-surface-variant"
          >
            Finalize
          </button>

          <div className="relative">
            <button type="button" onClick={() => setMoreMenuOpen((p) => !p)} title="More" className="rounded p-1.5 text-on-surface-variant hover:bg-surface-variant">
              <span className="material-symbols-outlined text-[18px]">more_vert</span>
            </button>
            {moreMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMoreMenuOpen(false)} />
                <div className="absolute right-0 z-20 mt-1 w-52 rounded-lg border border-outline-variant bg-white py-1 shadow-lg">
                  <button
                    type="button"
                    onClick={() => {
                      handleSaveAsTemplate();
                      setMoreMenuOpen(false);
                    }}
                    disabled={isSavingTemplate}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-body-sm text-on-surface hover:bg-surface-variant disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[16px]">bookmark_add</span>
                    Save as template
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVersionsOpen(true);
                      setMoreMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-body-sm text-on-surface hover:bg-surface-variant"
                  >
                    <span className="material-symbols-outlined text-[16px]">history</span>
                    Version history
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActivityOpen(true);
                      setMoreMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-body-sm text-on-surface hover:bg-surface-variant"
                  >
                    <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                    Activity
                  </button>
                </div>
              </>
            )}
          </div>

          <Divider />

          {/* Export / save group */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setExportMenuOpen((p) => !p)}
              disabled={data.isExporting}
              className="flex items-center gap-1.5 rounded-md bg-[#4285F4] px-3 py-1.5 font-label-md text-label-md text-white hover:bg-[#3367D6] disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-[16px]">{data.isExporting ? "progress_activity" : "picture_as_pdf"}</span>
              {data.isExporting ? "Exporting…" : "Export"}
            </button>
            {exportMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setExportMenuOpen(false)} />
                <div className="absolute right-0 z-20 mt-1 w-60 rounded-lg border border-outline-variant bg-white py-1 shadow-lg">
                  <button
                    type="button"
                    onClick={() => {
                      handleDownloadPdf();
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
                      handleDownloadDocx();
                      setExportMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-body-sm text-on-surface hover:bg-surface-variant"
                  >
                    <span className="material-symbols-outlined text-[16px]">description</span>
                    Download DOCX
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleExportToDrive();
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

          <button type="button" onClick={data.save} className="rounded-md border border-outline-variant px-3 py-1.5 font-label-md text-label-md text-on-surface hover:bg-surface-variant">
            Save
          </button>
        </div>
      </div>

      <EditorToolbar editor={activeEditor} />

      <div className="flex flex-1 overflow-hidden">
        <AgreementPageSidebar
          pages={pages}
          activePageId={activePageId}
          onSelectPage={setSelectedPageId}
          onAddPage={handleAddPage}
          onDeletePage={handleDeletePage}
          onReorderPages={handleReorderPages}
        />

        <div className="flex-1 overflow-y-auto py-10">
          <div className="flex flex-col items-center gap-10">
            {pages.map((page, index) => (
              <AgreementPage
                key={page.id}
                page={page}
                index={index}
                totalPages={pages.length}
                isActive={page.id === activePageId}
                onActivate={() => setSelectedPageId(page.id)}
                onUpdate={handlePageContentUpdate}
                onEditorReady={handleEditorReady}
                registerRef={registerPageDomRef}
              />
            ))}
          </div>
        </div>

        <ProposalPlaceholderSidebar editor={activeEditor} proposal={data.proposal} pages={pages} pageEditors={pageEditors} onSelectPage={setSelectedPageId} />
      </div>

      <VersionHistoryPanel open={versionsOpen} onClose={() => setVersionsOpen(false)} loadVersions={data.loadVersions} onRestore={data.restoreVersion} />
      <ActivityLogPanel open={activityOpen} onClose={() => setActivityOpen(false)} loadActivity={data.loadActivity} />
    </div>
  );
}
