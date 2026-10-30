"use client";

import { RefreshCw } from "lucide-react";
import { useState, useTransition } from "react";
import { refreshNewsNow } from "./actions";

export function RefreshButton() {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await refreshNewsNow();
            setMsg(r.skipped ? r.skipped : `${r.itemsUpserted} headlines stored · ${r.feedsOk} feeds ok · ${r.feedsFailed} failed`);
          })
        }
        className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
      >
        <RefreshCw size={16} aria-hidden className={pending ? "animate-spin" : ""} /> {pending ? "Refreshing…" : "Refresh now"}
      </button>
      <p aria-live="polite" className="text-xs text-muted">{msg}</p>
    </div>
  );
}
