"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { fetchReportById, updateReport as updateReportApi, exportReportToDrive, uploadReportAsset } from "@/services/reportService";
import { buildPage, clonePageWithNewIds, createEmptyElement } from "@/lib/reportPageLayouts";
import { getNodesPdfBlob, exportNodesToPdf } from "@/lib/Pdfexport";
import { HEADING_MIN_SIZE } from "@/lib/reportDesignPresets";

const AUTOSAVE_DELAY_MS = 2000;
const MAX_HISTORY = 50;

const deepClone = (value) => JSON.parse(JSON.stringify(value));

// The single source of truth for one report's live editable state — every
// page/element mutation in the editor goes through here, not through Redux
// (see reportsSlice.js's header comment for why: a fast-changing canvas
// document re-rendering the whole store on every drag/keystroke is a
// performance problem Invoice/SalarySlip builders already solved the same
// way, with plain local state instead).
export function useReportEditor(reportId) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [title, setTitleState] = useState("");
  const [documentData, setDocumentDataState] = useState(null);
  const [selectedPageId, setSelectedPageId] = useState(null);
  const [selectedElementId, setSelectedElementId] = useState(null);

  const [saveStatus, setSaveStatus] = useState("idle"); // idle | saving | saved | error | conflict
  const [isDirty, setIsDirty] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  const revisionRef = useRef(0);
  const historyRef = useRef({ stack: [], index: -1 });
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const skipNextHistoryPush = useRef(false);

  // ── Load ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!reportId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError("");
      try {
        const res = await fetchReportById(reportId);
        if (cancelled) return;
        const data = res.data;
        setReport(data);
        setTitleState(data.title);
        setDocumentDataState(data.documentData);
        revisionRef.current = data.revision;
        historyRef.current = { stack: [deepClone(data.documentData)], index: 0 };
        setCanUndo(false);
        setCanRedo(false);
        setSelectedPageId(data.documentData?.pages?.[0]?.id || null);
      } catch (err) {
        if (!cancelled) setLoadError(err.message || "Failed to load report");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reportId]);

  // ── History (undo/redo) ──────────────────────────────────────────────
  const pushHistory = useCallback((doc) => {
    const h = historyRef.current;
    const snapshot = deepClone(doc);
    const truncated = h.stack.slice(0, h.index + 1);
    truncated.push(snapshot);
    if (truncated.length > MAX_HISTORY) truncated.shift();
    h.stack = truncated;
    h.index = truncated.length - 1;
    setCanUndo(h.index > 0);
    setCanRedo(false);
  }, []);

  // The one function every mutation (page/element add/update/remove/
  // reorder) goes through — pushes an undo snapshot and marks the document
  // dirty for autosave. `skipHistory` is for drag-in-progress updates
  // (ResizableElement reports every pointermove) — those commit the live
  // value for rendering but only the *final* position lands in the undo
  // stack (see commitAndSnapshotHistory below), not every intermediate
  // frame.
  const commitDocumentChange = useCallback(
    (updater, { skipHistory = false } = {}) => {
      setDocumentDataState((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        if (!skipHistory) pushHistory(next);
        return next;
      });
      setIsDirty(true);
    },
    [pushHistory]
  );

  // Call after a drag/resize/rotate gesture ends, to record ONE history
  // entry for the whole gesture instead of one per pointermove frame.
  const snapshotHistory = useCallback(() => {
    pushHistory(documentData);
  }, [documentData, pushHistory]);

  const undo = useCallback(() => {
    const h = historyRef.current;
    if (h.index <= 0) return;
    h.index -= 1;
    setDocumentDataState(deepClone(h.stack[h.index]));
    setCanUndo(h.index > 0);
    setCanRedo(h.index < h.stack.length - 1);
    setIsDirty(true);
  }, []);

  const redo = useCallback(() => {
    const h = historyRef.current;
    if (h.index >= h.stack.length - 1) return;
    h.index += 1;
    setDocumentDataState(deepClone(h.stack[h.index]));
    setCanUndo(h.index > 0);
    setCanRedo(h.index < h.stack.length - 1);
    setIsDirty(true);
  }, []);

  // ── Save (manual + debounced autosave) ──────────────────────────────
  const save = useCallback(async () => {
    if (!reportId || !documentData) return;
    setSaveStatus("saving");
    try {
      const res = await updateReportApi(reportId, { title, documentData, expectedRevision: revisionRef.current });
      revisionRef.current = res.data.revision;
      setIsDirty(false);
      setSaveStatus("saved");
    } catch (err) {
      if (err.message && err.message.toLowerCase().includes("changed elsewhere")) {
        setSaveStatus("conflict");
      } else {
        setSaveStatus("error");
      }
    }
  }, [reportId, documentData, title]);

  useEffect(() => {
    if (!isDirty || loading) return;
    const timer = setTimeout(() => {
      save();
    }, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentData, title, isDirty, loading]);

  // Warn before navigating away with unsaved changes.
  useEffect(() => {
    if (!isDirty) return undefined;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const setTitle = useCallback((value) => {
    setTitleState(value);
    setIsDirty(true);
  }, []);

  // ── Page operations ──────────────────────────────────────────────────
  const selectedPage = useMemo(() => documentData?.pages?.find((p) => p.id === selectedPageId) || null, [documentData, selectedPageId]);

  const selectedElement = useMemo(() => selectedPage?.elements?.find((e) => e.id === selectedElementId) || null, [selectedPage, selectedElementId]);

  const addPage = useCallback(
    (kind, atIndex) => {
      const newPage = buildPage(kind);
      commitDocumentChange((prev) => {
        const pages = [...prev.pages];
        const insertAt = atIndex === undefined ? pages.length : atIndex;
        pages.splice(insertAt, 0, newPage);
        return { ...prev, pages };
      });
      setSelectedPageId(newPage.id);
      setSelectedElementId(null);
    },
    [commitDocumentChange]
  );

  const duplicatePage = useCallback(
    (pageId) => {
      commitDocumentChange((prev) => {
        const index = prev.pages.findIndex((p) => p.id === pageId);
        if (index === -1) return prev;
        const copy = clonePageWithNewIds(prev.pages[index]);
        copy.name = `${prev.pages[index].name} (Copy)`;
        const pages = [...prev.pages];
        pages.splice(index + 1, 0, copy);
        setSelectedPageId(copy.id);
        return { ...prev, pages };
      });
    },
    [commitDocumentChange]
  );

  const removePage = useCallback(
    (pageId) => {
      commitDocumentChange((prev) => {
        if (prev.pages.length <= 1) return prev; // always keep at least one page
        const index = prev.pages.findIndex((p) => p.id === pageId);
        const pages = prev.pages.filter((p) => p.id !== pageId);
        if (pageId === selectedPageId) {
          const fallback = pages[Math.max(0, index - 1)];
          setSelectedPageId(fallback?.id || null);
          setSelectedElementId(null);
        }
        return { ...prev, pages };
      });
    },
    [commitDocumentChange, selectedPageId]
  );

  const renamePage = useCallback(
    (pageId, name) => {
      commitDocumentChange((prev) => ({
        ...prev,
        pages: prev.pages.map((p) => (p.id === pageId ? { ...p, name } : p)),
      }));
    },
    [commitDocumentChange]
  );

  // For page-level properties (currently just background) — distinct from
  // renamePage since the Properties Panel's "no element selected" view
  // edits the page itself, not one of its elements.
  const updatePage = useCallback(
    (pageId, patch) => {
      commitDocumentChange((prev) => ({
        ...prev,
        pages: prev.pages.map((p) => (p.id === pageId ? { ...p, ...patch } : p)),
      }));
    },
    [commitDocumentChange]
  );

  // One history entry for every page at once, rather than one per page —
  // "apply to all" is a single user action and should undo as one.
  const applyBorderToAllPages = useCallback(
    (border) => {
      commitDocumentChange((prev) => ({
        ...prev,
        pages: prev.pages.map((p) => ({ ...p, border })),
      }));
    },
    [commitDocumentChange]
  );

  // Walks every text element and sets its fontFamily based on whether it
  // reads as a heading (fontSize >= HEADING_MIN_SIZE) or body text — the
  // document schema has no explicit "role" field, and size is already a
  // reliable enough signal across these templates' own text elements.
  const applyFontPairing = useCallback(
    (preset) => {
      commitDocumentChange((prev) => ({
        ...prev,
        pages: prev.pages.map((p) => ({
          ...p,
          elements: p.elements.map((el) =>
            el.type !== "text" ? el : { ...el, fontFamily: (el.fontSize || 0) >= HEADING_MIN_SIZE ? preset.heading : preset.body }
          ),
        })),
      }));
    },
    [commitDocumentChange]
  );

  // Swaps the thank-you page's elements for a different variant's, keeping
  // its id/kind/background slot — a real set of editable elements the user
  // can still tweak afterward, not a locked design.
  const replaceThankYouPage = useCallback(
    (buildVariant) => {
      commitDocumentChange((prev) => ({
        ...prev,
        pages: prev.pages.map((p) => (p.kind !== "thankyou" ? p : { ...p, ...buildVariant() })),
      }));
    },
    [commitDocumentChange]
  );

  const reorderPages = useCallback(
    (fromIndex, toIndex) => {
      commitDocumentChange((prev) => {
        const pages = [...prev.pages];
        const [moved] = pages.splice(fromIndex, 1);
        pages.splice(toIndex, 0, moved);
        return { ...prev, pages };
      });
    },
    [commitDocumentChange]
  );

  // ── Element operations (always scoped to the given page) ────────────
  const addElement = useCallback(
    (pageId, type, position) => {
      const newElement = createEmptyElement(type, position);
      commitDocumentChange((prev) => ({
        ...prev,
        pages: prev.pages.map((p) => (p.id === pageId ? { ...p, elements: [...p.elements, newElement] } : p)),
      }));
      setSelectedElementId(newElement.id);
      return newElement;
    },
    [commitDocumentChange]
  );

  const updateElement = useCallback(
    (pageId, elementId, patch, { skipHistory = false } = {}) => {
      commitDocumentChange(
        (prev) => ({
          ...prev,
          pages: prev.pages.map((p) =>
            p.id !== pageId ? p : { ...p, elements: p.elements.map((el) => (el.id === elementId ? { ...el, ...patch } : el)) }
          ),
        }),
        { skipHistory }
      );
    },
    [commitDocumentChange]
  );

  const removeElement = useCallback(
    (pageId, elementId) => {
      commitDocumentChange((prev) => ({
        ...prev,
        pages: prev.pages.map((p) => (p.id !== pageId ? p : { ...p, elements: p.elements.filter((el) => el.id !== elementId) })),
      }));
      if (elementId === selectedElementId) setSelectedElementId(null);
    },
    [commitDocumentChange, selectedElementId]
  );

  const duplicateElement = useCallback(
    (pageId, elementId) => {
      commitDocumentChange((prev) => {
        const page = prev.pages.find((p) => p.id === pageId);
        const source = page?.elements.find((el) => el.id === elementId);
        if (!source) return prev;
        const copy = { ...deepClone(source), id: `el-${Date.now()}-${Math.round(Math.random() * 1e6)}`, x: source.x + 8, y: source.y + 8 };
        setSelectedElementId(copy.id);
        return { ...prev, pages: prev.pages.map((p) => (p.id !== pageId ? p : { ...p, elements: [...p.elements, copy] })) };
      });
    },
    [commitDocumentChange]
  );

  const bringElementToFront = useCallback(
    (pageId, elementId) => {
      commitDocumentChange((prev) => {
        const page = prev.pages.find((p) => p.id === pageId);
        if (!page) return prev;
        const maxZ = Math.max(0, ...page.elements.map((el) => el.zIndex || 0));
        return {
          ...prev,
          pages: prev.pages.map((p) =>
            p.id !== pageId ? p : { ...p, elements: p.elements.map((el) => (el.id === elementId ? { ...el, zIndex: maxZ + 1 } : el)) }
          ),
        };
      });
    },
    [commitDocumentChange]
  );

  // ── Keyboard shortcuts ───────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      const isTyping = ["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName) || document.activeElement?.isContentEditable;
      const mod = e.ctrlKey || e.metaKey;

      if (mod && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((mod && e.key.toLowerCase() === "y") || (mod && e.shiftKey && e.key.toLowerCase() === "z")) {
        e.preventDefault();
        redo();
      } else if (mod && e.key.toLowerCase() === "d" && selectedElementId && selectedPageId && !isTyping) {
        e.preventDefault();
        duplicateElement(selectedPageId, selectedElementId);
      } else if ((e.key === "Delete" || e.key === "Backspace") && selectedElementId && selectedPageId && !isTyping) {
        e.preventDefault();
        removeElement(selectedPageId, selectedElementId);
      } else if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo, duplicateElement, removeElement, save, selectedElementId, selectedPageId]);

  // ── Assets ───────────────────────────────────────────────────────────
  const uploadAsset = useCallback(
    async (file) => {
      if (!reportId) return null;
      const res = await uploadReportAsset(reportId, file);
      return res.data;
    },
    [reportId]
  );

  // ── Export ───────────────────────────────────────────────────────────
  // Both take the *rendered* page nodes (an array from the editor
  // component's own pageRefs, same pattern as InvoiceBuilder's
  // reportPageRefs) — this hook has no DOM access of its own, and reusing
  // the already-mounted editor canvas nodes for capture means no second,
  // off-screen render pass is needed just for export.
  const orientation = documentData?.pageSize === "a4-landscape" ? "landscape" : "portrait";

  const downloadPdf = useCallback(
    async (pageNodes) => {
      await exportNodesToPdf(pageNodes, `${title || "Report"}.pdf`, { orientation });
    },
    [title, orientation]
  );

  const exportToDrive = useCallback(
    async (pageNodes) => {
      if (!reportId) return;
      setIsExporting(true);
      setExportError("");
      try {
        // Save first so the exported PDF always reflects the latest edits,
        // not a stale in-memory copy from before the last autosave fired.
        await save();
        const pdfBlob = await getNodesPdfBlob(pageNodes, { orientation });
        const fileName = `${title || "Report"}.pdf`;
        const res = await exportReportToDrive(reportId, pdfBlob, fileName);
        setReport((prev) => (prev ? { ...prev, ...res.data.report } : res.data.report));
        return res.data;
      } catch (err) {
        setExportError(err.message || "Failed to export the report");
        throw err;
      } finally {
        setIsExporting(false);
      }
    },
    [reportId, title, save, orientation]
  );

  return {
    report,
    loading,
    loadError,
    title,
    setTitle,
    documentData,
    selectedPageId,
    setSelectedPageId,
    selectedElementId,
    setSelectedElementId,
    selectedPage,
    selectedElement,
    saveStatus,
    isDirty,
    save,
    undo,
    redo,
    canUndo,
    canRedo,
    snapshotHistory,
    addPage,
    duplicatePage,
    removePage,
    renamePage,
    updatePage,
    applyBorderToAllPages,
    applyFontPairing,
    replaceThankYouPage,
    reorderPages,
    addElement,
    updateElement,
    removeElement,
    duplicateElement,
    bringElementToFront,
    uploadAsset,
    isExporting,
    exportError,
    exportToDrive,
    downloadPdf,
  };
}
