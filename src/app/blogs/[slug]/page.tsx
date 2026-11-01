import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { tagLabel } from "@/components/blog/ArticleSections";
import { ArticleView } from "@/components/blog/ArticleView";
import { absoluteUrl } from "@/data/site";
import { categoryName } from "@/lib/blog-categories";
import { getAdjacentPosts, getAllPublished, getPostBySlug, getRedirectSlug, getRelatedPosts } from "@/lib/posts";
import { buildMetadata } from "@/lib/seo";

// ISR: prebuilt at deploy, refreshed on publish via revalidatePath, and every 5 minutes at most.
export const revalidate = 300;

export async function generateStaticParams() {
  return (await getAllPublished()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/blogs/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Story not found", robots: { index: false } };
  const meta = buildMetadata({
    title: post.seoTitle || `${post.title} | Kanpur Ki Kahaani`,
    description: post.seoDescription || post.excerpt,
    path: `/blogs/${post.slug}`,
    ogImage: `/blogs/${post.slug}/opengraph-image`,
    type: "article",
    publishedTime: post.publishedAt,
  });
  return {
    ...meta,
    authors: [{ name: post.author, url: post.authorInfo ? absoluteUrl(`/blogs/author/${post.authorInfo.slug}`) : undefined }],
    keywords: post.tags.map(tagLabel),
    openGraph: {
      ...meta.openGraph,
      type: "article",
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [post.authorInfo ? absoluteUrl(`/blogs/author/${post.authorInfo.slug}`) : post.author],
      section: categoryName(post.category) || undefined,
      tags: post.tags.map(tagLabel),
    },
  };
}

export default async function BlogPostPage({ params }: PageProps<"/blogs/[slug]">) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) {
    // Renamed posts: the old URL answers with a permanent redirect to the current one.
    const moved = await getRedirectSlug(slug);
    if (moved) permanentRedirect(`/blogs/${moved}`);
    notFound();
  }
  const [related, adjacent] = await Promise.all([getRelatedPosts(post, 3), getAdjacentPosts(post)]);
  return <ArticleView post={post} related={related} adjacent={adjacent} />;
}
