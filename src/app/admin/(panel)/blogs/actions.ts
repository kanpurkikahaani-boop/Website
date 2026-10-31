"use server";

import type { JSONContent } from "@tiptap/core";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { renderPostContent } from "@/lib/content/render";
import { postInputSchema, type PostInput } from "@/lib/posts-admin-schema";
import { createSessionClient } from "@/lib/supabase/server";

export type ActionResult = { ok: true; id: string; slug: string } | { ok: false; error: string };

function revalidatePost(slug?: string) {
  revalidatePath("/blogs");
  revalidatePath("/");
  revalidatePath("/sitemap.xml");
  revalidatePath("/blogs/rss.xml");
  revalidatePath("/blogs/author/[slug]", "page");
  revalidatePath("/celebrations");
  if (slug) revalidatePath(`/blogs/${slug}`);
}

/**
 * Create or update a post. Layer 2 (requireAdmin) + layer 3 (the session client means
 * Supabase RLS checks is_admin() again in the database).
 */
export async function savePost(input: PostInput): Promise<ActionResult> {
  await requireAdmin();
  const parsed = postInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid post" };
  const p = parsed.data;
  const db = await createSessionClient();
  if (!db) return { ok: false, error: "Supabase is not configured" };

  const { html, minutes } = renderPostContent(p.contentJson as JSONContent);
  const publishedAt = p.status === "published" ? p.publishedAt ?? new Date().toISOString() : p.publishedAt;
  const row = {
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    content_json: p.contentJson,
    content_html: html,
    cover_url: p.coverUrl,
    cover_alt: p.coverAlt,
    city: p.city,
    tags: p.tags,
    seo_title: p.seoTitle,
    seo_description: p.seoDescription,
    status: p.status,
    published_at: publishedAt,
    reading_minutes: minutes,
    author_id: p.authorId,
    category: p.category,
    standfirst: p.standfirst,
    title_emphasis: p.titleEmphasis,
    pull_quote: p.pullQuote,
    cover_caption: p.coverCaption,
    cover_credit: p.coverCredit,
    key_facts: p.keyFacts,
    further_reading: p.furtherReading,
    glossary: p.glossary,
    plan_visit: p.planVisit,
  };

  let previousSlug: string | undefined;
  if (p.id) {
    const { data: prev } = await db.from("posts").select("slug").eq("id", p.id).maybeSingle();
    previousSlug = prev?.slug;
  }
  const res = p.id
    ? await db.from("posts").update(row).eq("id", p.id).select("id, slug").single()
    : await db.from("posts").insert(row).select("id, slug").single();

  if (res.error) {
    if (res.error.code === "23505") return { ok: false, error: "That slug is already used by another post." };
    return { ok: false, error: res.error.message };
  }
  revalidatePost(res.data.slug);
  if (previousSlug && previousSlug !== res.data.slug) revalidatePath(`/blogs/${previousSlug}`);
  return { ok: true, id: res.data.id, slug: res.data.slug };
}

export async function setPostStatus(id: string, status: "draft" | "published"): Promise<ActionResult> {
  await requireAdmin();
  const db = await createSessionClient();
  if (!db) return { ok: false, error: "Supabase is not configured" };
  const { data: current } = await db.from("posts").select("published_at").eq("id", id).maybeSingle();
  const patch =
    status === "published" ? { status, published_at: current?.published_at ?? new Date().toISOString() } : { status };
  const { data, error } = await db.from("posts").update(patch).eq("id", id).select("id, slug").single();
  if (error) return { ok: false, error: error.message };
  revalidatePost(data.slug);
  return { ok: true, id: data.id, slug: data.slug };
}

export async function deletePost(id: string): Promise<ActionResult> {
  await requireAdmin();
  const db = await createSessionClient();
  if (!db) return { ok: false, error: "Supabase is not configured" };
  const { data, error } = await db.from("posts").delete().eq("id", id).select("id, slug").single();
  if (error) return { ok: false, error: error.message };
  revalidatePost(data.slug);
  return { ok: true, id: data.id, slug: data.slug };
}

/** Is this slug free (ignoring the post being edited)? */
export async function isSlugAvailable(slug: string, exceptId?: string) {
  await requireAdmin();
  const db = await createSessionClient();
  if (!db) return true;
  let q = db.from("posts").select("id").eq("slug", slug);
  if (exceptId) q = q.neq("id", exceptId);
  const { data } = await q;
  return !data?.length;
}

/** Add a writer (admin-only; RLS enforces it again in the database). */
export async function createAuthor(input: { name: string; bio?: string }): Promise<{ ok: true; id: string; slug: string; name: string } | { ok: false; error: string }> {
  await requireAdmin();
  const name = input.name.trim();
  if (name.length < 2 || name.length > 120) return { ok: false, error: "Enter the writer's name" };
  const slug = name.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const db = await createSessionClient();
  if (!db) return { ok: false, error: "Supabase is not configured" };
  const { data, error } = await db.from("authors").insert({ name, slug, bio: (input.bio ?? "").trim().slice(0, 600) }).select("id, slug, name").single();
  if (error) return { ok: false, error: error.code === "23505" ? "A writer with that name already exists" : error.message };
  return { ok: true, id: data.id, slug: data.slug, name: data.name };
}
