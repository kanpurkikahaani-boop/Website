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
  seoTitle: optionalText(70),
  seoDescription: optionalText(170),
  status: z.enum(["draft", "published"]),
  publishedAt: z.string().optional().transform((v) => (v ? v : null)),
});

export type PostInput = z.input<typeof postInputSchema>;
