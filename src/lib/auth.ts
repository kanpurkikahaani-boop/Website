import "server-only";
import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createSessionClient } from "./supabase/server";

/** True when the user is the configured admin AND their email is verified. */
export function isAdminUser(user: Pick<User, "email" | "email_confirmed_at"> | null | undefined) {
  const admin = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!admin || !user?.email) return false;
  return user.email.toLowerCase() === admin && Boolean(user.email_confirmed_at);
}

/** The signed-in admin, re-verified with Supabase Auth (never trusts the cookie alone). */
export async function getAdminUser(): Promise<User | null> {
  const supabase = await createSessionClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error || !isAdminUser(data.user)) return null;
  return data.user;
}

export async function isAdmin() {
  return (await getAdminUser()) !== null;
}

/** For admin pages: redirect anyone else to the login page. */
export async function requireAdminPage() {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");
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
