"use client";

import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import MeetingNoteModal from "@/components/meetings/MeetingNoteModal";
import {
  fetchMeetingNotes,
  deleteMeetingNote,
} from "@/redux/slices/meetingNotesSlice";
import { fetchClients } from "@/redux/slices/clientsSlice";

export default function MeetingsPage() {
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

  const getClientNameForNote = (note) => {
    if (!note) return null;
    return getClientName(note.clientId);
  };

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

  if (loading) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Meeting Notes</h1>
          <p className="text-gray-600 mb-4">Loading meeting notes...</p>
          <div className="grid gap-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse border rounded-lg p-4"
              >
                <div className="h-4 w-3/4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 w-1/2 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Meeting Notes</h1>

          <div className="flex gap-2 items-center">
            <select
              value={selectedClientId || ""}
              onChange={handleClientChange}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              className="px-4 py-2 text-sm bg-gray-500 text-white hover:bg-gray-600 rounded-md"
            >
              Show All
            </button>

            <button
              onClick={() => {
                setEditingNote(null);
                setModalOpen(true);
              }}
              disabled={!selectedClientId}
              className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Meeting Note
            </button>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded mb-4">
              {error}
            </div>
          )}

          {!selectedClientId && meetingNotes.length === 0 && clients.length > 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                No meeting notes found. Add your first meeting note to get started.
              </p>
              <button
                onClick={() => {
                  setEditingNote(null);
                  setModalOpen(true);
                }}
                disabled={!selectedClientId}
                className="mt-4 px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add First Meeting Note
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {meetingNotes.map((note) => (
                <div
                  key={note.id}
                  className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {note.title}
                      </h3>
                      <div className="text-sm text-gray-500 mt-1 flex flex-wrap gap-4">
                        <span>
                          Date:{" "}
                          {note.meetingDate
                            ? new Date(note.meetingDate).toLocaleDateString()
                            : "No date"}
                        </span>
                        <span className="ml-2">
                          Client:{" "}
                          <strong>{getClientName(note.clientId)}</strong>
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {meetingTypeLabels[note.meetingType] || note.meetingType}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          meetingTypeColors[note.meetingType] ||
                          "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {meetingTypeLabels[note.meetingType] || note.meetingType}
                      </span>

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
                        className="p-1 text-red-600 hover:bg-red-100 rounded-md"
                        title="Delete Meeting Note"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <MeetingNoteModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingNote(null);
        }}
        onSuccess={handleSuccess}
        clientId={selectedClientId || editingNote?.clientId}
        clientName={getClientNameForNote(editingNote)}
        meetingNoteToEdit={editingNote}
        isEdit={!!editingNote}
      />
    </div>
  );
}
