import { User } from "../models/User";
import { getSocketIO } from "./socketServer";

export function emitNewJobMatch(userId: string, job: unknown): void {
  const io = getSocketIO();
  if (!io) return;
  io.to(`user-${userId}`).emit("new-job-match", { job });
}

export async function emitStatsUpdated(userId: string): Promise<void> {
  const io = getSocketIO();
  if (!io) return;

  const u = await User.findById(userId).select("stats").lean();
  if (!u?.stats) return;
  io.to(`user-${userId}`).emit("stats-updated", { stats: u.stats });
}

export function emitSequenceDue(userId: string, sequence: unknown): void {
  const io = getSocketIO();
  if (!io) return;
  io.to(`user-${userId}`).emit("sequence-due", { sequence });
}
