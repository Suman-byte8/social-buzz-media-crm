"use client";

import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
} from "@/redux/slices/notificationsSlice";
import Pagination from "@/components/ui/Pagination";

const LIMIT = 20;

// Colored by the *related task's current status* (not frozen at creation
// time) — a task that's since been completed shows green here even if the
// notification originally said "assigned", so the page reflects reality.
const STATUS_STYLE = {
  todo: { bg: "bg-gray-50", border: "border-l-gray-400", chip: "bg-gray-100 text-gray-700", label: "Backlog" },
  in_progress: { bg: "bg-blue-50", border: "border-l-blue-400", chip: "bg-blue-100 text-blue-700", label: "In Progress" },
  review: { bg: "bg-purple-50", border: "border-l-purple-400", chip: "bg-purple-100 text-purple-700", label: "Review" },
  completed: { bg: "bg-emerald-50", border: "border-l-emerald-500", chip: "bg-emerald-100 text-emerald-700", label: "Completed" },
  overdue: { bg: "bg-red-50", border: "border-l-red-500", chip: "bg-red-100 text-red-700", label: "Overdue" },
  none: { bg: "bg-white", border: "border-l-gray-200", chip: "bg-gray-100 text-gray-500", label: "No linked task" },
};

const resolveStatusStyle = (task) => {
  if (!task) return STATUS_STYLE.none;
  if (task.status !== "completed" && task.dueDate && new Date(task.dueDate) < new Date()) {
    return STATUS_STYLE.overdue;
  }
  return STATUS_STYLE[task.status] || STATUS_STYLE.none;
};

const timeAgo = (dateStr) => {
  if (!dateStr) return "";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export default function NotificationsPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { notifications, loading, totalPages, totalItems, currentPage, unreadCount } = useSelector(
    (state) => state.notifications
  );

  useEffect(() => {
    dispatch(fetchNotifications({ page: currentPage, limit: LIMIT }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  const handlePageChange = (page) => {
    dispatch(fetchNotifications({ page, limit: LIMIT }));
  };

  const handleViewTask = (notification) => {
    if (!notification.read) dispatch(markAsRead(notification.id));
    if (notification.task?.title) {
      router.push(`/tasks?search=${encodeURIComponent(notification.task.title)}`);
    } else {
      router.push("/tasks");
    }
  };

  const handleDelete = (id) => {
    dispatch(deleteNotification(id));
  };

  const handleMarkAllRead = () => {
    if (unreadCount > 0) dispatch(markAllAsRead());
  };

  const handleClearAll = () => {
    if (notifications.length === 0) return;
    if (window.confirm("Clear all notifications? This cannot be undone.")) {
      dispatch(clearAllNotifications());
    }
  };

  return (
    <main className="flex-1 p-6 lg:p-8 max-w-[900px] mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display-lg text-display-lg text-on-surface">Notifications</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            className="px-3 py-2 text-label-sm font-label-sm text-on-surface-variant border border-outline-variant rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Mark all as read
          </button>
          <button
            onClick={handleClearAll}
            disabled={notifications.length === 0}
            className="px-3 py-2 text-label-sm font-label-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Clear all
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-outline-variant shadow-card overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-on-surface-variant">
            <span className="animate-spin material-symbols-outlined text-[28px]">progress_activity</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center text-on-surface-variant">
            <span className="material-symbols-outlined text-[40px] block mb-1.5">notifications_none</span>
            No notifications yet.
          </div>
        ) : (
          <ul className="divide-y divide-outline-variant/30">
            {notifications.map((notification) => {
              const style = resolveStatusStyle(notification.task);
              return (
                <li
                  key={notification.id}
                  className={`flex items-start gap-3 p-4 border-l-4 ${style.border} ${
                    notification.read ? "bg-white" : style.bg
                  }`}
                >
                  <span className="material-symbols-outlined text-[22px] text-on-surface-variant mt-0.5 shrink-0">
                    assignment_turned_in
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-body-sm ${notification.read ? "font-body-sm text-on-surface-variant" : "font-semibold text-on-surface"}`}>
                        {notification.title}
                      </p>
                      {!notification.read && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${style.chip}`}>{style.label}</span>
                    </div>
                    {notification.message && (
                      <p className="text-body-sm text-secondary mt-0.5 break-words">{notification.message}</p>
                    )}
                    <p className="text-[11px] text-on-surface-variant mt-1">{timeAgo(notification.createdAt)}</p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleViewTask(notification)}
                      className="px-2.5 py-1.5 text-label-sm font-label-sm text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      title="View task"
                    >
                      View task
                    </button>
                    <button
                      onClick={() => handleDelete(notification.id)}
                      className="p-1.5 text-secondary hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete notification"
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <Pagination
          page={currentPage}
          limit={LIMIT}
          totalItems={totalItems}
          totalPages={totalPages}
          loading={loading}
          onPageChange={handlePageChange}
        />
      </div>
    </main>
  );
}
