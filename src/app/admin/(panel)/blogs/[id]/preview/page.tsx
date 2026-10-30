import { notFound } from "next/navigation";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { cityName } from "@/lib/city-names";
import { getPostForAdmin } from "@/lib/posts-admin";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Preview" };

/** Admin-only preview of a draft or published post, styled like the public article. */
export default async function PreviewPage({ params }: PageProps<"/admin/blogs/[id]/preview">) {
  const { id } = await params;
  const p = await getPostForAdmin(id);
  if (!p) notFound();
  const date = (p.published_at ?? p.updated_at).slice(0, 10);
  return (
    <article className="mx-auto max-w-3xl">
      <p className="mb-6 rounded-xl bg-accent-soft px-4 py-3 text-sm text-ink">
        Preview — {p.status === "published" ? "this post is live" : "this draft is not visible to the public"}.
      </p>
      <p className="eyebrow">Stories{p.city ? ` · ${cityName(p.city)}` : ""}</p>
      <h1 className="mt-2 text-[34px] font-bold leading-tight text-ink md:text-[48px]">{p.title}</h1>
      <p className="mt-3 text-sm">By {p.author} · {formatDate(date)} · {p.reading_minutes} min read</p>
      {p.cover_url && (
        <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-3xl">
          <ImageWithFallback src={p.cover_url} alt={p.cover_alt ?? ""} label={p.title} fill sizes="720px" className="object-cover" />
        </div>
      )}
      {/* content_html was sanitized on the server when the post was saved */}
      <div className="prose-kkk mt-8" dangerouslySetInnerHTML={{ __html: p.content_html }} />
    </article>
  );
}
