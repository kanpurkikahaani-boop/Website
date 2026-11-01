"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { duplicatePost, purgePost, restorePost, setPostStatus, trashPost } from "@/app/admin/(panel)/blogs/actions";

type Status = "draft" | "scheduled" | "published";

export function PostRowActions({ id, slug, title, status, trashed = false }: { id: string; slug: string; title: string; status: Status; trashed?: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);

  const run = (fn: () => Promise<{ ok: boolean; error?: string; id?: string }>, after?: (r: { id?: string }) => void) =>
    start(async () => {
      setError(null);
      const r = await fn();
      if (!r.ok) setError(r.error ?? "Failed");
      else if (after) after(r);
      else router.refresh();
    });

  const btn = "rounded-full border border-border px-3 py-1 text-xs font-semibold text-ink hover:border-primary hover:text-primary disabled:opacity-50";

  if (trashed) {
    return (
      <div className="flex flex-wrap items-center justify-end gap-1.5">
        <button type="button" disabled={pending} className={btn} onClick={() => run(() => restorePost(id))}>Restore</button>
        <button
          type="button"
          disabled={pending}
          className={`${btn} hover:bg-primary hover:text-white`}
          onClick={() => confirm(`Delete “${title}” forever? This can't be undone.`) && run(() => purgePost(id))}
        >
          Delete forever
        </button>
        {error && <span role="alert" className="w-full text-right text-xs text-primary">{error}</span>}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      <Link href={`/admin/blogs/${id}/edit`} className={btn}>Edit</Link>
      <a href={`/admin/blogs/${id}/preview`} target="_blank" rel="noopener noreferrer" className={btn}>Preview ↗</a>
      {status === "draft" ? (
        <button type="button" disabled={pending} className={btn} onClick={() => run(() => setPostStatus(id, "published"))}>Publish</button>
      ) : (
        <>
          {status === "published" && <a href={`/blogs/${slug}`} target="_blank" rel="noopener noreferrer" className={btn}>View ↗</a>}
          <button type="button" disabled={pending} className={btn} onClick={() => run(() => setPostStatus(id, "draft"))}>Unpublish</button>
        </>
      )}
      <button type="button" disabled={pending} className={btn} onClick={() => run(() => duplicatePost(id), (r) => router.push(`/admin/blogs/${r.id}/edit`))}>
        Duplicate
      </button>
      <button type="button" disabled={pending} className={`${btn} hover:bg-primary hover:text-white`} onClick={() => { setTyped(""); dialog.current?.showModal(); }}>
        Delete
      </button>
      {error && <span role="alert" className="w-full text-right text-xs text-primary">{error}</span>}
      <dialog ref={dialog} aria-labelledby={`del-${id}`} className="m-auto max-w-md rounded-2xl border border-border bg-surface p-6 text-left backdrop:bg-dark/50">
        <h2 id={`del-${id}`} className="text-xl font-bold text-primary">Move this post to the Trash?</h2>
        <p className="mt-2 text-sm">
          It disappears from the website straight away. You can restore it from the Trash for 30 days.
        </p>
        <label className="mt-4 block text-sm font-semibold text-ink">
          Type the title to confirm: <span className="font-normal italic">{title}</span>
          <input value={typed} onChange={(e) => setTyped(e.target.value)} className="mt-1.5 h-10 w-full rounded-xl border border-border bg-white px-3 text-sm" autoComplete="off" />
        </label>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className={btn} onClick={() => dialog.current?.close()}>Cancel</button>
          <button
            type="button"
            disabled={typed.trim() !== title.trim()}
            className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-white hover:bg-primary-hover disabled:opacity-40"
            onClick={() => {
              dialog.current?.close();
              run(() => trashPost(id, typed));
            }}
          >
            Move to Trash
          </button>
        </div>
      </dialog>
    </div>
  );
}
