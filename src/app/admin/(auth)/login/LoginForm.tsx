"use client";

import { KeyRound, Mail } from "lucide-react";
import { useActionState, useState } from "react";
import { sendPasswordReset, signInWithGoogle, signInWithPassword, verifyMfaCode, type LoginState } from "./actions";

function GoogleG() {
  return (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white">
      <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
        <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" />
        <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
        <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
        <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.2-.1-2.3-.4-3.5z" />
      </svg>
    </span>
  );
}

const input = "h-11 w-full rounded-xl border border-border bg-white px-4 text-sm text-ink focus:border-primary focus:outline-none";
const label = "block text-sm font-semibold text-ink";
const primary = "w-full rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:opacity-70";

function Feedback({ state }: { state: LoginState }) {
  if (state.error) return <p role="alert" className="text-sm font-medium text-primary">{state.error}</p>;
  if (state.notice) return <p role="status" className="rounded-xl bg-accent-soft px-4 py-3 text-sm text-ink">{state.notice}</p>;
  return null;
}

export function MfaForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(verifyMfaCode, {});
  return (
    <form action={action} className="mt-6 space-y-4 text-left">
      <input type="hidden" name="next" value={next} />
      <label className={label}>
        6-digit code from your authenticator app
        <input name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,7}" required autoFocus className={`${input} mt-1.5 text-center text-lg tracking-[0.4em]`} />
      </label>
      <Feedback state={state} />
      <button disabled={pending} className={primary}>{pending ? "Checking…" : "Verify and continue"}</button>
    </form>
  );
}

export function LoginForm({ next }: { next: string }) {
  const [mode, setMode] = useState<"password" | "reset">("password");
  const [pwState, pwAction, pwPending] = useActionState(signInWithPassword, {});
  const [resetState, resetAction, resetPending] = useActionState(sendPasswordReset, {});

  return (
    <div className="mt-6 text-left">
      <form action={signInWithGoogle}>
        <input type="hidden" name="next" value={next} />
        <button type="submit" className="flex w-full items-center justify-center gap-3 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover">
          <GoogleG /> Continue with Google
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-muted">
        <span className="h-px flex-1 bg-border" /> or use email <span className="h-px flex-1 bg-border" />
      </div>

      {mode === "password" ? (
        <form action={pwAction} className="space-y-3">
          <input type="hidden" name="next" value={next} />
          <label className={label}>
            Email
            <span className="relative mt-1.5 block">
              <Mail size={16} aria-hidden className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
              <input name="email" type="email" required autoComplete="username" className={`${input} pl-11`} />
            </span>
          </label>
          <label className={label}>
            Password
            <span className="relative mt-1.5 block">
              <KeyRound size={16} aria-hidden className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
              <input name="password" type="password" required autoComplete="current-password" className={`${input} pl-11`} />
            </span>
          </label>
          <Feedback state={pwState} />
          <button type="submit" disabled={pwPending} className="w-full rounded-full border border-primary px-5 py-3 text-sm font-semibold text-primary transition hover:bg-primary-soft disabled:opacity-70">
            {pwPending ? "Signing in…" : "Sign in with email"}
          </button>
          <button type="button" onClick={() => setMode("reset")} className="block w-full text-center text-sm font-medium text-primary underline-offset-4 hover:underline">
            Forgot password?
          </button>
        </form>
      ) : (
        <form action={resetAction} className="space-y-3">
          <label className={label}>
            Your team email
            <input name="email" type="email" required autoComplete="username" className={`${input} mt-1.5`} />
          </label>
          <Feedback state={resetState} />
          <button type="submit" disabled={resetPending} className={primary}>
            {resetPending ? "Sending…" : "Email me a reset link"}
          </button>
          <button type="button" onClick={() => setMode("password")} className="block w-full text-center text-sm font-medium text-primary underline-offset-4 hover:underline">
            Back to sign in
          </button>
        </form>
      )}
    </div>
  );
}
