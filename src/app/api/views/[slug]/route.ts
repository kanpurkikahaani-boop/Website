import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_HINT_COOKIE } from "@/lib/admin/session-rules";
import { createPublicClient } from "@/lib/supabase/public";
import { createServiceClient } from "@/lib/supabase/admin";
import { isBot, VISITOR_COOKIE, VISITOR_MAX_AGE, visitorHash, visitorId } from "@/lib/views";

export const dynamic = "force-dynamic";

const SLUG = /^[a-z0-9-]{1,120}$/;
const noStore = { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex" };

/** Current total for a live post, without counting (used for bots, the team and GET). */
async function currentViews(slug: string): Promise<number | null> {
  const db = createPublicClient();
  if (!db) return null;
  const { data } = await db.from("posts").select("id, post_view_counts(views)").eq("slug", slug).maybeSingle();
  if (!data) return null;
  const rel = (data as { post_view_counts?: { views?: number } | { views?: number }[] | null }).post_view_counts;
  const row = Array.isArray(rel) ? rel[0] : rel;
  return Number(row?.views ?? 0);
}

/** GET /api/views/{slug} → { views } (never counts). */
export async function GET(_req: NextRequest, { params }: RouteContext<"/api/views/[slug]">) {
  const { slug } = await params;
  if (!SLUG.test(slug)) return NextResponse.json({ views: null }, { status: 404, headers: noStore });
  return NextResponse.json({ views: await currentViews(slug) }, { headers: noStore });
}

/**
 * POST /api/views/{slug} → { views, counted }. Counts one view per visitor per 24 h (first-party
 * cookie, hashed before storage). Bots and signed-in team members are not counted.
 */
export async function POST(req: NextRequest, { params }: RouteContext<"/api/views/[slug]">) {
  const { slug } = await params;
  if (!SLUG.test(slug)) return NextResponse.json({ views: null, counted: false }, { status: 404, headers: noStore });
  // Only our own pages may count (blocks simple cross-site inflation).
  const site = req.headers.get("sec-fetch-site");
  if (site && site !== "same-origin") return NextResponse.json({ views: null, counted: false }, { status: 403, headers: noStore });

  const skip = isBot(req.headers.get("user-agent")) || req.cookies.get(ADMIN_HINT_COOKIE)?.value === "1";
  const db = createServiceClient();
  if (skip || !db) return NextResponse.json({ views: await currentViews(slug), counted: false }, { headers: noStore });

  const visitor = visitorId(req.cookies.get(VISITOR_COOKIE)?.value);
  const { data, error } = await db.rpc("record_post_view", { p_slug: slug, p_visitor: visitorHash(visitor.id) });
  if (error) {
    console.error("[views] record failed:", error.message);
    return NextResponse.json({ views: await currentViews(slug), counted: false }, { headers: noStore });
  }
  const res = NextResponse.json({ views: data === null ? null : Number(data), counted: data !== null }, { status: data === null ? 404 : 200, headers: noStore });
  if (visitor.isNew) {
    res.cookies.set(VISITOR_COOKIE, visitor.id, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: VISITOR_MAX_AGE });
  }
  return res;
}
