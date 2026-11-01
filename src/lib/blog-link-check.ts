import "server-only";
import { site } from "@/data/site";
import { checkPostLinks } from "@/lib/link-check";
import { createServiceClient } from "@/lib/supabase/admin";

/**
 * Weekly check of every link in published posts. Stores the result in posts.link_report
 * (shown as a badge on /admin/blogs). Never edits content. Oldest-checked posts go first and
 * the run stops at `budgetMs`, so a long backlog is spread over several runs.
 */
export async function runBlogLinkCheck(budgetMs = 45_000) {
  const db = createServiceClient();
  if (!db) return { skipped: true, reason: "SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY) not set", checked: [] as string[] };
  const started = Date.now();
  const { data, error } = await db
    .from("posts")
    .select("id, slug, content_html, plan_visit, glossary, further_reading, links_checked_at")
    .eq("status", "published")
    .order("links_checked_at", { ascending: true, nullsFirst: true });
  if (error) return { skipped: true, reason: error.message, checked: [] as string[] };

  const checked: { slug: string; total: number; broken: number; blocked: number }[] = [];
  for (const post of data ?? []) {
    if (Date.now() - started > budgetMs) break;
    const report = await checkPostLinks(post, site.url);
    await db.from("posts").update({ link_report: report, links_checked_at: report.checkedAt }).eq("id", post.id);
    checked.push({ slug: post.slug, total: report.total, broken: report.broken.length, blocked: report.blocked.length });
  }
  return { skipped: false, checked, remaining: (data?.length ?? 0) - checked.length };
}
