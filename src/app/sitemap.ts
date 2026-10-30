import type { MetadataRoute } from "next";
import { allNavHrefs } from "@/data/nav";
import { getAllPublished } from "@/lib/posts";
import { absoluteUrl } from "@/data/site";

/**
 * Served at /sitemap.xml. Built from the same data as the navigation and the
 * dynamic routes (cities, blog), so every listed URL is a real, indexable page.
 */
// Re-generated hourly so newly published stories appear without a redeploy.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const pages = [...new Set([...allNavHrefs, "/privacy"])].map((href) => ({
    url: absoluteUrl(href),
    lastModified: now,
    changeFrequency: (["/events", "/news", "/weather"].includes(href) ? "daily" : "weekly") as "daily" | "weekly",
    priority: href === "/" ? 1 : href.startsWith("/cities") || href === "/tourism" ? 0.9 : href === "/privacy" ? 0.2 : 0.7,
  }));
  const posts = await getAllPublished();
  const blog = posts.map((p) => ({
    url: absoluteUrl(`/blogs/${p.slug}`),
    lastModified: new Date(p.updatedAt || p.publishedAt),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));
  return [...pages, ...blog];
}
