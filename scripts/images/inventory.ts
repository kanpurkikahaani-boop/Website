/** npm run images:inventory → reports/image-inventory.json (one entry per image slot on the site). */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { photos } from "../../src/data/images";
import { collectSlots } from "./slots";

const slots = collectSlots().map((s) => ({
  ...s,
  hasFile: existsSync(path.join(process.cwd(), "public", s.currentImage)),
  inManifest: Boolean(photos[s.currentImage]),
}));
mkdirSync("reports", { recursive: true });
writeFileSync("reports/image-inventory.json", JSON.stringify(slots, null, 2) + "\n");

const byPage = new Map<string, number>();
for (const s of slots) byPage.set(s.page, (byPage.get(s.page) ?? 0) + 1);
const unique = new Set(slots.map((s) => s.currentImage)).size;
console.log(`${slots.length} slots (${unique} distinct images) — ${slots.filter((s) => s.inManifest).length} filled, ${slots.filter((s) => !s.inManifest).length} on the fallback tile`);
for (const [p, n] of [...byPage].sort()) console.log(`  ${p.padEnd(32)} ${n}`);
