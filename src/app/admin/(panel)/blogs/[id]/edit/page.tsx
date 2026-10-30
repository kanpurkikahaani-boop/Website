import { notFound } from "next/navigation";
import { PostEditor } from "@/components/admin/PostEditor";
import { getPostForAdmin, isoToIstLocal } from "@/lib/posts-admin";

export const metadata = { title: "Edit post" };

export default async function EditPostPage({ params }: PageProps<"/admin/blogs/[id]/edit">) {
  const { id } = await params;
  const p = await getPostForAdmin(id);
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
        }}
      />
    </>
  );
}
