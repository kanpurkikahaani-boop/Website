import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { PostRowActions } from "@/components/admin/PostRowActions";
import type { LinkReport } from "@/lib/link-check";
import { hrefsIn } from "@/lib/link-check";
import { displayStatus } from "@/lib/admin/post-status";
import { createSessionClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata = { title: "Blogs" };

type Status = "draft" | "scheduled" | "published";
const STATUS_LABEL: Record<Status, string> = { draft: "Draft", scheduled: "Scheduled", published: "Published" };
const STATUS_STYLE: Record<Status, string> = {
  draft: "bg-accent-soft text-accent-ink",
  scheduled: "bg-[#e6eefb] text-[#1d4a8f]",
  published: "bg-[#e3f1e6] text-[#21603a]",
};
const SORTS = { updated: "Last edited", published: "Publish date", title: "Title" } as const;

const ist = (iso: string, withTime = false) =>
  new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", ...(withTime ? { timeStyle: "short" } : {}) });

export default async function AdminBlogsPage({ searchParams }: PageProps<"/admin/blogs">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 80) : "";
  const statusFilter = (["draft", "scheduled", "published"] as const).find((s) => s === sp.status) ?? "all";
  const sort = (Object.keys(SORTS) as (keyof typeof SORTS)[]).find((s) => s === sp.sort) ?? "updated";
  const trash = sp.view === "trash";
  const notice = sp.notice === "password" ? "Your new password is saved." : null;

  const db = await createSessionClient();
  let query = db!
    .from("posts")
    .select("id, slug, title, status, published_at, updated_at, deleted_at, cover_url, author, authors(name), content_html, plan_visit, glossary, further_reading, link_report");
  query = trash ? query.not("deleted_at", "is", null) : query.is("deleted_at", null);
  if (q) query = query.ilike("title", `%${q.replace(/[%_,()]/g, " ")}%`);
  query =
    sort === "title"
      ? query.order("title", { ascending: true })
      : sort === "published"
        ? query.order("published_at", { ascending: false, nullsFirst: false })
        : query.order("updated_at", { ascending: false });
  const { data, error } = await query;
  const { count: trashCount } = await db!.from("posts").select("id", { count: "exact", head: true }).not("deleted_at", "is", null);

  const rows = (data ?? [])
    .map((p) => {
      const status: Status = displayStatus(p.status, p.published_at);
      const author = (Array.isArray(p.authors) ? p.authors[0] : p.authors)?.name ?? p.author;
      const boxes = [p.plan_visit, p.glossary, p.further_reading].reduce((n, a) => n + (Array.isArray(a) ? a.length : 0), 0);
      return { ...p, status, author, links: hrefsIn(p.content_html ?? "").length + boxes, report: p.link_report as LinkReport | null };
    })
    .filter((p) => statusFilter === "all" || p.status === statusFilter);

  const qs = (patch: Record<string, string | undefined>) => {
    const u = new URLSearchParams();
    const merged = { q: q || undefined, status: statusFilter === "all" ? undefined : statusFilter, sort: sort === "updated" ? undefined : sort, view: trash ? "trash" : undefined, ...patch };
    Object.entries(merged).forEach(([k, v]) => v && u.set(k, v));
    const s = u.toString();
    return `/admin/blogs${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Admin</p>
          <h1 className="mt-1 text-[32px] font-bold text-primary">{trash ? "Trash" : "Blogs"}</h1>
          {trash && <p className="mt-1 text-sm">Posts here are hidden from the site and deleted for good after 30 days.</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={trash ? "/admin/blogs" : "/admin/blogs?view=trash"} className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-ink hover:border-primary hover:text-primary">
            {trash ? "← All posts" : <><Trash2 size={15} aria-hidden /> Trash ({trashCount ?? 0})</>}
          </Link>
          <Link href="/admin/blogs/new" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover">
            <Plus size={16} aria-hidden /> New post
          </Link>
        </div>
      </div>
      {notice && <p role="status" className="mt-4 rounded-xl bg-[#e3f1e6] px-4 py-3 text-sm text-[#21603a]">{notice}</p>}

      <form role="search" className="mt-6 flex flex-wrap items-end gap-3" action="/admin/blogs">
        {trash && <input type="hidden" name="view" value="trash" />}
        <label className="text-xs font-semibold text-muted">
          Search titles
          <input name="q" defaultValue={q} placeholder="e.g. Navaratri" className="mt-1 block h-10 w-64 rounded-full border border-border bg-white px-4 text-sm text-ink" />
        </label>
        <label className="text-xs font-semibold text-muted">
          Status
          <select name="status" defaultValue={statusFilter} className="mt-1 block h-10 rounded-full border border-border bg-white px-4 text-sm text-ink">
            <option value="all">All</option>
            <option value="draft">Drafts</option>
            <option value="scheduled">Scheduled</option>
            <option value="published">Published</option>
          </select>
        </label>
        <label className="text-xs font-semibold text-muted">
          Sort by
          <select name="sort" defaultValue={sort} className="mt-1 block h-10 rounded-full border border-border bg-white px-4 text-sm text-ink">
            {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <button className="h-10 rounded-full bg-dark px-5 text-sm font-semibold text-cream">Apply</button>
        {(q || statusFilter !== "all" || sort !== "updated") && <Link href={qs({ q: undefined, status: undefined, sort: undefined })} className="h-10 px-2 text-sm leading-10 text-primary">Clear</Link>}
      </form>

      {error && <p role="alert" className="mt-6 text-primary">Couldn&apos;t load posts: {error.message}</p>}
      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-dark text-[11px] uppercase tracking-[0.16em] text-accent">
            <tr>
              {["", "Title", "Author", "Status", "Publish date", "Last edited", "Links", ""].map((h, i) => (
                <th key={i} scope="col" className="px-4 py-3 font-bold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-t border-border align-middle">
                <td className="w-[76px] py-3 pl-4">
                  {p.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element -- small admin thumbnail
                    <img src={p.cover_url} alt="" width={60} height={40} className="h-10 w-[60px] rounded-md object-cover" />
                  ) : (
                    <span className="block h-10 w-[60px] rounded-md bg-bg-alt" aria-hidden />
                  )}
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/blogs/${p.id}/edit`} className="font-semibold text-ink hover:text-primary">{p.title}</Link>
                  <p className="text-xs text-muted">/blogs/{p.slug}</p>
                  <LinkBadge report={p.report} />
                </td>
                <td className="px-4 py-3">{p.author}</td>
                <td className="px-4 py-3">
                  <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", STATUS_STYLE[p.status])}>{STATUS_LABEL[p.status]}</span>
                </td>
                <td className="px-4 py-3">{p.published_at ? ist(p.published_at, p.status === "scheduled") : "—"}</td>
                <td className="px-4 py-3">{ist(p.updated_at, true)}</td>
                <td className={cn("px-4 py-3 font-semibold", p.links >= 100 ? "text-[#21603a]" : "text-ink")}>{p.links}</td>
                <td className="px-4 py-3">
                  <PostRowActions id={p.id} slug={p.slug} title={p.title} status={p.status} trashed={trash} />
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr><td colSpan={8} className="px-4 py-10 text-center">{trash ? "The Trash is empty." : q || statusFilter !== "all" ? "No posts match." : "No posts yet — write the first one."}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

/** Weekly link-check result: red when links are broken, amber when sites refused the bot. */
function LinkBadge({ report }: { report: LinkReport | null }) {
  if (!report) return null;
  const when = new Date(report.checkedAt).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });
  if (!report.broken.length && !report.blocked.length) {
    return <p className="mt-1 text-xs text-[#21603a]">All {report.ok} links OK · checked {when}</p>;
  }
  return (
    <details className="mt-1 text-xs">
      <summary className="cursor-pointer">
        {report.broken.length > 0 && <span className="rounded-full bg-primary px-2 py-0.5 font-semibold text-white">{report.broken.length} broken link{report.broken.length === 1 ? "" : "s"}</span>}{" "}
        {report.blocked.length > 0 && <span className="rounded-full bg-accent-soft px-2 py-0.5 font-semibold text-accent-ink">{report.blocked.length} to check by hand</span>}
        <span className="text-muted"> · checked {when}</span>
      </summary>
      <ul className="mt-1 space-y-0.5 break-all text-muted">
        {[...report.broken, ...report.blocked].map((r) => (
          <li key={r.url}>{r.code ?? "—"} {r.url}{r.note ? ` (${r.note})` : ""}</li>
        ))}
      </ul>
    </details>
  );
}
