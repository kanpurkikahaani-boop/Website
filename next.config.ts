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
  },
};

export default nextConfig;
