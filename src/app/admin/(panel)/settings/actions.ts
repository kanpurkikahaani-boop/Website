"use server";

import { revalidatePath } from "next/cache";
import { audit } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

/** Step 1 of turning on 2-step verification: create a TOTP factor and return its QR code. */
export async function startTotpEnrolment(): Promise<Result<{ factorId: string; qr: string; secret: string }>> {
  await requireAdmin();
  const db = await createSessionClient();
  if (!db) return { ok: false, error: "Supabase is not configured" };
  // Clear half-finished attempts first (Supabase allows only a few unverified factors).
  const { data: list } = await db.auth.mfa.listFactors();
  for (const f of list?.all ?? []) if (f.status !== "verified") await db.auth.mfa.unenroll({ factorId: f.id });
  const { data, error } = await db.auth.mfa.enroll({ factorType: "totp", friendlyName: `Authenticator ${new Date().toISOString().slice(0, 10)}` });
  if (error || !data) return { ok: false, error: error?.message ?? "Couldn't start 2-step verification." };
  return { ok: true, factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret };
}

/** Step 2: confirm with a code from the app. */
export async function confirmTotpEnrolment(factorId: string, code: string): Promise<Result> {
  const user = await requireAdmin();
  if (!/^\d{6}$/.test(code.replace(/\s/g, ""))) return { ok: false, error: "Enter the 6-digit code." };
  const db = await createSessionClient();
  if (!db) return { ok: false, error: "Supabase is not configured" };
  const { error } = await db.auth.mfa.challengeAndVerify({ factorId, code: code.replace(/\s/g, "") });
  if (error) return { ok: false, error: "That code didn't work. Codes change every 30 seconds — try the current one." };
  await audit("mfa_enrol", user.email!);
  revalidatePath("/admin/settings");
  return { ok: true };
}

/** Turn 2-step verification off (Supabase requires the current session to have passed it). */
export async function removeTotp(factorId: string): Promise<Result> {
  const user = await requireAdmin();
  const db = await createSessionClient();
  if (!db) return { ok: false, error: "Supabase is not configured" };
  const { error } = await db.auth.mfa.unenroll({ factorId });
  if (error) return { ok: false, error: error.message };
  await audit("mfa_remove", user.email!);
  revalidatePath("/admin/settings");
  return { ok: true };
}
