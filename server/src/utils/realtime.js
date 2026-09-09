import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../middleware/auth.js";

let io = null;

// This app has exactly two login accounts (see scripts/seed-users.js) —
// there's no per-person login, so a task "assigned to Sarah" can't be
// targeted at Sarah's device specifically; every device logged in with the
// same shared credentials is indistinguishable to the server. Notifications
// are therefore broadcast to every currently-connected, authenticated
// socket rather than scoped to a specific user — which matches how the CRM
// is actually used (same id/password, open on however many PCs).
export const initRealtime = (httpServer) => {
  io = new Server(httpServer, { cors: { origin: "*" } });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication required"));
    try {
      socket.user = jwt.verify(token, JWT_SECRET);
      next();
    } catch {
      next(new Error("Invalid or expired session"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`[realtime] Socket connected (user: ${socket.user?.email || socket.user?.id})`);
    socket.on("disconnect", () => {
      console.log(`[realtime] Socket disconnected (user: ${socket.user?.email || socket.user?.id})`);
    });
  });

  return io;
};

// Fire-and-forget: pushes a notification to every connected session. Safe
// to call even if a socket server was never initialized (e.g. a script
// context) — it just does nothing.
export const notify = (payload) => {
  if (!io) return;
  io.emit("notification", payload);
};
