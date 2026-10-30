"use client";

import { Mail } from "lucide-react";
import { useCallback, useState } from "react";
import Link from "next/link";
import { Toast } from "@/components/ui/Toast";
import { useSubscribe } from "@/lib/newsletter/use-subscribe";

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Home-page newsletter band. Posts to /api/subscribe (source: home_band). */
export function NewsletterBand() {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const clearToast = useCallback(() => setToast(null), []);
  const { state, subscribe } = useSubscribe("home_band");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    setError(null);
    const result = await subscribe({ email, website });
    if (result === "subscribed") {
      setEmail("");
      setToast("You're in! Watch your inbox.");
    } else if (result === "exists") {
      setEmail("");
      setToast("You're already on the list!");
    } else {
      setError("We couldn't sign you up just now. Please try again.");
    }
  }

  return (
    <section id="newsletter" aria-labelledby="newsletter-title" className="bg-primary">
      <div className="container-site flex flex-col items-start gap-8 py-14 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-lg">
          <p className="eyebrow text-[#f6d79c]">Newsletter</p>
          <h2 id="newsletter-title" className="mt-2 text-[30px] font-bold leading-tight text-white md:text-[38px]">
            Get the Kahaani in your inbox
          </h2>
          <p className="mt-2 text-cream/85">
            Hidden gems, food trails, festivals and weekend trips from Kanpur — once a week, no spam.
          </p>
        </div>
        <form onSubmit={onSubmit} noValidate className="w-full max-w-md">
          <label htmlFor="newsletter-email" className="sr-only">
            Email address
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Mail size={18} aria-hidden className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
              <input
                id="newsletter-email"
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!error}
                aria-describedby={error ? "newsletter-error" : undefined}
                className="h-12 w-full rounded-full border-0 bg-white pl-11 pr-4 text-[15px] text-ink placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-coral"
              />
            </div>
            <button
              type="submit"
              disabled={state === "loading"}
              className="h-12 rounded-full bg-dark px-7 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-70"
            >
              {state === "loading" ? "Subscribing…" : "Subscribe"}
            </button>
          </div>
          <Honeypot value={website} onChange={setWebsite} id="newsletter-website" />
          <p id="newsletter-error" role="alert" className="mt-2 min-h-5 pl-4 text-sm text-[#ffd9d2]">
            {error}
          </p>
          <p className="pl-4 text-xs text-cream/75">
            By subscribing you agree to receive emails from Kanpur Ki Kahaani. Unsubscribe anytime.{" "}
            <Link href="/privacy" className="underline hover:text-white">
              Privacy
            </Link>
          </p>
        </form>
      </div>
      <Toast message={toast} onDone={clearToast} />
    </section>
  );
}

/** Off-screen field that only bots fill in. Hidden from people and screen readers. */
export function Honeypot({ value, onChange, id }: { value: string; onChange: (v: string) => void; id: string }) {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <label htmlFor={id}>Leave this field empty</label>
      <input id={id} name="website" type="text" tabIndex={-1} autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
