import { PostEditor } from "@/components/admin/PostEditor";
import { EMPTY_RICH_FIELDS } from "@/lib/admin/editor-defaults";
import { getAuthorOptions, getSiteRoutes } from "@/lib/posts-admin";

export const metadata = { title: "New post" };

export default async function NewPostPage() {
  const [authors, routes] = await Promise.all([getAuthorOptions(), getSiteRoutes()]);
  return (
    <>
      <p className="eyebrow">Blogs</p>
      <h1 className="mb-8 mt-1 text-[32px] font-bold text-primary">New post</h1>
      <PostEditor
        authors={authors}
        routes={routes}
        initial={{
          title: "",
          slug: "",
          excerpt: "",
          contentJson: null,
          coverUrl: "",
          coverAlt: "",
          city: "",
          tags: [],
          seoTitle: "",
          seoDescription: "",
          status: "draft",
          publishedAt: "",
          ...EMPTY_RICH_FIELDS,
        }}
      />
    </>
  );
}
