"use client";

import { useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics";

const fmt = new Intl.NumberFormat("en-IN");

/**
 * "👁 N views" at the end of a post (v10). Live pages record the visit (the server decides
 * whether it counts: once per visitor per 24 h, never bots or the team); previews only read.
 */
export function ViewCount({ slug, record = true, title }: { slug: string; record?: boolean; title?: string }) {
  const [views, setViews] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
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
  }, [slug, title, record, failed]);
  useEffect(() => {
    let live = true;
    fetch(`/api/views/${encodeURIComponent(slug)}`, { method: record ? "POST" : "GET", credentials: "same-origin", cache: "no-store" })
      .then((r) => r.json() as Promise<{ views: number | null }>)
      .then((j) => {
        if (!live) return;
        if (typeof j.views === "number") setViews(j.views);
        else setFailed(true);
      })
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [slug, record]);
  // Counts unavailable (e.g. database not migrated yet): show nothing rather than a spinner.
  if (failed) return <p ref={ref} aria-hidden className="h-px" />;
  return (
    <p ref={ref} data-testid="view-count" aria-live="polite" className="mt-10 flex items-center gap-2 text-sm text-muted">
      {views === null ? (
        <span aria-hidden className="inline-block h-4 w-24 animate-pulse rounded bg-border/70" />
      ) : (
        <>
          <span aria-hidden>👁</span>
          <span>
            {fmt.format(views)} {views === 1 ? "view" : "views"}
          </span>
        </>
      )}
    </p>
  );
}
