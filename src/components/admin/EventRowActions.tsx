"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { deleteEvent, setEventStatus } from "@/app/admin/(panel)/events/actions";

export function EventRowActions({ id, title, status }: { id: string; title: string; status: "draft" | "published" | "archived" }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    start(async () => {
      const r = await fn();
      if (!r.ok) setError(r.error ?? "Failed");
      else router.refresh();
    });
  const btn = "rounded-full border border-border px-3 py-1 text-xs font-semibold text-ink hover:border-primary hover:text-primary disabled:opacity-50";

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      <Link href={`/admin/events/${id}/edit`} className={btn}>Edit</Link>
      {status !== "published" && (
        <button type="button" disabled={pending} className={btn} onClick={() => run(() => setEventStatus(id, "published"))}>Publish</button>
      )}
      {status !== "archived" && (
        <button type="button" disabled={pending} className={btn} onClick={() => run(() => setEventStatus(id, "archived"))}>Archive</button>
      )}
      <button type="button" disabled={pending} className={`${btn} hover:bg-primary hover:text-white`} onClick={() => dialog.current?.showModal()}>Delete</button>
      {error && <span role="alert" className="w-full text-right text-xs text-primary">{error}</span>}
      <dialog ref={dialog} aria-labelledby={`del-ev-${id}`} className="m-auto max-w-sm rounded-2xl border border-border bg-surface p-6 text-left backdrop:bg-dark/50">
        <h2 id={`del-ev-${id}`} className="text-xl font-bold text-primary">Delete this event?</h2>
        <p className="mt-2 text-sm">&ldquo;{title}&rdquo; will be removed permanently. This can&apos;t be undone.</p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className={btn} onClick={() => dialog.current?.close()}>Cancel</button>
          <button
            type="button"
            className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-white hover:bg-primary-hover"
            onClick={() => {
              dialog.current?.close();
              run(() => deleteEvent(id));
            }}
          >
            Delete permanently
          </button>
        </div>
      </dialog>
    </div>
  );
}
