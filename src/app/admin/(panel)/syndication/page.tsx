import Link from "next/link";
import { CheckCircle2, CircleDashed } from "lucide-react";
import { PostSyndicationBlock } from "@/components/admin/SyndicationTools";
import { createSessionClient } from "@/lib/supabase/server";
import { isConfigured, MANUAL_ONLY, PLATFORMS } from "@/lib/syndication/platforms";
import type { SyndicationEntry } from "./actions";

export const metadata = { title: "Syndication" };

/**
 * Admin-only syndication tracker (v10): for every published post, where copies of it live, with
 * links; plus copies added by hand. Platform set-up status shows env var NAMES only.
 */
export default async function SyndicationPage() {
  const db = await createSessionClient();
  const [{ data: posts }, { data: rows, error }] = await Promise.all([
    db!.from("posts").select("id, slug, title, published_at").eq("status", "published").is("deleted_at", null).order("published_at", { ascending: false }),
    db!.from("post_syndications").select("*").order("published_at", { ascending: false }),
  ]);
  const byPost = new Map<string, SyndicationEntry[]>();
  for (const r of rows ?? []) {
    const e: SyndicationEntry = { id: r.id, postId: r.post_id, platform: r.platform, externalUrl: r.external_url, status: r.status, error: r.error, publishedAt: r.published_at, createdBy: r.created_by };
    byPost.set(e.postId, [...(byPost.get(e.postId) ?? []), e]);
  }
  const copies = (rows ?? []).filter((r) => r.status !== "failed").length;

  return (
    <>
      <p className="eyebrow">Admin</p>
      <h1 className="mt-1 text-[32px] font-bold text-primary">Syndication</h1>
      <p className="mt-1 max-w-[720px] text-sm">
        Where each story has been republished. Cross-post from a post&apos;s editor (<em>Syndicate</em> in the sidebar), or add a link here for copies you posted by hand. Every copy should start with
        “Originally published on Kanpur Ki Kahaani” linking back to the story.
      </p>
      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-primary-soft px-3 py-2 text-sm text-primary">
          The tracker table isn&apos;t there yet — run <code>supabase/migrations/0010_views_and_syndication.sql</code> in Supabase (SETUP.md → v10).
        </p>
      )}

      <section aria-labelledby="platforms-title" className="mt-8 rounded-2xl border border-border bg-surface p-5">
        <h2 id="platforms-title" className="text-lg font-bold text-ink">Platforms</h2>
        <ul className="mt-3 grid gap-2 md:grid-cols-2">
          {PLATFORMS.map((p) => {
            const ok = isConfigured(p);
            return (
              <li key={p.id} className="flex gap-2 text-sm">
                {ok ? <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-[#21603a]" aria-hidden /> : <CircleDashed size={17} className="mt-0.5 shrink-0 text-muted" aria-hidden />}
                <span>
                  <strong className="text-ink">{p.name}</strong> — {ok ? "ready" : <>not set up (needs <code className="text-xs">{p.env.join(", ")}</code>)</>}
                  <span className="block text-xs text-muted">{p.note}</span>
                </span>
              </li>
            );
          })}
          {MANUAL_ONLY.map((m) => (
            <li key={m.name} className="flex gap-2 text-sm">
              <CircleDashed size={17} className="mt-0.5 shrink-0 text-muted" aria-hidden />
              <span>
                <strong className="text-ink">{m.name}</strong> — by hand
                <span className="block text-xs text-muted">{m.note}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-8 text-sm">
        {posts?.length ?? 0} published {posts?.length === 1 ? "story" : "stories"} · {copies} {copies === 1 ? "copy" : "copies"} elsewhere
      </p>
      <ul className="mt-3 space-y-4">
        {(posts ?? []).map((p) => (
          <li key={p.id} data-testid="syndication-post" className="rounded-2xl border border-border bg-white p-5">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-base font-bold text-ink">
                <Link href={`/blogs/${p.slug}`} target="_blank" className="hover:text-primary">{p.title}</Link>
              </h2>
              <Link href={`/admin/blogs/${p.id}/edit`} className="text-xs font-semibold text-primary hover:underline">Open in editor →</Link>
            </div>
            <PostSyndicationBlock postId={p.id} initial={byPost.get(p.id) ?? []} />
          </li>
        ))}
        {!posts?.length && <li className="rounded-2xl border border-dashed border-border p-8 text-center text-sm">No published stories yet.</li>}
      </ul>
    </>
  );
}
