import Link from "next/link";
import { CalendarClock, CalendarDays, FilePen, FileText, Link2Off, Newspaper, Plus, Users } from "lucide-react";
import { IconBadge } from "@/components/ui/IconBadge";
import { createSessionClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

const ACTION_LABEL: Record<string, string> = {
  login: "Signed in",
  login_denied: "Sign-in refused",
  logout: "Signed out",
  create: "Created",
  update: "Edited",
  publish: "Published",
  unpublish: "Unpublished",
  schedule: "Scheduled",
  trash: "Moved to Trash",
  restore: "Restored",
  purge: "Deleted forever",
  revision_restore: "Restored an older version of",
  duplicate: "Duplicated",
  mfa_enrol: "Turned on 2-step verification",
  mfa_remove: "Turned off 2-step verification",
};

export default async function AdminDashboard() {
  const db = await createSessionClient();
  const nowIso = new Date().toISOString();
  const live = () => db!.from("posts").select("id", { count: "exact", head: true }).is("deleted_at", null);
  const [published, drafts, scheduled, reports, subs, run, upcoming, activity] = await Promise.all([
    live().eq("status", "published").lte("published_at", nowIso),
    live().eq("status", "draft"),
    live().eq("status", "published").gt("published_at", nowIso),
    db!.from("posts").select("link_report").eq("status", "published").is("deleted_at", null).not("link_report", "is", null),
    db!.from("subscribers").select("id", { count: "exact", head: true }).is("unsubscribed_at", null),
    db!.from("news_runs").select("finished_at, items_upserted, ok").order("finished_at", { ascending: false }).limit(1).maybeSingle(),
    db!.from("events").select("id", { count: "exact", head: true }).eq("status", "published"),
    db!.from("admin_audit").select("id, at, actor, action, detail, post_id").order("at", { ascending: false }).limit(10),
  ]);
  const broken = (reports.data ?? []).reduce((n, r) => n + ((r.link_report as { broken?: unknown[] } | null)?.broken?.length ?? 0), 0);

  const blogCards = [
    { href: "/admin/blogs?status=published", icon: FileText, title: "Published", stat: published.count ?? 0 },
    { href: "/admin/blogs?status=draft", icon: FilePen, title: "Drafts", stat: drafts.count ?? 0 },
    { href: "/admin/blogs?status=scheduled", icon: CalendarClock, title: "Scheduled", stat: scheduled.count ?? 0 },
    { href: "/admin/blogs", icon: Link2Off, title: "Broken links", stat: broken, alert: broken > 0 },
  ];
  const otherCards = [
    { href: "/admin/events", icon: CalendarDays, title: "Events", stat: `${upcoming.count ?? 0} published` },
    { href: "/admin/subscribers", icon: Users, title: "Subscribers", stat: `${subs.count ?? 0} active` },
    {
      href: "/admin/news",
      icon: Newspaper,
      title: "News sources",
      stat: run.data?.finished_at
        ? `Last run ${new Date(run.data.finished_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} · ${run.data.items_upserted} items`
        : "No refresh has run yet",
    },
  ];

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Admin</p>
          <h1 className="mt-1 text-[32px] font-bold text-primary">Dashboard</h1>
        </div>
        <Link href="/admin/blogs/new" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover">
          <Plus size={16} aria-hidden /> New post
        </Link>
      </div>

      <h2 className="mt-8 text-xs font-bold uppercase tracking-[0.16em] text-accent-ink">Blog</h2>
      <ul className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {blogCards.map((c) => (
          <li key={c.title}>
            <Link href={c.href} className={cn("flex items-center gap-4 rounded-2xl border bg-surface p-5 transition hover:-translate-y-0.5 hover:shadow-md", c.alert ? "border-primary" : "border-border")}>
              <IconBadge icon={c.icon} size={40} />
              <span>
                <span className={cn("block font-display text-3xl font-bold", c.alert ? "text-primary" : "text-ink")}>{c.stat}</span>
                <span className="text-sm">{c.title}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <section aria-labelledby="other-title">
          <h2 id="other-title" className="text-xs font-bold uppercase tracking-[0.16em] text-accent-ink">Elsewhere</h2>
          <ul className="mt-3 space-y-3">
            {otherCards.map((c) => (
              <li key={c.href}>
                <Link href={c.href} className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 hover:border-primary">
                  <IconBadge icon={c.icon} size={36} />
                  <span>
                    <span className="block font-semibold text-ink">{c.title}</span>
                    <span className="text-sm">{c.stat}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="activity-title">
          <h2 id="activity-title" className="text-xs font-bold uppercase tracking-[0.16em] text-accent-ink">Recent activity</h2>
          <ol className="mt-3 divide-y divide-border rounded-2xl border border-border bg-surface">
            {(activity.data ?? []).map((a) => (
              <li key={a.id} className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-3 text-sm">
                <span>
                  <strong className="text-ink">{ACTION_LABEL[a.action] ?? a.action}</strong>
                  {a.detail && (a.post_id ? <> <Link href={`/admin/blogs/${a.post_id}/edit`} className="text-primary hover:underline">{a.detail}</Link></> : <span className="text-muted"> · {a.detail}</span>)}
                </span>
                <time dateTime={a.at} className="text-xs text-muted">{new Date(a.at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })}</time>
              </li>
            ))}
            {!activity.data?.length && <li className="px-4 py-6 text-center text-sm">Nothing yet — activity appears here as you work.</li>}
          </ol>
        </section>
      </div>
    </>
  );
}
