import type { Metadata } from "next";
import { LogoMark } from "@/components/layout/Logo";
import { safeNext } from "@/lib/admin/session-rules";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { LoginForm, MfaForm } from "./LoginForm";

export const metadata: Metadata = { title: "Team login" };

// Friendly, and never reveals whether an email address has an account.
const errors: Record<string, string> = {
  forbidden: "This account doesn't have team access.",
  unconfigured: "Sign-in switches on once the site is connected to Supabase: add the Supabase keys and ADMIN_EMAIL in Vercel, then redeploy (SETUP.md, steps 1–6).",
  callback: "That sign-in link has expired or was already used. Please try again.",
  google: "Couldn't reach Google sign-in just now. Please try again.",
  expired: "For your security you're signed out after 7 days. Please sign in again.",
  idle: "You were signed out after 12 hours without activity. Please sign in again.",
  session: "Please sign in to continue.",
};

export default async function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  const sp = await searchParams;
  const message = typeof sp.error === "string" ? errors[sp.error] : undefined;
  const next = safeNext(sp.next);
  const mfa = sp.step === "mfa";
  const configured = isSupabaseConfigured() && Boolean(process.env.ADMIN_EMAIL);
  return (
    <section className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-[420px] rounded-2xl border border-border bg-white p-8 text-center shadow-[0_20px_50px_-30px_rgba(60,30,20,0.35)]">
        <LogoMark size={64} decorative={false} className="mx-auto" />
        <p className="eyebrow mt-4">Team access</p>
        <h1 className="mt-1 text-2xl font-bold text-primary">{mfa ? "2-step verification" : "Sign in to Kanpur Ki Kahaani"}</h1>
        {message && (
          <p role="alert" className="mt-4 rounded-xl bg-primary-soft px-4 py-3 text-sm font-medium text-primary">
            {message}
          </p>
        )}
        {!configured && !message && (
          <p role="alert" className="mt-4 rounded-xl bg-primary-soft px-4 py-3 text-sm font-medium text-primary">
            {errors.unconfigured}
          </p>
        )}
        {mfa && configured ? <MfaForm next={next} /> : <LoginForm next={next} disabled={!configured} />}
        <p className="mt-6 text-xs text-muted">This area is for the Kanpur Ki Kahaani team only.</p>
      </div>
    </section>
  );
}
