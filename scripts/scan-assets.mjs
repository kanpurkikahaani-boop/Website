// Scans /public for brand + place images and writes a manifest the app can import
// from both server and client components. Runs automatically before `dev` and `build`.
import { existsSync, readdirSync, statSync, writeFileSync, mkdirSync } from "node:fs";
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

console.log(
  `[scan-assets] logo: ${manifest.hasLogo ? "found" : "MISSING – using KKK placeholder"} · images: ${images.length}`,
);
