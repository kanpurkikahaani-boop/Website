"use client";

import { Mail } from "lucide-react";
import { useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/browser";

function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.2-.1-2.3-.4-3.5z" />
    </svg>
  );
}

export function LoginForm({ configured }: { configured: boolean }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const callback = () => `${window.location.origin}/admin/auth/callback`;

  async function google() {
    const supabase = createBrowserSupabase();
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: callback() } });
  }

  async function magic(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    const supabase = createBrowserSupabase();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: callback(), shouldCreateUser: false },
    });
    // Same message either way, so the form doesn't reveal which emails exist.
    setState(error && error.status !== 400 && error.status !== 422 ? "error" : "sent");
  }

  if (!configured) return null;

  return (
    <div className="mt-6 text-left">
      <button
        type="button"
        onClick={google}
        className="flex w-full items-center justify-center gap-3 rounded-full border border-border bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-primary"
      >
        <GoogleG /> Sign in with Google
      </button>
      <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-muted">
        <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
      </div>
      {state === "sent" ? (
        <p role="status" className="rounded-xl bg-accent-soft px-4 py-3 text-sm text-ink">
          If that address belongs to the team, a sign-in link is on its way. Check your inbox.
        </p>
      ) : (
        <form onSubmit={magic}>
          <label htmlFor="admin-email" className="text-sm font-semibold text-ink">
            Email me a sign-in link
          </label>
          <div className="relative mt-2">
            <Mail size={17} aria-hidden className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input
              id="admin-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 w-full rounded-full border border-border bg-white pl-11 pr-4 text-sm text-ink focus:border-primary focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={state === "sending"}
            className="mt-3 w-full rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-70"
          >
            {state === "sending" ? "Sending…" : "Send magic link"}
          </button>
          {state === "error" && (
            <p role="alert" className="mt-2 text-sm text-primary">
              Couldn&apos;t send the link right now. Please try again.
            </p>
          )}
        </form>
      )}
    </div>
  );
}
