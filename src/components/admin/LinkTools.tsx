"use client";

import type { Editor } from "@tiptap/react";
import { Check, Link2, Wand2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { linkGlossary } from "@/data/linkGlossary";
import { analyzeLinks, type JNode } from "@/lib/content/links";
import { isExternalHref } from "@/lib/content/enrich";
import { cn } from "@/lib/utils";

interface Suggestion {
  key: string;
  term: string;
  url: string;
  from: number;
  to: number;
  context: string;
}

const LATIN = /^[\x20-\x7e]+$/;
const reFor = (term: string) =>
  LATIN.test(term) ? new RegExp(`(?<![A-Za-z0-9])${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![A-Za-z0-9])`, "i") : new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

/**
 * Finds the first unlinked occurrence of each glossary term — never inside headings or existing
 * links, never in a sentence that already has 2 links, never right next to another link, and never
 * for a URL the post already uses.
 */
function findSuggestions(editor: Editor): Suggestion[] {
  const used = new Set<string>();
  editor.state.doc.descendants((n) => {
    n.marks.forEach((m) => m.type.name === "link" && used.add(String(m.attrs.href)));
  });
  const out: Suggestion[] = [];
  const done = new Set<string>();

  editor.state.doc.descendants((block, pos) => {
    if (!block.isTextblock) return true;
    if (block.type.name === "heading") return false;
    // Map the block to plain text + link ranges.
    let text = "";
    const linkRanges: [number, number][] = [];
    const starts: number[] = [];
    block.forEach((child, offset) => {
      starts.push(offset);
      const t = child.isText ? (child.text ?? "") : "￼";
      if (child.marks.some((m) => m.type.name === "link")) linkRanges.push([text.length, text.length + t.length]);
      text += t;
    });
    for (const entry of linkGlossary) {
      if (done.has(entry.url) || used.has(entry.url)) continue;
      for (const term of entry.terms) {
        const m = reFor(term).exec(text);
        if (!m) continue;
        const s = m.index;
        const e = s + m[0].length;
        if (linkRanges.some(([a, b]) => s < b && e > a)) continue; // overlaps a link
        if (linkRanges.some(([a, b]) => b === s || b === s - 1 || a === e || a === e + 1)) continue; // adjacent link
        const sentStart = Math.max(text.lastIndexOf(". ", s), text.lastIndexOf("! ", s), text.lastIndexOf("? ", s), -1) + 1;
        const nextEnd = text.slice(e).search(/[.!?](\s|$)/);
        const sentEnd = nextEnd < 0 ? text.length : e + nextEnd + 1;
        const inSentence = linkRanges.filter(([a]) => a >= sentStart && a < sentEnd).length + out.filter((o) => o.from >= pos + 1 + sentStart && o.from < pos + 1 + sentEnd).length;
        if (inSentence >= 2) continue;
        out.push({
          key: `${entry.url}-${pos + s}`,
          term: m[0],
          url: entry.url,
          from: pos + 1 + s,
          to: pos + 1 + e,
          context: `…${text.slice(Math.max(0, s - 30), Math.min(text.length, e + 30))}…`,
        });
        done.add(entry.url);
        break;
      }
    }
    return false;
  });
  return out;
}

export interface BoxCounts {
  planVisit: number;
  glossary: number;
  furtherReading: number;
  tags: number;
  headings: number;
  hasAuthor: boolean;
}

/** Live link meter + "Suggest links" (admin approves each suggestion). */
export function LinkTools({ editor, boxes, target = 100 }: { editor: Editor | null; boxes: BoxCounts; target?: number }) {
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [, force] = useState(0);
  const stats = useMemo(() => (editor ? analyzeLinks(editor.getJSON() as JNode) : null), [editor, editor?.state.doc]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!editor || !stats) return null;

  // Article-area estimate: body + boxes + template links (TOC, tags, more-to-explore, author box).
  const toc = boxes.headings ? boxes.headings + 1 : 0;
  const template = toc + boxes.tags + 10 + (boxes.hasAuthor ? 7 : 5);
  const total = stats.links.length + boxes.planVisit + boxes.glossary + boxes.furtherReading + template;

  const accept = (s: Suggestion) => {
    editor.chain().focus().setTextSelection({ from: s.from, to: s.to }).setLink({ href: s.url }).run();
    setSuggestions(findSuggestions(editor));
    force((n) => n + 1);
  };

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-accent-ink">
        <Link2 size={14} aria-hidden /> Links
      </p>
      <p className="mt-1 text-sm">
        <strong className={cn("text-lg", total >= target ? "text-[#21603a]" : "text-primary")}>{total}</strong> / target {target}
      </p>
      <p className="text-xs text-muted">
        Body: {stats.links.length} ({stats.internal} internal · {stats.external} external) · Boxes: {boxes.planVisit + boxes.glossary + boxes.furtherReading} · Template: {template}
      </p>
      {(stats.duplicates.length > 0 || stats.crowdedSentences.length > 0 || stats.vagueAnchors.length > 0) && (
        <ul className="mt-3 space-y-1 rounded-lg bg-primary-soft p-3 text-xs text-primary" role="alert">
          {stats.duplicates.map((d) => <li key={d}>Duplicate link: {d}</li>)}
          {stats.crowdedSentences.map((s) => <li key={s}>More than 2 links in: “{s}”</li>)}
          {stats.vagueAnchors.map((a, i) => <li key={i}>Vague anchor text: “{a}” — describe the destination instead</li>)}
        </ul>
      )}
      <button
        type="button"
        onClick={() => setSuggestions(findSuggestions(editor))}
        className="mt-3 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-ink hover:border-primary hover:text-primary"
      >
        <Wand2 size={15} aria-hidden /> Suggest links
      </button>
      {suggestions && (
        <div className="mt-3">
          {suggestions.length === 0 ? (
            <p className="text-xs text-muted">No new suggestions — every glossary term is linked or would break the density rules.</p>
          ) : (
            <ul className="max-h-80 space-y-2 overflow-y-auto pr-1">
              {suggestions.map((s) => (
                <li key={s.key} className="rounded-lg border border-border p-2 text-xs">
                  <p>
                    <strong className="text-ink">{s.term}</strong> → <span className="break-all text-muted">{s.url}</span>{" "}
                    <span className="text-muted">({isExternalHref(s.url) ? "external" : "internal"})</span>
                  </p>
                  <p className="mt-0.5 italic text-muted">{s.context}</p>
                  <div className="mt-1.5 flex gap-1.5">
                    <button type="button" onClick={() => accept(s)} className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 font-semibold text-white hover:bg-primary-hover">
                      <Check size={12} aria-hidden /> Accept
                    </button>
                    <button type="button" onClick={() => setSuggestions((l) => (l ?? []).filter((x) => x.key !== s.key))} className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 font-semibold text-ink hover:border-primary">
                      <X size={12} aria-hidden /> Reject
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
