import type { City, FoodItem, Interest, NearbyCitySlug, Place } from "@/data/types";

/**
 * Pure, deterministic itinerary generator used by the planner on /tourism.
 *
 * Rules:
 *  - Kanpur always gets at least one day (it's the hub).
 *  - Each Kanpur day is anchored on one zone; empty slots are filled from the nearest zones,
 *    so travel within a day stays short.
 *  - Nearby cities: Lucknow is a day trip (1 day). Others are overnight trips (2 days), or
 *    compressed to 1 long day when days are tight. Cities that still don't fit are listed in `skipped`.
 *  - Cities are visited in a sensible circuit order (Lucknow → Ayodhya → Varanasi → Prayagraj → Agra).
 */

export type Slot = "morning" | "afternoon" | "evening";

export interface PlanStop {
  slot: Slot | string;
  title: string;
  note: string;
  href?: string;
}

export interface PlanDay {
  day: number;
  city: "kanpur" | NearbyCitySlug;
  title: string;
  stops: PlanStop[];
  tip?: string;
}

export interface Plan {
  days: PlanDay[];
  skipped: string[];
  summary: string;
}

const ZONE_ORDER = ["bithoor", "north", "central", "south", "east"] as const;
const SLOTS: Slot[] = ["morning", "afternoon", "evening"];
const CITY_ORDER: NearbyCitySlug[] = ["lucknow", "ayodhya", "varanasi", "prayagraj", "agra"];

const slotLabel: Record<Slot, string> = { morning: "Morning", afternoon: "Afternoon", evening: "Evening" };

const zoneName: Record<string, string> = {
  bithoor: "Bithoor & the Ganga",
  north: "Nawabganj & the Barrage",
  central: "Mall Road & the Cantonment",
  south: "Swaroop Nagar & Arya Nagar",
  east: "Jajmau & the east bank",
};

function zoneDistance(a?: string, b?: string) {
  const ia = ZONE_ORDER.indexOf((a ?? "central") as (typeof ZONE_ORDER)[number]);
  const ib = ZONE_ORDER.indexOf((b ?? "central") as (typeof ZONE_ORDER)[number]);
  return Math.abs(ia - ib);
}

function score(p: Place, interests: Interest[]) {
  const matches = interests.length ? p.interests.filter((i) => interests.includes(i)).length : 1;
  return matches * 100 + (p.priority ?? 0);
}

interface GenerateInput {
  days: number;
  interests: Interest[];
  cities: NearbyCitySlug[];
  places: Place[];
  allCities: City[];
  food: FoodItem[];
}

