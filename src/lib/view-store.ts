"use client";

/**
 * One view-count request per post per page load, shared by the header badge and the counter at
 * the end of the story (v10.1). Live pages POST (the server decides whether the visit counts);
 * previews only GET.
 */
export type ViewState =
  | { status: "loading" }
  | { status: "ok"; views: number }
  | { status: "unavailable"; reason: string | null };

const states = new Map<string, ViewState>();
const started = new Set<string>();
const listeners = new Set<() => void>();
const LOADING: ViewState = { status: "loading" };

const set = (slug: string, s: ViewState) => {
  states.set(slug, s);
  listeners.forEach((l) => l());
};

export const getViewState = (slug: string) => states.get(slug) ?? LOADING;
export const serverViewState = (): ViewState => LOADING;
export function subscribeViews(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function loadViews(slug: string, record: boolean) {
  if (started.has(slug)) return;
  started.add(slug);
  fetch(`/api/views/${encodeURIComponent(slug)}`, { method: record ? "POST" : "GET", credentials: "same-origin", cache: "no-store" })
    .then((r) => r.json() as Promise<{ views: number | null; reason?: string }>)
    .then((j) => set(slug, typeof j.views === "number" ? { status: "ok", views: j.views } : { status: "unavailable", reason: j.reason ?? null }))
    .catch(() => set(slug, { status: "unavailable", reason: "network" }));
}

/** Signed-in team members carry this (non-secret) hint cookie; used only to show set-up help. */
export const isTeamBrowser = () => typeof document !== "undefined" && document.cookie.split("; ").includes("kkk_admin_hint=1");
