import { isExternalHref } from "./enrich";

/** Minimal Tiptap JSON shape used for link analysis. */
export interface JNode {
  type?: string;
  text?: string;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  content?: JNode[];
  attrs?: Record<string, unknown>;
}

export interface LinkInfo {
  href: string;
  text: string;
  external: boolean;
}

export interface LinkStats {
  links: LinkInfo[];
  internal: number;
  external: number;
  duplicates: string[];
  crowdedSentences: string[];
  vagueAnchors: string[];
}

const VAGUE = /^(click here|here|this link|read more|link|this)$/i;

/** Walk paragraphs/list items, collecting links and checking the density rules. */
export function analyzeLinks(doc: JNode): LinkStats {
  const links: LinkInfo[] = [];
  const crowded: string[] = [];

  const visitBlock = (block: JNode) => {
    if (block.type === "heading") return;
    const inline = (block.content ?? []).filter((n) => n.type === "text");
    if (!inline.length) {
      (block.content ?? []).forEach(visitBlock);
      return;
    }
    // Build the block's text and remember which character ranges are links.
    let text = "";
    const spans: { start: number; end: number; href: string }[] = [];
    let current: { start: number; href: string } | null = null;
    for (const n of inline) {
      const href = n.marks?.find((m) => m.type === "link")?.attrs?.href as string | undefined;
      const t = n.text ?? "";
      if (href && current?.href === href) {
        // contiguous run of the same link
      } else {
        if (current) spans.push({ ...current, end: text.length });
        current = href ? { start: text.length, href } : null;
      }
      text += t;
    }
    if (current) spans.push({ ...current, end: text.length });
    for (const s of spans) links.push({ href: s.href, text: text.slice(s.start, s.end).trim(), external: isExternalHref(s.href) });

    // Sentence check: at most 2 links per sentence.
    const sentences = text.split(/(?<=[.!?])\s+(?=[A-Z0-9"“])/);
    let offset = 0;
    for (const sent of sentences) {
      const start = text.indexOf(sent, offset);
      const end = start + sent.length;
      offset = end;
      const n = spans.filter((s) => s.start >= start && s.start < end).length;
      if (n > 2) crowded.push(sent.length > 90 ? sent.slice(0, 87) + "…" : sent);
    }
  };
  (doc.content ?? []).forEach(visitBlock);

  const seen = new Map<string, number>();
  for (const l of links) seen.set(l.href, (seen.get(l.href) ?? 0) + 1);
  return {
    links,
    internal: links.filter((l) => !l.external).length,
    external: links.filter((l) => l.external).length,
    duplicates: [...seen.entries()].filter(([, c]) => c > 1).map(([h]) => h),
    crowdedSentences: crowded,
    vagueAnchors: links.filter((l) => VAGUE.test(l.text)).map((l) => l.text),
  };
}