export function generateItinerary({ days, interests, cities, places, allCities, food }: GenerateInput): Plan {
  const totalDays = Math.min(5, Math.max(1, Math.round(days)));
  const chosen = CITY_ORDER.filter((c) => cities.includes(c));

  // ── Allocate days between Kanpur and the nearby cities ────────────────
  const available = totalDays - 1; // keep ≥1 day for Kanpur
  const cityDays = new Map<NearbyCitySlug, number>();
  const skipped: string[] = [];
  let used = 0;
  // first pass: everyone gets 1 day if possible
  for (const slug of chosen) {
    if (used < available) {
      cityDays.set(slug, 1);
      used++;
    } else {
      skipped.push(allCities.find((c) => c.slug === slug)?.name ?? slug);
    }
  }
  // second pass: overnight cities get a second day if there's room, keeping ≥1 Kanpur day
  for (const slug of chosen) {
    const city = allCities.find((c) => c.slug === slug);
    if (city && !city.dayTrip && cityDays.has(slug) && used < available) {
      cityDays.set(slug, 2);
      used++;
    }
  }
  const kanpurDays = totalDays - used;

  // ── Kanpur days ───────────────────────────────────────────────────────
  const ranked = [...places]
    .filter((p) => p.city === "kanpur")
    .sort((a, b) => score(b, interests) - score(a, interests));
  const relevant = interests.length
    ? ranked.filter((p) => p.interests.some((i) => interests.includes(i)))
    : ranked;
  const pool = relevant.length >= 3 ? relevant : ranked;
  const usedSlugs = new Set<string>();
  const out: PlanDay[] = [];
  const streetFood = food.filter((f) => f.city === "kanpur" && (f.kind === "street" || f.kind === "nightlife"));

  for (let d = 0; d < kanpurDays; d++) {
    // anchor zone = zone with the most unused, high-scoring places
    const zoneScore = new Map<string, number>();
    for (const p of pool) {
      if (usedSlugs.has(p.slug)) continue;
      zoneScore.set(p.zone ?? "central", (zoneScore.get(p.zone ?? "central") ?? 0) + score(p, interests));
    }
    const anchor = [...zoneScore.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "central";

    const stops: PlanStop[] = [];
    let hoursLeft = 9;
    for (const slot of SLOTS) {
      const candidates = (list: Place[]) =>
        list
          .filter((p) => !usedSlugs.has(p.slug) && p.hours <= hoursLeft)
          .sort(
            (a, b) =>
              zoneDistance(a.zone, anchor) - zoneDistance(b.zone, anchor) ||
              Number(b.bestSlot === slot) - Number(a.bestSlot === slot) ||
              score(b, interests) - score(a, interests),
          );
      // prefer places within 1 zone of the anchor that suit the slot
      let pick =
        candidates(pool).find((p) => zoneDistance(p.zone, anchor) <= 1 && p.bestSlot === slot) ??
        candidates(pool).find((p) => zoneDistance(p.zone, anchor) <= 1) ??
        candidates(pool)[0] ??
        candidates(ranked).find((p) => zoneDistance(p.zone, anchor) <= 1) ??
        candidates(ranked)[0];
      if (!pick) {
        // everything's been seen — repeat a favourite evening spot
        pick = ranked.find((p) => p.bestSlot === slot) ?? ranked[0];
      }
      if (!pick) continue;
      usedSlugs.add(pick.slug);
      hoursLeft -= pick.hours;
      stops.push({
        slot: slotLabel[slot],
        title: pick.name,
        note: `${pick.area} · ${pick.duration}. ${firstSentence(pick.description)}`,
        href: `/tourism#${pick.slug}`,
      });
    }

    let tip: string | undefined;
    if (interests.includes("food") || interests.length === 0) {
      const f = streetFood[d % Math.max(1, streetFood.length)];
      if (f) tip = `Taste of the day: ${f.name} (${f.area}, ${f.price}).`;
    }

    out.push({
      day: 0,
      city: "kanpur",
      title: `Kanpur · ${zoneName[anchor] ?? "City highlights"}`,
      stops,
      tip,
    });
  }

  // ── City days ─────────────────────────────────────────────────────────
  const cityOut: PlanDay[] = [];
  chosen.forEach((slug, idx) => {
    const n = cityDays.get(slug);
    const city = allCities.find((c) => c.slug === slug);
    if (!n || !city) return;
    const template = n >= 2 ? city.itinerary.twoDay : city.itinerary.oneDay;
    const isLast = idx === chosen.filter((s) => cityDays.has(s)).length - 1;
    template.slice(0, n).forEach((t, i) => {
      const stops: PlanStop[] = t.stops.map((s) => ({ slot: s.time, title: s.title, note: s.note }));
      const first = i === 0;
      const lastDay = i === n - 1;
      let tip: string;
      if (first && city.dayTrip && n === 1) {
        tip = `Day trip: ${city.driveTime} each way by road (~${city.distanceKm} km) — leave Kanpur early.`;
      } else if (first) {
        tip = `${city.fastestWay}: about ${city.trainTime}. ${n === 1 ? "A long day — consider staying overnight." : "Stay overnight."}`;
      } else {
        tip = lastDay && isLast ? "Head back to Kanpur in the evening." : `Overnight in ${city.name}.`;
      }
      cityOut.push({
        day: 0,
        city: slug,
        title: `${city.name} · ${t.title.replace(/^Day \d+ · /, "")}`,
        stops,
        tip,
      });
    });
  });

  const all = [...out, ...cityOut].map((d, i) => ({ ...d, day: i + 1 }));
  const cityNames = chosen.filter((c) => cityDays.has(c)).map((c) => allCities.find((x) => x.slug === c)?.name);
  const summary =
    `${totalDays}-day plan: ${kanpurDays} day${kanpurDays > 1 ? "s" : ""} in Kanpur` +
    (cityNames.length ? ` + ${cityNames.join(", ")}` : "") +
    (interests.length ? ` · focus on ${interests.join(", ")}` : "");

  return { days: all, skipped, summary };
}

function firstSentence(s: string) {
  const m = s.match(/^.*?[.!?](\s|$)/);
  return (m ? m[0] : s).trim();
}

/** Plain-text version for copy / WhatsApp share. */
export function planToText(plan: Plan, url?: string) {
  const lines = [`🗺️ My Kanpur Ki Kahaani trip — ${plan.summary}`, ""];
  for (const d of plan.days) {
    lines.push(`Day ${d.day}: ${d.title}`);
    for (const s of d.stops) lines.push(`  • ${s.slot}: ${s.title}`);
    if (d.tip) lines.push(`  ↳ ${d.tip}`);
    lines.push("");
  }
  if (plan.skipped.length) lines.push(`Add more days to include: ${plan.skipped.join(", ")}`, "");
  if (url) lines.push(`Plan yours: ${url}`);
  return lines.join("\n").trim();
}
