import { activeSources } from "@/data/newsSources";
import { formatIST } from "@/lib/news/query";
import { createSessionClient } from "@/lib/supabase/server";
import { RefreshButton } from "./RefreshButton";

export const metadata = { title: "News sources" };

export default async function AdminNewsPage() {
  const db = await createSessionClient();
  const [{ data: health }, { data: runs }] = await Promise.all([
    db!.from("news_sources_health").select("*").order("source"),
    db!.from("news_runs").select("*").order("started_at", { ascending: false }).limit(5),
  ]);
  const sources = activeSources();
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Admin</p>
          <h1 className="mt-1 text-[32px] font-bold text-primary">News sources</h1>
          <p className="text-sm">
            {sources.length} top-newspaper feeds, each checked live on every run · daily refresh at 6:00 AM IST
          </p>
        </div>
        <RefreshButton />
      </div>

      <h2 className="mt-10 text-xl font-semibold">Recent runs</h2>
      <ul className="mt-3 space-y-1 text-sm">
        {(runs ?? []).map((r) => (
          <li key={r.id}>
            {formatIST(r.started_at)} — {r.finished_at ? `${r.items_upserted} items, ${r.feeds_ok} ok, ${r.feeds_failed} failed` : "running or interrupted"} {r.ok ? "✅" : "⚠️"}
          </li>
        ))}
        {!runs?.length && <li>No runs yet.</li>}
      </ul>

      <h2 className="mt-10 text-xl font-semibold">Feed health</h2>
      <div className="mt-3 overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-dark text-[11px] uppercase tracking-[0.16em] text-accent">
            <tr>{["Source", "Last success", "Items", "Last error"].map((h) => <th key={h} scope="col" className="px-4 py-3 font-bold">{h}</th>)}</tr>
          </thead>
          <tbody>
            {(health ?? []).map((h) => (
              <tr key={h.source} className="border-t border-border">
                <td className="max-w-[360px] truncate px-4 py-2.5" title={h.source}>{h.source}</td>
                <td className="px-4 py-2.5">{h.last_success_at ? formatIST(h.last_success_at) : "—"}</td>
                <td className="px-4 py-2.5">{h.items_last_run}</td>
                <td className={`px-4 py-2.5 ${h.last_error ? "text-primary" : "text-muted"}`}>{h.last_error ?? "OK"}</td>
              </tr>
            ))}
            {!health?.length && <tr><td colSpan={4} className="px-4 py-8 text-center">No feed has been fetched yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
