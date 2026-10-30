import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/data/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/unsubscribe"] }],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
