"use client";

import React from "react";
import Link from "next/link";
import { useSelector } from "react-redux";

// Unread count itself is kept fresh globally by NotificationBridge (initial
// fetch on login + live increments over the socket) — this just reads it.
export default function NotificationBell() {
  const unreadCount = useSelector((state) => state.notifications.unreadCount);

  return (
    <Link
      href="/notifications"
      className="relative p-2 text-on-surface-variant hover:text-primary hover:bg-gray-100 rounded-lg transition-colors shrink-0"
      title="Notifications"
    >
      <span className="material-symbols-outlined text-[22px]">notifications</span>
      {unreadCount > 0 && (
        <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
