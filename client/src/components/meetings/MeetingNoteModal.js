import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createMeetingNote, updateMeetingNote } from "@/redux/slices/meetingNotesSlice";
import { fetchTeamMembers } from "@/redux/slices/teamSlice";
import { uploadNoteAttachments, addNoteImageLink } from "@/redux/slices/documentsSlice";

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
  const teamMembers = useSelector((state) => state.team.teamMembers);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingType, setMeetingType] = useState("other");
  const [attendees, setAttendees] = useState([]);
  const [attendeesOpen, setAttendeesOpen] = useState(false);
  const [actionItems, setActionItems] = useState("");
  const [link, setLink] = useState("");
  const [screenshotFiles, setScreenshotFiles] = useState([]);
  const [documentFiles, setDocumentFiles] = useState([]);
  const [imageLinkInput, setImageLinkInput] = useState("");
  const [imageLinks, setImageLinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const documentInputRef = useRef(null);

  useEffect(() => {
    if (open) {
      dispatch(fetchTeamMembers());
    }
  }, [open, dispatch]);

  useEffect(() => {
    if (meetingNoteToEdit) {
      setTitle(meetingNoteToEdit.title || "");
      setDescription(meetingNoteToEdit.description || "");
      setMeetingDate(meetingNoteToEdit.meetingDate || "");
      setMeetingType(meetingNoteToEdit.meetingType || "other");
      setAttendees(
        meetingNoteToEdit.attendees
          ? meetingNoteToEdit.attendees.split(",").map((name) => name.trim()).filter(Boolean)
          : []
      );
      setActionItems(meetingNoteToEdit.actionItems || "");
      setLink(meetingNoteToEdit.link || "");
    } else {
      setTitle("");
      setDescription("");
      setMeetingDate("");
      setMeetingType("other");
      setAttendees([]);
      setActionItems("");
      setLink("");
    }
    setScreenshotFiles([]);
    setDocumentFiles([]);
    setImageLinkInput("");
    setImageLinks([]);
    setError(null);
  }, [meetingNoteToEdit, open]);

  // Screenshot dump: paste one or more images (Ctrl+V) into the drop zone
  // below — they queue up here and upload once the note itself is saved.
  const handleScreenshotPaste = (e) => {
    const items = Array.from(e.clipboardData?.items || []);
    const files = items
      .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
      .map((item) => item.getAsFile())
      .filter(Boolean);
    if (files.length > 0) {
      e.preventDefault();
      setScreenshotFiles((prev) => [...prev, ...files]);
    }
  };

  const handleDocumentFilesChange = (e) => {
    setDocumentFiles((prev) => [...prev, ...Array.from(e.target.files || [])]);
    if (documentInputRef.current) documentInputRef.current.value = "";
  };

  const handleAddImageLink = () => {
    const url = imageLinkInput.trim();
    if (!url) return;
    setImageLinks((prev) => [...prev, url]);
    setImageLinkInput("");
  };

  const toggleAttendee = (name) => {
    setAttendees((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

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
        attendees: attendees.length > 0 ? attendees.join(", ") : null,
        actionItems: actionItems.trim() || null,
        link: link.trim() || null,
        clientId,
      };

      let noteData;
      if (isEdit && meetingNoteToEdit?.id) {
        const data = await dispatch(
          updateMeetingNote({ id: meetingNoteToEdit.id, updateData: payload })
        ).unwrap();
        noteData = data?.data;
      } else {
        const data = await dispatch(createMeetingNote(payload)).unwrap();
        noteData = data?.data;
      }

      // Attachments upload against the now-known note id — best-effort:
      // a failure here shouldn't undo the note that already saved above.
      const noteId = noteData?.id;
      if (noteId) {
        const uploadTasks = [];
        if (screenshotFiles.length > 0) {
          const formData = new FormData();
          screenshotFiles.forEach((file) => formData.append("files", file));
          formData.append("clientId", clientId);
          formData.append("noteId", noteId);
          formData.append("kind", "screenshot");
          uploadTasks.push(dispatch(uploadNoteAttachments({ formData, clientId })).unwrap());
        }
        if (documentFiles.length > 0) {
          const formData = new FormData();
          documentFiles.forEach((file) => formData.append("files", file));
          formData.append("clientId", clientId);
          formData.append("noteId", noteId);
          formData.append("kind", "document");
          uploadTasks.push(dispatch(uploadNoteAttachments({ formData, clientId })).unwrap());
        }
        imageLinks.forEach((imageUrl) => {
          uploadTasks.push(dispatch(addNoteImageLink({ clientId, noteId, imageUrl })).unwrap());
        });

        if (uploadTasks.length > 0) {
          const results = await Promise.allSettled(uploadTasks);
          const failed = results.filter((r) => r.status === "rejected");
          if (failed.length > 0) {
            setError(`Note saved, but ${failed.length} attachment(s) failed to save to Drive.`);
          }
        }
      }

      setLoading(false);
      onSuccess(noteData);
      onClose();
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
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Client
              </label>
              <input
                type="text"
                value={clientName || "Loading..."}
                readOnly
                className="w-full py-2 px-3 border border-gray-300 rounded-md bg-gray-50"
              />
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3 relative">
              <label className="block text-sm font-medium text-gray-700">
                Attendees
              </label>
              <div className="flex flex-wrap gap-2 p-2 bg-gray-50 rounded-md border border-gray-200 min-h-[42px]">
                {attendees.length > 0 ? (
                  attendees.map((name) => (
                    <span
                      key={name}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-800 rounded-md text-xs border border-blue-200 font-medium"
                    >
                      <span>{name}</span>
                      <button
                        type="button"
                        onClick={() => toggleAttendee(name)}
                        disabled={loading}
                        className="hover:bg-blue-200 p-0.5 rounded-full text-blue-700 transition-colors"
                        title="Remove attendee"
                      >
                        <span className="material-symbols-outlined text-[14px]">close</span>
                      </button>
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-400 italic py-1">No attendees added yet</span>
                )}
              </div>

              <button
                type="button"
                onClick={() => setAttendeesOpen((prev) => !prev)}
                disabled={loading}
                className="w-full py-2 px-3 border border-gray-300 rounded-md bg-white text-left text-sm flex items-center justify-between gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <span className="text-gray-500">Select attendees…</span>
                <span className="material-symbols-outlined text-[20px] text-gray-500 shrink-0">
                  {attendeesOpen ? "expand_less" : "expand_more"}
                </span>
              </button>

              {attendeesOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setAttendeesOpen(false)} />
                  <div className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-56 overflow-y-auto">
                    {teamMembers.length === 0 ? (
                      <p className="px-4 py-3 text-xs text-gray-400 italic">No team members found</p>
                    ) : (
                      teamMembers.map((member) => {
                        const isSelected = attendees.includes(member.name);
                        return (
                          <div
                            key={member.id}
                            onClick={() => toggleAttendee(member.name)}
                            className={`flex items-center gap-2 px-4 py-2 cursor-pointer transition-colors ${
                              isSelected ? "bg-blue-50" : "hover:bg-gray-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleAttendee(member.name)}
                              onClick={(e) => e.stopPropagation()}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-900">{member.name}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">Link</label>
              <input
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://... (recording, shared doc, ticket, etc.)"
                disabled={loading}
                className="w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <label className="block text-sm font-medium text-gray-700 pt-2">
                Action Items
              </label>
              <textarea
                value={actionItems}
                onChange={(e) => setActionItems(e.target.value)}
                rows="2"
                className="w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                placeholder="Action items from meeting"
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Description / Notes
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="3"
              className="w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              placeholder="Meeting notes and discussion points"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-gray-200">
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">Screenshot Dump</label>
              <div
                tabIndex={0}
                onPaste={handleScreenshotPaste}
                className="flex items-center gap-1.5 min-h-[42px] rounded-md border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <span className="material-symbols-outlined text-[16px]">content_paste</span>
                Click here, then Ctrl+V to paste screenshots
              </div>
              {screenshotFiles.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {screenshotFiles.map((file, idx) => (
                    <span key={`${file.name}-${idx}`} className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 bg-blue-50 text-blue-800 rounded-md text-xs border border-blue-200">
                      {file.name || `Screenshot ${idx + 1}`}
                      <button
                        type="button"
                        onClick={() => setScreenshotFiles((prev) => prev.filter((_, i) => i !== idx))}
                        disabled={loading}
                        className="hover:bg-blue-200 p-0.5 rounded-full text-blue-700 transition-colors"
                        title="Remove"
                      >
                        <span className="material-symbols-outlined text-[14px]">close</span>
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <p className="text-[11px] text-gray-400">Saved to the client&apos;s Drive folder once you save this note.</p>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">Documents</label>
              <input
                ref={documentInputRef}
                type="file"
                multiple
                onChange={handleDocumentFilesChange}
                disabled={loading}
                className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:bg-gray-100 file:text-gray-700 file:text-sm file:cursor-pointer"
              />
              {documentFiles.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {documentFiles.map((file, idx) => (
                    <span key={`${file.name}-${idx}`} className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 bg-gray-100 text-gray-800 rounded-md text-xs border border-gray-200">
                      {file.name}
                      <button
                        type="button"
                        onClick={() => setDocumentFiles((prev) => prev.filter((_, i) => i !== idx))}
                        disabled={loading}
                        className="hover:bg-gray-200 p-0.5 rounded-full text-gray-700 transition-colors"
                        title="Remove"
                      >
                        <span className="material-symbols-outlined text-[14px]">close</span>
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <p className="text-[11px] text-gray-400">Any file type — uploaded to the client&apos;s Drive folder.</p>
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-700">Image Links</label>
            <div className="flex items-stretch gap-2">
              <input
                type="url"
                value={imageLinkInput}
                onChange={(e) => setImageLinkInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddImageLink();
                  }
                }}
                placeholder="Paste an image URL..."
                disabled={loading}
                className="flex-1 py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleAddImageLink}
                disabled={loading || !imageLinkInput.trim()}
                className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
              >
                Add
              </button>
            </div>
            <p className="text-[11px] text-gray-400">
              The image is fetched and stored in the client&apos;s Drive folder once you save this note — the preview
              below is just from the original link until then.
            </p>
            {imageLinks.length > 0 && (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {imageLinks.map((url, idx) => (
                  <div key={`${url}-${idx}`} className="relative group aspect-square rounded-md border border-gray-200 overflow-hidden bg-gray-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImageLinks((prev) => prev.filter((_, i) => i !== idx))}
                      disabled={loading}
                      className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove"
                    >
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
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
