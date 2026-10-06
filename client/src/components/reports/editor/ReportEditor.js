"use client";
import React, { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useReportEditor } from "./useReportEditor";
import EditorTopToolbar from "./EditorTopToolbar";
import PageSidebar from "./PageSidebar";
import EditorCanvas from "./EditorCanvas";
import PropertiesPanel from "./PropertiesPanel";
import SaveAsTemplateModal from "./SaveAsTemplateModal";
import ReportPreviewModal from "./ReportPreviewModal";
import { saveReportTemplate } from "@/services/reportService";

export default function ReportEditor({ reportId }) {
  const router = useRouter();
  const editor = useReportEditor(reportId);
  const pageRefsRef = useRef([]);
  const [zoom, setZoom] = useState(1);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateError, setTemplateError] = useState("");
  const [uploadingElementId, setUploadingElementId] = useState(null);

  const handleBackToDashboard = useCallback(() => {
    if (editor.isDirty && !window.confirm("You have unsaved changes. Leave anyway?")) return;
    router.push("/reports");
  }, [editor.isDirty, router]);

  const handleAddElement = useCallback(
    (type) => {
      if (!editor.selectedPageId) return;
      editor.addElement(editor.selectedPageId, type, { x: 30, y: 30 });
    },
    [editor]
  );

  const handlePickImage = useCallback(
    async (pageId, elementId, file) => {
      setUploadingElementId(elementId);
      try {
        const asset = await editor.uploadAsset(file);
        editor.updateElement(pageId, elementId, { assetId: asset.id, src: `/api/documents/${asset.id}/stream` });
      } catch (err) {
        window.alert(err.message || "Failed to upload the image");
      } finally {
        setUploadingElementId(null);
      }
    },
    [editor]
  );

  const handleSaveAsTemplate = useCallback(
    async ({ name, description, isShared }) => {
      setSavingTemplate(true);
      setTemplateError("");
      try {
        await editor.save();
        await saveReportTemplate({ reportId, name, description, isShared });
        setTemplateModalOpen(false);
      } catch (err) {
        setTemplateError(err.message || "Failed to save template");
      } finally {
        setSavingTemplate(false);
      }
    },
    [editor, reportId]
  );

  const handleDownloadPdf = useCallback(async () => {
    try {
      await editor.downloadPdf(pageRefsRef.current);
    } catch (err) {
      window.alert(err.message || "Failed to generate the PDF");
    }
  }, [editor]);

  const handleExportToDrive = useCallback(async () => {
    try {
      await editor.exportToDrive(pageRefsRef.current);
      window.alert("Report exported and saved to the client's Google Drive folder.");
    } catch (err) {
      window.alert(err.message || "Failed to save the report to Google Drive");
    }
  }, [editor]);

  // The dashboard's "Export PDF" quick action can't render a page's DOM
  // itself (PDF generation needs the actual mounted canvas nodes — see
  // EditorCanvas.js's header comment), so it links here with ?autoExport=1
  // instead. A short delay lets the just-mounted pages paint and their refs
  // attach before capture runs. Reads location.search directly rather than
  // next/navigation's useSearchParams(), which needs a <Suspense> boundary
  // this app has no existing precedent for.
  const autoExportTriggered = useRef(false);
  useEffect(() => {
    if (editor.loading || autoExportTriggered.current) return;
    if (typeof window === "undefined") return;
    if (new URLSearchParams(window.location.search).get("autoExport") !== "1") return;
    autoExportTriggered.current = true;
    const timer = setTimeout(() => {
      handleExportToDrive();
    }, 500);
    return () => clearTimeout(timer);
  }, [editor.loading, handleExportToDrive]);

  if (editor.loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#EAE8E4]">
        <span className="material-symbols-outlined animate-spin text-[32px] text-on-surface-variant">progress_activity</span>
      </div>
    );
  }

  if (editor.loadError || !editor.documentData) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-[#EAE8E4]">
        <p className="text-body-md text-red-700">{editor.loadError || "This report could not be loaded."}</p>
        <button onClick={() => router.push("/reports")} className="rounded-md bg-primary px-4 py-2 text-white">
          Back to Reports
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#EAE8E4]">
      <EditorTopToolbar
        title={editor.title}
        onTitleChange={editor.setTitle}
        clientName={editor.report?.client?.name}
        saveStatus={editor.saveStatus}
        onSave={editor.save}
        onUndo={editor.undo}
        onRedo={editor.redo}
        canUndo={editor.canUndo}
        canRedo={editor.canRedo}
        zoom={zoom}
        onZoomChange={setZoom}
        onAddElement={handleAddElement}
        onPreview={() => setPreviewOpen(true)}
        onSaveAsTemplate={() => setTemplateModalOpen(true)}
        onDownloadPdf={handleDownloadPdf}
        onExportToDrive={handleExportToDrive}
        isExporting={editor.isExporting}
        onBackToDashboard={handleBackToDashboard}
      />

      <div className="flex flex-1 overflow-hidden">
        <PageSidebar
          pages={editor.documentData.pages}
          pageSize={editor.documentData.pageSize}
          selectedPageId={editor.selectedPageId}
          onSelectPage={(id) => {
            editor.setSelectedPageId(id);
            editor.setSelectedElementId(null);
          }}
          onAddPage={(kind) => editor.addPage(kind)}
          onDuplicatePage={editor.duplicatePage}
          onDeletePage={editor.removePage}
          onRenamePage={editor.renamePage}
          onReorderPages={editor.reorderPages}
        />

        <div className="flex-1 overflow-y-auto">
          <EditorCanvas
            pages={editor.documentData.pages}
            pageSize={editor.documentData.pageSize}
            selectedPageId={editor.selectedPageId}
            selectedElementId={editor.selectedElementId}
            onSelectPage={editor.setSelectedPageId}
            onSelectElement={editor.setSelectedElementId}
            onUpdateElement={editor.updateElement}
            onCommitHistory={editor.snapshotHistory}
            onRemoveElement={editor.removeElement}
            onPickImage={handlePickImage}
            uploadingElementId={uploadingElementId}
            zoom={zoom}
            pageRefsRef={pageRefsRef}
          />
        </div>

        <PropertiesPanel
          selectedPage={editor.selectedPage}
          selectedElement={editor.selectedElement}
          onUpdateElement={(patch) => editor.updateElement(editor.selectedPageId, editor.selectedElementId, patch)}
          onUpdatePage={(patch) => editor.updatePage(editor.selectedPageId, patch)}
          onCommitHistory={editor.snapshotHistory}
          onDuplicateElement={() => editor.duplicateElement(editor.selectedPageId, editor.selectedElementId)}
          onRemoveElement={() => editor.removeElement(editor.selectedPageId, editor.selectedElementId)}
        />
      </div>

      <SaveAsTemplateModal
        open={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
        onSave={handleSaveAsTemplate}
        saving={savingTemplate}
        error={templateError}
      />

      <ReportPreviewModal open={previewOpen} onClose={() => setPreviewOpen(false)} documentData={editor.documentData} />
    </div>
  );
}
