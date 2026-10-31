/**
 * Checks every link in the ARTICLE AREA of a rendered blog page (groups A–H marked with
 * data-link-group) and writes reports/<slug>-links.json.
 *
 *   npx tsx scripts/check-links.ts [pageUrl] [--structure-only] [--min=100]
 *
 * Rules checked: no URL repeated · ≤2 links per sentence · no adjacent links · no vague anchors ·
 * external = target=_blank + rel="noopener noreferrer" + sr-only "(opens in new tab)" ·
 * internal = same tab. Then (unless --structure-only) every link is fetched: HEAD → GET
 * fallback, 10 s, redirects followed; Wikipedia pages are also checked for disambiguation;
 * #fragments must exist on the target page. Exits 1 if any rule fails or fewer than --min
 * links return 2xx.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { Parser } from "htmlparser2";
import { checkUrl, pool, type LinkResult } from "../src/lib/link-check";

const args = process.argv.slice(2);
const pageUrl = args.find((a) => !a.startsWith("--")) ?? "http://localhost:3000/blogs/navaratri-in-kanpur";
const structureOnly = args.includes("--structure-only");
const min = Number(args.find((a) => a.startsWith("--min="))?.slice(6) ?? 100);

const GROUPS: Record<string, string> = {
  A: "Inline (author's text)",
  B: "Table of contents",
  C: "Plan your visit",
  D: "Glossary",
  E: "Further reading & sources",
  F: "More to explore (internal)",
  G: "Tags",
  H: "Author box",
};
const VAGUE = /^(click here|here|this link|read more|link|this|learn more)$/i;

interface Found {
  group: string;
  href: string;
  text: string;
  target: string | null;
  rel: string | null;
  srOnly: boolean;
  ariaLabel: string | null;
}

function parse(html: string) {
  const links: Found[] = [];
  const ids = new Set<string>();
  const paragraphs: { tokens: (string | { link: number })[] }[] = [];
  const seenGroupInstance = new Set<string>();

  let depth = 0;
  const groupStack: { group: string; depth: number; skip: boolean }[] = [];
  let a: (Found & { depth: number }) | null = null;
  let srDepth = -1;
  let para: { tokens: (string | { link: number })[]; depth: number } | null = null;

  const current = () => groupStack.at(-1);
  const p = new Parser(
    {
      onopentag(name, attrs) {
        depth++;
        if (attrs.id) ids.add(attrs.id);
        if (attrs["data-link-group"]) {
          const g = attrs["data-link-group"];
          // The TOC and plan card render twice (mobile + desktop); count the first instance only.
          const skip = (g === "B" || g === "C") && seenGroupInstance.has(g);
          seenGroupInstance.add(g);
          groupStack.push({ group: g, depth, skip });
        }
        const g = current();
        if (g?.group === "A" && !g.skip && (name === "p" || name === "li") && !para) para = { tokens: [], depth };
        if (name === "span" && /\bsr-only\b/.test(attrs.class ?? "") && a) srDepth = depth;
        if (name === "a" && g && !g.skip && attrs.href) {
          a = { group: g.group, href: attrs.href, text: "", target: attrs.target ?? null, rel: attrs.rel ?? null, srOnly: false, ariaLabel: attrs["aria-label"] ?? null, depth };
          if (para) para.tokens.push({ link: links.length });
        }
      },
      ontext(t) {
        if (a) {
          if (srDepth >= 0) a.srOnly ||= /opens in (a )?new tab/i.test(t);
          else a.text += t;
          return;
        }
        if (para) para.tokens.push(t);
      },
      onclosetag(name) {
        if (a && name === "span" && depth === srDepth) srDepth = -1;
        if (a && name === "a" && depth === a.depth) {
          const { depth: _d, ...rest } = a; // eslint-disable-line @typescript-eslint/no-unused-vars
          links.push({ ...rest, text: rest.text.replace(/\s+/g, " ").trim() });
          a = null;
        }
        if (para && depth === para.depth) {
          paragraphs.push({ tokens: para.tokens });
          para = null;
        }
        if (current()?.depth === depth) groupStack.pop();
        depth--;
      },
    },
    { decodeEntities: true },
  );
  p.write(html);
  p.end();
  return { links, ids, paragraphs };
}

function densityProblems(paragraphs: { tokens: (string | { link: number })[] }[], links: Found[]) {
  const crowded: string[] = [];
  const adjacent: string[] = [];
  for (const { tokens } of paragraphs) {
    // Sentence split on . ! ? followed by space (or end), keeping link tokens in order.
    let count = 0;
    let sentence = "";
    let lastWasLink = false;
    let between = "";
    const flush = () => {
      if (count > 2) crowded.push(sentence.trim().slice(0, 140));
      count = 0;
      sentence = "";
    };
    for (const tok of tokens) {
      if (typeof tok === "string") {
        const parts = tok.split(/(?<=[.!?]["”’)]?)\s+/);
        parts.forEach((part, i) => {
          if (i > 0) flush();
          sentence += part;
          if (lastWasLink) between += part;
        });
        if (parts.length > 1) lastWasLink = false;
      } else {
        const l = links[tok.link];
        if (lastWasLink && /^[\s,;:&–—-]*(and|or)?[\s,;:&–—-]*$/i.test(between)) adjacent.push(l.text);
        count++;
        sentence += l.text;
        lastWasLink = true;
        between = "";
      }
    }
    flush();
  }
  return { crowded, adjacent };
}

const isExternal = (href: string, origin: string) => /^https?:\/\//i.test(href) && new URL(href).origin !== origin;

async function main() {
  const origin = new URL(pageUrl).origin;
  const res = await fetch(pageUrl, { cache: "no-store" });
  if (!res.ok) throw new Error(`Could not load ${pageUrl}: HTTP ${res.status}`);
  const html = await res.text();
  const { links, ids, paragraphs } = parse(html);

  const problems: string[] = [];
  // Uniqueness across the whole article area.
  const byUrl = new Map<string, Found[]>();
  for (const l of links) byUrl.set(l.href, [...(byUrl.get(l.href) ?? []), l]);
  for (const [u, ls] of byUrl) if (ls.length > 1) problems.push(`URL used ${ls.length}× (${ls.map((l) => l.group).join(",")}): ${u}`);
  // Target/rel + anchor text.
  for (const l of links) {
    const ext = isExternal(l.href, origin);
    if (ext) {
      if (l.target !== "_blank") problems.push(`External link without target=_blank: ${l.href}`);
      const rel = (l.rel ?? "").split(/\s+/);
      if (!rel.includes("noopener") || !rel.includes("noreferrer")) problems.push(`External link without rel="noopener noreferrer": ${l.href}`);
      if (!l.srOnly && !/new tab/i.test(l.ariaLabel ?? "")) problems.push(`External link without "(opens in new tab)" text: ${l.href}`);
    } else if (l.target) problems.push(`Internal link opens a new tab: ${l.href}`);
    const label = l.text || l.ariaLabel || "";
    if (!label) problems.push(`Link without text: ${l.href}`);
    else if (VAGUE.test(label) && l.group !== "D") problems.push(`Vague anchor "${label}": ${l.href}`);
  }
  const { crowded, adjacent } = densityProblems(paragraphs, links);
  crowded.forEach((s) => problems.push(`More than 2 links in sentence: “${s}…”`));
  adjacent.forEach((t) => problems.push(`Adjacent links near “${t}”`));

  // Verification.
  const unique = [...byUrl.keys()];
  const results = new Map<string, LinkResult & { group: string; text: string }>();
  if (!structureOnly) {
    const pageCache = new Map<string, Promise<string>>();
    const verified = await pool(unique, 6, async (href): Promise<LinkResult> => {
      if (href.startsWith("#")) {
        const id = decodeURIComponent(href.slice(1));
        return { url: href, status: ids.has(id) ? "ok" : "broken", code: null, note: ids.has(id) ? "fragment on this page" : "missing #id on this page" };
      }
      const abs = new URL(href, pageUrl);
      const frag = abs.hash.slice(1);
      abs.hash = "";
      const wiki = /(^|\.)wikipedia\.org$/.test(abs.hostname);
      const r = await checkUrl(abs.toString(), { wantBody: wiki || !!frag });
      const out: LinkResult = { url: href, status: r.status, code: r.code, finalUrl: r.finalUrl, note: r.note };
      if (r.status === "ok" && wiki && /id="disambigbox"|mw-disambig|class="[^"]*\bdmbox\b/.test(r.body ?? "")) {
        out.status = "broken";
        out.note = "Wikipedia disambiguation page";
      }
      if (r.status === "ok" && frag) {
        if (!pageCache.has(abs.toString())) pageCache.set(abs.toString(), Promise.resolve(r.body ?? ""));
        const body = await pageCache.get(abs.toString())!;
        if (!new RegExp(`id=["']${frag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`).test(body)) {
          out.status = "broken";
          out.note = `missing #${frag} on target page`;
        }
      }
      return out;
    });
    verified.forEach((r) => {
      const first = byUrl.get(r.url)![0];
      results.set(r.url, { ...r, group: first.group, text: first.text || first.ariaLabel || "" });
    });
  }

  const groups = Object.fromEntries(
    Object.entries(GROUPS).map(([k, name]) => {
      const ls = links.filter((l) => l.group === k);
      return [k, { name, count: ls.length, internal: ls.filter((l) => !isExternal(l.href, origin)).length, external: ls.filter((l) => isExternal(l.href, origin)).length }];
    }),
  );
  const list = links.map((l) => {
    const r = results.get(l.href);
    return {
      group: l.group,
      anchor: l.text || l.ariaLabel || "",
      url: l.href,
      type: isExternal(l.href, origin) ? "external" : "internal",
      status: structureOnly ? "not-checked" : (r?.status ?? "not-checked"),
      code: r?.code ?? null,
      ...(r?.finalUrl ? { finalUrl: r.finalUrl } : {}),
      ...(r?.note ? { note: r.note } : {}),
    };
  });
  const ok = [...results.values()].filter((r) => r.status === "ok").length;
  const report = {
    page: pageUrl,
    generatedAt: new Date().toISOString(),
    verified: !structureOnly,
    totals: {
      links: links.length,
      unique: unique.length,
      internal: list.filter((l) => l.type === "internal").length,
      external: list.filter((l) => l.type === "external").length,
      ok: structureOnly ? null : ok,
      broken: structureOnly ? null : [...results.values()].filter((r) => r.status === "broken").length,
      blocked: structureOnly ? null : [...results.values()].filter((r) => r.status === "blocked").length,
      skipped: structureOnly ? null : [...results.values()].filter((r) => r.status === "skipped").length,
    },
    groups,
    problems,
    links: list,
  };
  const slug = new URL(pageUrl).pathname.split("/").filter(Boolean).pop() ?? "page";
  mkdirSync("reports", { recursive: true });
  const out = `reports/${slug}-links.json`;
  writeFileSync(out, JSON.stringify(report, null, 2) + "\n");

  console.log(`Article-area links: ${links.length} (${unique.length} unique) — internal ${report.totals.internal}, external ${report.totals.external}`);
  for (const [k, g] of Object.entries(groups)) console.log(`  ${k} ${g.name.padEnd(28)} ${String(g.count).padStart(3)}`);
  if (problems.length) {
    console.log(`\n${problems.length} rule problem(s):`);
    problems.forEach((p) => console.log("  ✗ " + p));
  } else console.log("\nRules: no duplicates, density OK, target/rel OK, anchors OK");
  if (!structureOnly) {
    console.log(`\nVerified: ${ok} ok · ${report.totals.broken} broken · ${report.totals.blocked} blocked · ${report.totals.skipped} skipped`);
    list.filter((l) => l.status !== "ok").forEach((l) => console.log(`  ${l.status.padEnd(7)} ${l.code ?? "—"} ${l.url}${l.note ? ` (${l.note})` : ""}`));
  }
  console.log(`\nReport: ${out}`);
  const fail = problems.length > 0 || (!structureOnly && ok < min) || unique.length < min;
  if (fail) {
    console.error(`\nFAIL${unique.length < min ? ` — only ${unique.length} unique links (min ${min})` : ""}${!structureOnly && ok < min ? ` — only ${ok} verified (min ${min})` : ""}`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
