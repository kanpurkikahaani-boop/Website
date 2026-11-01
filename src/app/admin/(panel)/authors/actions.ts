"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";

const schema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(2, "Enter the writer's name").max(120),
  bio: z.string().trim().max(600).default(""),
  // Uploaded photos are https:// Storage URLs; team photos live on the site under /images/team/.
  avatarUrl: z.union([z.literal(""), z.string().url().startsWith("https://"), z.string().regex(/^\/images\/[a-z0-9/_-]+\.(jpg|jpeg|png|webp)$/)]).default(""),
  title: z.string().trim().max(120).default(""),
  website: z.union([z.literal(""), z.string().url().startsWith("https://", "Use an https:// link")]).default(""),
  instagram: z.string().trim().max(60).regex(/^@?[A-Za-z0-9._]*$/, "Just the handle, e.g. @kanpurkikahaani").default(""),
});

export async function updateAuthor(input: z.input<typeof schema>): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the fields" };
  const a = parsed.data;
  const db = await createSessionClient();
  if (!db) return { ok: false, error: "Supabase is not configured" };
  const { data, error } = await db
    .from("authors")
    .update({ name: a.name, bio: a.bio, avatar_url: a.avatarUrl || null, website: a.website || null, instagram: a.instagram.replace(/^@/, "") || null, ...(a.title ? { title: a.title } : {}) })
    .eq("id", a.id)
    .select("slug")
    .single();
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/blogs/author/${data.slug}`);
  revalidatePath("/blogs/[slug]", "page");
  revalidatePath("/admin/authors");
  return { ok: true };
}

/** Only writers with no posts can be removed (so no byline silently changes). */
export async function deleteAuthor(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  const db = await createSessionClient();
  if (!db) return { ok: false, error: "Supabase is not configured" };
  const { count } = await db.from("posts").select("id", { count: "exact", head: true }).eq("author_id", id);
  if (count) return { ok: false, error: `This writer has ${count} post${count === 1 ? "" : "s"}. Change their byline first.` };
  const { error } = await db.from("authors").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/authors");
  return { ok: true };
}
