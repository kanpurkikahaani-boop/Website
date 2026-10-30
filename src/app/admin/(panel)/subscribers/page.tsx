import Link from "next/link";
import { Download } from "lucide-react";
import { createSessionClient } from "@/lib/supabase/server";

export const metadata = { title: "Subscribers" };
const PER_PAGE = 50;

export default async function SubscribersPage({ searchParams }: PageProps<"/admin/subscribers">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const page = Math.max(1, Number(sp.page) || 1);
  const db = await createSessionClient();

  let query = db!
    .from("subscribers")
    .select("email, cities, source, created_at, unsubscribed_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * PER_PAGE, page * PER_PAGE - 1);
  if (q) query = query.ilike("email", `%${q.replace(/[%_]/g, "")}%`);
  const { data, count, error } = await query;
  const pages = Math.max(1, Math.ceil((count ?? 0) / PER_PAGE));

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Admin</p>
          <h1 className="mt-1 text-[32px] font-bold text-primary">Subscribers</h1>
          <p className="text-sm">{count ?? 0} total{q ? ` matching “${q}”` : ""}</p>
        </div>
        <a href={`/admin/subscribers/export${q ? `?q=${encodeURIComponent(q)}` : ""}`} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover">
          <Download size={16} aria-hidden /> Export CSV
        </a>
      </div>
      <form className="mt-6 flex max-w-md gap-2" role="search">
        <label htmlFor="sub-q" className="sr-only">Search by email</label>
        <input id="sub-q" name="q" defaultValue={q} placeholder="Search by email" className="h-11 flex-1 rounded-full border border-border bg-white px-4 text-sm text-ink focus:border-primary focus:outline-none" />
        <button className="rounded-full border border-border bg-white px-5 text-sm font-semibold text-ink hover:border-primary">Search</button>
      </form>
      {error && <p role="alert" className="mt-6 text-primary">Couldn&apos;t load subscribers: {error.message}</p>}
      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-dark text-[11px] uppercase tracking-[0.16em] text-accent">
            <tr>
              {["Email", "Cities", "Source", "Joined", "Status"].map((h) => (
                <th key={h} scope="col" className="px-4 py-3 font-bold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((s) => (
              <tr key={s.email} className="border-t border-border">
                <td className="px-4 py-3 font-medium text-ink">{s.email}</td>
                <td className="px-4 py-3">{s.cities?.join(", ") || "—"}</td>
                <td className="px-4 py-3">{s.source}</td>
                <td className="px-4 py-3">{new Date(s.created_at).toLocaleDateString("en-IN")}</td>
                <td className="px-4 py-3">{s.unsubscribed_at ? "Unsubscribed" : "Active"}</td>
              </tr>
            ))}
            {!data?.length && (
              <tr><td colSpan={5} className="px-4 py-8 text-center">No subscribers yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <nav aria-label="Pagination" className="mt-6 flex gap-2 text-sm">
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <Link key={n} href={`?${new URLSearchParams({ ...(q ? { q } : {}), page: String(n) })}`} aria-current={n === page ? "page" : undefined}
              className={n === page ? "rounded-full bg-primary px-3 py-1 text-white" : "rounded-full border border-border px-3 py-1"}>
              {n}
            </Link>
          ))}
        </nav>
      )}
    </>
  );
}
