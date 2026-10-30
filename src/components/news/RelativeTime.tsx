"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};

function relative(iso: string, now: number) {
  const diff = Math.max(0, now - new Date(iso).getTime());
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hour${h > 1 ? "s" : ""} ago`;
  const d = Math.round(h / 24);
  return `${d} day${d > 1 ? "s" : ""} ago`;
}

/** "2 hours ago", computed in the browser so cached pages never show stale relative times. */
export function RelativeTime({ iso, fallback }: { iso: string; fallback: string }) {
  const now = useSyncExternalStore(noop, () => Math.floor(Date.now() / 60000) * 60000, () => 0);
  return (
    <time dateTime={iso} title={fallback}>
      {now ? relative(iso, now) : fallback}
    </time>
  );
}
