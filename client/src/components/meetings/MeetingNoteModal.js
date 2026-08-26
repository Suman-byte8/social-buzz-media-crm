import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { createMeetingNote, updateMeetingNote } from "@/redux/slices/meetingNotesSlice";

export default function MeetingNoteModal({
  open,
  onClose,
  onSuccess,
  clientId,
  clientName,
  meetingNoteToEdit = null,
  isEdit = false,
}) {
  const dispatch = useDispatch();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingType, setMeetingType] = useState("other");
  const [attendees, setAttendees] = useState("");
  const [actionItems, setActionItems] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (meetingNoteToEdit) {
      setTitle(meetingNoteToEdit.title || "");
      setDescription(meetingNoteToEdit.description || "");
      setMeetingDate(meetingNoteToEdit.meetingDate || "");
      setMeetingType(meetingNoteToEdit.meetingType || "other");
      setAttendees(meetingNoteToEdit.attendees || "");
      setActionItems(meetingNoteToEdit.actionItems || "");
    } else {
      setTitle("");
      setDescription("");
      setMeetingDate("");
      setMeetingType("other");
      setAttendees("");
      setActionItems("");
    }
    setError(null);
  }, [meetingNoteToEdit, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!clientId) {
      setError("Please select a client first");
      setLoading(false);
      return;
    }

    if (!title.trim()) {
      setError("Title is required");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        meetingDate: meetingDate || null,
        meetingType,
        attendees: attendees.trim() || null,
        actionItems: actionItems.trim() || null,
        clientId,
      };

      if (isEdit && meetingNoteToEdit?.id) {
        const data = await dispatch(
          updateMeetingNote({ id: meetingNoteToEdit.id, updateData: payload })
        ).unwrap();
        setLoading(false);
        onSuccess(data?.data);
        onClose();
      } else {
        const data = await dispatch(createMeetingNote(payload)).unwrap();
        setLoading(false);
        onSuccess(data?.data);
        onClose();
      }
    } catch (err) {
      setLoading(false);
      setError(
        typeof err === "string"
          ? err
          : err?.message || "Failed to process meeting note"
      );
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {isEdit ? "Edit Meeting Note" : "Add Meeting Note"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            title="Cancel"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Client
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  value={clientName || "Loading..."}
                  readOnly
                  className="w-full py-2 px-3 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Meeting title"
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Meeting Date
              </label>
              <input
                type="date"
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                className="w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              />
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Meeting Type
              </label>
              <select
                value={meetingType}
                onChange={(e) => setMeetingType(e.target.value)}
                className="w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              >
                <option value="client_sync">Client Sync</option>
                <option value="internal_sync">Internal Sync</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Description / Notes
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="4"
              className="w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              placeholder="Meeting notes and discussion points"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Attendees
              </label>
              <input
                type="text"
                value={attendees}
                onChange={(e) => setAttendees(e.target.value)}
                className="w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Comma separated names"
                disabled={loading}
              />
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Action Items
              </label>
              <textarea
                value={actionItems}
                onChange={(e) => setActionItems(e.target.value)}
                rows="3"
                className="w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                placeholder="Action items from meeting"
                disabled={loading}
              />
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-gray-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 text-sm font-medium border border-gray-300 rounded-md hover:bg-gray-50"
            >
              {loading ? "Processing..." : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {loading ? "Processing..." : isEdit ? "Update Meeting Note" : "Add Meeting Note"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
