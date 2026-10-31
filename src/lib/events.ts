import "server-only";
import { createPublicClient } from "@/lib/supabase/public";

export interface CityEvent {
  id: string;
  title: string;
  category: string;
  city: string;
  venue: string;
  startAt: string;
  endAt: string | null;
  imageUrl: string | null;
  bmsUrl: string | null;
  sourceUrl: string | null;
}

/** True while the event hasn't finished (its end, or its start if there's no end). */
export function isUpcoming(e: Pick<CityEvent, "startAt" | "endAt">, now = new Date()) {
  return new Date(e.endAt ?? e.startAt).getTime() >= now.getTime();
}

/** Published events that haven't finished, soonest first. RLS hides drafts and archived events. */
export async function getUpcomingEvents(): Promise<CityEvent[]> {
  const db = createPublicClient();
  if (!db) return [];
  const now = new Date().toISOString();
  const { data, error } = await db
    .from("events")
    .select("id, title, category, city, venue, start_at, end_at, image_url, bms_url, source_url")
    .eq("status", "published")
    .or(`end_at.gte.${now},and(end_at.is.null,start_at.gte.${now})`)
    .order("start_at", { ascending: true })
    .limit(300);
  if (error) {
    console.error("[events] query failed:", error.message);
    return [];
  }
  return (data ?? [])
    .map((r) => ({
      id: r.id,
      title: r.title,
      category: r.category,
      city: r.city,
      venue: r.venue ?? "",
      startAt: r.start_at,
      endAt: r.end_at,
      imageUrl: r.image_url,
      bmsUrl: r.bms_url,
      sourceUrl: r.source_url,
    }))
    .filter((e) => isUpcoming(e));
}

export async function getEventsLastRefreshed(): Promise<string | null> {
  const db = createPublicClient();
  if (!db) return null;
  const { data } = await db.from("cron_runs").select("finished_at").eq("job", "refresh-events").maybeSingle();
  return data?.finished_at ?? null;
}
