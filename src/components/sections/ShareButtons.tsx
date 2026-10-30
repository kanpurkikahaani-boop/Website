"use client";

import { Check, Link2 } from "lucide-react";
import { useState } from "react";
import { FacebookIcon, RedditIcon, WhatsAppIcon, XIcon } from "@/components/ui/BrandIcons";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

/** WhatsApp, X, Facebook and copy-link share buttons. `url` should be absolute. */
export function ShareButtons({
  url,
  title,
  text,
  className,
  context,
}: {
  url: string;
  title: string;
  /** Optional custom share text (e.g. a whole itinerary) */
  text?: string;
  className?: string;
  context: string;
}) {
  const [copied, setCopied] = useState(false);
  const body = text ?? `${title} — ${url}`;
  const links = [
    { name: "WhatsApp", href: `https://wa.me/?text=${encodeURIComponent(body)}`, Icon: WhatsAppIcon },
    { name: "X", href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, Icon: XIcon },
    { name: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, Icon: FacebookIcon },
    { name: "Reddit", href: `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`, Icon: RedditIcon },
  ];

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      track("share_click", { network: "copy", context });
    } catch {
      window.prompt("Copy this link:", url);
    }
  }

  const btn =
    "inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-ink transition hover:border-primary hover:text-primary";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="mr-1 text-xs font-bold uppercase tracking-[0.18em] text-accent-ink">Share</span>
      {links.map(({ name, href, Icon }) => (
        <a
          key={name}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Share on ${name} (opens in a new tab)`}
          className={btn}
          onClick={() => track("share_click", { network: name.toLowerCase(), context })}
        >
          <Icon size={17} />
        </a>
      ))}
      <button type="button" onClick={copy} className={btn} aria-label={copied ? "Link copied" : "Copy link"}>
        {copied ? <Check size={17} aria-hidden className="text-primary" /> : <Link2 size={17} aria-hidden />}
      </button>
      <span aria-live="polite" className="sr-only">
        {copied ? "Link copied to clipboard" : ""}
      </span>
    </div>
  );
}
