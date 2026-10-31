import { revalidatePath } from "next/cache";
import { after, NextResponse } from "next/server";
import { runBlogLinkCheck } from "@/lib/blog-link-check";
import { cities } from "@/data/cities";
import { isAuthorizedCron } from "@/lib/cron-auth";
import { runEventsRefresh } from "@/lib/events-refresh";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

/** GET /api/cron/refresh-events — daily at 00:15 UTC (5:45 AM IST) via Vercel Cron. */
export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const result = await runEventsRefresh();
  revalidatePath("/events");
  revalidatePath("/");
  for (const c of cities) revalidatePath(`/cities/${c.slug}`);
  revalidatePath("/admin/events");
  // Weekly blog link check piggybacks on this cron (Hobby plan = 2 crons) — Mondays only, after the response.
  if (new Date().getUTCDay() === 1) {
    after(async () => {
      await runBlogLinkCheck(40_000);
      revalidatePath("/admin/blogs");
    });
  }
  return NextResponse.json(result, { status: result.skipped ? 503 : 200, headers: { "Cache-Control": "no-store" } });
}
