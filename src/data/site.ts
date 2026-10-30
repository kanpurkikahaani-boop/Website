/** The one canonical domain. Every canonical URL, sitemap entry, OG URL and JSON-LD URL is built from it. */
export const CANONICAL_SITE_URL = "https://kanpurkikahaani.site";

/**
 * NEXT_PUBLIC_SITE_URL may override the canonical domain (e.g. a future domain change), but a
 * Vercel deployment domain (*.vercel.app), localhost or a non-HTTPS URL is never accepted —
 * that is what previously leaked https://kanpur-ki-kahaani.vercel.app into the sitemap.
 */
function resolveSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return CANONICAL_SITE_URL;
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:" || u.hostname.endsWith(".vercel.app") || u.hostname === "localhost") return CANONICAL_SITE_URL;
    return u.origin;
  } catch {
    return CANONICAL_SITE_URL;
  }
}

export const site = {
  name: "Kanpur Ki Kahaani",
  shortName: "KKK",
  tagline: "The Stories of the Manchester of the East",
  description:
    "The stories of the Manchester of the East — a curated guide to Kanpur's heritage, food, festivals and everyday life, and the cities around it.",
  url: resolveSiteUrl(),
  locale: "en_IN",
  twitter: "@kanpurkikahaani",
  kanpur: { lat: 26.4499, lon: 80.3319 },
  year: 2026,
} as const;

export type SocialPlatform = "instagram" | "facebook" | "x" | "medium" | "reddit";

/** Official profiles — single source for the top bar, footer, JSON-LD sameAs and blog follow links. */
export const socials: { platform: SocialPlatform; label: string; url: string }[] = [
  { platform: "instagram", label: "Instagram", url: "https://www.instagram.com/kanpurkikahaani/" },
  { platform: "facebook", label: "Facebook", url: "https://www.facebook.com/share/14sYGBBZAyj/?mibextid=wwXIfr" },
  { platform: "x", label: "X", url: "https://x.com/kanpurkikahaani" },
  { platform: "medium", label: "Medium", url: "https://medium.com/@kanpurkikahaani" },
  { platform: "reddit", label: "Reddit", url: "https://www.reddit.com/user/KanpurkiKahaani/" },
];

export const mediumUrl = socials.find((s) => s.platform === "medium")!.url;

export function absoluteUrl(path = "/") {
  return `${site.url}${path.startsWith("/") ? path : `/${path}`}`;
}
