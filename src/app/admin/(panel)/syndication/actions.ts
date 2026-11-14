"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { absoluteUrl, site } from "@/data/site";
import { audit } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/auth";
import { getPostForPreview } from "@/lib/posts-admin";
import { createSessionClient } from "@/lib/supabase/server";
import type { SyndicationPost } from "@/lib/syndication/format";
import { isConfigured, platformById, PLATFORMS, publishTo, type PlatformId } from "@/lib/syndication/platforms";

export interface PlatformInfo {
  id: PlatformId;
  name: string;
  configured: boolean;
  canonical: boolean;
  drafts: boolean;
  note: string;
  /** Env var names to add (never values). */
  env: string[];
}

export interface SyndicationEntry {
  id: string;
  postId: string;
  platform: string;
  externalUrl: string | null;
  status: "published" | "draft" | "failed" | "manual";
  error: string | null;
  publishedAt: string;
  createdBy: string | null;
}

export type CrossPostOutcome = { platform: string; ok: boolean; url: string | null; error?: string; status?: string };

const toEntry = (r: Record<string, unknown>): SyndicationEntry => ({
  id: String(r.id),
  postId: String(r.post_id),
  platform: String(r.platform),
  externalUrl: (r.external_url as string) ?? null,
  status: r.status as SyndicationEntry["status"],
  error: (r.error as string) ?? null,
  publishedAt: String(r.published_at),
  createdBy: (r.created_by as string) ?? null,
});

/** Which platforms are set up (env vars present) — names and notes only, never keys. */
export async function listPlatforms(): Promise<PlatformInfo[]> {
  await requireAdmin();
  return PLATFORMS.map((p) => ({ id: p.id, name: p.name, configured: isConfigured(p), canonical: p.canonical, drafts: p.drafts, note: p.note, env: p.env }));
}

export async function listSyndications(postId: string): Promise<SyndicationEntry[]> {
  await requireAdmin();
  const db = await createSessionClient();
  if (!db) return [];
  const { data } = await db.from("post_syndications").select("*").eq("post_id", postId).order("published_at", { ascending: false });
  return (data ?? []).map(toEntry);
}

/**
 * Cross-post a live post to the chosen platforms. Runs on the server with keys from env; each
 * attempt (success or failure) is saved in the tracker.
 */
export async function crossPost(postId: string, platformIds: string[], draft: boolean): Promise<{ ok: true; results: CrossPostOutcome[] } | { ok: false; error: string }> {
  const user = await requireAdmin();
  const db = await createSessionClient();
  if (!db) return { ok: false, error: "Supabase is not configured" };
  const found = await getPostForPreview(postId);
  if (!found) return { ok: false, error: "Post not found" };
  const { post, status } = found;
  if (status !== "published" || Date.parse(post.publishedAt) > Date.now()) return { ok: false, error: "Publish the post on our site first — copies must link back to a live page." };
  const chosen = [...new Set(platformIds)].map(platformById).filter((p) => p !== undefined);
  if (!chosen.length) return { ok: false, error: "Choose at least one platform." };

  const payload: SyndicationPost = {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt || post.seoDescription || "",
    html: post.html,
    coverUrl: post.coverUrl?.startsWith("https://") ? post.coverUrl : null,
    coverAlt: post.coverAlt,
    tags: post.tags,
    canonicalUrl: absoluteUrl(`/blogs/${post.slug}`),
    siteName: site.name,
    siteUrl: absoluteUrl("/").replace(/\/$/, ""),
  };

  const results: CrossPostOutcome[] = [];
  for (const p of chosen) {
    if (!isConfigured(p)) {
      results.push({ platform: p.name, ok: false, url: null, error: `Not set up — add ${p.env.join(", ")} in Vercel.` });
      continue;
    }
    const r = await publishTo(p, payload, draft);
    const row: Record<string, string | null | undefined> = r.ok
      ? { post_id: postId, platform: p.name, external_url: r.result.url?.startsWith("https://") ? r.result.url : null, external_id: r.result.externalId, status: r.result.status, created_by: user.email }
      : { post_id: postId, platform: p.name, status: "failed", error: r.error, created_by: user.email };
    const { error } = await db.from("post_syndications").insert(row);
    if (error) console.error("[syndication] tracker insert failed:", error.message);
    results.push(r.ok ? { platform: p.name, ok: true, url: r.result.url, status: r.result.status } : { platform: p.name, ok: false, url: null, error: r.error });
  }
  await audit("syndicate", user.email!, { postId, detail: results.map((r) => `${r.platform}: ${r.ok ? r.status : "failed"}`).join(", ") });
  revalidatePath("/admin/syndication");
  return { ok: true, results };
}

const manualSchema = z.object({
  postId: z.string().uuid(),
  platform: z.string().trim().min(1, "Name the site").max(40),
  url: z.string().trim().url("Paste the full link").refine((u) => u.startsWith("https://"), "Use an https:// link"),
  publishedAt: z.string().trim().optional(),
});

/** For copies posted by hand (LinkedIn, Medium import, Substack, Quora…). */
export async function addManualSyndication(input: z.input<typeof manualSchema>): Promise<{ ok: true; entry: SyndicationEntry } | { ok: false; error: string }> {
  const user = await requireAdmin();
  const parsed = manualSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form" };
  const { postId, platform, url, publishedAt } = parsed.data;
  const when = publishedAt && !Number.isNaN(Date.parse(publishedAt)) ? new Date(publishedAt).toISOString() : new Date().toISOString();
  const db = await createSessionClient();
  if (!db) return { ok: false, error: "Supabase is not configured" };
  const { data, error } = await db.from("post_syndications").insert({ post_id: postId, platform, external_url: url, status: "manual", published_at: when, created_by: user.email }).select("*").single();
  if (error || !data) return { ok: false, error: error?.message ?? "Couldn't save" };
  revalidatePath("/admin/syndication");
  return { ok: true, entry: toEntry(data) };
}

export async function deleteSyndication(id: string): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: "Invalid id" };
  const db = await createSessionClient();
  if (!db) return { ok: false, error: "Supabase is not configured" };
  const { error } = await db.from("post_syndications").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/syndication");
  return { ok: true };
}
