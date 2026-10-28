import { io } from "socket.io-client";
import { getFromStorage } from "@/utils/storage";
import { getApiHost } from "@/services/apiClient";

let socket = null;

// Lazily creates (or returns) the one socket connection for this tab.
// Returns null when there's no auth token yet (not logged in) or on the
// server (no window) — callers should treat a null return as "not
// connected right now" rather than an error.
export const getSocket = () => {
  if (typeof window === "undefined") return null;

  const token = getFromStorage("auth_token");
  if (!token) return null;

  if (socket) return socket;

  // Socket.io connects to the bare host and handles its own /socket.io/ path.
  socket = io(getApiHost(), {
    auth: { token },
    transports: ["websocket", "polling"],
  });
  // If the API client failed over to the other server, follow it on the
  // next reconnect instead of retrying the dead host forever.
  socket.io.on("reconnect_attempt", () => {
    socket.io.uri = getApiHost();
  });

  return socket;
};

// Call on logout so a stale connection/token doesn't linger, and so the
// next login creates a fresh socket with the new token.
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
