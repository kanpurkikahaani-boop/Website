import "server-only";
import { createServiceClient } from "@/lib/supabase/admin";

export const MAX_ATTEMPTS = 5;
export const WINDOW_MS = 15 * 60 * 1000;

// Fallback when the service key isn't set (local dev): per-instance memory.
const memory = new Map<string, number[]>();

/** Failed attempts for `key` within the window. Returns minutes left in the cool-down, or 0. */
export async function coolDownMinutes(key: string): Promise<number> {
  const since = Date.now() - WINDOW_MS;
  const db = createServiceClient();
  let times: number[];
  if (db) {
    const { data, error } = await db
      .from("login_attempts")
      .select("at")
      .eq("key", key)
      .gte("at", new Date(since).toISOString())
      .order("at", { ascending: true });
    times = error ? (memory.get(key) ?? []) : (data ?? []).map((r) => Date.parse(r.at as string));
  } else {
    times = (memory.get(key) ?? []).filter((t) => t > since);
  }
  if (times.length < MAX_ATTEMPTS) return 0;
  const unlock = times[times.length - MAX_ATTEMPTS] + WINDOW_MS;
  return Math.max(1, Math.ceil((unlock - Date.now()) / 60_000));
}

export async function recordFailure(key: string) {
  const now = Date.now();
  memory.set(key, [...(memory.get(key) ?? []).filter((t) => t > now - WINDOW_MS), now]);
  const db = createServiceClient();
  if (!db) return;
  await db.from("login_attempts").insert({ key });
  // Housekeeping: forget attempts older than a day.
  await db.from("login_attempts").delete().lt("at", new Date(now - 24 * 60 * 60 * 1000).toISOString());
}

export async function clearFailures(key: string) {
  memory.delete(key);
  const db = createServiceClient();
  if (db) await db.from("login_attempts").delete().eq("key", key);
}
