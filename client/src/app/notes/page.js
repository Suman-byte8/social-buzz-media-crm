"use client";

import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import MeetingNoteModal from "@/components/meetings/MeetingNoteModal";
import {
  fetchMeetingNotes,
  deleteMeetingNote,
} from "@/redux/slices/meetingNotesSlice";
import { fetchClients } from "@/redux/slices/clientsSlice";

const meetingTypeConfig = {
  client_sync: {
    label: "Client Sync",
    color: "text-primary",
    bg: "bg-surface-container-highest",
    icon: "videocam",
  },
  internal_sync: {
    label: "Internal Sync",
    color: "text-secondary",
    bg: "bg-secondary-container",
    icon: "groups",
  },
  other: {
    label: "Other",
    color: "text-tertiary",
    bg: "bg-surface-container-high",
    icon: "note",
  },
};

export default function MeetingNotesPage() {
  const dispatch = useDispatch();
  const { clients } = useSelector((state) => state.clients);
  const { meetingNotes, loading, error } = useSelector(
    (state) => state.meetingNotes
  );

  const [selectedClientId, setSelectedClientId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState({});

  useEffect(() => {
    dispatch(fetchClients());
    dispatch(fetchMeetingNotes());
  }, [dispatch]);

  const loadNotesByClient = (clientId) => {
    if (!clientId) return;
    dispatch(fetchMeetingNotes(clientId));
  };

  const handleClientChange = (e) => {
    const rawValue = e.target.value;
    const clientId = rawValue === "" ? null : Number(rawValue);
    if (clientId !== null && isNaN(clientId)) return;
    setSelectedClientId(clientId);
    loadNotesByClient(clientId);
  };

  const handleResetFilter = () => {
    setSelectedClientId(null);
    loadNotes();
  };

  const handleSuccess = () => {
    setEditingNote(null);
    setModalOpen(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this meeting note?"))
      return;
    try {
      await dispatch(deleteMeetingNote(id)).unwrap();
      setDeleteLoading((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    } catch (err) {
      // Delete errors are surfaced via the meetingNotes slice's error state.
    }
  };

  const handleEdit = (note) => {
    setEditingNote(note);
    setModalOpen(true);
  };

  const loadNotes = () => {
    dispatch(fetchMeetingNotes());
  };

  const getClientName = (clientId) => {
    const client = clients.find((c) => c.id === clientId);
    return client ? client.name : "Unknown Client";
  };

  const formatMeetingTime = (note) => {
    if (!note.meetingDate) return "No date";
    const date = new Date(note.meetingDate);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (days === 0) return `Today, ${hours}`;
    if (days === 1) return `Yesterday, ${hours}`;
    return `${date.toLocaleDateString()}, ${hours}`;
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

  const renderActionItems = (actionItems) => {
    if (!actionItems || !actionItems.trim()) return null;
    const items = actionItems
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
    if (items.length === 0) return null;

    return (
      <div className="bg-surface-container-low rounded-lg p-3">
        <h4 className="font-label-md text-label-md text-on-surface mb-2 flex items-center gap-1">
          <span className="material-symbols-outlined text-primary text-[16px]">
            task_alt
          </span>{" "}
          Action Items
        </h4>
        <ul className="space-y-2">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <input
                className="mt-0.5 rounded border-outline-variant text-primary focus:ring-primary h-4 w-4"
                type="checkbox"
              />
              <span className="font-body-sm text-body-sm text-on-surface">
                {item}
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderAttendees = (attendees) => {
    if (!attendees || !attendees.trim()) return null;
    const names = attendees
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean);
    if (names.length === 0) return null;

    return (
      <div className="flex items-center gap-2 mb-4">
        <span className="font-label-sm text-label-sm text-on-surface-variant">
          Attendees:
        </span>
        <div className="flex -space-x-2">
          {names.slice(0, 2).map((name, idx) => (
            <div
              key={idx}
              className="w-6 h-6 rounded-full border-2 border-white overflow-hidden bg-secondary-container flex items-center justify-center"
            >
              <span className="font-label-sm text-label-sm text-on-secondary-container">
                {getInitials(name)}
              </span>
            </div>
          ))}
          {names.length > 2 && (
            <div className="w-6 h-6 rounded-full border-2 border-white overflow-hidden bg-secondary-container flex items-center justify-center">
              <span className="font-label-sm text-label-sm text-on-secondary-container">
                +{names.length - 2}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <main className="flex-1 overflow-y-auto bg-background p-container-margin">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display-lg text-display-lg text-on-background mb-4">
            Meeting Notes
          </h2>
          <p className="text-body-md text-on-surface-variant mb-4">
            Loading meeting notes...
          </p>
          <div className="grid gap-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse border rounded-xl p-card-padding"
              >
                <div className="h-4 w-3/4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 w-1/2 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto bg-background p-container-margin">
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h2 className="font-display-lg text-display-lg text-on-background">
              Meeting Notes
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">
              Timeline view of client engagements and internal syncs.
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <select
              value={selectedClientId || ""}
              onChange={handleClientChange}
              className="border border-[#E5E5E7] rounded-lg px-3 py-2 font-label-md text-label-md text-on-surface focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none"
            >
              <option value="">-- All Clients --</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleResetFilter}
              className="px-4 py-2 text-sm bg-surface-container-high text-on-surface hover:bg-surface-container transition-colors rounded-lg font-label-md text-label-md"
            >
              Show All
            </button>
            <button
              onClick={() => {
                setEditingNote(null);
                setModalOpen(true);
              }}
              disabled={!selectedClientId}
              className="bg-primary text-on-primary font-label-md text-label-md px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-container transition-colors shadow-sm cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Add Meeting Note
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Timeline View */}
        {meetingNotes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-on-surface-variant font-body-md mb-4">
              {selectedClientId
                ? "No meeting notes found for this client."
                : "No meeting notes found. Add your first meeting note to get started."}
            </p>
            {!selectedClientId && (
              <button
                onClick={() => {
                  setEditingNote(null);
                  setModalOpen(true);
                }}
                className="px-4 py-2 text-sm bg-primary text-white rounded-lg font-label-md text-label-md hover:bg-primary-container transition-colors"
              >
                Add First Meeting Note
              </button>
            )}
          </div>
        ) : (
          <div className="relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-outline-variant before:to-transparent">
            {meetingNotes.map((note, idx) => {
              const config =
                meetingTypeConfig[note.meetingType] || meetingTypeConfig.other;
              const isLast = idx === meetingNotes.length - 1;

              return (
                <div
                  key={note.id}
                  className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active ${!isLast ? "pb-12" : ""}`}
                >
                  {/* Marker */}
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-surface-container-high shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                    <span
                      className={`material-symbols-outlined ${config.color} text-[20px]`}
                    >
                      {config.icon}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-card-padding bg-white border border-[#E5E5E7] rounded-xl shadow-[0px_2px_4px_rgba(0,0,0,0.05)] hover:shadow-[0px_10px_20px_rgba(0,0,0,0.08)] transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-label-sm text-label-sm ${config.color} uppercase tracking-wider ${config.bg} px-2 py-1 rounded-full`}
                        >
                          {config.label}
                        </span>
                        <span className="font-label-md text-label-md text-on-surface-variant">
                          {formatMeetingTime(note)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(note)}
                          className="p-1 text-amber-600 hover:bg-amber-100 rounded-md"
                          title="Edit Meeting Note"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 8v7l4 2v-5l-4-2z" />
                            <path d="M15 3.5a2.525 2.525 0 1 1 3.5 3.5A2.525 2.525 0 1 1 15 3.5z" />
                            <path d="M17 3.5h-1" />
                            <path d="M12 21h-7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h4l4 4v9" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(note.id)}
                          disabled={deleteLoading[note.id]}
                          className="p-1 text-red-600 hover:bg-red-100 rounded-md disabled:opacity-50"
                          title="Delete Meeting Note"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18" />
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <h3 className="font-title-lg text-title-lg text-on-surface mb-2">
                      {note.title}
                    </h3>

                    {renderAttendees(note.attendees)}

                    {note.description && (
                      <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">
                        {note.description}
                      </p>
                    )}

                    {renderActionItems(note.actionItems)}

                    <div className="mt-3 flex items-center gap-2">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">
                        Client:{" "}
                        <strong>{getClientName(note.clientId)}</strong>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <MeetingNoteModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingNote(null);
        }}
        onSuccess={handleSuccess}
        clientId={selectedClientId || editingNote?.clientId}
        clientName={
          editingNote
            ? getClientName(editingNote.clientId)
            : selectedClientId
            ? getClientName(selectedClientId)
            : null
        }
        meetingNoteToEdit={editingNote}
        isEdit={!!editingNote}
      />
    </main>
  );
}
