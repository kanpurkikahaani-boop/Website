import { revalidatePath } from "next/cache";
import { after, NextResponse } from "next/server";
import { runBlogHousekeeping } from "@/lib/blog-housekeeping";
import { isAuthorizedCron } from "@/lib/cron-auth";
import { runNewsRefresh } from "@/lib/news/refresh";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

/** GET /api/cron/refresh-news — run daily by Vercel Cron (00:30 UTC = 6:00 AM IST). */
export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const result = await runNewsRefresh();
  revalidatePath("/news", "layout"); // /news and every /news/[city]/[genre] page
  // Daily blog housekeeping (scheduled posts + 30-day Trash) rides on this cron (Hobby plan = 2 crons).
  after(() => runBlogHousekeeping().then(() => undefined));
  return NextResponse.json(result, { status: result.skipped ? 503 : 200, headers: { "Cache-Control": "no-store" } });
}
