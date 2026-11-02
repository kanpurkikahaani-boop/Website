/**
 * npm run images:process — apply reports/image-selections.json (choices a person made after
 * looking at each candidate) to the site:
 *  - Commons / Pexels / Flickr: download, auto-rotate per EXIF, resize to the slot's display
 *    width × 2 (at least the slot minimum, at most 2400 px), JPEG q82. sharp drops all metadata
 *    (incl. GPS) by default. No cropping, no colour changes, no AI — framing is CSS objectPosition.
 *  - Unsplash: hotlinked from images.unsplash.com (API guidelines) and download_location triggered.
 *  - Every photo: a tiny blur placeholder made by plain downscaling.
 * Then merges the entries into src/data/photos.json. Run images:verify + images:report after.
 *
 * Env for tests: PHOTOS_JSON (manifest path), PUBLIC_DIR (output root), SELECTIONS (input path).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import type { Photo, PhotoAlternate } from "../../src/data/images";
import { collectSlots, type SlotKind } from "./slots";

export interface Selection {
  key: string;
  provider: "wikimedia" | "unsplash" | "pexels" | "flickr";
  imageUrl: string;
  pageUrl: string;
  author: string;
  authorUrl?: string;
  license: string;
  licenseUrl?: string;
  alt: string;
  caption?: string;
  subject: string;
  representative: boolean;
  objectPosition: string;
  captureDate?: string;
  camera?: string;
  aiCheck: string;
  relevanceNote: string;
  scores: { relevance: number; quality: number; fit: number };
  downloadLocation?: string;
  alternates?: PhotoAlternate[];
}

const UA = "KanpurKiKahaaniImageSourcing/1.0 (https://kanpurkikahaani.site; photo credits at /credits)";
const PHOTOS = process.env.PHOTOS_JSON ?? "src/data/photos.json";
const PUBLIC = process.env.PUBLIC_DIR ?? "public";
const SELECTIONS = process.env.SELECTIONS ?? "reports/image-selections.json";
/** Widest the slot is ever displayed, in CSS px. */
const DISPLAY: Record<SlotKind, number> = { hero: 1440, "city-hero": 1440, about: 560, card: 400, "blog-cover": 1040, "blog-inline": 720 };

async function load(url: string): Promise<Buffer> {
  if (url.startsWith("file://")) return readFileSync(new URL(url));
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${res.status} downloading ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function blur(buf: Buffer) {
  const tiny = await sharp(buf).rotate().resize(16).jpeg({ quality: 50 }).toBuffer();
  return `data:image/jpeg;base64,${tiny.toString("base64")}`;
}

async function main() {
  const selections: Selection[] = JSON.parse(readFileSync(SELECTIONS, "utf8"));
  const manifest: Record<string, Photo> = existsSync(PHOTOS) ? JSON.parse(readFileSync(PHOTOS, "utf8")) : {};
  const slots = collectSlots();

  for (const s of selections) {
    if (s.scores.relevance < 4) throw new Error(`${s.key}: relevance ${s.scores.relevance} < 4 — leave this slot on the fallback tile`);
    const uses = slots.filter((x) => x.currentImage === s.key);
    if (!uses.length) throw new Error(`${s.key}: no slot uses this image key`);
    const minWidth = Math.max(...uses.map((u) => u.minWidth));
    const target = Math.min(2400, Math.max(minWidth, ...uses.map((u) => DISPLAY[u.kind] * 2)));
    const base: Omit<Photo, "src" | "width" | "height" | "blurDataURL"> = {
      alt: s.alt,
      caption: s.caption,
      objectPosition: s.objectPosition,
      subject: s.subject,
      representative: s.representative,
      source: s.provider,
      sourcePageUrl: s.pageUrl,
      author: s.author,
      authorUrl: s.authorUrl,
      license: s.license,
      licenseUrl: s.licenseUrl,
      captureDate: s.captureDate,
      camera: s.camera,
      aiCheck: s.aiCheck,
      relevanceNote: `${s.relevanceNote} (scores: relevance ${s.scores.relevance}, quality ${s.scores.quality}, fit ${s.scores.fit})`,
      alternates: s.alternates,
      credit: true,
    };

    if (s.provider === "unsplash") {
      const meta = await sharp(await load(`${s.imageUrl}&w=64`)).metadata();
      const ratio = (meta.height ?? 2) / (meta.width ?? 3);
      const width = target;
      const key = process.env.UNSPLASH_ACCESS_KEY;
      if (key && s.downloadLocation) await fetch(s.downloadLocation, { headers: { Authorization: `Client-ID ${key}` } }); // required by Unsplash API guidelines
      manifest[s.key] = {
        ...base,
        src: `${s.imageUrl}${s.imageUrl.includes("?") ? "&" : "?"}w=${width}&q=80&fm=jpg&fit=max`,
        width,
        height: Math.round(width * ratio),
        changes: "None (hotlinked from Unsplash, resized by their CDN)",
        blurDataURL: await blur(await load(`${s.imageUrl}&w=32`)),
        downloadLocation: s.downloadLocation,
      };
    } else {
      const original = await load(s.imageUrl);
      const out = await sharp(original).rotate().resize({ width: target, withoutEnlargement: true }).jpeg({ quality: 82, mozjpeg: true }).toBuffer({ resolveWithObject: true });
      const file = path.join(PUBLIC, s.key);
      mkdirSync(path.dirname(file), { recursive: true });
      writeFileSync(file, out.data);
      manifest[s.key] = {
        ...base,
        src: s.key,
        width: out.info.width,
        height: out.info.height,
        changes: "Resized; converted to JPEG; metadata (incl. GPS) removed",
        blurDataURL: await blur(out.data),
      };
    }
    console.log(`✓ ${s.key} ← ${s.provider} ${s.pageUrl}`);
  }
  writeFileSync(PHOTOS, JSON.stringify(Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b))), null, 2) + "\n");
  console.log(`\n${selections.length} photo(s) written to ${PHOTOS}. Now run: npm run images:verify && npm run images:report`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
