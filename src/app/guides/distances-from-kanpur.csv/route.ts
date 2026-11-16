import { absoluteUrl, site } from "@/data/site";
import { DISTANCES_PATH, DISTANCES_UPDATED, distanceRows } from "@/lib/distances";

export const dynamic = "force-static";

const cell = (v: string | number) => {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** The distance guide as CSV (CC BY 4.0 — reuse with a link back). */
export function GET() {
  const head = ["city", "straight_line_km", "road_km_approx", "drive_time", "train_time", "fastest_way", "nearest_airport", "best_time", "guide_url"];
  const rows = distanceRows().map((r) => [r.city.name, r.straightKm, r.roadKm, r.drive, r.train, r.fastest, r.airport, r.bestTime, absoluteUrl(`/cities/${r.city.slug}`)]);
  const csv = [
    `# Distances from Kanpur — ${site.name}, ${absoluteUrl(DISTANCES_PATH)} — updated ${DISTANCES_UPDATED} — licence CC BY 4.0 (credit "${site.name}" with a link)`,
    head.join(","),
    ...rows.map((r) => r.map(cell).join(",")),
  ].join("\n");
  return new Response(`${csv}\n`, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'inline; filename="distances-from-kanpur.csv"' },
  });
}
