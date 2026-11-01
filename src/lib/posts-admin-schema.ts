import { z } from "zod";
import { CITY_SLUGS } from "@/lib/newsletter/schema";

export const slugRe = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function slugifyTitle(title: string) {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().transform((v) => (v ? v : null));

/** Links in the article boxes: https URLs or internal paths only (never javascript: etc.). */
const linkUrl = z.string().trim().max(600).refine((u) => /^https:\/\//.test(u) || /^\/(?!\/)/.test(u), "Links must be https:// or an internal /path");

/** Validated on the server for every save — never trust what the editor sends. */
export const postInputSchema = z.object({
  id: z.uuid().optional(),
  title: z.string().trim().min(3, "Title is too short").max(160),
  slug: z.string().trim().max(90).regex(slugRe, "Use lowercase letters, numbers and hyphens"),
  excerpt: z.string().trim().max(320).default(""),
  contentJson: z.record(z.string(), z.unknown()).refine((d) => d.type === "doc", "Invalid document"),
  coverUrl: optionalText(500).refine((v) => !v || /^https:\/\//.test(v) || v.startsWith("/images/"), "Cover must be an https or /images URL"),
  coverAlt: optionalText(200),
  city: z.enum(CITY_SLUGS).nullable().optional().transform((v) => v ?? null),
  tags: z.array(z.string().trim().toLowerCase().regex(/^[a-z0-9-]{1,30}$/)).max(10).default([]),
  seoTitle: optionalText(100),
  seoDescription: optionalText(170),
  status: z.enum(["draft", "published"]),
  publishedAt: z.string().optional().transform((v) => (v ? v : null)),
  // ── Rich article fields (all optional) ──
  authorId: z.uuid().nullable().optional().transform((v) => v ?? null),
  category: optionalText(40),
  standfirst: optionalText(320),
  titleEmphasis: optionalText(120),
  pullQuote: optionalText(400),
  coverCaption: optionalText(200),
  coverCredit: optionalText(240),
  coverFocal: z.string().regex(/^\d{1,3}% \d{1,3}%$/).nullish().transform((v) => v ?? null),
  keyFacts: z.array(z.object({ label: z.string().trim().min(1).max(40), value: z.string().trim().min(1).max(200) })).max(12).default([]),
  furtherReading: z.array(z.object({ title: z.string().trim().min(1).max(160), url: linkUrl, publisher: z.string().trim().max(80).default("") })).max(40).default([]),
  glossary: z.array(z.object({ term: z.string().trim().min(1).max(60), definition: z.string().trim().min(1).max(240), url: linkUrl, source: z.string().trim().max(60).default("") })).max(30).default([]),
  planVisit: z.array(z.object({ group: z.string().trim().min(1).max(40), label: z.string().trim().min(1).max(100), url: linkUrl })).max(30).default([]),
});

export type PostInput = z.input<typeof postInputSchema>;
