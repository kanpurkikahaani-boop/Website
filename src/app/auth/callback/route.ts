import { NextResponse } from "next/server";

/** Alias: /auth/callback → /admin/auth/callback (same query), for Supabase redirect settings. */
export function GET(request: Request) {
  const url = new URL(request.url);
  return NextResponse.redirect(new URL(`/admin/auth/callback${url.search}`, url.origin), { status: 307 });
}
