// Socket.io server for live updates — pushes a "something changed" event to
// every connected browser the moment a mutation succeeds, instead of
// leaving other users waiting out a cache TTL (see serverCache.js) or a
// manual refresh to see someone else's change.
//
// Deliberately thin: sockets don't carry any data, only a resource name
// (the same cache-key prefix already passed to invalidateCache — see
// serverCache.js, which calls broadcast() itself so every existing
// invalidateCache() call site automatically gets a live push for free).
// Each client decides what, if anything, to do about it — see
// client/src/lib/socket.js and RealtimeBridge.js.
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../middleware/auth.js";

let io = null;

export const initRealtime = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: "*" }, // matches the existing permissive cors() middleware on the REST API
  });

  // Same JWT the REST API already requires — a socket that can't produce
  // a valid token never completes the handshake.
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
    console.log(`[realtime] client connected (user ${socket.user?.id ?? "?"})`);
    socket.on("disconnect", () => {
      console.log(`[realtime] client disconnected (user ${socket.user?.id ?? "?"})`);
    });
  });

  console.log("[realtime] Socket.io initialized");
  return io;
};

// No-op (not an error) if called before initRealtime — e.g. a script that
// imports serverCache.js without ever starting the HTTP server. A missed
// broadcast is purely a live-UI nicety, never something worth crashing or
// logging noisily over.
export const broadcast = (event, payload) => {
  if (!io) return;
  io.emit(event, payload);
};
