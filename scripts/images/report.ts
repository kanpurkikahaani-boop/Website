/**
 * npm run images:report — regenerates, from the photo manifest + slot inventory:
 *  - reports/image-review.html  contact sheet: each slot's own card text beside the chosen photo,
 *                               its 2 alternates, licence/source, AI-check and relevance notes
 *  - reports/missing-images.md  slots still on the fallback tile, why, and a shot description
 *  - IMAGE_CREDITS.md           credits for every photo (kept in sync with /credits)
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { creditLine, photos, type Photo } from "../../src/data/images";
import { collectSlots, type Slot } from "./slots";

const esc = (s = "") => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const slots = collectSlots();
const candidates: Record<string, { candidates: unknown[]; rejected: unknown[] }> = existsSync("reports/image-candidates.json") ? JSON.parse(readFileSync("reports/image-candidates.json", "utf8")) : {};
const filled = slots.filter((s) => photos[s.currentImage]);
const missing = slots.filter((s) => !photos[s.currentImage]);
const bySource = new Map<string, number>();
for (const key of new Set(filled.map((s) => s.currentImage))) bySource.set(photos[key].source, (bySource.get(photos[key].source) ?? 0) + 1);

// ── Contact sheet ──
const img = (src: string) => (src.startsWith("/") ? `../public${src}` : src);
const row = (s: Slot) => {
  const p: Photo | undefined = photos[s.currentImage];
  const card = `<div class="card"><p class="eyebrow">${esc(s.eyebrow)}</p><h3>${esc(s.adjacentTitle)}</h3><p>${esc(s.adjacentDescription)}</p><p class="meta">${esc(s.slotId)} · ${esc(s.page)} · ${esc(s.aspect)} · ≥${s.minWidth}px</p><p class="brief">Must show: ${esc(s.brief)}</p></div>`;
  if (!p) {
    const n = candidates[s.currentImage]?.candidates.length;
    return `<tr class="missing"><td>${card}</td><td colspan="3"><div class="tile">Fallback tile${n !== undefined ? ` · ${n} candidate(s) awaiting review` : ""}</div></td></tr>`;
  }
  const alts = (p.alternates ?? []).slice(0, 2).map((a) => `<td>${a.thumbUrl ? `<img src="${esc(a.thumbUrl)}" alt="">` : ""}<p><a href="${esc(a.sourcePageUrl)}">${esc(a.author ?? "source")}</a> · ${esc(a.license ?? "")}</p>${a.scores ? `<p class="meta">R${a.scores.relevance} Q${a.scores.quality} F${a.scores.fit}</p>` : ""}<p>${esc(a.note ?? "")}</p></td>`);
  while (alts.length < 2) alts.push("<td class=\"meta\">—</td>");
  return `<tr><td>${card}</td><td><img src="${esc(img(p.src))}" alt="${esc(p.alt)}" style="object-position:${esc(p.objectPosition)}"><p>${p.representative ? "<b>Representative image</b> · " : ""}${esc(creditLine(p))}</p><p><a href="${esc(p.sourcePageUrl ?? "")}">source</a> · <a href="${esc(p.licenseUrl ?? "")}">${esc(p.license)}</a> · ${p.width}×${p.height}</p><p class="ai">AI check: ${esc(p.aiCheck ?? "—")}</p><p>${esc(p.relevanceNote ?? "")}</p></td>${alts.join("")}</tr>`;
};
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Image review — Kanpur Ki Kahaani</title>
<style>
:root{--maroon:#8e2b1e;--gold:#855a14;--ink:#1c1412;--muted:#6b5d57;--bg:#fcf8f4;--alt:#f5eee7}
body{font:14px/1.5 system-ui,sans-serif;color:var(--ink);background:var(--bg);margin:0;padding:24px}
h1{color:var(--maroon);margin:0 0 4px}.sum{color:var(--muted);margin:0 0 20px}
table{border-collapse:collapse;width:100%}td{vertical-align:top;border-top:1px solid #e8dccf;padding:12px;width:25%}
img{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:10px;background:var(--alt)}
.eyebrow{color:var(--gold);font-size:11px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;margin:0}
h3{margin:2px 0 4px;font-size:16px}.meta{color:var(--muted);font-size:12px}.brief{font-size:12px;background:var(--alt);padding:6px 8px;border-radius:8px}
.tile{aspect-ratio:4/3;max-width:300px;border-radius:10px;background:linear-gradient(135deg,#c86a4b,#5c1f16);color:#fff;display:flex;align-items:flex-end;padding:12px;font-weight:600}
.ai{font-size:12px;color:#21603a}tr.missing td{opacity:.85}a{color:var(--maroon)}
</style></head><body>
<h1>Image review</h1>
<p class="sum">${slots.length} slots · ${filled.length} filled · ${missing.length} on the fallback tile · by source: ${[...bySource].map(([k, v]) => `${k} ${v}`).join(", ") || "none yet"}. To swap a photo, change its entry in src/data/photos.json to one of the alternates.</p>
<table><thead><tr><th>Card text (relevance target)</th><th>Chosen photo</th><th>Alternate 1</th><th>Alternate 2</th></tr></thead><tbody>
${slots.map(row).join("\n")}
</tbody></table></body></html>
`;
writeFileSync("reports/image-review.html", html);

// ── Missing images ──
const groups = new Map<string, Slot[]>();
for (const s of missing) groups.set(s.page, [...(groups.get(s.page) ?? []), s]);
const md = [
  "# Missing images",
  "",
  `${missing.length} of ${slots.length} slots still show the gradient fallback tile (${new Set(missing.map((s) => s.currentImage)).size} distinct photos needed).`,
  "",
  "**Why:** no candidate has been approved yet. Sourcing needs network access to Wikimedia Commons / Unsplash / Pexels, which this environment does not have — see SETUP.md → “Photos”. A slot also stays here if no correct, licensed, non-AI photo scores ≥ 4 on relevance: a wrong photo is worse than none.",
  "",
  "Each line is also a shot list our team can photograph ourselves (landscape, natural light, no identifiable children as the main subject).",
  "",
  ...[...groups].flatMap(([page, list]) => [
    `## ${page}`,
    "",
    ...[...new Map(list.map((s) => [s.currentImage, s])).values()].map((s) => `- **${s.adjacentTitle}** — \`${s.currentImage}\` (${s.aspect}, ≥ ${s.minWidth}px${s.representativeOk ? ", representative OK" : ""}): ${s.brief}`),
    "",
  ]),
].join("\n");
writeFileSync("reports/missing-images.md", md);

// ── IMAGE_CREDITS.md ──
const credited = Object.entries(photos).filter(([, p]) => p.credit !== false).sort(([a], [b]) => a.localeCompare(b));
const credits = [
  "# Image credits",
  "",
  "Generated by `npm run images:report` from the photo manifest (`src/data/photos.json`, typed in `src/data/images.ts`). The same list is on the site at `/credits`. Do not edit by hand.",
  "",
  "Rules for every photo (update v5): a real photograph — never AI-generated or AI-edited; legally licensed (Public domain, CC0, CC BY, CC BY-SA, Unsplash or Pexels licence; never NC/ND); it shows exactly what its card names; only technical changes (resizing, format conversion, metadata removal).",
  "",
  credited.length
    ? ["| Image | Subject | Author | Source | Licence | Changes |", "|---|---|---|---|---|---|", ...credited.map(([k, p]) => `| \`${k}\` | ${p.subject}${p.representative ? " *(representative)*" : ""} | ${p.authorUrl ? `[${p.author}](${p.authorUrl})` : p.author} | ${p.sourcePageUrl ? `[${p.source}](${p.sourcePageUrl})` : p.source} | ${p.licenseUrl ? `[${p.license}](${p.licenseUrl})` : p.license} | ${p.changes ?? ""} |`)].join("\n")
    : "_No photos credited yet — every slot shows the illustrated fallback tile. See `reports/missing-images.md` for the full shot list._",
  "",
  "Team portraits (`/images/team/*`) are the team's own photos (© Kanpur Ki Kahaani team, used with permission) and are not listed here.",
  "",
].join("\n");
writeFileSync("IMAGE_CREDITS.md", credits);

console.log(`images:report — ${filled.length}/${slots.length} slots filled · reports/image-review.html, reports/missing-images.md, IMAGE_CREDITS.md updated`);
