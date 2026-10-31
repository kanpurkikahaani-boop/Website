import { EventForm } from "@/components/admin/EventForm";

export const metadata = { title: "New event" };

export default function NewEventPage() {
  return (
    <>
      <p className="eyebrow">Events</p>
      <h1 className="mb-8 mt-1 text-[32px] font-bold text-primary">New event</h1>
      <EventForm initial={{ title: "", category: "cultural", city: "kanpur", venue: "", startAt: "", endAt: "", imageUrl: "", bmsUrl: "", sourceUrl: "", status: "draft" }} />
    </>
  );
}
