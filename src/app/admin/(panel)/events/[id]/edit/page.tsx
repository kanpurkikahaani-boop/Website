import { notFound } from "next/navigation";
import { EventForm } from "@/components/admin/EventForm";
import { isoToIstLocal } from "@/lib/posts-admin";
import { createSessionClient } from "@/lib/supabase/server";

export const metadata = { title: "Edit event" };

export default async function EditEventPage({ params }: PageProps<"/admin/events/[id]/edit">) {
  const { id } = await params;
  const db = await createSessionClient();
  const { data: e } = await db!.from("events").select("*").eq("id", id).maybeSingle();
  if (!e) notFound();
  return (
    <>
      <p className="eyebrow">Events</p>
      <h1 className="mb-8 mt-1 text-[32px] font-bold text-primary">Edit event</h1>
      <EventForm
        key={e.id}
        initial={{
          id: e.id,
          title: e.title,
          category: e.category,
          city: e.city,
          venue: e.venue ?? "",
          startAt: isoToIstLocal(e.start_at),
          endAt: isoToIstLocal(e.end_at),
          imageUrl: e.image_url ?? "",
          bmsUrl: e.bms_url ?? "",
          sourceUrl: e.source_url ?? "",
          status: e.status,
        }}
      />
    </>
  );
}
