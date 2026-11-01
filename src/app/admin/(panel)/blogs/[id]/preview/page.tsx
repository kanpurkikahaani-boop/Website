import { notFound, redirect } from "next/navigation";
import { createPreviewToken } from "@/lib/admin/preview-token";
import { getPostForAdmin } from "@/lib/posts-admin";

export const metadata = { title: "Preview" };

/** Issues a 1-hour signed preview link and opens the post in the real public template. */
export default async function PreviewRedirect({ params }: PageProps<"/admin/blogs/[id]/preview">) {
  const { id } = await params;
  const p = await getPostForAdmin(id);
  if (!p) notFound();
  const token = createPreviewToken(p.id);
  if (!token) {
    return (
      <p role="alert" className="mx-auto max-w-xl rounded-xl bg-primary-soft px-5 py-4 text-primary">
        Preview isn&apos;t set up yet: add a <code>PREVIEW_SECRET</code> environment variable in Vercel (any random 32+ characters, see SETUP.md) and redeploy.
      </p>
    );
  }
  redirect(`/blogs/${p.slug}?preview=${encodeURIComponent(token)}`);
}
