"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveEvent } from "@/app/admin/(panel)/events/actions";
import { BMS_URL_RE, EVENT_CATEGORIES } from "@/lib/events-schema";
import { CITY_OPTIONS } from "@/lib/city-names";
import { uploadBlogImage } from "@/lib/upload-image";

export interface EventFormValues {
  id?: string;
  title: string;
  category: string;
  city: string;
  venue: string;
  startAt: string; // datetime-local (IST)
  endAt: string;
  imageUrl: string;
  bmsUrl: string;
  sourceUrl: string;
  status: "draft" | "published" | "archived";
}

const inputCls = "w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-ink focus:border-primary focus:outline-none";
const toIso = (local: string) => (local ? new Date(`${local}:00+05:30`).toISOString() : "");

export function EventForm({ initial }: { initial: EventFormValues }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, start] = useTransition();
  const set = <K extends keyof EventFormValues>(k: K, val: EventFormValues[K]) => setV((p) => ({ ...p, [k]: val }));
  const bmsInvalid = v.bmsUrl.trim() !== "" && !BMS_URL_RE.test(v.bmsUrl.trim());

  function submit(status: EventFormValues["status"]) {
    setError(null);
    if (bmsInvalid) return setError("BookMyShow link must start with https://in.bookmyshow.com/");
    start(async () => {
      const r = await saveEvent({
        id: v.id,
        title: v.title,
        category: v.category as never,
        city: v.city as never,
        venue: v.venue,
        startAt: toIso(v.startAt),
        endAt: toIso(v.endAt),
        imageUrl: v.imageUrl,
        bmsUrl: v.bmsUrl,
        sourceUrl: v.sourceUrl,
        status,
      });
      if (!r.ok) return setError(r.error);
      router.push("/admin/events");
      router.refresh();
    });
  }

  return (
    <form onSubmit={(e) => e.preventDefault()} className="grid max-w-3xl gap-5">
      <Field label="Title" id="ev-title">
        <input id="ev-title" required value={v.title} onChange={(e) => set("title", e.target.value)} className={inputCls + " text-lg font-semibold"} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Category" id="ev-cat">
          <select id="ev-cat" value={v.category} onChange={(e) => set("category", e.target.value)} className={inputCls}>
            {EVENT_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </Field>
        <Field label="City" id="ev-city">
          <select id="ev-city" value={v.city} onChange={(e) => set("city", e.target.value)} className={inputCls}>
            {CITY_OPTIONS.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Venue" id="ev-venue">
        <input id="ev-venue" value={v.venue} onChange={(e) => set("venue", e.target.value)} className={inputCls} placeholder="e.g. Green Park Stadium, Civil Lines" />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Starts (IST)" id="ev-start">
          <input id="ev-start" type="datetime-local" required value={v.startAt} onChange={(e) => set("startAt", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Ends (IST, optional)" id="ev-end">
          <input id="ev-end" type="datetime-local" value={v.endAt} onChange={(e) => set("endAt", e.target.value)} className={inputCls} />
        </Field>
      </div>
      <Field label="BookMyShow event link" id="ev-bms" hint="Paste the event's page from in.bookmyshow.com — visitors get a “Book on BookMyShow” button." error={bmsInvalid ? "Must start with https://in.bookmyshow.com/" : null}>
        <input id="ev-bms" type="url" value={v.bmsUrl} onChange={(e) => set("bmsUrl", e.target.value)} className={inputCls} placeholder="https://in.bookmyshow.com/events/…" />
      </Field>
      <Field label="Other details link (optional)" id="ev-src" hint="Used for “Details ↗” when there's no BookMyShow link.">
        <input id="ev-src" type="url" value={v.sourceUrl} onChange={(e) => set("sourceUrl", e.target.value)} className={inputCls} placeholder="https://…" />
      </Field>
      <Field label="Event image (our own photo — never copy BookMyShow's)" id="ev-img">
        {v.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- admin preview of our uploaded file
          <img src={v.imageUrl} alt="" className="mb-2 aspect-[16/9] w-full max-w-sm rounded-xl object-cover" />
        )}
        <input
          id="ev-img"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
          disabled={uploading}
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            setUploading(true);
            setError(null);
            try {
              set("imageUrl", await uploadBlogImage(f, "event-images"));
            } catch (err) {
              setError(err instanceof Error ? err.message : "Upload failed");
            } finally {
              setUploading(false);
            }
          }}
          className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-primary-soft file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary"
        />
      </Field>
      {error && <p role="alert" className="rounded-lg bg-primary-soft px-3 py-2 text-sm text-primary">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={saving || uploading} onClick={() => submit("published")} className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60">
          {saving ? "Saving…" : "Publish"}
        </button>
        <button type="button" disabled={saving || uploading} onClick={() => submit("draft")} className="rounded-full border border-border px-6 py-2.5 text-sm font-semibold text-ink hover:border-primary disabled:opacity-60">
          Save draft
        </button>
        {v.id && (
          <button type="button" disabled={saving} onClick={() => submit("archived")} className="rounded-full border border-border px-6 py-2.5 text-sm font-semibold text-ink hover:border-primary disabled:opacity-60">
            Archive
          </button>
        )}
      </div>
    </form>
  );
}

function Field({ label, id, hint, error, children }: { label: string; id: string; hint?: string; error?: string | null; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-bold uppercase tracking-[0.14em] text-accent-ink">{label}</label>
      {children}
      {error ? <p role="alert" className="mt-1 text-xs text-primary">{error}</p> : hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}
