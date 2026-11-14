"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { track } from "@/lib/analytics";
import { getViewState, isTeamBrowser, loadViews, serverViewState, subscribeViews } from "@/lib/view-store";

const fmt = new Intl.NumberFormat("en-IN");
const label = (n: number) => `${fmt.format(n)} ${n === 1 ? "view" : "views"}`;

const REASONS: Record<string, string> = {
  not_set_up: "the view-count tables are missing — run supabase/migrations/0010_views_and_syndication.sql in the Supabase SQL editor (SETUP.md → Update v10).",
  no_server_key: "the Supabase server key isn't set in Vercel (SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY), so visits can't be recorded.",
  not_found: "this story isn't live yet (drafts and scheduled posts have no public count).",
  network: "the count couldn't be loaded (network error).",
};

function useViews(slug: string, record: boolean) {
  const state = useSyncExternalStore(subscribeViews, () => getViewState(slug), serverViewState);
  useEffect(() => loadViews(slug, record), [slug, record]);
  return state;
}

/** "👁 N views" next to the reading time at the top of a story (v10.1). */
export function ViewBadge({ slug, record = true }: { slug: string; record?: boolean }) {
  const s = useViews(slug, record);
  if (s.status === "unavailable") return null;
  return (
    <span data-testid="view-badge" className="inline-flex items-center gap-1.5">
      <span aria-hidden>👁</span>
      {s.status === "ok" ? label(s.views) : <span aria-hidden className="inline-block h-3.5 w-14 animate-pulse rounded bg-border/70" />}
    </span>
  );
}

/**
 * "👁 N views" at the end of a story (v10). The server decides whether a visit counts: once per
 * visitor per 24 h, never bots or the team; previews only read. If counts can't be shown,
 * readers see nothing, and signed-in team members see what needs fixing.
 */
export function ViewCount({ slug, record = true, title }: { slug: string; record?: boolean; title?: string }) {
  const s = useViews(slug, record);
  const ref = useRef<HTMLParagraphElement>(null);
  // GA4 "blog_read": the reader reached the end of the story (this line), once per page view.
  useEffect(() => {
    const el = ref.current;
    if (!record || !el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        track("blog_read", { post_slug: slug, post_title: title?.slice(0, 100) });
        io.disconnect();
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, [slug, title, record]);

  if (s.status === "unavailable") {
    const team = isTeamBrowser();
    return (
      <p ref={ref} data-testid="view-count-help" role={team ? "note" : undefined} aria-hidden={team ? undefined : true} className={team ? "mt-10 rounded-lg bg-primary-soft px-3 py-2 text-sm text-primary" : "h-px"}>
        {team ? <>Only the team sees this: view counts are hidden because {REASONS[s.reason ?? ""] ?? "the server couldn't return a count."}</> : null}
      </p>
    );
  }
  return (
    <p ref={ref} data-testid="view-count" aria-live="polite" className="mt-10 flex items-center gap-2 text-sm text-muted">
      {s.status === "ok" ? (
        <>
          <span aria-hidden>👁</span>
          <span>{label(s.views)}</span>
        </>
      ) : (
        <span aria-hidden className="inline-block h-4 w-24 animate-pulse rounded bg-border/70" />
      )}
    </p>
  );
}
