import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
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
  return NextResponse.json(result, { status: result.skipped ? 503 : 200, headers: { "Cache-Control": "no-store" } });
}
