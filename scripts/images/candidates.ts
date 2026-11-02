/**
 * Candidate search + automatic filters for v5 photo sourcing (pure functions, unit-tested with
 * fixtures). Network calls live in source.ts. Nothing here edits or generates images.
 */
import type { Slot } from "./slots";

export type Provider = "wikimedia" | "unsplash" | "pexels";

export interface Candidate {
  provider: Provider;
  id: string;
  title: string;
  description: string;
  pageUrl: string;
  imageUrl: string;
  thumbUrl: string;
  width: number;
  height: number;
  author: string;
  authorUrl?: string;
  license: string;
  licenseUrl?: string;
  categories: string[];
  mime?: string;
  camera?: string;
  captureDate?: string;
  downloadLocation?: string;
  /** dHash of the thumbnail, filled in by source.ts (duplicate detection). */
  hash?: string;
}

export interface Rejection {
  candidate: Candidate;
  reasons: string[];
}

export const AI_WORDS = /\b(ai[- ]?generated|generated (by|with) ai|artificial intelligence|midjourney|dall[·.\- ]?e|stable[- ]diffusion|firefly|imagen|gemini|generative|upscal(ed|er|ing)|digital art|digital painting|render(ed|ing)?|3d|cgi|illustration|concept art|created with|photo ?manipulation|composite)\b/i;
const WATERMARK = /\b(watermark(ed)?|logo|text overlay|caption(ed)? image|poster|banner|infographic|screenshot|collage|stock photo preview)\b/i;
const LICENCE_OK = /^(public domain|pd|pdm|cc0( 1\.0)?|cc[- ]by( \d\.\d)?|cc[- ]by-sa( \d\.\d)?( [a-z]{2})?)$/i;
const LICENCE_BAD = /\bnc\b|\bnd\b|non-?commercial|no-?deriv|fair use|all rights reserved/i;

/** Search phrases for a slot: title + city, the shot brief, and (Commons) a Hindi name and category. */
export function queriesFor(slot: Pick<Slot, "adjacentTitle" | "city" | "brief">, hindi?: string): { text: string[]; categories: string[] } {
  const city = slot.city.charAt(0).toUpperCase() + slot.city.slice(1);
  const title = slot.adjacentTitle.replace(/[—–-].*$/, "").trim();
  const text = [`${title} ${city}`, slot.brief.split(/[,—–]/)[0].trim()];
  if (hindi) text.push(hindi);
  return { text: [...new Set(text.filter(Boolean))], categories: [`Category:${title}, ${city}`, `Category:${title}`] };
}

/** Normalise Wikimedia Commons `imageinfo` + `categories` API pages into candidates. */
export function fromCommons(json: { query?: { pages?: Record<string, CommonsPage> } }): Candidate[] {
  return Object.values(json.query?.pages ?? {}).flatMap((p) => {
    const ii = p.imageinfo?.[0];
    if (!ii) return [];
    const m = ii.extmetadata ?? {};
    const v = (k: string) => strip(m[k]?.value ?? "");
    return [
      {
        provider: "wikimedia" as const,
        id: String(p.pageid),
        title: p.title,
        description: v("ImageDescription"),
        pageUrl: ii.descriptionurl,
        imageUrl: ii.url,
        thumbUrl: ii.thumburl ?? ii.url,
        width: ii.width,
        height: ii.height,
        author: v("Artist") || "unknown",
        authorUrl: (m.Artist?.value.match(/href="([^"]+)"/)?.[1] ?? "").replace(/^\/\//, "https://") || undefined,
        license: v("LicenseShortName"),
        licenseUrl: v("LicenseUrl") || undefined,
        categories: [...(p.categories ?? []).map((c) => c.title), ...v("Categories").split("|")].filter(Boolean),
        mime: ii.mime,
        captureDate: v("DateTimeOriginal") || undefined,
      },
    ];
  });
}

export interface CommonsPage {
  pageid: number;
  title: string;
  categories?: { title: string }[];
  imageinfo?: {
    url: string;
    thumburl?: string;
    descriptionurl: string;
    width: number;
    height: number;
    mime?: string;
    extmetadata?: Record<string, { value: string }>;
  }[];
}

