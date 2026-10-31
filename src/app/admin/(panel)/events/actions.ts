"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { eventInputSchema, type EventInput } from "@/lib/events-schema";
import { createSessionClient } from "@/lib/supabase/server";

export type EventActionResult = { ok: true; id: string } | { ok: false; error: string };

function revalidateEvents() {
  revalidatePath("/events");
  revalidatePath("/");
  revalidatePath("/admin/events");
}

/** Create or update an event. requireAdmin() here + Supabase RLS (session client) in the database. */
export async function saveEvent(input: EventInput): Promise<EventActionResult> {
  await requireAdmin();
  const parsed = eventInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid event" };
  const e = parsed.data;
  const db = await createSessionClient();
  if (!db) return { ok: false, error: "Supabase is not configured" };
  const row = {
    title: e.title,
    category: e.category,
    city: e.city,
    venue: e.venue,
    start_at: e.startAt,
    end_at: e.endAt,
    image_url: e.imageUrl,
    bms_url: e.bmsUrl,
    source_url: e.sourceUrl,
    status: e.status,
    // a new or changed link gets re-checked by the next cron run
    link_status: "unknown",
  };
  const res = e.id
    ? await db.from("events").update(row).eq("id", e.id).select("id").single()
    : await db.from("events").insert(row).select("id").single();
  if (res.error) return { ok: false, error: res.error.message };
  revalidateEvents();
  return { ok: true, id: res.data.id };
}

export async function setEventStatus(id: string, status: "draft" | "published" | "archived"): Promise<EventActionResult> {
  await requireAdmin();
  const db = await createSessionClient();
  if (!db) return { ok: false, error: "Supabase is not configured" };
  const { data, error } = await db.from("events").update({ status }).eq("id", id).select("id").single();
  if (error) return { ok: false, error: error.message };
  revalidateEvents();
  return { ok: true, id: data.id };
}

export async function deleteEvent(id: string): Promise<EventActionResult> {
  await requireAdmin();
  const db = await createSessionClient();
  if (!db) return { ok: false, error: "Supabase is not configured" };
  const { data, error } = await db.from("events").delete().eq("id", id).select("id").single();
  if (error) return { ok: false, error: error.message };
  revalidateEvents();
  return { ok: true, id: data.id };
}
