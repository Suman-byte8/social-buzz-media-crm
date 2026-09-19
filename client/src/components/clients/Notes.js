"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMeetingNotes, deleteMeetingNote } from "@/redux/slices/meetingNotesSlice";
import { fetchNoteAttachments, deleteNoteAttachment } from "@/redux/slices/documentsSlice";
import { getAssetUrl } from "@/services/apiClient";
import MeetingNoteModal from "@/components/meetings/MeetingNoteModal";

const meetingTypeLabels = {
  client_sync: "Client Sync",
  internal_sync: "Internal Sync",
  other: "Other",
};

const meetingTypeColors = {
  client_sync: "bg-blue-100 text-blue-800",
  internal_sync: "bg-purple-100 text-purple-800",
  other: "bg-gray-100 text-gray-800",
};

const getInitials = (name) => {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const renderAttendees = (attendees) => {
  if (!attendees || !attendees.trim()) return null;
  const names = attendees.split(",").map((name) => name.trim()).filter(Boolean);
  if (names.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mt-2">
      <span className="font-label-sm text-label-sm text-on-surface-variant shrink-0">
        Attendees:
      </span>
      {names.map((name, idx) => (
        <span
          key={idx}
          className="inline-flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full bg-secondary-container"
        >
          <span className="w-5 h-5 rounded-full bg-white/70 flex items-center justify-center text-[10px] font-label-sm text-on-secondary-container shrink-0">
            {getInitials(name)}
          </span>
          <span className="font-label-sm text-label-sm text-on-secondary-container">
            {name}
          </span>
        </span>
      ))}
    </div>
  );
};

// Groups a client's flat note-attachment list (screenshot dump / documents /
// image links — all documentType "note", see documentsSlice.js) by noteId
// and then by noteAttachmentKind, so each note article can render its own
// three buckets without re-filtering the array per note.
const groupAttachmentsByNote = (attachments) => {
  const byNote = {};
  attachments.forEach((doc) => {
    if (!doc.noteId) return;
    if (!byNote[doc.noteId]) byNote[doc.noteId] = { screenshot: [], document: [], image_link: [] };
    const bucket = byNote[doc.noteId][doc.noteAttachmentKind];
    if (bucket) bucket.push(doc);
  });
  return byNote;
};

const formatFileSize = (bytes) => {
  if (!bytes) return "";
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
};

export default function Notes({ client, clientId }) {
  const dispatch = useDispatch();
  const { meetingNotes, loading } = useSelector((state) => state.meetingNotes);
  const noteAttachments = useSelector((state) => state.documents.noteAttachmentsByClient[clientId] || []);
  const clientName = client?.name || "Client";

  const [modalOpen, setModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);

  useEffect(() => {
    if (clientId) {
      dispatch(fetchMeetingNotes(clientId));
      dispatch(fetchNoteAttachments(clientId));
    }
  }, [dispatch, clientId]);

  const attachmentsByNote = useMemo(() => groupAttachmentsByNote(noteAttachments), [noteAttachments]);

  const handleEdit = (note) => {
    setEditingNote(note);
    setModalOpen(true);
  };

  const handleDelete = (id) => {
    if (!window.confirm("Delete this meeting note?")) return;
    dispatch(deleteMeetingNote(id));
  };

  const handleDeleteAttachment = (id) => {
    if (!window.confirm("Delete this attachment? It will be moved to the Drive trash.")) return;
    dispatch(deleteNoteAttachment({ id, clientId }));
  };

  const hasNotes = meetingNotes.length > 0;

  return (
    <main className="flex-1 overflow-y-auto p-container-margin">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-title-lg text-title-lg text-on-surface">Meeting Notes</h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
              {hasNotes
                ? `Notes and conversations for ${clientName}.`
                : `No meeting notes recorded for ${clientName} yet.`}
            </p>
          </div>
          <button
            onClick={() => {
              setEditingNote(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-on-primary font-label-md text-label-md shadow-sm hover:bg-primary/90 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Note
          </button>
        </header>

        {loading ? (
          <div className="py-8 text-center text-on-surface-variant">
            <span className="animate-spin material-symbols-outlined text-[24px]">progress_activity</span>
          </div>
        ) : hasNotes ? (
          <div className="space-y-4">
            {meetingNotes.map((note) => {
              const attachments = attachmentsByNote[note.id] || { screenshot: [], document: [], image_link: [] };

              return (
                <article key={note.id} className="rounded-xl border border-outline-variant bg-white p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="font-title-md text-title-md text-on-surface">{note.title}</h2>
                        <span className={`px-2 py-0.5 rounded-full font-label-sm text-label-sm ${meetingTypeColors[note.meetingType] || "bg-gray-100 text-gray-800"}`}>
                          {meetingTypeLabels[note.meetingType] || note.meetingType}
                        </span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        {note.meetingDate ? new Date(note.meetingDate).toLocaleDateString() : "No date"}
                      </p>
                      {renderAttendees(note.attendees)}
                    </div>
                    <div className="flex items-center gap-1 text-tertiary">
                      <button onClick={() => handleEdit(note)} className="rounded-lg p-2 hover:bg-surface-container-high transition-colors" title="Edit">
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button onClick={() => handleDelete(note.id)} className="rounded-lg p-2 hover:bg-red-50 hover:text-red-600 transition-colors" title="Delete">
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>
                  {note.description && (
                    <div className="bg-surface-container-low rounded-lg p-4 mt-2">
                      <h3 className="font-label-md text-label-md text-on-surface mb-2 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-primary text-[16px]">subject</span>
                        Meeting Brief
                      </h3>
                      <p className="font-body-md text-body-md text-on-surface leading-relaxed whitespace-pre-wrap">
                        {note.description}
                      </p>
                    </div>
                  )}

                  {note.link && (
                    <a
                      href={note.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 text-body-sm text-primary hover:underline"
                    >
                      <span className="material-symbols-outlined text-[16px]">link</span>
                      {note.link}
                    </a>
                  )}

                  {attachments.document.length > 0 && (
                    <div className="mt-3">
                      <h3 className="font-label-md text-label-md text-on-surface-variant mb-1.5 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px]">attach_file</span>
                        Documents
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {attachments.document.map((doc) => (
                          <a
                            key={doc.id}
                            href={getAssetUrl(`/api/documents/${doc.id}/stream`)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 bg-surface-container rounded-full text-label-sm font-label-sm text-on-surface hover:bg-surface-variant transition-colors"
                          >
                            <span className="material-symbols-outlined text-[14px]">description</span>
                            {doc.fileName}
                            {doc.fileSize ? <span className="text-tertiary">({formatFileSize(doc.fileSize)})</span> : null}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                handleDeleteAttachment(doc.id);
                              }}
                              className="p-0.5 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-600 transition-colors"
                              title="Delete"
                            >
                              <span className="material-symbols-outlined text-[14px]">close</span>
                            </button>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {(attachments.screenshot.length > 0 || attachments.image_link.length > 0) && (
                    <div className="mt-3 space-y-3">
                      {attachments.screenshot.length > 0 && (
                        <div>
                          <h3 className="font-label-md text-label-md text-on-surface-variant mb-1.5 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px]">content_paste</span>
                            Screenshot Dump
                          </h3>
                          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
                            {attachments.screenshot.map((doc) => (
                              <div key={doc.id} className="relative group aspect-square rounded-md border border-outline-variant overflow-hidden bg-surface-container-lowest">
                                <a href={getAssetUrl(`/api/documents/${doc.id}/stream`)} target="_blank" rel="noopener noreferrer">
                                  <img src={getAssetUrl(`/api/documents/${doc.id}/stream`)} alt={doc.fileName} loading="lazy" className="w-full h-full object-cover" />
                                </a>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAttachment(doc.id)}
                                  className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Delete"
                                >
                                  <span className="material-symbols-outlined text-[14px]">close</span>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {attachments.image_link.length > 0 && (
                        <div>
                          <h3 className="font-label-md text-label-md text-on-surface-variant mb-1.5 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px]">image</span>
                            Image Links
                          </h3>
                          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
                            {attachments.image_link.map((doc) => (
                              <div key={doc.id} className="relative group aspect-square rounded-md border border-outline-variant overflow-hidden bg-surface-container-lowest">
                                <a href={getAssetUrl(`/api/documents/${doc.id}/stream`)} target="_blank" rel="noopener noreferrer" title={doc.linkUrl}>
                                  <img src={getAssetUrl(`/api/documents/${doc.id}/stream`)} alt={doc.fileName} loading="lazy" className="w-full h-full object-cover" />
                                </a>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAttachment(doc.id)}
                                  className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Delete"
                                >
                                  <span className="material-symbols-outlined text-[14px]">close</span>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-outline-variant bg-white p-6 shadow-sm flex flex-col items-center justify-center text-center min-h-[200px]">
            <span className="material-symbols-outlined text-3xl text-on-surface-variant mb-3">event_note</span>
            <h3 className="font-title-md text-title-md text-on-surface mb-2">No Notes Yet</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Add your first note for {clientName}.
            </p>
          </div>
        )}
      </div>

      <MeetingNoteModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingNote(null);
        }}
        onSuccess={() => {
          setModalOpen(false);
          setEditingNote(null);
        }}
        clientId={clientId}
        clientName={clientName}
        meetingNoteToEdit={editingNote}
        isEdit={!!editingNote}
      />
    </main>
  );
}
