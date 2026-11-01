import { NextResponse } from "next/server";
import { runBlogHousekeeping } from "@/lib/blog-housekeeping";
import { isAuthorizedCron } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/publish-scheduled (Bearer CRON_SECRET). Vercel Hobby allows two once-a-day crons, so
 * the daily news cron calls this too. Scheduled posts don't wait for it: they appear as soon as their
 * time passes (/blogs is rendered per request; post and home pages refresh every 5 minutes).
 */
export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const result = await runBlogHousekeeping();
  return NextResponse.json(result, { status: result.skipped ? 503 : 200, headers: { "Cache-Control": "no-store" } });
}
