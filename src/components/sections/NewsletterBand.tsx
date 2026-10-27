"use client";

import { Mail } from "lucide-react";
import { useCallback, useState } from "react";
import { Toast } from "@/components/ui/Toast";
import { track } from "@/lib/analytics";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Front-end-only newsletter signup with validation, toast and analytics event. */
export function NewsletterBand() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const clearToast = useCallback(() => setToast(null), []);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    setError(null);
    track("newsletter_signup", { location: "home_band" });
    setEmail("");
    setToast("You're in! The next Kahaani lands in your inbox soon.");
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
            One warm letter a month: new stories, festival dates, food finds and weekend trips from Kanpur.
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
              className="h-12 rounded-full bg-dark px-7 text-sm font-semibold text-white transition hover:bg-black"
            >
              Subscribe
            </button>
          </div>
          <p id="newsletter-error" role="alert" className="mt-2 min-h-5 pl-4 text-sm text-[#ffd9d2]">
            {error}
          </p>
        </form>
      </div>
      <Toast message={toast} onDone={clearToast} />
    </section>
  );
}
