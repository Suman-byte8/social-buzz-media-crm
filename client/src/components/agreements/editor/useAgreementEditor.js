"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  fetchAgreementDraftById,
  updateAgreementDraft,
  finalizeAgreementDraft,
  exportAgreementDraft,
  uploadSignedCopy,
  fetchAgreementVersions,
  restoreAgreementVersion,
  fetchAgreementActivity,
} from "@/services/agreementService";

const AUTOSAVE_DELAY_MS = 2000;

// The single source of truth for one agreement's live editable state —
// mirrors useReportEditor.js's role, but simpler: Tiptap owns its own
// undo/redo (StarterKit's history extension), so this hook doesn't need
// the Report editor's hand-rolled history stack — just load/autosave/
// revision-conflict/export/versions/activity, same as the data half of
// useReportEditor.js.
export function useAgreementEditor(agreementId) {
  const [agreement, setAgreement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [title, setTitleState] = useState("");
  const [documentData, setDocumentDataState] = useState(null);

  const [saveStatus, setSaveStatus] = useState("idle"); // idle | saving | saved | error | conflict
  const [isDirty, setIsDirty] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  const revisionRef = useRef(0);

  useEffect(() => {
    if (!agreementId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError("");
      try {
        const res = await fetchAgreementDraftById(agreementId);
        if (cancelled) return;
        const data = res.data;
        setAgreement(data);
        setTitleState(data.title);
        setDocumentDataState(data.documentData);
        revisionRef.current = data.revision;
      } catch (err) {
        if (!cancelled) setLoadError(err.message || "Failed to load agreement");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [agreementId]);

  const save = useCallback(async () => {
    if (!agreementId || !documentData) return;
    setSaveStatus("saving");
    try {
      const res = await updateAgreementDraft(agreementId, { title, documentData, expectedRevision: revisionRef.current });
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
  }, [agreementId, documentData, title]);

  useEffect(() => {
    if (!isDirty || loading) return;
    const timer = setTimeout(() => {
      save();
    }, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentData, title, isDirty, loading]);

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

  // Tiptap reports its JSON doc on every keystroke via onUpdate — this is
  // the single place that flows into autosave, same role
  // commitDocumentChange plays in useReportEditor.js (minus the history
  // stack, which Tiptap already owns internally).
  const setDocumentData = useCallback((next) => {
    setDocumentDataState(next);
    setIsDirty(true);
  }, []);

  const finalize = useCallback(
    async (note) => {
      await save();
      const res = await finalizeAgreementDraft(agreementId, note);
      setAgreement((prev) => (prev ? { ...prev, ...res.data } : res.data));
      return res.data;
    },
    [agreementId, save]
  );

  // Builds the PDF (and DOCX, if the caller supplies one) and uploads both
  // in one call — the editor component supplies the blobs since building
  // them needs the live rendered DOM (pagination) and the current
  // documentData (DOCX), both of which this data-only hook has no access to.
  const exportAgreement = useCallback(
    async ({ pdfBlob, docxBlob }) => {
      if (!agreementId) return;
      setIsExporting(true);
      setExportError("");
      try {
        await save();
        const fileNameBase = (title || "Agreement").replace(/[\\/:*?"<>|]/g, "_");
        const res = await exportAgreementDraft(agreementId, { pdfBlob, docxBlob, fileNameBase });
        setAgreement((prev) => (prev ? { ...prev, ...res.data.agreement } : res.data.agreement));
        return res.data;
      } catch (err) {
        setExportError(err.message || "Failed to export the agreement");
        throw err;
      } finally {
        setIsExporting(false);
      }
    },
    [agreementId, title, save]
  );

  const uploadSigned = useCallback(
    async (file) => {
      const res = await uploadSignedCopy(agreementId, file);
      setAgreement((prev) => (prev ? { ...prev, ...res.data.agreement } : res.data.agreement));
      return res.data;
    },
    [agreementId]
  );

  const loadVersions = useCallback(async () => {
    const res = await fetchAgreementVersions(agreementId);
    return res.data;
  }, [agreementId]);

  const restoreVersion = useCallback(
    async (versionId) => {
      const res = await restoreAgreementVersion(agreementId, versionId);
      setDocumentDataState(res.data.documentData);
      revisionRef.current = res.data.revision;
      setIsDirty(false);
      return res.data;
    },
    [agreementId]
  );

  const loadActivity = useCallback(async () => {
    const res = await fetchAgreementActivity(agreementId);
    return res.data;
  }, [agreementId]);

  return {
    agreement,
    loading,
    loadError,
    title,
    setTitle,
    documentData,
    setDocumentData,
    saveStatus,
    isDirty,
    save,
    finalize,
    isExporting,
    exportError,
    exportAgreement,
    uploadSigned,
    loadVersions,
    restoreVersion,
    loadActivity,
  };
}
