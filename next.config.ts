import type { NextConfig } from "next";

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
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" }],
  },
  async redirects() {
    return [
      { source: "/blog", destination: "/blogs", permanent: true },
      { source: "/blog/:slug", destination: "/blogs/:slug", permanent: true },
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
