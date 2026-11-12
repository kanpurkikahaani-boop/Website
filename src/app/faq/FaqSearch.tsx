"use client";

import { useEffect, useState } from "react";

/**
 * Topic pills + search over the server-rendered FAQ list. Without JavaScript every question is
 * still on the page; with it, typing hides non-matching questions (and opens the matches).
 */
export function FaqSearch({ groups }: { groups: { key: string; label: string }[] }) {
  const [q, setQ] = useState("");
  useEffect(() => {
    const term = q.trim().toLowerCase();
    let shown = 0;
    document.querySelectorAll<HTMLElement>("[data-faq-group]").forEach((g) => {
      let inGroup = 0;
      g.querySelectorAll<HTMLDetailsElement>("details.faq-item").forEach((d) => {
        const match = !term || (d.textContent ?? "").toLowerCase().includes(term);
        d.hidden = !match;
        if (term && match) d.open = true;
        if (match) inGroup++;
      });
      g.querySelectorAll<HTMLElement>("h3").forEach((h) => {
        const list = h.nextElementSibling;
        h.hidden = !!term && !!list && ![...list.querySelectorAll("details")].some((d) => !d.hidden);
      });
      g.hidden = inGroup === 0;
      shown += inGroup;
    });
    const empty = document.querySelector<HTMLElement>("[data-faq-empty]");
    if (empty) empty.hidden = shown > 0;
  }, [q]);
  return (
    <div className="mx-auto max-w-[760px]">
      <label htmlFor="faq-search" className="sr-only">
        Search FAQs
      </label>
      <input
        id="faq-search"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search questions — e.g. rain, Lucknow, laddu"
        className="w-full rounded-full border border-border bg-white px-5 py-3 text-[16px] text-ink shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral"
      />
      <nav aria-label="FAQ topics" className="mt-5 flex flex-wrap justify-center gap-2">
        {groups.map((g) => (
          <a key={g.key} href={`#topic-${g.key}`} className="rounded-full border border-border bg-white px-3.5 py-1.5 text-[13px] font-semibold text-ink transition hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral">
            {g.label}
          </a>
        ))}
      </nav>
    </div>
  );
}
