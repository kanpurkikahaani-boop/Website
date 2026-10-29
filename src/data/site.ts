export const site = {
  name: "Kanpur Ki Kahaani",
  shortName: "KKK",
  tagline: "The Stories of the Manchester of the East",
  description:
    "The stories of the Manchester of the East — a curated guide to Kanpur's heritage, food, festivals and everyday life, and the cities around it.",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://kanpurkikahaani.site").replace(/\/$/, ""),
  locale: "en_IN",
  twitter: "@kanpurkikahaani",
  social: {
    instagram: "https://www.instagram.com/",
    facebook: "https://www.facebook.com/",
    youtube: "https://www.youtube.com/",
  },
  kanpur: { lat: 26.4499, lon: 80.3319 },
  year: 2026,
} as const;

export function absoluteUrl(path = "/") {
  return `${site.url}${path.startsWith("/") ? path : `/${path}`}`;
}
