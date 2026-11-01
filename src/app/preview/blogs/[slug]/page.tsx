import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleView } from "@/components/blog/ArticleView";
import { displayStatus } from "@/lib/admin/post-status";
import { verifyPreviewToken } from "@/lib/admin/preview-token";
import { getAdminUser } from "@/lib/auth";
import { getPostForPreview } from "@/lib/posts-admin";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Preview", robots: { index: false, follow: false, nocache: true } };

/**
 * Reached only through the proxy rewrite of /blogs/[slug]?preview=<token>. Needs BOTH a valid,
 * unexpired token AND the signed-in admin; anything else is a plain 404.
 */
export default async function PreviewPage({ searchParams }: PageProps<"/preview/blogs/[slug]">) {
  const sp = await searchParams;
  const postId = verifyPreviewToken(typeof sp.preview === "string" ? sp.preview : null);
  if (!postId || !(await getAdminUser())) notFound();
  const found = await getPostForPreview(postId);
  if (!found) notFound();
  const status = displayStatus(found.status, found.post.publishedAt);
  return <ArticleView post={found.post} related={[]} adjacent={{ newer: null, older: null }} preview={status} />;
}
