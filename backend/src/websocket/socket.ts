import { Server } from "socket.io";
import type { Server as HttpServer } from "node:http";

let io: Server;

export function initializeSocket(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {
    console.log(`WebSocket connected: ${socket.id}`);

    socket.on("disconnect", () => {
      console.log(`WebSocket disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO() {
  if (!io) {
    throw new Error("Socket.IO has not been initialized");
  }

  return io;
}
