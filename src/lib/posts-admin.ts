import "server-only";
import { blogsLink, homeLink, navGroups, playlistLink } from "@/data/nav";
import { createSessionClient } from "@/lib/supabase/server";

/** Fetch any post (draft or published) as the signed-in admin. RLS hides drafts from everyone else. */
export async function getPostForAdmin(id: string) {
  const db = await createSessionClient();
  if (!db) return null;
  const { data } = await db.from("posts").select("*").eq("id", id).maybeSingle();
  return data;
}

/** Author choices for the editor's byline select. */
export async function getAuthorOptions(): Promise<{ id: string; name: string }[]> {
  const db = await createSessionClient();
  if (!db) return [];
  const { data } = await db.from("authors").select("id, name").order("name");
  return (data ?? []) as { id: string; name: string }[];
}

/** ISO →"YYYY-MM-DDTHH:mm" in IST for <input type="datetime-local"> */
export function isoToIstLocal(iso: string | null) {
  if (!iso) return "";
  const d = new Date(new Date(iso).getTime() + 5.5 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 16);
}

/** Internal pages for the editor's link autocomplete: navigation + every post (any status). */
export async function getSiteRoutes(): Promise<{ href: string; label: string }[]> {
  const base = [homeLink, blogsLink, playlistLink, ...navGroups.flatMap((g) => g.items), { label: "Privacy", href: "/privacy" }];
  const db = await createSessionClient();
  const { data } = db ? await db.from("posts").select("slug, title").is("deleted_at", null).order("updated_at", { ascending: false }).limit(200) : { data: [] };
  const posts = (data ?? []).map((p) => ({ href: `/blogs/${p.slug}`, label: `Story: ${p.title}` }));
  const seen = new Set<string>();
  return [...base, ...posts].filter((r) => !seen.has(r.href) && seen.add(r.href));
}
