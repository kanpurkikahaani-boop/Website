import Link from "next/link";
import { Plus } from "lucide-react";
import { createSessionClient } from "@/lib/supabase/server";
import { PostRowActions } from "@/components/admin/PostRowActions";

export const metadata = { title: "Blogs" };

export default async function AdminBlogsPage() {
  const db = await createSessionClient();
  const { data: posts, error } = await db!
    .from("posts")
    .select("id, slug, title, status, published_at, updated_at, city")
    .order("updated_at", { ascending: false });

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Admin</p>
          <h1 className="mt-1 text-[32px] font-bold text-primary">Blogs</h1>
        </div>
        <Link href="/admin/blogs/new" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover">
          <Plus size={16} aria-hidden /> New post
        </Link>
      </div>
      {error && <p role="alert" className="mt-6 text-primary">Couldn&apos;t load posts: {error.message}</p>}
      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-dark text-[11px] uppercase tracking-[0.16em] text-accent">
            <tr>
              {["Title", "Status", "Published", "Updated", ""].map((h, i) => (
                <th key={i} scope="col" className="px-4 py-3 font-bold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(posts ?? []).map((p) => (
              <tr key={p.id} className="border-t border-border align-middle">
                <td className="px-4 py-3">
                  <Link href={`/admin/blogs/${p.id}/edit`} className="font-semibold text-ink hover:text-primary">{p.title}</Link>
                  <p className="text-xs text-muted">/blogs/{p.slug}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={p.status === "published" ? "rounded-full bg-[#e3f1e6] px-2.5 py-1 text-xs font-semibold text-[#21603a]" : "rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent-ink"}>
                    {p.status === "published" ? "Published" : "Draft"}
                  </span>
                </td>
                <td className="px-4 py-3">{p.published_at ? new Date(p.published_at).toLocaleDateString("en-IN") : "—"}</td>
                <td className="px-4 py-3">{new Date(p.updated_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</td>
                <td className="px-4 py-3">
                  <PostRowActions id={p.id} slug={p.slug} title={p.title} status={p.status as "draft" | "published"} />
                </td>
              </tr>
            ))}
            {!posts?.length && (
              <tr><td colSpan={5} className="px-4 py-10 text-center">No posts yet — write the first one.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
