import "server-only";
import { createServiceClient } from "@/lib/supabase/admin";

const UA = "Mozilla/5.0 (compatible; KanpurKiKahaaniBot/1.0; +https://kanpurkikahaani.site)";

/** 'ok' on 2xx/3xx, 'broken' on 404/410, 'unknown' for anything else (403, Cloudflare, timeout…). */
export async function checkLink(url: string): Promise<"ok" | "broken" | "unknown"> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    // A single page request to the event link — the same thing a visitor's click does. Nothing is parsed or stored.
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "text/html" }, redirect: "follow", signal: ctrl.signal, cache: "no-store" });
    await res.body?.cancel();
    if (res.status === 404 || res.status === 410) return "broken";
    if (res.status >= 200 && res.status < 400) return "ok";
    return "unknown";
  } catch {
    return "unknown";
  } finally {
    clearTimeout(t);
  }
}

export interface EventsRefreshResult {
  archived: number;
  checked: number;
  broken: number;
  unknown: number;
  skipped?: string;
}

/** Daily job: archive finished events, re-check BookMyShow links, unpublish 404s. */
export async function runEventsRefresh(): Promise<EventsRefreshResult> {
  const db = createServiceClient();
  if (!db) return { archived: 0, checked: 0, broken: 0, unknown: 0, skipped: "Supabase service role not configured" };
  const now = new Date().toISOString();

  // 1. Archive anything that has finished (end, or start when there's no end).
  const { data: endedWithEnd } = await db.from("events").update({ status: "archived" }).neq("status", "archived").lt("end_at", now).select("id");
  const { data: endedNoEnd } = await db.from("events").update({ status: "archived" }).neq("status", "archived").is("end_at", null).lt("start_at", now).select("id");
  const archived = (endedWithEnd?.length ?? 0) + (endedNoEnd?.length ?? 0);

  // 2. Check each published event's BookMyShow link (few requests, sequential, polite).
  const { data: live } = await db.from("events").select("id, bms_url").eq("status", "published").not("bms_url", "is", null);
  let broken = 0;
  let unknown = 0;
  for (const e of live ?? []) {
    const status = await checkLink(e.bms_url as string);
    if (status === "broken") broken++;
    if (status === "unknown") unknown++;
    await db
      .from("events")
      .update({ link_status: status, link_checked_at: new Date().toISOString(), ...(status === "broken" ? { status: "draft" } : {}) })
      .eq("id", e.id);
  }

  const result = { archived, checked: live?.length ?? 0, broken, unknown };
  await db.from("cron_runs").upsert({ job: "refresh-events", finished_at: new Date().toISOString(), ok: true, detail: result });
  return result;
}
