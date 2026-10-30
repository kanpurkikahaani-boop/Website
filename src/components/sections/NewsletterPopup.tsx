"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { LogoMark } from "@/components/layout/Logo";
import { cities } from "@/data/cities";
import { SUBSCRIBED_KEY, useSubscribe } from "@/lib/newsletter/use-subscribe";
import { cn } from "@/lib/utils";
import { EMAIL_RE, Honeypot } from "./NewsletterBand";

export const DISMISSED_KEY = "kkk-nl-dismissed-at";
const DISMISS_DAYS = 14;
const DELAY_MS = 8000;
const SCROLL_RATIO = 0.4;

const CITY_CHIPS = [{ slug: "kanpur", name: "Kanpur" }, ...cities.map((c) => ({ slug: c.slug, name: c.name }))];

function suppressed() {
  try {
    if (localStorage.getItem(SUBSCRIBED_KEY)) return true;
    const at = Number(localStorage.getItem(DISMISSED_KEY));
    return Boolean(at) && Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

/**
 * Home-page newsletter popup. Opens after 8s, 40% scroll, or desktop exit intent — never on first paint.
 * Desktop: centred modal. Mobile: bottom sheet ≤40% of the screen (avoids intrusive-interstitial issues).
 */
export function NewsletterPopup() {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  const triggered = useRef(false);
  const lastFocus = useRef<HTMLElement | null>(null);

  const show = useCallback(() => {
    if (triggered.current || suppressed()) return;
    triggered.current = true;
    lastFocus.current = document.activeElement as HTMLElement | null;
    setOpen(true);
  }, []);

  useEffect(() => {
    if (suppressed()) return;
    const timer = window.setTimeout(show, DELAY_MS);
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max > 0 && window.scrollY / max >= SCROLL_RATIO) show();
    };
    const onLeave = (e: MouseEvent) => {
      if (!e.relatedTarget && e.clientY <= 0 && window.matchMedia("(pointer: fine)").matches) show();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("mouseout", onLeave);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("mouseout", onLeave);
    };
  }, [show]);

  const close = useCallback((reason: "dismiss" | "done") => {
    if (reason === "dismiss") {
      try {
        localStorage.setItem(DISMISSED_KEY, String(Date.now()));
      } catch {
        // ignore
      }
    }
    setOpen(false);
    requestAnimationFrame(() => lastFocus.current?.focus?.());
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="nl-popup"
          className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.2 }}
        >
          <div className="absolute inset-0 bg-dark/55" onClick={() => close("dismiss")} aria-hidden />
          <PopupDialog onClose={close} reduce={!!reduce} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function PopupDialog({ onClose, reduce }: { onClose: (r: "dismiss" | "done") => void; reduce: boolean }) {
  const titleId = useId();
  const descId = useId();
  const ref = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { state, message, subscribe } = useSubscribe("home_popup");
  const done = state === "subscribed" || state === "exists";

  // Focus the first field, trap Tab, close on Escape
  useEffect(() => {
    const el = ref.current;
    el?.querySelector<HTMLElement>("input[type=email], button")?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose(done ? "done" : "dismiss");
      }
      if (e.key === "Tab" && el) {
        const f = Array.from(el.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), input:not([tabindex='-1'])"));
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, done]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    setError(null);
    const r = await subscribe({ email, cities: picked, website });
    if (r === "error") setError(null);
  }

  return (
    <motion.div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
      initial={reduce ? false : { y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={reduce ? undefined : { y: 24, opacity: 0 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "relative w-full overflow-y-auto bg-bg text-left shadow-2xl",
        // mobile: bottom sheet (≤40% of the screen); desktop: centred card
        "max-h-[40vh] rounded-t-2xl px-5 pb-5 pt-4",
        "sm:max-h-[90vh] sm:max-w-[440px] sm:rounded-2xl sm:p-8",
      )}
    >
      <button
        type="button"
        onClick={() => onClose(done ? "done" : "dismiss")}
        aria-label="Close newsletter signup"
        className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full text-ink hover:bg-primary-soft"
      >
        <X size={18} aria-hidden />
      </button>

      {done ? (
        <div className="py-4 text-center sm:py-6">
          <CheckCircle2 size={40} className="mx-auto text-accent" aria-hidden />
          <h2 id={titleId} className="mt-3 text-2xl font-bold text-primary">
            {message}
          </h2>
          <p id={descId} className="mt-2 text-sm">
            The next Kahaani letter is on its way.
          </p>
          <button
            type="button"
            onClick={() => onClose("done")}
            className="mt-5 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover"
          >
            Back to the stories
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 sm:block sm:text-center">
            <LogoMark size={56} decorative={false} className="sm:mx-auto max-sm:h-10! max-sm:w-10!" />
            <div className="sm:mt-3">
              <p className="eyebrow text-[10.5px]">The Kahaani Letter</p>
              <h2 id={titleId} className="mt-1 text-[22px] font-bold leading-tight text-primary sm:text-[26px]">
                Get Kanpur&apos;s stories in your inbox
              </h2>
            </div>
          </div>
          <p id={descId} className="mt-2 text-sm sm:text-center">
            Hidden gems, food trails, festivals and weekend trips from Kanpur — once a week, no spam.
          </p>
          <form onSubmit={onSubmit} noValidate className="relative mt-4">
            <label htmlFor="popup-email" className="sr-only">
              Email address
            </label>
            <div className="flex gap-2">
              <input
                id="popup-email"
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!error}
                aria-describedby="popup-error"
                className="h-11 min-w-0 flex-1 rounded-full border border-border bg-white px-4 text-[15px] text-ink placeholder:text-muted/70 focus:border-primary focus:outline-none"
              />
              <button
                type="submit"
                disabled={state === "loading"}
                className="h-11 shrink-0 rounded-full bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-70"
              >
                {state === "loading" ? "…" : "Subscribe"}
              </button>
            </div>
            <Honeypot value={website} onChange={setWebsite} id="popup-website" />
            <p id="popup-error" role="alert" className="mt-1.5 min-h-4 pl-1 text-xs text-primary">
              {error ?? (state === "error" ? message : "")}
            </p>
            <fieldset className="mt-1">
              <legend className="text-xs font-semibold text-ink">Which cities interest you?</legend>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {CITY_CHIPS.map((c) => {
                  const on = picked.includes(c.slug);
                  return (
                    <button
                      key={c.slug}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setPicked((p) => (on ? p.filter((x) => x !== c.slug) : [...p, c.slug]))}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                        on ? "border-accent bg-accent text-dark" : "border-border bg-white text-ink hover:border-accent",
                      )}
                    >
                      {c.name}
                    </button>
                  );
                })}
              </div>
            </fieldset>
            <p className="mt-3 text-[11px] leading-snug text-muted">
              By subscribing you agree to receive emails from Kanpur Ki Kahaani. Unsubscribe anytime.{" "}
              <Link href="/privacy" className="underline hover:text-primary">
                Privacy notice
              </Link>
            </p>
            <button type="button" onClick={() => onClose("dismiss")} className="mt-2 text-xs font-semibold text-muted underline hover:text-primary">
              No thanks
            </button>
          </form>
        </>
      )}
    </motion.div>
  );
}
