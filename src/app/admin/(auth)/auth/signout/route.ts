import { NextResponse } from "next/server";
import { audit } from "@/lib/admin/audit";
import { ADMIN_SEEN_COOKIE } from "@/lib/admin/session-rules";
import { createSessionClient } from "@/lib/supabase/server";

/** POST only, same-origin only (CSRF). Clears the Supabase session and our cookie, then → /blogs. */
export async function POST(request: Request) {
  const url = new URL(request.url);
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (origin && host && new URL(origin).host !== host) return NextResponse.json({ error: "Bad origin" }, { status: 403 });

  const supabase = await createSessionClient();
  const { data } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  if (data.user?.email) await audit("logout", data.user.email);
  await supabase?.auth.signOut();
  const res = NextResponse.redirect(new URL("/blogs", url.origin), { status: 303 });
  res.cookies.delete(ADMIN_SEEN_COOKIE);
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("Clear-Site-Data", '"cache"'); // the back button won't show cached admin pages
  return res;
}
