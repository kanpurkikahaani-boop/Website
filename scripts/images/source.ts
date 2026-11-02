/**
 * npm run images:source [-- --only <slotId-prefix>] [--fixtures]
 *
 * For every image key still on the fallback tile: search Wikimedia Commons (and Unsplash / Pexels
 * when UNSPLASH_ACCESS_KEY / PEXELS_API_KEY are set), apply the automatic filters, drop
 * near-duplicates by perceptual hash, and save up to 8 candidate thumbnails per key to
 * review/<key>/ for a PERSON to look at. Writes reports/image-candidates.json.
 *
 * It never picks a photo. Selection happens in reports/image-selections.json after viewing each
 * candidate; scripts/images/process.ts then downloads and resizes the chosen ones.
 * --fixtures runs offline against tests/fixtures/images/*.json (no downloads, no hashing).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { photos } from "../../src/data/images";
import { dedupe, filterCandidates, fromCommons, fromPexels, fromUnsplash, queriesFor, type Candidate, type Rejection } from "./candidates";
import { collectSlots, type Slot } from "./slots";

const UA = "KanpurKiKahaaniImageSourcing/1.0 (https://kanpurkikahaani.site; photo credits at /credits)";
const args = process.argv.slice(2);
const FIXTURES = args.includes("--fixtures");
const only = args[args.indexOf("--only") + 1] && args.includes("--only") ? args[args.indexOf("--only") + 1] : "";
const fixture = (name: string) => JSON.parse(readFileSync(path.join("tests/fixtures/images", name), "utf8"));

async function getJson(url: string, headers: Record<string, string> = {}) {
  const res = await fetch(url, { headers: { "User-Agent": UA, ...headers } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

async function commons(query: string, category?: string): Promise<Candidate[]> {
  if (FIXTURES) return fromCommons(fixture("commons.json"));
  const base = "https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo|categories&iiprop=url|size|mime|extmetadata&iiurlwidth=640&cllimit=50&clshow=!hidden";
  const gen = category
    ? `&generator=categorymembers&gcmtype=file&gcmlimit=30&gcmtitle=${encodeURIComponent(category)}`
    : `&generator=search&gsrnamespace=6&gsrlimit=30&gsrsearch=${encodeURIComponent(`${query} filetype:bitmap`)}`;
  return fromCommons(await getJson(base + gen).catch(() => ({})));
}

async function unsplash(query: string): Promise<Candidate[]> {
  if (FIXTURES) return fromUnsplash(fixture("unsplash.json"));
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return [];
  const json = await getJson(`https://api.unsplash.com/search/photos?per_page=10&orientation=landscape&query=${encodeURIComponent(query)}`, { Authorization: `Client-ID ${key}` }).catch(() => ({}));
  return fromUnsplash(json);
}

async function pexels(query: string): Promise<Candidate[]> {
  if (FIXTURES) return fromPexels(fixture("pexels.json"));
  const key = process.env.PEXELS_API_KEY;
  if (!key) return [];
  return fromPexels(await getJson(`https://api.pexels.com/v1/search?per_page=10&orientation=landscape&query=${encodeURIComponent(query)}`, { Authorization: key }).catch(() => ({})));
}

/** 64-bit difference hash of an image buffer (plain grayscale downscale — no AI). */
async function dHash(buf: Buffer): Promise<string> {
  const px = await sharp(buf).grayscale().resize(9, 8, { fit: "fill" }).raw().toBuffer();
  let bits = "";
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) bits += px[y * 9 + x] > px[y * 9 + x + 1] ? "1" : "0";
  return BigInt(`0b${bits}`).toString(16).padStart(16, "0");
}

const keyDir = (key: string) => path.join("review", key.replace(/^\/images\//, "").replace(/\.\w+$/, "").replace(/\//g, "__"));

async function main() {
  const slots = collectSlots().filter((s) => !photos[s.currentImage] && (!only || s.slotId.startsWith(only)));
  const byKey = new Map<string, Slot[]>();
  for (const s of slots) byKey.set(s.currentImage, [...(byKey.get(s.currentImage) ?? []), s]);

  const report: Record<string, { slots: string[]; brief: string; minWidth: number; queries: string[]; candidates: (Candidate & { file?: string })[]; rejected: { title: string; pageUrl: string; reasons: string[] }[] }> = {};
  for (const [key, uses] of byKey) {
    const minWidth = Math.max(...uses.map((u) => u.minWidth));
    const q = queriesFor(uses[0]);
    let found: Candidate[] = [];
    for (const cat of q.categories) found.push(...(await commons("", cat)));
    for (const text of q.text) found.push(...(await commons(text)), ...(await unsplash(text)), ...(await pexels(text)));
    found = [...new Map(found.map((c) => [`${c.provider}:${c.id}`, c])).values()];

    const { kept, rejected } = filterCandidates(found, { minWidth, landscape: true });
    const withFiles: (Candidate & { file?: string })[] = [];
    if (!FIXTURES) {
      mkdirSync(keyDir(key), { recursive: true });
      for (const c of kept.slice(0, 20)) {
        const res = await fetch(c.thumbUrl, { headers: { "User-Agent": UA } }).catch(() => null);
        if (!res?.ok) continue;
        const buf = Buffer.from(await res.arrayBuffer());
        c.hash = await dHash(buf);
        const file = path.join(keyDir(key), `${c.provider}-${c.id}.jpg`);
        writeFileSync(file, buf);
        withFiles.push({ ...c, file });
      }
    } else withFiles.push(...kept);
    const unique = dedupe(withFiles).slice(0, 8);
    report[key] = {
      slots: uses.map((u) => u.slotId),
      brief: uses[0].brief,
      minWidth,
      queries: [...q.categories, ...q.text],
      candidates: unique,
      rejected: rejected.map((r: Rejection) => ({ title: r.candidate.title, pageUrl: r.candidate.pageUrl, reasons: r.reasons })),
    };
    console.log(`${key.padEnd(52)} ${String(unique.length).padStart(2)} to review · ${rejected.length} rejected`);
  }
  mkdirSync("reports", { recursive: true });
  const out = FIXTURES ? "reports/image-candidates.fixture.json" : "reports/image-candidates.json";
  const prev = existsSync(out) && !FIXTURES ? JSON.parse(readFileSync(out, "utf8")) : {};
  writeFileSync(out, JSON.stringify({ ...prev, ...report }, null, 2) + "\n");
  console.log(`\nWrote ${out}. Next: open each review/<key>/ image, then record choices in reports/image-selections.json and run npm run images:process.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
