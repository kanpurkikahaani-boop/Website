/** Admin session limits, enforced by src/proxy.ts and getAdminUser(). */
export const ADMIN_SEEN_COOKIE = "kkk_admin_seen";
export const MAX_SESSION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days after signing in
export const MAX_IDLE_MS = 12 * 60 * 60 * 1000; // 12 hours without visiting /admin

export type SessionVerdict = "ok" | "expired" | "idle";

/** `lastSignInAt` comes from Supabase Auth (can't be forged); `seenAt` from our httpOnly cookie. */
export function checkSessionAge(lastSignInAt: string | null | undefined, seenAt: string | undefined, now = Date.now()): SessionVerdict {
  const signedIn = lastSignInAt ? Date.parse(lastSignInAt) : NaN;
  if (!Number.isFinite(signedIn) || now - signedIn > MAX_SESSION_MS) return "expired";
  const seen = Number(seenAt);
  if (seenAt && Number.isFinite(seen) && now - seen > MAX_IDLE_MS) return "idle";
  return "ok";
}

export const seenCookieOptions = {
  path: "/",
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: MAX_SESSION_MS / 1000,
};

/** Only internal /admin paths are allowed as a post-login destination (no open redirects). */
export function safeNext(next: unknown, fallback = "/admin/blogs"): string {
  if (typeof next !== "string") return fallback;
  if (!next.startsWith("/admin") || next.startsWith("//") || next.includes("\\") || /[\r\n]/.test(next)) return fallback;
  if (next.startsWith("/admin/login") || next.startsWith("/admin/auth")) return fallback;
  try {
    const u = new URL(next, "http://x");
    if (u.host !== "x") return fallback;
    return u.pathname + u.search;
  } catch {
    return fallback;
  }
}
