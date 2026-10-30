import { ForbiddenError, requireAdmin } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";

const csvCell = (v: unknown) => {
  let s = Array.isArray(v) ? v.join("|") : v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // block spreadsheet formula injection
  return `"${s.replace(/"/g, '""')}"`;
};

/** GET /admin/subscribers/export — admin-only CSV download. */
export async function GET(request: Request) {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof ForbiddenError) return new Response("Forbidden", { status: 403 });
    throw e;
  }
  const q = new URL(request.url).searchParams.get("q")?.trim();
  const db = await createSessionClient();
  let query = db!.from("subscribers").select("email, cities, source, consent, created_at, unsubscribed_at").order("created_at");
  if (q) query = query.ilike("email", `%${q.replace(/[%_]/g, "")}%`);
  const { data, error } = await query;
  if (error) return new Response(error.message, { status: 500 });

  const header = ["email", "cities", "source", "consent", "created_at", "unsubscribed_at"];
  const rows = (data ?? []).map((r) => header.map((h) => csvCell(r[h as keyof typeof r])).join(","));
  const body = "﻿" + [header.join(","), ...rows].join("\r\n");
  const date = new Date().toISOString().slice(0, 10);
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="kkk-subscribers-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
