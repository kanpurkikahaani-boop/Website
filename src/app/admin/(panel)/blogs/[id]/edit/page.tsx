import { notFound } from "next/navigation";
import { PostEditor } from "@/components/admin/PostEditor";
import { getAuthorOptions, getPostForAdmin, getSiteRoutes, isoToIstLocal } from "@/lib/posts-admin";

export const metadata = { title: "Edit post" };

export default async function EditPostPage({ params }: PageProps<"/admin/blogs/[id]/edit">) {
  const { id } = await params;
  const [p, authors, routes] = await Promise.all([getPostForAdmin(id), getAuthorOptions(), getSiteRoutes()]);
  if (!p) notFound();
  return (
    <>
      <p className="eyebrow">Blogs</p>
      <h1 className="mb-8 mt-1 text-[32px] font-bold text-primary">Edit post</h1>
      <PostEditor
        key={p.id}
        initial={{
          id: p.id,
          title: p.title,
          slug: p.slug,
          excerpt: p.excerpt ?? "",
          contentJson: p.content_json,
          coverUrl: p.cover_url ?? "",
          coverAlt: p.cover_alt ?? "",
          city: p.city ?? "",
          tags: p.tags ?? [],
          seoTitle: p.seo_title ?? "",
          seoDescription: p.seo_description ?? "",
          status: p.status,
          publishedAt: isoToIstLocal(p.published_at),
          authorId: p.author_id ?? "",
          category: p.category ?? "",
          standfirst: p.standfirst ?? "",
          titleEmphasis: p.title_emphasis ?? "",
          pullQuote: p.pull_quote ?? "",
          coverCaption: p.cover_caption ?? "",
          coverCredit: p.cover_credit ?? "",
          coverFocal: p.cover_focal ?? "",
          keyFacts: p.key_facts ?? [],
          furtherReading: p.further_reading ?? [],
          glossary: p.glossary ?? [],
          planVisit: p.plan_visit ?? [],
        }}
        authors={authors}
        routes={routes}
      />
    </>
  );
}
