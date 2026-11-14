import TurndownService from "turndown";

/** What every platform adapter receives: one published post, ready to copy. */
export interface SyndicationPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  /** Sanitized body HTML (as published on our site). */
  html: string;
  coverUrl: string | null;
  coverAlt: string | null;
  tags: string[];
  /** Absolute URL of the original on our site — the canonical. */
  canonicalUrl: string;
  siteName: string;
  siteUrl: string;
}

const escAttr = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const escText = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** The line every copy starts with (v10 requirement). */
export const attributionText = (p: SyndicationPost) => `Originally published on ${p.siteName}`;
export function attributionHtml(p: SyndicationPost) {
  return `<p><em>Originally published on <a href="${escAttr(p.canonicalUrl)}">${escText(p.siteName)}</a>.</em></p>`;
}

/**
 * Our HTML made portable: internal links and images become absolute, screen-reader-only helper
 * text and our CSS classes/inline layout are removed (other sites don't have our stylesheet),
 * and the attribution line goes first. Cover image (if any) goes after the attribution.
 */
export function portableHtml(p: SyndicationPost, { withCover = true } = {}) {
  const abs = (u: string) => (u.startsWith("/") && !u.startsWith("//") ? `${p.siteUrl}${u}` : u);
  const body = p.html
    .replace(/<span class="sr-only">[^<]*<\/span>/g, "")
    .replace(/\s(href|src)="([^"]+)"/g, (_m, attr: string, url: string) => ` ${attr}="${escAttr(abs(url))}"`)
    .replace(/\sclass="[^"]*"/g, "")
    .replace(/\sstyle="[^"]*"/g, "")
    .replace(/<span>([\s\S]*?)<\/span>/g, "$1")
    .replace(/<p><\/p>/g, "<p>&nbsp;</p>");
  const cover = withCover && p.coverUrl ? `<figure><img src="${escAttr(abs(p.coverUrl))}" alt="${escAttr(p.coverAlt ?? p.title)}" /></figure>` : "";
  return `${attributionHtml(p)}${cover}${body}`;
}

/** Markdown for platforms that take it (Dev.to, Hashnode). */
export function portableMarkdown(p: SyndicationPost, opts: { withCover?: boolean } = {}) {
  const td = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced", bulletListMarker: "-", emDelimiter: "*" });
  // Keep figure captions as an italic line under the image.
  td.addRule("figcaption", { filter: "figcaption", replacement: (content) => (content.trim() ? `\n\n*${content.trim()}*\n\n` : "") });
  td.addRule("youtube", {
    filter: (node) => node.nodeName === "IFRAME",
    replacement: (_c, node) => {
      const src = (node as HTMLElement).getAttribute("src") ?? "";
      const id = /embed\/([A-Za-z0-9_-]{6,})/.exec(src)?.[1];
      return id ? `\n\n[Watch on YouTube](https://www.youtube.com/watch?v=${id})\n\n` : "";
    },
  });
  return td.turndown(portableHtml(p, opts)).replace(/\n{3,}/g, "\n\n").trim();
}

/** Tags as plain lowercase words (most platforms reject hyphens/spaces). */
export const plainTags = (tags: string[], max: number) =>
  [...new Set(tags.map((t) => t.toLowerCase().replace(/[^a-z0-9]/g, "")).filter(Boolean))].slice(0, max);

/** Readable tag names (e.g. "street-food" → "Street Food"). */
export const tagName = (t: string) => t.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/** Never echo a token back into an error message we store or show. */
export function scrubSecrets(message: string, secrets: (string | undefined)[]) {
  let out = message;
  for (const s of secrets) if (s && s.length >= 6) out = out.split(s).join("[hidden]");
  return out.slice(0, 600);
}
