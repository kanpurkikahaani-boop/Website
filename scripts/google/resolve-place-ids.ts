/**
 * npm run google:place-ids — OPTIONAL, one-off. With GOOGLE_MAPS_API_KEY set (in .env.local or the
 * shell), looks up each exact place once with the Places API (New) Text Search and saves its
 * place_id to src/data/placeIds.json, so Map links open that exact place. Never runs in the browser
 * or at page load. Without a key it exits without changing anything; the search links still work.
 *
 * Cost: the Places API needs a Google Cloud project with billing enabled; Text Search is billed per
 * request beyond Google's monthly free usage. ~250 requests per full run. // VERIFY current pricing.
 * Matches whose address doesn't contain the item's city, or whose name shares no word with the
 * item, are saved with `flagged: true` and NOT used for links until you check them.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { collect } from "./collect";
import { idKey } from "../../src/lib/googleQueries";

export interface Resolved {
  placeId: string;
  matchedName: string;
  address: string;
  query: string;
  flagged: boolean;
  reason?: string;
}

const words = (s: string) => new Set(s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 2));

/** One Text Search call (exported for the mocked unit test). */
export async function resolveOne(query: string, itemName: string, city: string, key: string, fetchImpl: typeof fetch = fetch): Promise<Resolved | null> {
  const res = await fetchImpl("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key, "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress" },
    body: JSON.stringify({ textQuery: query, regionCode: "IN", languageCode: "en" }),
  });
  if (!res.ok) throw new Error(`Places API answered ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const j = (await res.json()) as { places?: { id: string; displayName?: { text?: string }; formattedAddress?: string }[] };
  const top = j.places?.[0];
  if (!top) return null;
  const matchedName = top.displayName?.text ?? "";
  const address = top.formattedAddress ?? "";
  const cityOk = address.toLowerCase().includes(city.toLowerCase()) || (city === "Prayagraj" && /allahabad/i.test(address));
  const nameOk = [...words(itemName)].some((w) => words(matchedName).has(w));
  const reason = !cityOk ? `address isn't in ${city}` : !nameOk ? "name doesn't match" : undefined;
  return { placeId: top.id, matchedName, address, query, flagged: Boolean(reason), ...(reason ? { reason } : {}) };
}

async function main() {
  const key = process.env.GOOGLE_MAPS_API_KEY?.trim();
  if (!key) {
    console.log("google:place-ids — GOOGLE_MAPS_API_KEY isn't set; nothing to do (search links work without place IDs).");
    return;
  }
  const out: Record<string, Resolved & { placeIdUsed?: boolean }> = JSON.parse(readFileSync("src/data/placeIds.json", "utf8"));
  const seen = new Set<string>();
  let flagged = 0;
  for (const r of collect()) {
    if (r.item.mapsKind !== "place") continue;
    const k = idKey(r.item.type, r.item.city, r.item.name);
    if (seen.has(k) || out[k]) continue;
    seen.add(k);
    const hit = await resolveOne(r.item.mapsQuery, r.item.name, r.item.city, key);
    if (hit) {
      out[k] = hit;
      if (hit.flagged) {
        flagged++;
        console.warn(`⚠ ${r.item.name}: ${hit.reason} → "${hit.matchedName}", ${hit.address}`);
      }
    }
    await new Promise((res) => setTimeout(res, 120));
  }
  writeFileSync("src/data/placeIds.json", JSON.stringify(out, null, 2) + "\n");
  console.log(`google:place-ids — ${Object.keys(out).length} saved, ${flagged} flagged for review (flagged ones aren't used).`);
}

if (process.argv[1]?.endsWith("resolve-place-ids.ts")) main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
