"use client";

import Link from "next/link";
import { useState } from "react";
import { LogoMark } from "@/components/layout/Logo";
import { useSubscribe } from "@/lib/newsletter/use-subscribe";
import { EMAIL_RE, Honeypot } from "./NewsletterBand";

/** Compact signup card used inside blog posts (source: blog). */
export function InlineSignup() {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { state, message, subscribe } = useSubscribe("blog");
  const done = state === "subscribed" || state === "exists";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) return setError("Please enter a valid email address.");
    setError(null);
    await subscribe({ email, website });
  }

  return (
    <aside aria-labelledby="inline-signup-title" className="my-10 rounded-2xl border border-border bg-bg-alt p-6 md:p-8">
      <div className="flex items-start gap-4">
        <LogoMark size={48} />
        <div className="min-w-0 flex-1">
          <p className="eyebrow text-[10.5px]">The Kahaani Letter</p>
          <h2 id="inline-signup-title" className="mt-1 text-xl font-bold text-primary md:text-2xl">
            Enjoyed this story? Get the next one by email.
          </h2>
          {done ? (
            <p role="status" className="mt-3 font-semibold text-ink">{message}</p>
          ) : (
            <form onSubmit={onSubmit} noValidate className="relative mt-4">
              <label htmlFor="inline-email" className="sr-only">Email address</label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  id="inline-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={!!error}
                  aria-describedby="inline-error"
                  className="h-11 min-w-0 flex-1 rounded-full border border-border bg-white px-4 text-[15px] text-ink focus:border-primary focus:outline-none"
                />
                <button type="submit" disabled={state === "loading"} className="h-11 rounded-full bg-primary px-6 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-70">
                  {state === "loading" ? "Subscribing…" : "Subscribe"}
                </button>
              </div>
              <Honeypot value={website} onChange={setWebsite} id="inline-website" />
              <p id="inline-error" role="alert" className="mt-1.5 min-h-4 text-xs text-primary">
                {error ?? (state === "error" ? message : "")}
              </p>
              <p className="text-[11px] text-muted">
                By subscribing you agree to receive emails from Kanpur Ki Kahaani. Unsubscribe anytime.{" "}
                <Link href="/privacy" className="underline hover:text-primary">Privacy</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </aside>
  );
}
