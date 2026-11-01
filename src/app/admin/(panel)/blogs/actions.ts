"use server";

import type { JSONContent } from "@tiptap/core";
import { revalidatePath } from "next/cache";
import { audit } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/auth";
import { renderPostContent } from "@/lib/content/render";
import { postInputSchema, type PostInput } from "@/lib/posts-admin-schema";
import { createSessionClient } from "@/lib/supabase/server";

export type ActionResult = { ok: true; id: string; slug: string } | { ok: false; error: string };

const KEEP_REVISIONS = 50;
const NOT_CONFIGURED = { ok: false as const, error: "Supabase is not configured" };

function revalidatePost(slug?: string, authorSlug?: string | null) {
  revalidatePath("/blogs");
  revalidatePath("/");
  revalidatePath("/sitemap.xml");
  revalidatePath("/blogs/rss.xml");
  revalidatePath("/blogs/author/[slug]", "page");
  if (authorSlug) revalidatePath(`/blogs/author/${authorSlug}`);
  revalidatePath("/celebrations");
  if (slug) revalidatePath(`/blogs/${slug}`);
}

const isFuture = (iso: string | null | undefined) => Boolean(iso && Date.parse(iso) > Date.now());

/** Keep the newest KEEP_REVISIONS revisions of a post. */
async function pruneRevisions(db: NonNullable<Awaited<ReturnType<typeof createSessionClient>>>, postId: string) {
  const { data } = await db.from("post_revisions").select("id").eq("post_id", postId).order("saved_at", { ascending: false }).range(KEEP_REVISIONS, KEEP_REVISIONS + 200);
  if (data?.length) await db.from("post_revisions").delete().in("id", data.map((r) => r.id));
}

/**
 * Create or update a post. Layer 2 (requireAdmin) + layer 3 (the session client means Supabase RLS
 * checks is_admin() again in the database). Content changes write a revision; a changed slug on a
 * post that has been published leaves a 301 behind.
 */
export async function savePost(input: PostInput): Promise<ActionResult> {
  const user = await requireAdmin();
  const parsed = postInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid post" };
  const p = parsed.data;
  const db = await createSessionClient();
  if (!db) return NOT_CONFIGURED;

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
    cover_focal: p.coverFocal,
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

  let prev: { slug: string; title: string; content_json: unknown; status: string; published_at: string | null } | null = null;
  if (p.id) {
    const { data } = await db.from("posts").select("slug, title, content_json, status, published_at").eq("id", p.id).maybeSingle();
    prev = data;
  }
  const res = p.id
    ? await db.from("posts").update(row).eq("id", p.id).select("id, slug, authors(slug)").single()
    : await db.from("posts").insert(row).select("id, slug, authors(slug)").single();

  if (res.error) {
    if (res.error.code === "23505") return { ok: false, error: "That slug is already used by another post." };
    return { ok: false, error: res.error.message };
  }
  const id = res.data.id as string;
  const authorSlug = (Array.isArray(res.data.authors) ? res.data.authors[0] : res.data.authors)?.slug as string | undefined;

  // Revision history: only when the title or body actually changed.
  const contentChanged = !prev || prev.title !== p.title || JSON.stringify(prev.content_json) !== JSON.stringify(p.contentJson);
  if (contentChanged) {
    await db.from("post_revisions").insert({ post_id: id, title: p.title, content_json: p.contentJson, saved_by: user.email });
    await pruneRevisions(db, id);
  }

  // Slug changed after the post went public → 301 from the old URL.
  if (prev && prev.slug !== res.data.slug) {
    if (prev.published_at) await db.from("post_redirects").upsert({ old_slug: prev.slug, post_id: id });
    await db.from("post_redirects").delete().eq("old_slug", res.data.slug); // the new slug is live again
    revalidatePath(`/blogs/${prev.slug}`);
  }

  const action = !prev
    ? p.status === "published" ? (isFuture(publishedAt) ? "schedule" : "publish") : "create"
    : prev.status !== "published" && p.status === "published" ? (isFuture(publishedAt) ? "schedule" : "publish")
    : prev.status === "published" && p.status !== "published" ? "unpublish" : "update";
  // Autosaves of drafts are frequent; log them only when they change state.
  if (action !== "update" || contentChanged) await audit(action, user.email!, { postId: id, detail: p.title });

  revalidatePost(res.data.slug as string, authorSlug);
  return { ok: true, id, slug: res.data.slug as string };
}

export async function setPostStatus(id: string, status: "draft" | "published"): Promise<ActionResult> {
  const user = await requireAdmin();
  const db = await createSessionClient();
  if (!db) return NOT_CONFIGURED;
  const { data: current } = await db.from("posts").select("published_at").eq("id", id).maybeSingle();
  const publishedAt = current?.published_at ?? new Date().toISOString();
  const patch = status === "published" ? { status, published_at: publishedAt } : { status };
  const { data, error } = await db.from("posts").update(patch).eq("id", id).select("id, slug, title").single();
  if (error) return { ok: false, error: error.message };
  await audit(status === "draft" ? "unpublish" : isFuture(publishedAt) ? "schedule" : "publish", user.email!, { postId: id, detail: data.title });
  revalidatePost(data.slug);
  return { ok: true, id: data.id, slug: data.slug };
}

