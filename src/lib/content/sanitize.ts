import sanitizeHtml from "sanitize-html";

const YOUTUBE_EMBED = /^https:\/\/(www\.)?(youtube-nocookie\.com|youtube\.com)\/embed\/[A-Za-z0-9_-]{6,}/;

/** Strict allowlist for blog HTML: safe tags, http(s)/mailto links, and YouTube iframes only. */
export function sanitizeBlogHtml(html: string) {
  return sanitizeHtml(html, {
    allowedTags: [
      "p", "h2", "h3", "h4", "strong", "b", "em", "i", "u", "s", "a", "ul", "ol", "li",
      "blockquote", "hr", "br", "img", "figure", "figcaption", "code", "pre", "div", "iframe",
    ],
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      img: ["src", "alt", "title", "width", "height", "loading"],
      iframe: ["src", "width", "height", "allow", "allowfullscreen", "title", "loading"],
      div: ["data-youtube-video", "class"],
      ol: ["start"],
    },
    allowedClasses: { div: ["kkk-video"] },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: { img: ["https"] },
    allowProtocolRelative: false,
    exclusiveFilter: (frame) => frame.tag === "iframe" && !YOUTUBE_EMBED.test(frame.attribs.src ?? ""),
    transformTags: {
      a: (tagName, attribs) => {
        const href = attribs.href ?? "#";
        const external = /^https?:\/\//.test(href) && !href.includes("kanpurkikahaani.site");
        const out: Record<string, string> = { href };
        if (attribs.title) out.title = attribs.title;
        if (external) Object.assign(out, { target: "_blank", rel: "noopener noreferrer" });
        return { tagName, attribs: out };
      },
      iframe: (tagName, attribs) => ({ tagName, attribs: { ...attribs, loading: "lazy" } }),
    },
  });
}

/** Plain text from HTML (reading time, RSS descriptions). */
export function htmlToText(html: string) {
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} }).replace(/\s+/g, " ").trim();
}

export function readingMinutes(text: string) {
  return Math.max(1, Math.round(text.split(/\s+/).filter(Boolean).length / 220));
}
