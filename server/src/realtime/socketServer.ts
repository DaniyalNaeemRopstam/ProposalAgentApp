import type { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { Server as SocketIOServer } from "socket.io";
import { corsAllowsOrigin } from "../config/cors";

let ioInstance: SocketIOServer | null = null;

function jwtSecret(): string {
  const s = process.env.JWT_SECRET;
  if (!s) {
    throw new Error("JWT_SECRET is not set");
  }
  return s;
}

/**
 * Attach Socket.IO to the HTTP server (after routes are mounted).
 */
export function initSocketServer(httpServer: HttpServer): SocketIOServer {
  ioInstance = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, cb) => {
        cb(null, corsAllowsOrigin(origin));
      },
      credentials: true,
    },
  });

  ioInstance.use((socket, next) => {
    const raw = socket.handshake.auth?.token;
    const token =
      typeof raw === "string"
        ? raw.trim()
        : raw != null && typeof (raw as { toString(): string }).toString === "function"
          ? String(raw).trim()
          : "";
    if (!token) {
      next(new Error("Unauthorized"));
      return;
    }

    try {
      const payload = jwt.verify(token, jwtSecret()) as { sub?: string };
      const sub = payload.sub ?? "";
      if (!mongoose.Types.ObjectId.isValid(sub)) {
        next(new Error("Unauthorized"));
        return;
      }
      (socket.data as { userId?: string }).userId = sub;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  ioInstance.on("connection", (socket) => {
    const userId = (socket.data as { userId?: string }).userId;
    if (!userId) return;
    socket.join(`user-${userId}`);
  });

  return ioInstance;
}

export function getSocketIO(): SocketIOServer | null {
  return ioInstance;
}
