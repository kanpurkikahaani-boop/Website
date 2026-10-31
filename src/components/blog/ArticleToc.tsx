"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export interface TocItem {
  id: string;
  text: string;
  badge: string | null;
}

function useActiveId(ids: string[]) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-90px 0px -65% 0px" },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [ids]);
  return active;
}

function List({ items, active }: { items: TocItem[]; active?: string }) {
  return (
    <ol className="space-y-1 text-[14px]">
      {items.map((t) => (
        <li key={t.id}>
          <a
            href={`#${t.id}`}
            aria-current={active === t.id ? "location" : undefined}
            className={cn(
              "flex gap-2 rounded-lg px-3 py-1.5 leading-snug transition-colors",
              active === t.id ? "bg-primary-soft font-semibold text-primary" : "text-ink/80 hover:text-primary",
            )}
          >
            {t.badge && <span className="shrink-0 text-[10.5px] font-bold uppercase tracking-[0.12em] text-accent-ink">{t.badge}</span>}
            <span>{t.text}</span>
          </a>
        </li>
      ))}
    </ol>
  );
}

/** Sticky "In this story" list with scroll-spy (desktop). */
export function ArticleToc({ items }: { items: TocItem[] }) {
  const active = useActiveId(items.map((i) => i.id));
  return (
    <nav aria-label="In this story" className="rounded-2xl border border-border bg-surface p-4">
      <p className="eyebrow mb-2 px-3 text-[10.5px]">In this story</p>
      <List items={items} active={active} />
    </nav>
  );
}

/** Collapsible "In this story ▾" panel (mobile). */
export function MobileToc({ items }: { items: TocItem[] }) {
  return (
    <details className="group rounded-2xl border border-border bg-surface lg:hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold text-ink">
        In this story
        <ChevronDown size={18} aria-hidden className="transition-transform group-open:rotate-180" />
      </summary>
      <div className="px-1 pb-3">
        <List items={items} />
      </div>
    </details>
  );
}
