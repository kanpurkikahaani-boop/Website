import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { runBlogLinkCheck } from "@/lib/blog-link-check";
import { isAuthorizedCron } from "@/lib/cron-auth";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

/**
 * GET /api/cron/check-blog-links — weekly link check of published posts.
 * Vercel Hobby allows only two crons, so refresh-events runs this on Mondays; it can also be
 * called by hand with `Authorization: Bearer $CRON_SECRET`.
 */
export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const result = await runBlogLinkCheck();
  revalidatePath("/admin/blogs");
  return NextResponse.json(result, { status: result.skipped ? 503 : 200, headers: { "Cache-Control": "no-store" } });
}
