import { createHash } from "node:crypto";

const TRACKING = /^(utm_|fbclid$|gclid$|mc_cid$|mc_eid$|ref$|ref_src$|cmp$|ito$)/i;

/** Canonical URL for de-duplication: https, no tracking params, no fragment, no trailing slash. */
export function canonicalUrl(raw: string) {
  try {
    const u = new URL(raw.trim());
    u.hash = "";
    if (u.protocol === "http:") u.protocol = "https:";
    for (const k of [...u.searchParams.keys()]) if (TRACKING.test(k)) u.searchParams.delete(k);
    u.hostname = u.hostname.toLowerCase();
    if (u.pathname.length > 1 && u.pathname.endsWith("/")) u.pathname = u.pathname.slice(0, -1);
    return u.toString();
  } catch {
    return null;
  }
}

export function urlHash(url: string) {
  return createHash("sha256").update(url).digest("hex").slice(0, 32);
}

const ENTITIES: Record<string, string> = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&apos;": "'", "&nbsp;": " " };

export function stripHtml(s: string) {
  return s
    .replace(/<[^>]*>/g, " ")
    .replace(/&(amp|lt|gt|quot|#39|apos|nbsp);/g, (m) => ENTITIES[m] ?? m)
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, " ")
    .trim();
}

/** One-line summary from the feed's own description, cut to ~140 chars on a word boundary. */
export function shortSummary(desc: string | undefined, title: string, max = 140) {
  if (!desc) return null;
  let s = stripHtml(desc);
  if (!s || s.toLowerCase().startsWith(title.toLowerCase().slice(0, 40))) return null; // Google News repeats the title
  if (s.length > max) s = s.slice(0, max).replace(/\s+\S*$/, "") + "…";
  return s;
}

/** Google News titles end with " - Publisher"; drop it since we show the source badge. */
export function cleanTitle(title: string, publisher?: string) {
  let t = stripHtml(title);
  if (publisher && t.endsWith(` - ${publisher}`)) t = t.slice(0, -(publisher.length + 3));
  return t.slice(0, 300);
}

export function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}
