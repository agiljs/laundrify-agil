import "dotenv/config";
import { createServer } from "node:http";
import app from "./app.js";
import { initializeSocket } from "./websocket/socket.js";
import { describeMidtransKeys, getMidtransConfigProblem } from "./services/midtrans.service.js";

const PORT = process.env.PORT || 5000;

const httpServer = createServer(app);

initializeSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Laundrify API running on http://localhost:${PORT}`);
  console.log(`Laundrify webSocket running on ws://localhost:${PORT}`);

  const midtransProblem = getMidtransConfigProblem();
  if (midtransProblem) console.warn(`[Midtrans] PERHATIAN: ${midtransProblem}`);
  else console.log(`[Midtrans] siap (${process.env.MIDTRANS_IS_PRODUCTION === "true" ? "PRODUCTION" : "Sandbox"})`);
  if (process.env.NODE_ENV !== "production") console.log(`[Midtrans] ${describeMidtransKeys()}`);
});
