import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Does this session still owe its 2-step code? Uses the server-verified form (access token sent to
 * Supabase Auth, factors read from the server), never the factor list cached in the cookie, and
 * treats any error as "yes" — so a forged or edited token can't skip the second step.
 */
export async function needsSecondFactor(supabase: SupabaseClient): Promise<boolean> {
  const { data: s } = await supabase.auth.getSession();
  const token = s.session?.access_token;
  if (!token) return true;
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel(token);
  if (error || !data) return true;
  return data.nextLevel === "aal2" && data.currentLevel !== "aal2";
}
