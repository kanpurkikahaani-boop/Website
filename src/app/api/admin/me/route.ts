import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { ADMIN_HINT_COOKIE } from "@/lib/admin/session-rules";
import { createSessionClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * Tells the public site's admin shortcuts whether to render. Re-verifies the httpOnly session on
 * every call; visitors get {admin:false} (and their stale hint cookie removed). Never cached.
 */
export async function GET(request: Request) {
  const user = await getAdminUser();
  if (!user) {
    const res = NextResponse.json({ admin: false }, { headers: { "Cache-Control": "private, no-store" } });
    res.cookies.delete(ADMIN_HINT_COOKIE);
    return res;
  }
  const slug = new URL(request.url).searchParams.get("slug");
  let postId: string | null = null;
  if (slug && SLUG.test(slug)) {
    const db = await createSessionClient();
    const { data } = (await db?.from("posts").select("id").eq("slug", slug).maybeSingle()) ?? { data: null };
    postId = data?.id ?? null;
  }
  return NextResponse.json({ admin: true, email: user.email, postId }, { headers: { "Cache-Control": "private, no-store" } });
}
