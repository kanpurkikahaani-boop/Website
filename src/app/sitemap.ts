import type { MetadataRoute } from "next";
import { allNavHrefs } from "@/data/nav";
import { posts } from "@/data/blog";
import { absoluteUrl } from "@/data/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const pages = [...new Set([...allNavHrefs, "/privacy"])].map((href) => ({
    url: absoluteUrl(href),
    lastModified: now,
    changeFrequency: (["/events", "/news", "/weather"].includes(href) ? "daily" : "weekly") as "daily" | "weekly",
    priority: href === "/" ? 1 : href.startsWith("/cities") || href === "/tourism" ? 0.9 : href === "/privacy" ? 0.2 : 0.7,
  }));
  const blog = posts.map((p) => ({
    url: absoluteUrl(`/blog/${p.slug}`),
    lastModified: new Date(p.date),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));
  return [...pages, ...blog];
}
