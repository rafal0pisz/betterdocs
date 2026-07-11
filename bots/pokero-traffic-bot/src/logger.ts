import type { ActionLogEntry } from "./types.js";

export function logAction(entry: ActionLogEntry): void {
  const time = new Date(entry.timestampMs).toISOString();
  const status = entry.ok ? "OK  " : "FAIL";
  console.log(
    `[${time}] session=${entry.sessionId} iter=${entry.iteration} [${status}] ${entry.action}: ${entry.detail}`
  );
}

export function logInfo(message: string): void {
  console.log(`[${new Date().toISOString()}] ${message}`);
}
