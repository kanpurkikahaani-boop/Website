import type { CookieOptions } from "@supabase/ssr";

/**
 * Every Supabase auth cookie is httpOnly + SameSite=Lax (+ Secure in production): page scripts can
 * never read the session. All sign-in, sign-out and uploads therefore run on the server.
 */
export function hardenCookie(options: CookieOptions = {}): CookieOptions {
  return { ...options, path: options.path ?? "/", httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" };
}
