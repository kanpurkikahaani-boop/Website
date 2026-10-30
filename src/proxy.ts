import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAdminUser } from "@/lib/admin-check";

const PUBLIC_ADMIN_PATHS = ["/admin/login", "/admin/auth/callback"];

/**
 * Layer 1 of 3 for /admin: refresh the Supabase session cookie and turn away anyone who
 * isn't the verified ADMIN_EMAIL. Layers 2 (server checks) and 3 (database RLS) still apply.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  response.headers.set("X-Robots-Tag", "noindex, nofollow");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isPublic = PUBLIC_ADMIN_PATHS.some((p) => request.nextUrl.pathname.startsWith(p));

  if (!url || !key) {
    if (isPublic) return response;
    return redirectToLogin(request, "unconfigured");
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        response.headers.set("X-Robots-Tag", "noindex, nofollow");
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers ?? {}).forEach(([k, v]) => response.headers.set(k, v));
      },
    },
  });

  // getUser() validates the token with Supabase Auth — never trust the cookie on its own.
  const { data } = await supabase.auth.getUser();
  if (isPublic || isAdminUser(data.user)) return response;
  return redirectToLogin(request, data.user ? "forbidden" : undefined);
}

function redirectToLogin(request: NextRequest, error?: string) {
  const to = request.nextUrl.clone();
  to.pathname = "/admin/login";
  to.search = error ? `?error=${error}` : "";
  const res = NextResponse.redirect(to);
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}

export const config = {
  matcher: ["/admin/:path*"],
};
