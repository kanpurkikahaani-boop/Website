import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAdminUser } from "@/lib/admin-check";
import { ADMIN_HINT_COOKIE, ADMIN_SEEN_COOKIE, checkSessionAge, seenCookieOptions } from "@/lib/admin/session-rules";
import { hardenCookie } from "@/lib/supabase/cookie-options";

const PUBLIC_ADMIN_PATHS = ["/admin/login", "/admin/auth/callback"];

/**
 * Layer 1 of 3 for /admin: refresh the Supabase session cookie and turn away anyone who isn't the
 * verified ADMIN_EMAIL, whose session is too old / idle, or who still owes the 2-step code.
 * Layers 2 (server checks in every page and action) and 3 (database RLS) still apply.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /blogs/[slug]?preview=<token> → the dynamic preview route (it checks the token AND the admin).
  if (pathname.startsWith("/blogs/")) {
    const token = request.nextUrl.searchParams.get("preview");
    const slug = pathname.slice("/blogs/".length);
    if (!token || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return NextResponse.next();
    const to = request.nextUrl.clone();
    to.pathname = `/preview/blogs/${slug}`;
    const res = NextResponse.rewrite(to);
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    res.headers.set("Cache-Control", "private, no-store");
    return res;
  }

  let response = NextResponse.next({ request });
  const noindex = (r: NextResponse) => {
    r.headers.set("X-Robots-Tag", "noindex, nofollow");
    r.headers.set("Cache-Control", "private, no-store");
    return r;
  };
  noindex(response);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isPublic = PUBLIC_ADMIN_PATHS.some((p) => pathname.startsWith(p));

  if (!url || !key) {
    if (isPublic) return response;
    return noindex(redirectToLogin(request, "unconfigured"));
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = noindex(NextResponse.next({ request }));
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, hardenCookie(options)));
        Object.entries(headers ?? {}).forEach(([k, v]) => response.headers.set(k, v));
      },
    },
  });

  // getUser() validates the token with Supabase Auth — never trust the cookie on its own.
  const { data } = await supabase.auth.getUser();
  if (isPublic) return response;
  if (!data.user) return noindex(redirectToLogin(request, undefined, true));
  if (!isAdminUser(data.user)) return noindex(redirectToLogin(request, "forbidden"));

  const verdict = checkSessionAge(data.user.last_sign_in_at, request.cookies.get(ADMIN_SEEN_COOKIE)?.value);
  if (verdict !== "ok") {
    await supabase.auth.signOut();
    const res = redirectToLogin(request, verdict === "idle" ? "idle" : "expired", true);
    response.cookies.getAll().forEach((c) => res.cookies.set(c)); // carry the cleared auth cookies
    res.cookies.delete(ADMIN_SEEN_COOKIE);
    res.cookies.delete(ADMIN_HINT_COOKIE);
    return noindex(res);
  }

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.nextLevel === "aal2" && aal.currentLevel !== "aal2") {
    const res = redirectToLogin(request, undefined, true, "mfa");
    response.cookies.getAll().forEach((c) => res.cookies.set(c)); // keep refreshed session cookies
    return noindex(res);
  }

  response.cookies.set(ADMIN_SEEN_COOKIE, String(Date.now()), seenCookieOptions);
  return response;
}

function redirectToLogin(request: NextRequest, error?: string, withNext = false, step?: "mfa") {
  const to = request.nextUrl.clone();
  to.pathname = "/admin/login";
  to.search = "";
  if (error) to.searchParams.set("error", error);
  if (step) to.searchParams.set("step", step);
  if (withNext) to.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(to);
}

export const config = {
  matcher: ["/admin/:path*", "/blogs/:slug"],
};
