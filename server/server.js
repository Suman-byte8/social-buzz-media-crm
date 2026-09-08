import http from "http";
import app from "./index.js";
import { initRealtime } from "./src/utils/realtime.js";

const PORT = process.env.PORT || 5000;

// Socket.io needs the raw http.Server rather than the Express app itself
// (app.listen() creates one internally but doesn't hand it back), so it's
// created explicitly here and Express is mounted onto it as the request
// handler — this is otherwise identical to app.listen(PORT).
const httpServer = http.createServer(app);
initRealtime(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
