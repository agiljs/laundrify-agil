import "dotenv/config";
import { createServer } from "node:http";
import app from "./app.js";
import { initializeSocket } from "./websocket/socket.js";

const PORT = process.env.PORT || 5000;

const httpServer = createServer(app);

initializeSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Laundrify API running on http://localhost:${PORT}`);
  console.log(`Laundrify webSocket running on ws:http://localhost:${PORT}`);
});
