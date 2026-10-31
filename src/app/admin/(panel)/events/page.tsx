import Link from "next/link";
import { Plus } from "lucide-react";
import { EventRowActions } from "@/components/admin/EventRowActions";
import { categoryLabel } from "@/lib/events-schema";
import { formatIST } from "@/lib/news/query";
import { CITY_LABELS, type NewsCity } from "@/lib/news/taxonomy";
import { createSessionClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata = { title: "Events" };

const badge: Record<string, string> = {
  published: "bg-[#e3f1e6] text-[#21603a]",
  draft: "bg-accent-soft text-accent-ink",
  archived: "bg-bg-alt text-muted",
};

export default async function AdminEventsPage() {
  const db = await createSessionClient();
  const { data: events, error } = await db!
    .from("events")
    .select("id, title, category, city, start_at, status, bms_url, link_status, link_checked_at")
    .order("start_at", { ascending: false });

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Admin</p>
          <h1 className="mt-1 text-[32px] font-bold text-primary">Events</h1>
          <p className="text-sm">Past events are archived automatically every morning; BookMyShow links are checked daily.</p>
        </div>
        <Link href="/admin/events/new" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover">
          <Plus size={16} aria-hidden /> New event
        </Link>
      </div>
      {error && <p role="alert" className="mt-6 text-primary">Couldn&apos;t load events: {error.message}</p>}
      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-dark text-[11px] uppercase tracking-[0.16em] text-accent">
            <tr>
              {["Event", "City", "Starts", "Status", "BookMyShow link", ""].map((h, i) => (
                <th key={i} scope="col" className="px-4 py-3 font-bold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(events ?? []).map((e) => (
              <tr key={e.id} className="border-t border-border align-middle">
                <td className="px-4 py-3">
                  <Link href={`/admin/events/${e.id}/edit`} className="font-semibold text-ink hover:text-primary">{e.title}</Link>
                  <p className="text-xs text-muted">{categoryLabel(e.category)}</p>
                </td>
                <td className="px-4 py-3">{CITY_LABELS[e.city as NewsCity]?.en ?? e.city}</td>
                <td className="px-4 py-3">{formatIST(e.start_at)}</td>
                <td className="px-4 py-3">
                  <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold capitalize", badge[e.status])}>{e.status}</span>
                </td>
                <td className="px-4 py-3">
                  {!e.bms_url ? (
                    <span className="text-muted">—</span>
                  ) : e.link_status === "broken" ? (
                    <span className="font-semibold text-primary" title={e.link_checked_at ? `Checked ${formatIST(e.link_checked_at)}` : undefined}>
                      ⚠ Broken (404) — unpublished
                    </span>
                  ) : e.link_status === "ok" ? (
                    <span className="text-[#21603a]">OK</span>
                  ) : (
                    <span className="text-muted">Not checked yet</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <EventRowActions id={e.id} title={e.title} status={e.status as "draft" | "published" | "archived"} />
                </td>
              </tr>
            ))}
            {!events?.length && (
              <tr><td colSpan={6} className="px-4 py-10 text-center">No events yet — add the first one.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
