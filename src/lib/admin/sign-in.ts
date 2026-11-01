import "server-only";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { isAdminUser } from "@/lib/admin-check";
import { audit } from "./audit";
import { ADMIN_HINT_COOKIE, ADMIN_SEEN_COOKIE, hintCookieOptions, safeNext, seenCookieOptions } from "./session-rules";

/**
 * Runs after ANY sign-in (password, Google, email link): the session's verified email must equal
 * ADMIN_EMAIL, otherwise sign out at once. Returns where to send the browser next.
 */
export async function finishAdminSignIn(supabase: SupabaseClient, user: User | null, next: unknown, method: string): Promise<string> {
  if (!isAdminUser(user)) {
    await audit("login_denied", user?.email ?? "unknown", { detail: method });
    await supabase.auth.signOut();
    const jar = await cookies();
    jar.delete(ADMIN_SEEN_COOKIE);
    jar.delete(ADMIN_HINT_COOKIE);
    return "/admin/login?error=forbidden";
  }
  const jar = await cookies();
  jar.set(ADMIN_SEEN_COOKIE, String(Date.now()), seenCookieOptions);
  jar.set(ADMIN_HINT_COOKIE, "1", hintCookieOptions);
  const dest = safeNext(next);
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.nextLevel === "aal2" && aal.currentLevel !== "aal2") {
    return `/admin/login?step=mfa&next=${encodeURIComponent(dest)}`;
  }
  await audit("login", user!.email!, { detail: method });
  return dest;
}
