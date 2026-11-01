import "server-only";
import { createServiceClient } from "@/lib/supabase/admin";
import { createSessionClient } from "@/lib/supabase/server";

export type AuditAction =
  | "login" | "login_denied" | "logout" | "create" | "update" | "publish" | "unpublish" | "schedule"
  | "trash" | "restore" | "purge" | "revision_restore" | "duplicate" | "mfa_enrol" | "mfa_remove";

/**
 * Append to admin_audit. Normally written with the admin's own session (RLS: admin-only insert).
 * `login_denied` has no admin session, so it goes through the service role. Never throws.
 */
export async function audit(action: AuditAction, actor: string, extra: { postId?: string | null; detail?: string } = {}) {
  try {
    const db = action === "login_denied" ? createServiceClient() : await createSessionClient();
    if (!db) return;
    await db.from("admin_audit").insert({ action, actor: actor.slice(0, 200), post_id: extra.postId ?? null, detail: extra.detail?.slice(0, 500) ?? null });
  } catch (e) {
    console.error("[audit] failed:", e instanceof Error ? e.message : e);
  }
}
