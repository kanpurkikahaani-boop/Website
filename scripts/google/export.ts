/** npm run google:export → reports/google-links.csv + reports/google-links.html (every item, both links). */
import { mkdirSync, writeFileSync } from "node:fs";
import { blogRowsWithoutLinks, collect } from "./collect";

const rows = collect();
const cell = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const head = ["Page", "Section", "Item", "Type", "City", "Area", "Google Maps link", "Google Images link", "Place ID", "Needs review", "Note"];
const data = rows.map((r) => [r.page, r.section, r.item.name, r.item.type, r.item.city, r.item.area ?? "", r.item.mapsUrl, r.item.imagesUrl, r.item.placeId ?? "", r.item.needsReview ? "Y" : "N", r.item.note ?? ""]);
mkdirSync("reports", { recursive: true });
writeFileSync("reports/google-links.csv", [head, ...data].map((l) => l.map(cell).join(",")).join("\n") + "\n");

const pages = [...new Set(rows.map((r) => r.page))];
const review = rows.filter((r) => r.item.needsReview).length;
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Google links — Kanpur Ki Kahaani</title>
<style>
:root{--maroon:#8e2b1e;--ink:#1c1412;--muted:#6b5d57;--bg:#fcf8f4;--alt:#f5eee7;--border:#e8dccf}
body{font:14px/1.45 system-ui,sans-serif;color:var(--ink);background:var(--bg);margin:0;padding:20px}
h1{color:var(--maroon);margin:0 0 4px}p.sum{color:var(--muted);margin:0 0 14px}
.bar{position:sticky;top:0;background:var(--bg);padding:8px 0;display:flex;gap:8px;flex-wrap:wrap;z-index:2}
input,select{padding:8px 10px;border:1px solid var(--border);border-radius:8px;font:inherit}
h2{margin:22px 0 6px;font-size:16px;color:var(--maroon)}
table{border-collapse:collapse;width:100%;background:#fff;border:1px solid var(--border)}th,td{padding:6px 8px;border-top:1px solid var(--border);text-align:left;vertical-align:top}
th{background:var(--alt);font-size:12px}a{color:var(--maroon)}.rev{background:#fff4dc}.muted{color:var(--muted);font-size:12px}
</style></head><body>
<h1>Google links</h1>
<p class="sum">${rows.length} items on ${pages.length} pages · ${review} marked “needs review” (highlighted) · generated ${new Date().toISOString().slice(0, 10)}. Click any link to spot-check it.</p>
<div class="bar"><input id="q" type="search" placeholder="Filter by item, city, type…" aria-label="Filter"><select id="p" aria-label="Page"><option value="">All pages</option>${pages.map((p) => `<option>${esc(p)}</option>`).join("")}</select><label><input type="checkbox" id="r"> Needs review only</label></div>
${pages
  .map(
    (p) => `<section data-page="${esc(p)}"><h2>${esc(p)}</h2><table><thead><tr><th>Section</th><th>Item</th><th>Type</th><th>City / area</th><th>Map</th><th>Photos</th><th>Note</th></tr></thead><tbody>
${rows
  .filter((r) => r.page === p)
  .map((r) => `<tr class="${r.item.needsReview ? "rev" : ""}" data-review="${r.item.needsReview ? 1 : 0}"><td>${esc(r.section)}</td><td>${esc(r.item.name)}</td><td>${r.item.type}</td><td>${esc(r.item.city)}${r.item.area ? `<div class="muted">${esc(r.item.area)}</div>` : ""}</td><td><a href="${esc(r.item.mapsUrl)}" target="_blank" rel="noopener noreferrer">${esc(r.item.mapsQuery)}</a></td><td><a href="${esc(r.item.imagesUrl)}" target="_blank" rel="noopener noreferrer">${esc(r.item.imagesQuery)}</a></td><td class="muted">${esc(r.item.note ?? "")}</td></tr>`)
  .join("\n")}
</tbody></table></section>`,
  )
  .join("\n")}
<h2>Blog rows without links (add “Google Maps search text” in the editor if they're places)</h2><ul>${blogRowsWithoutLinks().map((l) => `<li>${esc(l)}</li>`).join("")}</ul>
<script>
const q=document.getElementById('q'),p=document.getElementById('p'),r=document.getElementById('r');
function f(){const t=q.value.toLowerCase();document.querySelectorAll('section[data-page]').forEach(s=>{const showPage=!p.value||s.dataset.page===p.value;let n=0;s.querySelectorAll('tbody tr').forEach(tr=>{const ok=showPage&&(!t||tr.textContent.toLowerCase().includes(t))&&(!r.checked||tr.dataset.review==='1');tr.hidden=!ok;if(ok)n++});s.hidden=!n})}
[q,p,r].forEach(e=>e.addEventListener('input',f));
</script></body></html>
`;
writeFileSync("reports/google-links.html", html);

const byType = new Map<string, number>();
for (const r of rows) byType.set(r.item.type, (byType.get(r.item.type) ?? 0) + 1);
console.log(`google:export — ${rows.length} items → reports/google-links.csv, reports/google-links.html`);
console.log(`by page: ${pages.map((p) => `${p} ${rows.filter((r) => r.page === p).length}`).join(", ")}`);
console.log(`by type: ${[...byType].map(([k, v]) => `${k} ${v}`).join(", ")}`);
