import { timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { runNewsRefresh } from "@/lib/news/refresh";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

function authorized(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = Buffer.from(req.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/** GET /api/cron/refresh-news — run daily by Vercel Cron (00:30 UTC = 6:00 AM IST). */
export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const result = await runNewsRefresh();
  revalidatePath("/news", "layout"); // /news and every /news/[city]/[genre] page
  return NextResponse.json(result, { status: result.skipped ? 503 : 200, headers: { "Cache-Control": "no-store" } });
}
