import "server-only";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/admin";

const DAY = 24 * 60 * 60 * 1000;

/**
 * Daily blog housekeeping (service role, cron only):
 *  1. Scheduled posts whose time arrived in the last ~day: refresh /, /blogs, the post, sitemap, RSS.
 *     (They're already visible — RLS shows a post once published_at <= now(); this just refreshes caches.)
 *  2. Posts in the Trash for more than 30 days are deleted for good (logged in admin_audit).
 */
export async function runBlogHousekeeping(now = Date.now()) {
  const db = createServiceClient();
  if (!db) return { skipped: true as const, reason: "SUPABASE_SERVICE_ROLE_KEY not set" };

  const { data: due, error } = await db
    .from("posts")
    .select("slug")
    .eq("status", "published")
    .is("deleted_at", null)
    .gt("published_at", new Date(now - 26 * 60 * 60 * 1000).toISOString())
    .lte("published_at", new Date(now).toISOString());
  if (error) return { skipped: true as const, reason: error.message };
  for (const p of due ?? []) revalidatePath(`/blogs/${p.slug}`);
  if (due?.length) {
    for (const path of ["/", "/blogs", "/sitemap.xml", "/blogs/rss.xml", "/celebrations"]) revalidatePath(path);
    revalidatePath("/blogs/author/[slug]", "page");
  }

  const { data: purged } = await db
    .from("posts")
    .delete()
    .lt("deleted_at", new Date(now - 30 * DAY).toISOString())
    .select("id, title");
  if (purged?.length) {
    await db.from("admin_audit").insert(purged.map((p) => ({ actor: "system (30-day Trash)", action: "purge", post_id: p.id, detail: p.title })));
  }
  return { skipped: false as const, published: (due ?? []).map((p) => p.slug), purged: (purged ?? []).length };
}
