"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSocket } from "@/lib/socket";
import { useAuth } from "@/app/login/context/AuthContext";

const DISMISS_KEY = "crm_notif_prompt_dismissed";

// Mounted once in AppLayout so it's alive on every authenticated page.
// Connects the live-update socket and, whenever a task gets assigned (see
// server/src/routes/taskRoutes.js), shows a native browser notification —
// which (unlike an in-page toast) still appears even if this tab is
// unfocused, in the background, or the CRM is open in a different
// browser/PC under the same shared login. Does NOT persist notifications
// or work while the browser itself is fully closed (out of scope).
//
// Browsers require Notification.requestPermission() to be called from a
// real user gesture (a click) — calling it automatically on load is
// silently ignored by Chrome and others, leaving permission stuck at
// "default" forever with no prompt ever shown. So instead of requesting on
// mount, this renders a small dismissible prompt whose button click is
// the actual gesture.
export default function NotificationBridge() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [permission, setPermission] = useState("default");
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    setPermission(Notification.permission);
    setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    const socket = getSocket();
    if (!socket) {
      console.warn("[notifications] No socket — not authenticated yet?");
      return;
    }

    const handleConnect = () => console.log("[notifications] socket connected:", socket.id);
    const handleConnectError = (err) => console.error("[notifications] socket connect_error:", err.message);

    const handleNotification = ({ title, message, taskId } = {}) => {
      console.log("[notifications] received:", title, message);
      if (!title) return;

      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        const n = new Notification(title, { body: message });
        n.onclick = () => {
          window.focus();
          if (taskId) router.push("/tasks");
        };
      }
    };

    socket.on("connect", handleConnect);
    socket.on("connect_error", handleConnectError);
    socket.on("notification", handleNotification);
    return () => {
      socket.off("connect", handleConnect);
      socket.off("connect_error", handleConnectError);
      socket.off("notification", handleNotification);
    };
  }, [isAuthenticated, router]);

  const handleEnable = async () => {
    const result = await Notification.requestPermission();
    setPermission(result);
    setDismissed(true);
    sessionStorage.setItem(DISMISS_KEY, "1");
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem(DISMISS_KEY, "1");
  };

  if (!isAuthenticated || permission !== "default" || dismissed) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white border border-outline-variant rounded-lg shadow-lg p-4 max-w-xs flex flex-col gap-2">
      <p className="text-body-sm font-body-sm text-on-surface">
        Enable notifications to get a live alert when a task is assigned, even while this tab is in the background.
      </p>
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={handleDismiss}
          className="px-3 py-1.5 text-label-sm font-label-sm text-on-surface-variant hover:bg-gray-100 rounded"
        >
          Not now
        </button>
        <button
          onClick={handleEnable}
          className="px-3 py-1.5 text-label-sm font-label-sm bg-primary text-white rounded hover:bg-primary/90"
        >
          Enable
        </button>
      </div>
    </div>
  );
}
