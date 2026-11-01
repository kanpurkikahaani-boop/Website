import "server-only";
import type { User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { isAdminUser } from "./admin-check";
import { needsSecondFactor } from "./admin/mfa";
import { ADMIN_SEEN_COOKIE, checkSessionAge } from "./admin/session-rules";
import { createSessionClient } from "./supabase/server";

export { isAdminUser };

/** The signed-in admin, re-verified with Supabase Auth (never trusts the cookie alone). */
export async function getAdminUser(): Promise<User | null> {
  await connection(); // always evaluated at request time, never at build
  const supabase = await createSessionClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error || !isAdminUser(data.user)) return null;
  // Same limits as the proxy: 7-day sessions, 12 h idle, and 2-step verification once enrolled.
  const seen = (await cookies()).get(ADMIN_SEEN_COOKIE)?.value;
  if (checkSessionAge(data.user.last_sign_in_at, seen) !== "ok") return null;
  if (await needsSecondFactor(supabase)) return null;
  return data.user;
}

export async function isAdmin() {
  return (await getAdminUser()) !== null;
}

/** For admin pages: redirect anyone else to the login page. */
export async function requireAdminPage() {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login?error=session");
  return user;
}

export class ForbiddenError extends Error {
  constructor() {
    super("Forbidden");
  }
}

/** For server actions and route handlers that change data. */
export async function requireAdmin() {
  const user = await getAdminUser();
  if (!user) throw new ForbiddenError();
  return user;
}
