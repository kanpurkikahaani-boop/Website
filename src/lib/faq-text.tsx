import Link from "next/link";
import { Fragment } from "react";

/**
 * FAQ answers are plain strings with markdown-style links: "See the [planner](/tourism#planner)."
 * Only internal paths (/…, #…) and https:// URLs become links; anything else stays plain text.
 * No HTML is ever interpreted, so answers are safe to render.
 */
const LINK = /\[([^\]]+)\]\(([^)\s]+)\)/g;
const isSafe = (href: string) => /^(\/(?!\/)|#|https:\/\/)/.test(href);

export function renderAnswer(text: string) {
  const out: React.ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(LINK)) {
    const [whole, label, href] = m;
    out.push(text.slice(last, m.index));
    if (!isSafe(href)) out.push(label);
    else if (href.startsWith("https://"))
      out.push(
        <a key={m.index} href={href} target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline decoration-primary/40 underline-offset-[3px] hover:decoration-primary">
          {label} ↗<span className="sr-only"> (opens in new tab)</span>
        </a>,
      );
    else
      out.push(
        <Link key={m.index} href={href} className="font-medium text-primary underline decoration-primary/40 underline-offset-[3px] hover:decoration-primary">
          {label}
        </Link>,
      );
    last = (m.index ?? 0) + whole.length;
  }
  out.push(text.slice(last));
  return out.map((n, i) => <Fragment key={i}>{n}</Fragment>);
}

/** The same answer as plain text (links reduced to their words) — used for FAQPage JSON-LD. */
export const plainAnswer = (text: string) => text.replace(LINK, "$1");

/** Links in an answer (for the coverage check). */
export const answerLinks = (text: string) => [...text.matchAll(LINK)].map((m) => m[2]);
