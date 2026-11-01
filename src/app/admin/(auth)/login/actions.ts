"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { audit } from "@/lib/admin/audit";
import { clearFailures, coolDownMinutes, recordFailure } from "@/lib/admin/rate-limit";
import { clientIp, requestOrigin } from "@/lib/admin/request-info";
import { safeNext } from "@/lib/admin/session-rules";
import { finishAdminSignIn } from "@/lib/admin/sign-in";
import { createSessionClient } from "@/lib/supabase/server";

export interface LoginState {
  error?: string;
  notice?: string;
}

const NOT_CONFIGURED = "Sign-in isn't set up yet. Add the Supabase keys and ADMIN_EMAIL (see SETUP.md).";
const WRONG = "That email and password didn't match. Please try again.";
const cooling = (m: number) => `Too many attempts. Please wait ${m} minute${m === 1 ? "" : "s"} and try again.`;

const emailSchema = z.string().trim().toLowerCase().email().max(200);

/** "Continue with Google": the PKCE verifier is stored in an httpOnly cookie on the server. */
export async function signInWithGoogle(formData: FormData) {
  const supabase = await createSessionClient();
  if (!supabase) redirect("/admin/login?error=unconfigured");
  const next = safeNext(formData.get("next"));
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${await requestOrigin()}/admin/auth/callback?next=${encodeURIComponent(next)}`,
      skipBrowserRedirect: true,
      queryParams: { prompt: "select_account" },
    },
  });
  if (error || !data.url) redirect("/admin/login?error=google");
  redirect(data.url);
}

/** Email + password (backup). 5 failures per 15 min per IP + email, then a cool-down. */
export async function signInWithPassword(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const supabase = await createSessionClient();
  if (!supabase) return { error: NOT_CONFIGURED };
  const email = emailSchema.safeParse(formData.get("email"));
  const password = String(formData.get("password") ?? "");
  if (!email.success || !password) return { error: WRONG };

  const key = `pw|${await clientIp()}|${email.data}`;
  const wait = await coolDownMinutes(key);
  if (wait) return { error: cooling(wait) };

  const { data, error } = await supabase.auth.signInWithPassword({ email: email.data, password: password.slice(0, 200) });
  if (error || !data.user) {
    await recordFailure(key);
    const left = await coolDownMinutes(key);
    return { error: left ? cooling(left) : WRONG };
  }
  await clearFailures(key);
  redirect(await finishAdminSignIn(supabase, data.user, formData.get("next"), "password"));
}

/** "Forgot password?": the same answer whether or not the email exists. */
export async function sendPasswordReset(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const supabase = await createSessionClient();
  if (!supabase) return { error: NOT_CONFIGURED };
  const email = emailSchema.safeParse(formData.get("email"));
  const done = { notice: "If that address belongs to the team, a reset link is on its way. Check your inbox." };
  if (!email.success) return done;
  const key = `reset|${await clientIp()}|${email.data}`;
  const wait = await coolDownMinutes(key);
  if (wait) return { error: cooling(wait) };
  await recordFailure(key); // every reset request counts toward the limit
  await supabase.auth.resetPasswordForEmail(email.data, {
    redirectTo: `${await requestOrigin()}/admin/auth/callback?next=${encodeURIComponent("/admin/reset-password")}`,
  });
  return done;
}

/** Second step when 2-step verification is on: a 6-digit code from the authenticator app. */
export async function verifyMfaCode(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const supabase = await createSessionClient();
  if (!supabase) return { error: NOT_CONFIGURED };
  const code = String(formData.get("code") ?? "").replace(/\s/g, "");
  if (!/^\d{6}$/.test(code)) return { error: "Enter the 6-digit code from your authenticator app." };
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) redirect("/admin/login?error=session");

  const key = `mfa|${user.user.id}`;
  const wait = await coolDownMinutes(key);
  if (wait) return { error: cooling(wait) };

  const { data: factors } = await supabase.auth.mfa.listFactors();
  const totp = factors?.totp?.find((f) => f.status === "verified");
  if (!totp) redirect(safeNext(formData.get("next")));
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: totp.id, code });
  if (error) {
    await recordFailure(key);
    return { error: "That code didn't work. Codes change every 30 seconds — try the current one." };
  }
  await clearFailures(key);
  await audit("login", user.user.email ?? "admin", { detail: "password/google + 2-step" });
  redirect(safeNext(formData.get("next")));
}
