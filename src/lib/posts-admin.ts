import "server-only";
import { createSessionClient } from "@/lib/supabase/server";

/** Fetch any post (draft or published) as the signed-in admin. RLS hides drafts from everyone else. */
export async function getPostForAdmin(id: string) {
  const db = await createSessionClient();
  if (!db) return null;
  const { data } = await db.from("posts").select("*").eq("id", id).maybeSingle();
  return data;
}

/** ISO → "YYYY-MM-DDTHH:mm" in IST for <input type="datetime-local"> */
export function isoToIstLocal(iso: string | null) {
  if (!iso) return "";
  const d = new Date(new Date(iso).getTime() + 5.5 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 16);
}
