"use client";

import { site } from "@/data/site";
import { useToday } from "@/lib/use-today";
import { CopyBox } from "./CopyBox";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const fmt = (iso: string) => new Date(`${iso}T00:00:00+05:30`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });

/**
 * "Cite or link to this page" (v11): a ready-made link and a citation, so bloggers, students and
 * journalists can reference the page in one click — the easiest way to earn genuine links.
 */
export function CiteThisPage({ url, title, updated }: { url: string; title: string; updated?: string }) {
  const today = useToday();
  const year = (updated ?? today ?? "").slice(0, 4) || new Date().getFullYear().toString();
  const link = `<a href="${esc(url)}">${esc(title)}</a> — ${esc(site.name)}`;
  const citation = `${site.name} (${year}). ${title}. ${url}${today ? ` (accessed ${fmt(today)})` : ""}`;
  return (
    <aside aria-labelledby="cite-title" className="not-prose mt-12 rounded-2xl border border-border bg-surface p-5 md:p-6">
      <h2 id="cite-title" className="font-display text-xl font-bold text-primary">Cite or link to this page</h2>
      <p className="mt-1 text-sm">Found this useful for your blog, project or article? You&apos;re welcome to quote it with a link back.</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <CopyBox label="Link (HTML)" value={link} />
        <CopyBox label="Citation" value={citation} mono={false} />
      </div>
      <p className="mt-3 text-xs text-muted">
        Press, partners and collaborations: see our <a href="/press" className="font-semibold text-primary underline">press kit &amp; badges</a>.
      </p>
    </aside>
  );
}