/** Normalise an Unsplash /search/photos response. */
export function fromUnsplash(json: { results?: UnsplashPhoto[] }): Candidate[] {
  return (json.results ?? []).map((r) => ({
    provider: "unsplash" as const,
    id: r.id,
    title: r.alt_description ?? r.description ?? "",
    description: [r.description, r.alt_description].filter(Boolean).join(" — "),
    pageUrl: r.links.html,
    imageUrl: r.urls.raw,
    thumbUrl: r.urls.small,
    width: r.width,
    height: r.height,
    author: r.user.name,
    authorUrl: r.user.links.html,
    license: "Unsplash License",
    licenseUrl: "https://unsplash.com/license",
    categories: (r.tags ?? []).map((t) => t.title),
    camera: r.exif?.model ? [r.exif.make, r.exif.model].filter(Boolean).join(" ") : undefined,
    captureDate: r.created_at,
    downloadLocation: r.links.download_location,
  }));
}

export interface UnsplashPhoto {
  id: string;
  width: number;
  height: number;
  description: string | null;
  alt_description: string | null;
  created_at?: string;
  urls: { raw: string; small: string };
  links: { html: string; download_location: string };
  user: { name: string; links: { html: string } };
  tags?: { title: string }[];
  exif?: { make?: string; model?: string };
}

/** Normalise a Pexels /v1/search response. */
export function fromPexels(json: { photos?: PexelsPhoto[] }): Candidate[] {
  return (json.photos ?? []).map((p) => ({
    provider: "pexels" as const,
    id: String(p.id),
    title: p.alt ?? "",
    description: p.alt ?? "",
    pageUrl: p.url,
    imageUrl: p.src.original,
    thumbUrl: p.src.medium,
    width: p.width,
    height: p.height,
    author: p.photographer,
    authorUrl: p.photographer_url,
    license: "Pexels License",
    licenseUrl: "https://www.pexels.com/license/",
    categories: [],
  }));
}

export interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  alt?: string;
  photographer: string;
  photographer_url: string;
  src: { original: string; medium: string };
}

/**
 * Automatic filters (brief §3.3): licence, resolution, orientation, AI keywords/categories,
 * watermark/text keywords, file type. Duplicates are removed later by perceptual hash.
 * Everything that passes still has to be looked at by a person before it can be used.
 */
export function filterCandidates(cands: Candidate[], need: { minWidth: number; landscape: boolean }): { kept: Candidate[]; rejected: Rejection[] } {
  const kept: Candidate[] = [];
  const rejected: Rejection[] = [];
  for (const c of cands) {
    const reasons: string[] = [];
    const lic = c.license.trim();
    if (c.provider === "wikimedia" && (!LICENCE_OK.test(lic) || LICENCE_BAD.test(lic))) reasons.push(`licence "${lic || "none"}" not allowed`);
    if (c.width < need.minWidth) reasons.push(`${c.width}px wide < ${need.minWidth}px`);
    if (need.landscape && c.width < c.height * 1.15) reasons.push(`not landscape (${c.width}×${c.height})`);
    const text = [c.title, c.description, ...c.categories].join(" | ");
    if (AI_WORDS.test(text)) reasons.push(`AI / non-photo keyword: "${text.match(AI_WORDS)?.[0]}"`);
    if (WATERMARK.test(text)) reasons.push(`watermark/text keyword: "${text.match(WATERMARK)?.[0]}"`);
    if (c.mime && !/^image\/(jpeg|png)$/.test(c.mime)) reasons.push(`file type ${c.mime}`);
    if (reasons.length) rejected.push({ candidate: c, reasons });
    else kept.push(c);
  }
  return { kept, rejected };
}

/** Hamming distance between two hex dHashes. */
export function hamming(a: string, b: string): number {
  let d = 0;
  for (let i = 0; i < a.length; i++) {
    let x = parseInt(a[i], 16) ^ parseInt(b[i], 16);
    while (x) {
      d += x & 1;
      x >>= 1;
    }
  }
  return d;
}

/** Drop near-duplicates (same photo re-uploaded / resized), keeping the larger file. */
export function dedupe(cands: Candidate[], threshold = 6): Candidate[] {
  const out: Candidate[] = [];
  for (const c of [...cands].sort((a, b) => b.width * b.height - a.width * a.height)) {
    if (c.hash && out.some((o) => o.hash && hamming(o.hash, c.hash!) <= threshold)) continue;
    out.push(c);
  }
  return out;
}

const strip = (html: string) =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
