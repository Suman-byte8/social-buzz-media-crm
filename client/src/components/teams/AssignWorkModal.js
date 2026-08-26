"use client";

import React from "react";

export default function AssignWorkModal({ isOpen, onClose, memberName, allClients, workForm, onChange, onSubmit, loading }) {
  if (!isOpen) return null;

  const inputClass = "w-full px-4 py-2 border border-outline-variant rounded-lg focus:ring-1 focus:ring-primary focus:border-primary bg-white";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gray-200 pb-3">
          <h3 className="font-title-lg text-title-lg text-on-surface font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600">add_task</span>
            Assign Work to {memberName}
          </h3>
          <button onClick={onClose} className="text-secondary hover:text-primary transition-colors p-1">
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block font-label-sm text-label-sm text-secondary mb-1">Work / Task Title *</label>
            <input
              type="text"
              required
              value={workForm.title}
              onChange={(e) => onChange({ ...workForm, title: e.target.value })}
              className={inputClass}
              placeholder="e.g. Design August Social Media Calendar"
            />
          </div>

          <div>
            <label className="block font-label-sm text-label-sm text-secondary mb-1">Associated Client (Optional)</label>
            <select value={workForm.clientId} onChange={(e) => onChange({ ...workForm, clientId: e.target.value })} className={inputClass}>
              <option value="">Select Client (Optional)</option>
              {allClients.map((client) => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-label-sm text-label-sm text-secondary mb-1">Status</label>
              <select value={workForm.status} onChange={(e) => onChange({ ...workForm, status: e.target.value })} className={inputClass}>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block font-label-sm text-label-sm text-secondary mb-1">Priority</label>
              <select value={workForm.priority} onChange={(e) => onChange({ ...workForm, priority: e.target.value })} className={inputClass}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-label-sm text-label-sm text-secondary mb-1">Due Date</label>
            <input type="date" value={workForm.dueDate} onChange={(e) => onChange({ ...workForm, dueDate: e.target.value })} className={inputClass} />
          </div>

          <div>
            <label className="block font-label-sm text-label-sm text-secondary mb-1">Description</label>
            <textarea
              rows={2}
              value={workForm.description}
              onChange={(e) => onChange({ ...workForm, description: e.target.value })}
              className={inputClass}
              placeholder="Task details and instructions..."
            />
          </div>

          <div className="pt-3 border-t border-outline-variant flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-outline-variant rounded-lg text-secondary font-label-md hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-emerald-600 text-white rounded-lg font-label-md hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {loading && <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>}
              Assign Work
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
