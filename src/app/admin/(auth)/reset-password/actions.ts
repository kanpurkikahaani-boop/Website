"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";

export async function setNewPassword(_prev: { error?: string }, formData: FormData): Promise<{ error?: string }> {
  await requireAdmin(); // only reachable with the admin's (reset-link) session
  const pw = String(formData.get("password") ?? "");
  const again = String(formData.get("confirm") ?? "");
  if (pw.length < 12) return { error: "Use at least 12 characters." };
  if (pw !== again) return { error: "The two passwords don't match." };
  const supabase = await createSessionClient();
  const { error } = await supabase!.auth.updateUser({ password: pw });
  if (error) return { error: "Couldn't save the new password. Please try again." };
  redirect("/admin/blogs?notice=password");
}
