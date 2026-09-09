"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSocket } from "@/lib/socket";
import { useAuth } from "@/app/login/context/AuthContext";

// Renders nothing — mounted once in AppLayout so it's alive on every
// authenticated page. Connects the live-update socket and, whenever a task
// gets assigned (see server/src/routes/taskRoutes.js), shows a native
// browser notification — which (unlike an in-page toast) still appears
// even if this tab is unfocused, in the background, or the CRM is open in
// a different browser/PC under the same shared login. It does NOT persist
// notifications or work while the browser itself is fully closed — see
// the "hold this" conversation this was scoped from.
export default function NotificationBridge() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;

    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    const socket = getSocket();
    if (!socket) return;

    const handleNotification = ({ title, message, taskId } = {}) => {
      if (!title) return;

      if (Notification.permission === "granted") {
        const n = new Notification(title, { body: message });
        n.onclick = () => {
          window.focus();
          if (taskId) router.push("/tasks");
        };
      }
    };

    socket.on("notification", handleNotification);
    return () => socket.off("notification", handleNotification);
  }, [isAuthenticated, router]);

  return null;
}