/** Delete = move to Trash (kept 30 days). The admin must type the post title to confirm. */
export async function trashPost(id: string, typedTitle: string): Promise<ActionResult> {
  const user = await requireAdmin();
  const db = await createSessionClient();
  if (!db) return NOT_CONFIGURED;
  const { data: post } = await db.from("posts").select("title").eq("id", id).maybeSingle();
  if (!post) return { ok: false, error: "Post not found." };
  if (typedTitle.trim() !== post.title.trim()) return { ok: false, error: "The title you typed doesn't match." };
  const { data, error } = await db.from("posts").update({ deleted_at: new Date().toISOString() }).eq("id", id).select("id, slug").single();
  if (error) return { ok: false, error: error.message };
  await audit("trash", user.email!, { postId: id, detail: post.title });
  revalidatePost(data.slug);
  return { ok: true, id: data.id, slug: data.slug };
}

export async function restorePost(id: string): Promise<ActionResult> {
  const user = await requireAdmin();
  const db = await createSessionClient();
  if (!db) return NOT_CONFIGURED;
  const { data, error } = await db.from("posts").update({ deleted_at: null }).eq("id", id).select("id, slug, title").single();
  if (error) return { ok: false, error: error.message };
  await audit("restore", user.email!, { postId: id, detail: data.title });
  revalidatePost(data.slug);
  return { ok: true, id: data.id, slug: data.slug };
}

/** Permanently delete a post that is already in the Trash. */
export async function purgePost(id: string): Promise<ActionResult> {
  const user = await requireAdmin();
  const db = await createSessionClient();
  if (!db) return NOT_CONFIGURED;
  const { data, error } = await db.from("posts").delete().eq("id", id).not("deleted_at", "is", null).select("id, slug, title").single();
  if (error) return { ok: false, error: "Only posts in the Trash can be deleted permanently." };
  await audit("purge", user.email!, { postId: id, detail: data.title });
  return { ok: true, id: data.id, slug: data.slug };
}

/** Copy a post as a new draft ("Copy of …", slug "…-copy[-n]"). */
export async function duplicatePost(id: string): Promise<ActionResult> {
  const user = await requireAdmin();
  const db = await createSessionClient();
  if (!db) return NOT_CONFIGURED;
  const { data: src } = await db.from("posts").select("*").eq("id", id).maybeSingle();
  if (!src) return { ok: false, error: "Post not found." };
  let slug = `${src.slug}-copy`.slice(0, 100);
  for (let n = 2; n < 50; n++) {
    const { data: taken } = await db.from("posts").select("id").eq("slug", slug).maybeSingle();
    if (!taken) break;
    slug = `${src.slug}-copy-${n}`.slice(0, 100);
  }
  const copy = { ...src };
  for (const k of ["id", "created_at", "updated_at", "deleted_at", "link_report", "links_checked_at"]) delete copy[k];
  const { data, error } = await db
    .from("posts")
    .insert({ ...copy, slug, title: `Copy of ${src.title}`.slice(0, 200), status: "draft", published_at: null })
    .select("id, slug")
    .single();
  if (error) return { ok: false, error: error.message };
  await audit("duplicate", user.email!, { postId: data.id, detail: `from ${src.title}` });
  return { ok: true, id: data.id, slug: data.slug };
}

export interface RevisionSummary {
  id: string;
  title: string;
  savedBy: string | null;
  savedAt: string;
}

export async function listRevisions(postId: string): Promise<RevisionSummary[]> {
  await requireAdmin();
  const db = await createSessionClient();
  if (!db) return [];
  const { data } = await db.from("post_revisions").select("id, title, saved_by, saved_at").eq("post_id", postId).order("saved_at", { ascending: false }).limit(KEEP_REVISIONS);
  return (data ?? []).map((r) => ({ id: r.id, title: r.title, savedBy: r.saved_by, savedAt: r.saved_at }));
}

/** Restore a revision's title + body into the post (the current version is saved as a revision first). */
export async function restoreRevision(postId: string, revisionId: string): Promise<ActionResult & { contentJson?: unknown; title?: string }> {
  const user = await requireAdmin();
  const db = await createSessionClient();
  if (!db) return NOT_CONFIGURED;
  const { data: rev } = await db.from("post_revisions").select("title, content_json").eq("id", revisionId).eq("post_id", postId).maybeSingle();
  if (!rev) return { ok: false, error: "Revision not found." };
  const { data: cur } = await db.from("posts").select("title, content_json").eq("id", postId).maybeSingle();
  if (cur) await db.from("post_revisions").insert({ post_id: postId, title: cur.title, content_json: cur.content_json, saved_by: user.email });
  const { html, minutes } = renderPostContent(rev.content_json as JSONContent);
  const { data, error } = await db
    .from("posts")
    .update({ title: rev.title, content_json: rev.content_json, content_html: html, reading_minutes: minutes })
    .eq("id", postId)
    .select("id, slug")
    .single();
  if (error) return { ok: false, error: error.message };
  await pruneRevisions(db, postId);
  await audit("revision_restore", user.email!, { postId, detail: rev.title });
  revalidatePost(data.slug);
  return { ok: true, id: data.id, slug: data.slug, contentJson: rev.content_json, title: rev.title };
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
  const slug = name.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const db = await createSessionClient();
  if (!db) return NOT_CONFIGURED;
  const { data, error } = await db.from("authors").insert({ name, slug, bio: (input.bio ?? "").trim().slice(0, 600) }).select("id, slug, name").single();
  if (error) return { ok: false, error: error.code === "23505" ? "A writer with that name already exists" : error.message };
  revalidatePath("/blogs/author/[slug]", "page");
  return { ok: true, id: data.id, slug: data.slug, name: data.name };
}
