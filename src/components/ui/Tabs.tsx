"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

interface Props<T extends string> {
  tabs: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  idPrefix: string;
}

/** WAI-ARIA tabs (tablist) with arrow-key navigation. Pair with role="tabpanel". */
export function Tabs<T extends string>({ tabs, value, onChange, label, idPrefix }: Props<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKey(e: React.KeyboardEvent, i: number) {
    let next = -1;
    if (e.key === "ArrowRight") next = (i + 1) % tabs.length;
    if (e.key === "ArrowLeft") next = (i - 1 + tabs.length) % tabs.length;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = tabs.length - 1;
    if (next >= 0) {
      e.preventDefault();
      onChange(tabs[next].value);
      refs.current[next]?.focus();
    }
  }

  return (
    <div role="tablist" aria-label={label} className="scrollbar-none -mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
      {tabs.map((t, i) => {
        const active = t.value === value;
        return (
          <button
            key={t.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            id={`${idPrefix}-tab-${t.value}`}
            role="tab"
            type="button"
            aria-selected={active}
            aria-controls={`${idPrefix}-panel`}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(t.value)}
            onKeyDown={(e) => onKey(e, i)}
            className={cn(
              "whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold transition-colors",
              active ? "bg-primary text-white" : "bg-surface text-ink ring-1 ring-border hover:text-primary",
            )}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
