import type { NextConfig } from "next";

type RemotePattern = NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]>[number];

/** Images uploaded through the admin live in Supabase Storage: allow *.supabase.co and the configured project URL. */
function storagePatterns(): RemotePattern[] {
  const patterns: RemotePattern[] = [
    { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
    // Unsplash photos must be hotlinked (API guidelines); every other source is stored locally.
    { protocol: "https", hostname: "images.unsplash.com" },
  ];
  try {
    const u = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "");
    if (!u.hostname.endsWith(".supabase.co")) {
      patterns.push({ protocol: u.protocol.replace(":", "") as "http" | "https", hostname: u.hostname, port: u.port, pathname: "/storage/v1/object/public/**" });
    }
  } catch {
    /* not configured */
  }
  return patterns;
}

const nextConfig: NextConfig = {
  // Every page is statically prerendered at build time, so the classic
  // (non-Cache-Components) model keeps things simple for static hosting.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    // Blog cover and inline images uploaded through the admin editor
    remotePatterns: storagePatterns(),
  },
  async redirects() {
    return [
      { source: "/blog", destination: "/blogs", permanent: true },
      { source: "/blog/:slug*", destination: "/blogs", permanent: true },
      // Old production domain → canonical custom domain (308, path and query preserved).
      // /api/* is excluded so Vercel Cron, which may call the deployment domain, keeps working.
      // Preview deployments use different *.vercel.app hosts and are unaffected.
      {
        source: "/:path((?!api/).*)",
        has: [{ type: "host", value: "kanpur-ki-kahaani.vercel.app" }],
        destination: "https://kanpurkikahaani.site/:path",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
