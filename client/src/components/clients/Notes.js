"use client";

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMeetingNotes, deleteMeetingNote } from "@/redux/slices/meetingNotesSlice";
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

export default function Notes({ client, clientId }) {
  const dispatch = useDispatch();
  const { meetingNotes, loading } = useSelector((state) => state.meetingNotes);
  const clientName = client?.name || "Client";

  const [modalOpen, setModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);

  useEffect(() => {
    if (clientId) {
      dispatch(fetchMeetingNotes(clientId));
    }
  }, [dispatch, clientId]);

  const handleEdit = (note) => {
    setEditingNote(note);
    setModalOpen(true);
  };

  const handleDelete = (id) => {
    if (!window.confirm("Delete this meeting note?")) return;
    dispatch(deleteMeetingNote(id));
  };

  const hasNotes = meetingNotes.length > 0;

  return (
    <main className="flex-1 overflow-y-auto p-container-margin">
      <div className="max-w-4xl mx-auto space-y-6">
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
            {meetingNotes.map((note) => (
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
                  <p className="font-body-sm text-body-sm text-on-surface-variant whitespace-pre-wrap">
                    {note.description}
                  </p>
                )}
              </article>
            ))}
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
