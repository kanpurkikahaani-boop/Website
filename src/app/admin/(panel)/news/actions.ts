"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { runNewsRefresh, type RefreshResult } from "@/lib/news/refresh";

/** "Refresh now" — the same job the daily cron runs, admin-only. */
export async function refreshNewsNow(): Promise<RefreshResult> {
  await requireAdmin();
  const result = await runNewsRefresh();
  revalidatePath("/news", "layout");
  revalidatePath("/admin/news");
  return result;
}
