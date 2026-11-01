/**
 * Supabase settings read from env. Everything degrades gracefully when these are missing.
 *
 * Accepts both our names (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY /
 * SUPABASE_SERVICE_ROLE_KEY) and the names the Supabase ↔ Vercel integration creates
 * (SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY or SUPABASE_ANON_KEY / SUPABASE_SECRET_KEY).
 * All Supabase calls run on the server, so the non-public names are enough.
 */
const env = (...names: string[]) => names.map((n) => process.env[n]?.trim()).find(Boolean) ?? "";

export const supabaseUrl = env("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL").replace(/\/+$/, "");
export const supabaseAnonKey = env("NEXT_PUBLIC_SUPABASE_ANON_KEY", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "SUPABASE_PUBLISHABLE_KEY", "SUPABASE_ANON_KEY");

/** Server-only secret key (bypasses RLS). Never import this into client code. */
export const supabaseServiceKey = () => env("SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEY");

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}
