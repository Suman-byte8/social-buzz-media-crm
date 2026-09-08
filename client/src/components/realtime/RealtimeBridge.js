"use client";

import { useEffect } from "react";
import { getSocket } from "@/lib/socket";
import { invalidateCache } from "@/utils/cache";
import { useAuth } from "@/app/login/context/AuthContext";

// Renders nothing — mounted once in AppLayout so it's alive on every
// authenticated page. Connects the live-update socket and, whenever
// another user's change comes in, drops this tab's localStorage cache
// entry for that resource (see @/utils/cache.js) so the next fetch for it
// — whenever that happens, on this page or the next one visited — can't
// serve stale data for the rest of its TTL window.
//
// This alone doesn't make anything visibly update *right now* without a
// refetch; for the one place that matters most (the Tasks board, the most
// likely spot for simultaneous edits), TasksPageShell additionally listens
// for the same event and actively refetches using its own current filters.
export default function RealtimeBridge() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;

    const socket = getSocket();
    if (!socket) return;

    const handleChange = ({ resource } = {}) => {
      if (resource) invalidateCache(resource);
    };

    socket.on("data:changed", handleChange);
    return () => socket.off("data:changed", handleChange);
  }, [isAuthenticated]);

  return null;
}
