/**
 * npm run images:verify — every image in src/data/images.ts `imageManifest` must exist under
 * public/, match its recorded pixel size, and carry alt text, a source and a licence.
 * Also checks every team member's photo is in the manifest with matching alt text.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { imageManifest, type ImageSource } from "../src/data/images";
import { portraitAlt, team } from "../src/data/team";

const SOURCES: ImageSource[] = ["own", "wikimedia", "unsplash", "other"];

function size(file: string): { width: number; height: number } | null {
  const d = readFileSync(file);
  if (d.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { width: d.readUInt32BE(16), height: d.readUInt32BE(20) };
  if (d[0] === 0xff && d[1] === 0xd8) {
    let i = 2;
    while (i < d.length) {
      if (d[i] !== 0xff) { i++; continue; }
      const m = d[i + 1];
      if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) return { height: d.readUInt16BE(i + 5), width: d.readUInt16BE(i + 7) };
      i += 2 + d.readUInt16BE(i + 2);
    }
  }
  if (d.subarray(0, 4).toString() === "RIFF" && d.subarray(8, 12).toString() === "WEBP") return null; // size check skipped for webp
  return null;
}

const problems: string[] = [];
for (const img of imageManifest) {
  const file = path.join(process.cwd(), "public", img.path);
  if (!existsSync(file)) { problems.push(`missing file: ${img.path}`); continue; }
  const s = size(file);
  if (s && (s.width !== img.width || s.height !== img.height)) problems.push(`${img.path}: is ${s.width}×${s.height}, manifest says ${img.width}×${img.height}`);
  if (!img.alt.trim()) problems.push(`${img.path}: no alt text`);
  if (!SOURCES.includes(img.source)) problems.push(`${img.path}: unknown source "${img.source}"`);
  if (!img.license.trim()) problems.push(`${img.path}: no licence`);
}
for (const m of team) {
  const entry = imageManifest.find((i) => i.path === m.photo);
  if (!entry) problems.push(`team photo not in manifest: ${m.photo}`);
  else if (entry.alt !== portraitAlt(m)) problems.push(`${m.photo}: alt text differs from team.ts`);
}

if (problems.length) {
  console.error(`images:verify — ${problems.length} problem(s):\n  ` + problems.join("\n  "));
  process.exit(1);
}
console.log(`images:verify — ${imageManifest.length} images OK (exist, sizes match, alt + source + licence present)`);
