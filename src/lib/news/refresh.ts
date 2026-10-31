import "server-only";
import { activeSources } from "@/data/newsSources";
import { createServiceClient } from "@/lib/supabase/admin";
import { fetchFeed } from "./fetch-feed";
import { KEEP_DAYS, toRow, type NewsRow } from "./to-row";

export interface RefreshResult {
  ok: boolean;
  feedsOk: number;
  feedsFailed: number;
  itemsUpserted: number;
  errors: { source: string; error: string }[];
  skipped?: string;
}

/** The daily job: fetch all feeds in parallel, normalise, de-duplicate, classify, store, prune. */
export async function runNewsRefresh(): Promise<RefreshResult> {
  const db = createServiceClient();
  if (!db) return { ok: false, feedsOk: 0, feedsFailed: 0, itemsUpserted: 0, errors: [], skipped: "Supabase service role not configured" };
  const sources = activeSources();
  const now = new Date();

  const { data: run } = await db.from("news_runs").insert({ started_at: now.toISOString() }).select("id").single();

  // One failing feed never breaks the run.
  const settled = await Promise.allSettled(sources.map((s) => fetchFeed(s)));
  const byUrl = new Map<string, NewsRow>();
  const health: { source: string; last_run_at: string; last_success_at?: string; last_error: string | null; items_last_run: number }[] = [];
  const errors: RefreshResult["errors"] = [];

  settled.forEach((r, i) => {
    const src = sources[i];
    const key = `${src.name} · ${src.feedUrl}`;
    if (r.status === "rejected") {
      const msg = r.reason?.name === "AbortError" ? "timeout after 10s" : String(r.reason?.message ?? r.reason).slice(0, 300);
      errors.push({ source: key, error: msg });
      health.push({ source: key, last_run_at: now.toISOString(), last_error: msg, items_last_run: 0 });
      return;
    }
    let n = 0;
    for (const item of r.value.items ?? []) {
      const row = toRow(item, src, now);
      if (!row) continue;
      // de-duplicate by canonical URL; keep the earliest-seen, publisher-specific version
      const prev = byUrl.get(row.url);
      if (!prev || (prev.source_name === "Google News" && row.source_name !== "Google News")) byUrl.set(row.url, row);
      n++;
    }
    health.push({ source: key, last_run_at: now.toISOString(), last_success_at: now.toISOString(), last_error: null, items_last_run: n });
  });

  const rows = [...byUrl.values()];
  let upserted = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500);
    const { error } = await db.from("news_items").upsert(chunk, { onConflict: "url", ignoreDuplicates: false });
    if (error) errors.push({ source: "database", error: error.message });
    else upserted += chunk.length;
  }
  await db.from("news_items").delete().lt("published_at", new Date(now.getTime() - KEEP_DAYS * 864e5).toISOString());
  if (health.length) await db.from("news_sources_health").upsert(health, { onConflict: "source" });

  const feedsOk = health.filter((h) => !h.last_error).length;
  const result: RefreshResult = { ok: feedsOk > 0 || sources.length === 0, feedsOk, feedsFailed: sources.length - feedsOk, itemsUpserted: upserted, errors };
  if (run?.id) {
    await db
      .from("news_runs")
      .update({ finished_at: new Date().toISOString(), items_upserted: upserted, feeds_ok: feedsOk, feeds_failed: result.feedsFailed, ok: result.ok })
      .eq("id", run.id);
  }
  return result;
}
