"use client";

import { ExternalLink, Send, Trash2 } from "lucide-react";
import { useEffect, useId, useState, useTransition } from "react";
import {
  addManualSyndication,
  crossPost,
  deleteSyndication,
  listPlatforms,
  listSyndications,
  type CrossPostOutcome,
  type PlatformInfo,
  type SyndicationEntry,
} from "@/app/admin/(panel)/syndication/actions";
import { cn } from "@/lib/utils";

const input = "w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none";
const STATUS_STYLE: Record<SyndicationEntry["status"], string> = {
  published: "bg-[#e3f2e8] text-[#21603a]",
  draft: "bg-accent-soft text-accent-ink",
  manual: "bg-bg-alt text-ink",
  failed: "bg-primary-soft text-primary",
};
const dateIST = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium" });

/** List of copies of one post, with links and a delete button. */
export function SyndicationList({ entries, onDeleted }: { entries: SyndicationEntry[]; onDeleted: (id: string) => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  if (!entries.length) return <p className="text-sm text-muted">Not published anywhere else yet.</p>;
  return (
    <ul className="space-y-1.5" aria-label="Published copies">
      {entries.map((e) => (
        <li key={e.id} className="flex items-start gap-2 text-sm">
          <span className={cn("mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize", STATUS_STYLE[e.status])}>{e.status}</span>
          <span className="min-w-0 flex-1">
            {e.externalUrl ? (
              <a href={e.externalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">
                {e.platform} <ExternalLink size={12} aria-hidden />
                <span className="sr-only"> (opens in new tab)</span>
              </a>
            ) : (
              <strong className="text-ink">{e.platform}</strong>
            )}
            <span className="text-xs text-muted"> · {dateIST(e.publishedAt)}</span>
            {e.error && <span className="block break-words text-xs text-primary">{e.error}</span>}
          </span>
          <button
            type="button"
            aria-label={`Remove ${e.platform} entry`}
            disabled={busy === e.id}
            onClick={async () => {
              if (!window.confirm(`Remove this ${e.platform} entry from the tracker? (The copy itself stays on ${e.platform}.)`)) return;
              setBusy(e.id);
              const r = await deleteSyndication(e.id);
              setBusy(null);
              if (r.ok) onDeleted(e.id);
            }}
            className="rounded-full p-1 text-muted hover:text-primary disabled:opacity-40"
          >
            <Trash2 size={14} aria-hidden />
          </button>
        </li>
      ))}
    </ul>
  );
}

/** Add a copy posted by hand (LinkedIn, Medium import, Substack…). */
export function ManualEntryForm({ postId, onAdded, stacked = false }: { postId: string; onAdded: (e: SyndicationEntry) => void; stacked?: boolean }) {
  const id = useId();
  const [platform, setPlatform] = useState("");
  const [url, setUrl] = useState("");
  const [date, setDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      aria-label="Add a copy posted by hand"
      onSubmit={(ev) => {
        ev.preventDefault();
        start(async () => {
          setError(null);
          const r = await addManualSyndication({ postId, platform, url, publishedAt: date || undefined });
          if (!r.ok) return setError(r.error);
          onAdded(r.entry);
          setPlatform("");
          setUrl("");
          setDate("");
        });
      }}
      className={cn("grid gap-2", !stacked && "sm:grid-cols-[150px_minmax(0,1fr)_150px_auto]")}
    >
      <label className="sr-only" htmlFor={`${id}-p`}>Site</label>
      <input id={`${id}-p`} list={`${id}-sites`} value={platform} onChange={(e) => setPlatform(e.target.value)} placeholder="Site, e.g. LinkedIn" required maxLength={40} className={input} />
      <datalist id={`${id}-sites`}>
        {["LinkedIn", "Medium", "Substack", "Quora", "Reddit", "Hashnode", "DEV (dev.to)", "Blogger", "Tumblr", "WordPress.com", "Facebook", "Instagram"].map((s) => <option key={s} value={s} />)}
      </datalist>
      <label className="sr-only" htmlFor={`${id}-u`}>Link to the copy</label>
      <input id={`${id}-u`} type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" required className={input} />
      <label className="sr-only" htmlFor={`${id}-d`}>Date posted</label>
      <input id={`${id}-d`} type="date" value={date} onChange={(e) => setDate(e.target.value)} className={input} title="Date posted (optional — today if empty)" />
      <button type="submit" disabled={pending} className="rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-primary disabled:opacity-50">
        {pending ? "Adding…" : "Add link"}
      </button>
      {error && <p role="alert" className="text-xs text-primary sm:col-span-4">{error}</p>}
    </form>
  );
}

/**
 * Editor sidebar panel (v10): cross-post this published post to the platforms that are set up,
 * see where it's been published, and add copies posted by hand.
 */
export function SyndicatePanel({ postId, live }: { postId?: string; live: boolean }) {
  const [platforms, setPlatforms] = useState<PlatformInfo[] | null>(null);
  const [entries, setEntries] = useState<SyndicationEntry[]>([]);
  const [chosen, setChosen] = useState<string[]>([]);
  const [draft, setDraft] = useState(false);
  const [results, setResults] = useState<CrossPostOutcome[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    if (!postId) return;
    let ok = true;
    Promise.all([listPlatforms(), listSyndications(postId)]).then(([p, e]) => {
      if (!ok) return;
      setPlatforms(p);
      setEntries(e);
    });
    return () => {
      ok = false;
    };
  }, [postId]);

  if (!postId) return <p className="text-sm">Save the post first.</p>;
  if (!platforms) return <p className="text-sm">Loading…</p>;
  const ready = platforms.filter((p) => p.configured);

  return (
    <div className="space-y-4">
      {!live ? (
        <p className="rounded-lg bg-accent-soft px-3 py-2 text-xs text-ink">Publish the post on our site first — every copy links back to it.</p>
      ) : (
        <fieldset>
          <legend className="text-sm font-semibold text-ink">Cross-post to</legend>
          <ul className="mt-2 space-y-1.5">
            {platforms.map((p) => (
              <li key={p.id}>
                <label className={cn("flex items-start gap-2 text-sm", !p.configured && "text-muted")}>
                  <input
                    type="checkbox"
                    disabled={!p.configured || pending}
                    checked={chosen.includes(p.id)}
                    onChange={(e) => setChosen((c) => (e.target.checked ? [...c, p.id] : c.filter((x) => x !== p.id)))}
                    className="mt-1"
                  />
                  <span>
                    <span className="font-semibold">{p.name}</span>
                    {p.canonical && <span className="ml-1 rounded bg-[#e3f2e8] px-1.5 text-[10.5px] font-semibold text-[#21603a]">canonical</span>}
                    <span className="block text-xs text-muted">{p.configured ? p.note : `Not set up — add ${p.env.join(", ")} in Vercel (see SETUP.md).`}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
          {ready.some((p) => p.drafts) && (
            <label className="mt-3 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={draft} onChange={(e) => setDraft(e.target.checked)} /> Save as a draft there (where the site allows) so I can check it first
            </label>
          )}
          <button
            type="button"
            disabled={!chosen.length || pending}
            onClick={() =>
              start(async () => {
                setError(null);
                setResults(null);
                const r = await crossPost(postId, chosen, draft);
                if (!r.ok) return setError(r.error);
                setResults(r.results);
                setChosen([]);
                setEntries(await listSyndications(postId));
              })
            }
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-50"
          >
            <Send size={14} aria-hidden /> {pending ? "Publishing copies…" : "Cross-post"}
          </button>
          {!ready.length && <p className="mt-2 text-xs text-muted">No platform is set up yet. The tracker below still works for copies you post by hand.</p>}
        </fieldset>
      )}
      {error && <p role="alert" className="text-sm text-primary">{error}</p>}
      {results && (
        <ul role="status" className="space-y-1 rounded-lg bg-bg-alt p-3 text-xs">
          {results.map((r) => (
            <li key={r.platform} className={r.ok ? "text-[#21603a]" : "text-primary"}>
              {r.ok ? "✓" : "✗"} {r.platform}: {r.ok ? (r.status === "draft" ? "draft saved" : "published") : r.error}
            </li>
          ))}
        </ul>
      )}
      <div>
        <p className="mb-2 text-sm font-semibold text-ink">Published on</p>
        <SyndicationList entries={entries} onDeleted={(id) => setEntries((l) => l.filter((x) => x.id !== id))} />
      </div>
      <div>
        <p className="mb-2 text-sm font-semibold text-ink">Posted it somewhere by hand?</p>
        <ManualEntryForm stacked postId={postId} onAdded={(e) => setEntries((l) => [e, ...l])} />
      </div>
    </div>
  );
}

/** One post's row on /admin/syndication: its copies plus the add-by-hand form. */
export function PostSyndicationBlock({ postId, initial }: { postId: string; initial: SyndicationEntry[] }) {
  const [entries, setEntries] = useState(initial);
  return (
    <div className="space-y-3">
      <SyndicationList entries={entries} onDeleted={(id) => setEntries((l) => l.filter((x) => x.id !== id))} />
      <ManualEntryForm postId={postId} onAdded={(e) => setEntries((l) => [e, ...l])} />
    </div>
  );
}
