import { createClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "./config";

/**
 * Cookie-less anon client for public reads (published posts, news). Because it never
 * touches cookies, pages using it can stay statically generated / ISR. RLS applies.
 */
export function createPublicClient() {
  if (!isSupabaseConfigured()) return null;
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
