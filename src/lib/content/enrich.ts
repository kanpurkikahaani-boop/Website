/**
 * Presentation-only enrichment of generated article HTML (runs BEFORE sanitizing, so anything
 * added here must also be allowed by the sanitizer). Never changes the author's words.
 */

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const strip = (s: string) => s.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").trim();

export function slugifyHeading(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

export function isExternalHref(href: string) {
  return /^https?:\/\//.test(href) && !href.includes("kanpurkikahaani.site");
}

export function enrichArticleHtml(html: string) {
  const used = new Set<string>();

  // 1. Every h2 gets a stable, unique id (kept if the author set one) for the table of contents.
  // 2. "Day 1 — …" / "Days 2 & 3 — …" headings get a small gold badge for the day.
  let out = html.replace(/<h2([^>]*)>([\s\S]*?)<\/h2>/g, (_m, attrs: string, inner: string) => {
    const existing = /\sid="([^"]+)"/.exec(attrs)?.[1];
    let id = existing || slugifyHeading(strip(inner)) || "section";
    while (used.has(id)) id = `${id}-x`;
    used.add(id);
    const day = /^(Days?\s+\d+(?:\s*(?:&amp;|&|and)\s*\d+)?)\s*[—–-]\s*/.exec(inner);
    const body = day ? `<span class="day-badge">${day[1]}</span> ${inner.slice(day[0].length)}` : inner;
    return `<h2 id="${esc(id)}">${body}</h2>`;
  });

  // 3. Images with a title become a figure with a caption.
  out = out.replace(/<img([^>]*?)\stitle="([^"]+)"([^>]*)>/g, (_m, a: string, title: string, b: string) => {
    return `<figure class="kkk-figure"><img${a}${b}><figcaption class="kkk-caption">${title}</figcaption></figure>`;
  });

  // 4. External links (and internal ones set to open a new tab) announce it (the ↗ icon itself is CSS).
  out = out.replace(/<a([^>]*?)href="([^"]+)"([^>]*)>([\s\S]*?)<\/a>/g, (m, a: string, href: string, b: string, text: string) =>
    (isExternalHref(href) || /target="_blank"/.test(a + b)) && !text.includes("sr-only") ? `<a${a}href="${href}"${b}>${text}<span class="sr-only"> (opens in new tab)</span></a>` : m,
  );
  return out;
}

/** h2 headings (id + plain text, without the badge) for the "In this story" table of contents. */
export function extractToc(html: string) {
  const toc: { id: string; text: string; badge: string | null }[] = [];
  for (const m of html.matchAll(/<h2 id="([^"]+)">([\s\S]*?)<\/h2>/g)) {
    const badge = /<span class="day-badge">([^<]+)<\/span>/.exec(m[2])?.[1]?.replace(/&amp;/g, "&") ?? null;
    toc.push({ id: m[1], text: strip(m[2].replace(/<span class="day-badge">[^<]+<\/span>/, "")), badge });
  }
  return toc;
}
