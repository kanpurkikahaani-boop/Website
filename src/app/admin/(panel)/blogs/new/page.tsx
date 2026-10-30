import { PostEditor } from "@/components/admin/PostEditor";

export const metadata = { title: "New post" };

export default function NewPostPage() {
  return (
    <>
      <p className="eyebrow">Blogs</p>
      <h1 className="mb-8 mt-1 text-[32px] font-bold text-primary">New post</h1>
      <PostEditor
        initial={{ title: "", slug: "", excerpt: "", contentJson: null, coverUrl: "", coverAlt: "", city: "", tags: [], seoTitle: "", seoDescription: "", status: "draft", publishedAt: "" }}
      />
    </>
  );
}
