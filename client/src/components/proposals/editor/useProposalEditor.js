"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  fetchProposalDraftById,
  updateProposalDraft,
  finalizeProposalDraft,
  exportProposalDraft,
  fetchProposalVersions,
  restoreProposalVersion,
  fetchProposalActivity,
} from "@/services/proposalService";

const AUTOSAVE_DELAY_MS = 2000;

// The single source of truth for one proposal's live editable state —
// mirrors useAgreementEditor.js's role exactly, minus aiFill/uploadSigned
// (not applicable to proposals — see proposalBuilderRoutes.js's own header
// comment on why).
export function useProposalEditor(proposalId) {
  const [proposal, setProposal] = useState(null);
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
    if (!proposalId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError("");
      try {
        const res = await fetchProposalDraftById(proposalId);
        if (cancelled) return;
        const data = res.data;
        setProposal(data);
        setTitleState(data.title);
        setDocumentDataState(data.documentData);
        revisionRef.current = data.revision;
      } catch (err) {
        if (!cancelled) setLoadError(err.message || "Failed to load proposal");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [proposalId]);

  const save = useCallback(async () => {
    if (!proposalId || !documentData) return;
    setSaveStatus("saving");
    try {
      const res = await updateProposalDraft(proposalId, { title, documentData, expectedRevision: revisionRef.current });
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
  }, [proposalId, documentData, title]);

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
  // the single place that flows into autosave.
  const setDocumentData = useCallback((next) => {
    setDocumentDataState(next);
    setIsDirty(true);
  }, []);

  const finalize = useCallback(
    async (note) => {
      await save();
      const res = await finalizeProposalDraft(proposalId, note);
      setProposal((prev) => (prev ? { ...prev, ...res.data } : res.data));
      return res.data;
    },
    [proposalId, save]
  );

  // Builds the PDF (and DOCX, if the caller supplies one) and uploads both
  // in one call — the editor component supplies the blobs since building
  // them needs the live rendered DOM (pagination) and the current
  // documentData (DOCX), both of which this data-only hook has no access to.
  const exportProposal = useCallback(
    async ({ pdfBlob, docxBlob }) => {
      if (!proposalId) return;
      setIsExporting(true);
      setExportError("");
      try {
        await save();
        const fileNameBase = (title || "Proposal").replace(/[\\/:*?"<>|]/g, "_");
        const res = await exportProposalDraft(proposalId, { pdfBlob, docxBlob, fileNameBase });
        setProposal((prev) => (prev ? { ...prev, ...res.data.proposal } : res.data.proposal));
        return res.data;
      } catch (err) {
        setExportError(err.message || "Failed to export the proposal");
        throw err;
      } finally {
        setIsExporting(false);
      }
    },
    [proposalId, title, save]
  );

  const loadVersions = useCallback(async () => {
    const res = await fetchProposalVersions(proposalId);
    return res.data;
  }, [proposalId]);

  const restoreVersion = useCallback(
    async (versionId) => {
      const res = await restoreProposalVersion(proposalId, versionId);
      setDocumentDataState(res.data.documentData);
      revisionRef.current = res.data.revision;
      setIsDirty(false);
      return res.data;
    },
    [proposalId]
  );

  const loadActivity = useCallback(async () => {
    const res = await fetchProposalActivity(proposalId);
    return res.data;
  }, [proposalId]);

  return {
    proposal,
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
    exportProposal,
    loadVersions,
    restoreVersion,
    loadActivity,
  };
}
