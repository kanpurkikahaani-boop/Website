import { NextResponse } from "next/server";
import { finishAdminSignIn } from "@/lib/admin/sign-in";
import { createSessionClient } from "@/lib/supabase/server";

/**
 * Google / reset-link landing: swap the one-time code for a session, then immediately run the
 * admin check (wrong account → signed out). `next` is internal-only (see safeNext).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const supabase = await createSessionClient();
  if (!supabase || !code) return NextResponse.redirect(new URL("/admin/login?error=callback", url.origin), { status: 303 });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL("/admin/login?error=callback", url.origin), { status: 303 });

  const { data } = await supabase.auth.getUser();
  const dest = await finishAdminSignIn(supabase, data.user, url.searchParams.get("next"), "link");
  return NextResponse.redirect(new URL(dest, url.origin), { status: 303 });
}
