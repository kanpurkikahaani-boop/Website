// Scans /public for brand + place images and writes a manifest the app can import
// from both server and client components. Runs automatically before `dev` and `build`.
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const pub = join(root, "public");
const imagesDir = join(pub, "images");

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const images = walk(imagesDir)
  .filter((f) => /\.(jpe?g|png|webp|avif)$/i.test(f))
  .map((f) => "/" + relative(pub, f).split("\\").join("/"))
  .sort();

const manifest = {
  hasLogo: existsSync(join(pub, "brand", "logo.png")),
  images,
};

mkdirSync(join(root, "src", "generated"), { recursive: true });
writeFileSync(
  join(root, "src", "generated", "assets.json"),
  JSON.stringify(manifest, null, 2) + "\n",
);

// Slim, client-safe photo index from the manifest (src/data/photos.json): only what the image
// components need. Licence notes, AI checks and alternates stay server-side (/credits, reports).
const VIA = { wikimedia: "via Wikimedia Commons", unsplash: "on Unsplash", pexels: "on Pexels", flickr: "via Flickr" };
const photos = existsSync(join(root, "src", "data", "photos.json")) ? JSON.parse(readFileSync(join(root, "src", "data", "photos.json"), "utf8")) : {};
const index = Object.fromEntries(
  Object.entries(photos).map(([key, p]) => {
    const lic = p.source === "unsplash" || p.source === "pexels" ? "" : `, ${p.license}`;
    const credit = p.source === "own" ? p.license : `Photo: ${p.author ?? "unknown"}${lic} ${VIA[p.source] ?? ""}`.trim();
    return [key, { src: p.src, width: p.width, height: p.height, objectPosition: p.objectPosition, blurDataURL: p.blurDataURL, credit, representative: !!p.representative }];
  }),
);
writeFileSync(join(root, "src", "generated", "photo-index.json"), JSON.stringify(index) + "\n");

console.log(`[scan-assets] photos in manifest: ${Object.keys(index).length}`);
console.log(`[scan-assets] logo: ${manifest.hasLogo ? "found" : "MISSING"} · images: ${images.length}`);
if (!manifest.hasLogo) {
  console.warn(
    "\x1b[41m\x1b[97m LOGO MISSING \x1b[0m\x1b[31m public/brand/logo.png was not found. " +
      "Add the logo — the navbar, footer, popup, favicon and OG images all use it.\x1b[0m",
  );
}
