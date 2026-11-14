import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_HINT_COOKIE } from "@/lib/admin/session-rules";
import { createPublicClient } from "@/lib/supabase/public";
import { createServiceClient } from "@/lib/supabase/admin";
import { isBot, VISITOR_COOKIE, VISITOR_MAX_AGE, visitorHash, visitorId } from "@/lib/views";

export const dynamic = "force-dynamic";

const SLUG = /^[a-z0-9-]{1,120}$/;
const noStore = { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex" };

type Reason = "not_set_up" | "no_server_key" | "not_found" | "error";
type Views = { views: number; reason?: undefined } | { views: null; reason: Reason };

/** PostgREST / Postgres codes for "that table or function doesn't exist" (migration 0010 not run). */
const MISSING = new Set(["42P01", "42883", "PGRST202", "PGRST205", "PGRST200"]);
const missing = (e: { code?: string; message?: string } | null) => Boolean(e && (MISSING.has(e.code ?? "") || /does not exist|could not find/i.test(e.message ?? "")));

/** Current total for a live post, without counting (used for bots, the team and GET). */
async function currentViews(slug: string): Promise<Views> {
  const db = createPublicClient();
  if (!db) return { views: null, reason: "error" };
  const { data: post } = await db.from("posts").select("id").eq("slug", slug).maybeSingle();
  if (!post) return { views: null, reason: "not_found" };
  const { data, error } = await db.from("post_view_counts").select("views").eq("post_id", post.id).maybeSingle();
  if (error) {
    console.error("[views] read failed:", error.code, error.message);
    return { views: null, reason: missing(error) ? "not_set_up" : "error" };
  }
  return { views: Number(data?.views ?? 0) };
}

/** GET /api/views/{slug} → { views } (never counts). */
export async function GET(_req: NextRequest, { params }: RouteContext<"/api/views/[slug]">) {
  const { slug } = await params;
  if (!SLUG.test(slug)) return NextResponse.json({ views: null, reason: "not_found" }, { status: 404, headers: noStore });
  return NextResponse.json(await currentViews(slug), { headers: noStore });
}

/**
 * POST /api/views/{slug} → { views, counted, reason? }. Counts one view per visitor per 24 h
 * (first-party cookie, hashed before storage). Bots and signed-in team members are not counted.
 * When counts can't be shown, `reason` says why (shown to the team on the post page).
 */
export async function POST(req: NextRequest, { params }: RouteContext<"/api/views/[slug]">) {
  const { slug } = await params;
  if (!SLUG.test(slug)) return NextResponse.json({ views: null, counted: false, reason: "not_found" }, { status: 404, headers: noStore });
  // Only our own pages may count (blocks simple cross-site inflation).
  const site = req.headers.get("sec-fetch-site");
  if (site && site !== "same-origin") return NextResponse.json({ views: null, counted: false }, { status: 403, headers: noStore });

  const skip = isBot(req.headers.get("user-agent")) || req.cookies.get(ADMIN_HINT_COOKIE)?.value === "1";
  const db = createServiceClient();
  if (skip) return NextResponse.json({ ...(await currentViews(slug)), counted: false }, { headers: noStore });
  if (!db) {
    console.error("[views] no Supabase server key (SUPABASE_SECRET_KEY / SUPABASE_SERVICE_ROLE_KEY): visits aren't recorded");
    const cur = await currentViews(slug);
    return NextResponse.json({ ...cur, ...(cur.views === null ? {} : { reason: "no_server_key" }), counted: false }, { headers: noStore });
  }

  const visitor = visitorId(req.cookies.get(VISITOR_COOKIE)?.value);
  const { data, error } = await db.rpc("record_post_view", { p_slug: slug, p_visitor: visitorHash(visitor.id) });
  if (error) {
    console.error("[views] record failed:", error.code, error.message);
    const cur = await currentViews(slug);
    return NextResponse.json({ ...cur, ...(cur.views === null && missing(error) ? { reason: "not_set_up" } : {}), counted: false }, { headers: noStore });
  }
  const res = NextResponse.json(data === null ? { views: null, counted: false, reason: "not_found" } : { views: Number(data), counted: true }, { status: data === null ? 404 : 200, headers: noStore });
  if (visitor.isNew) {
    res.cookies.set(VISITOR_COOKIE, visitor.id, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: VISITOR_MAX_AGE });
  }
  return res;
}
