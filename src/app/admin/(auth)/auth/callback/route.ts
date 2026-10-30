import { NextResponse } from "next/server";
import { isAdminUser } from "@/lib/admin-check";
import { createSessionClient } from "@/lib/supabase/server";

/** OAuth / magic-link landing: create the session, then immediately reject anyone who isn't the admin. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const supabase = await createSessionClient();
  if (!supabase || !code) return NextResponse.redirect(new URL("/admin/login?error=callback", url.origin));

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL("/admin/login?error=callback", url.origin));

  const { data } = await supabase.auth.getUser();
  if (!isAdminUser(data.user)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/admin/login?error=forbidden", url.origin));
  }
  return NextResponse.redirect(new URL("/admin", url.origin));
}
