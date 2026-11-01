"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { uploadBlogImage } from "@/lib/upload-image";
import { deleteAuthor, updateAuthor } from "./actions";

export interface AuthorRow {
  id: string;
  slug: string;
  name: string;
  bio: string;
  avatarUrl: string;
  website: string;
  instagram: string;
  title: string;
  posts: number;
}

const input = "mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none";

export function AuthorCard({ author }: { author: AuthorRow }) {
  const router = useRouter();
  const [a, setA] = useState(author);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const set = (k: keyof AuthorRow, v: string) => setA((x) => ({ ...x, [k]: v }));

  return (
    <form
      className="rounded-2xl border border-border bg-surface p-5"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await updateAuthor({ id: a.id, name: a.name, bio: a.bio, avatarUrl: a.avatarUrl, website: a.website, instagram: a.instagram, title: a.title });
          setMsg(r.ok ? { ok: true, text: "Saved." } : { ok: false, text: r.error });
          if (r.ok) router.refresh();
        });
      }}
    >
      <div className="flex items-center gap-4">
        {a.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- admin preview
          <img src={a.avatarUrl} alt="" className="h-14 w-14 rounded-full object-cover" />
        ) : (
          <span aria-hidden className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-coral font-display font-bold text-dark">
            {a.name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
          </span>
        )}
        <div>
          <p className="font-display text-lg font-semibold text-ink">{a.name}</p>
          <p className="text-xs text-muted">/blogs/author/{a.slug} · {a.posts} post{a.posts === 1 ? "" : "s"}</p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-semibold text-muted">Name<input value={a.name} onChange={(e) => set("name", e.target.value)} className={input} /></label>
        <label className="text-xs font-semibold text-muted sm:col-span-2">Byline title<input value={a.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Blog Editor, Kanpur Ki Kahaani" className={input} /></label>
        <label className="text-xs font-semibold text-muted">Instagram handle<input value={a.instagram} onChange={(e) => set("instagram", e.target.value)} placeholder="@handle" className={input} /></label>
        <label className="text-xs font-semibold text-muted sm:col-span-2">Bio<textarea value={a.bio} onChange={(e) => set("bio", e.target.value)} rows={3} maxLength={600} className={input} /></label>
        <label className="text-xs font-semibold text-muted">Website<input value={a.website} onChange={(e) => set("website", e.target.value)} placeholder="https://" className={input} /></label>
        <label className="text-xs font-semibold text-muted">
          Photo
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (!f) return;
              try {
                set("avatarUrl", await uploadBlogImage(f));
              } catch (err) {
                setMsg({ ok: false, text: err instanceof Error ? err.message : "Upload failed" });
              }
            }}
            className="mt-1 block w-full text-xs file:mr-2 file:rounded-full file:border-0 file:bg-primary-soft file:px-3 file:py-1.5 file:font-semibold file:text-primary"
          />
        </label>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button disabled={pending} className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60">{pending ? "Saving…" : "Save"}</button>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            window.confirm(`Remove ${a.name}?`) &&
            start(async () => {
              const r = await deleteAuthor(a.id);
              if (!r.ok) setMsg({ ok: false, text: r.error });
              else router.refresh();
            })
          }
          className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-ink hover:border-primary"
        >
          Remove
        </button>
        {msg && <span role={msg.ok ? "status" : "alert"} className={msg.ok ? "text-sm text-[#21603a]" : "text-sm text-primary"}>{msg.text}</span>}
      </div>
    </form>
  );
}
