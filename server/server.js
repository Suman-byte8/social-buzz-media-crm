import http from "http";
import app from "./index.js";
import { initRealtime } from "./src/utils/realtime.js";

const PORT = process.env.PORT || 5000;

const httpServer = http.createServer(app);
initRealtime(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
