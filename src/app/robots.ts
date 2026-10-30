import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/data/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // Admin, API and unsubscribe pages stay out of search results via noindex headers/meta tags.
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
