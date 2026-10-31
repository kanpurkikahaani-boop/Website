import { z } from "zod";
import { CITY_SLUGS } from "@/lib/newsletter/schema";

export const EVENT_CATEGORIES = [
  { value: "cultural", label: "Cultural" },
  { value: "music", label: "Music" },
  { value: "comedy", label: "Comedy" },
  { value: "sports", label: "Sports" },
  { value: "expo", label: "Expo" },
  { value: "festival", label: "Festival" },
  { value: "literature", label: "Literature" },
  { value: "workshop", label: "Workshop" },
  { value: "theatre", label: "Theatre" },
] as const;
export type EventCategory = (typeof EVENT_CATEGORIES)[number]["value"];
export const EVENT_CATEGORY_VALUES = EVENT_CATEGORIES.map((c) => c.value) as [EventCategory, ...EventCategory[]];

export function categoryLabel(v: string) {
  return EVENT_CATEGORIES.find((c) => c.value === v)?.label ?? v;
}

export const BMS_URL_RE = /^https:\/\/in\.bookmyshow\.com\/.+/;

const optionalUrl = (re: RegExp, msg: string) =>
  z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || re.test(v), msg);

/** Server-side validation for every admin save. */
export const eventInputSchema = z
  .object({
    id: z.uuid().optional(),
    title: z.string().trim().min(3, "Title is too short").max(160),
    category: z.enum(EVENT_CATEGORY_VALUES),
    city: z.enum(CITY_SLUGS),
    venue: z.string().trim().max(200).default(""),
    startAt: z.iso.datetime({ offset: true }),
    endAt: z.iso.datetime({ offset: true }).optional().or(z.literal("")).transform((v) => (v ? v : null)),
    imageUrl: optionalUrl(/^https:\/\//, "Image must be an https URL"),
    bmsUrl: optionalUrl(BMS_URL_RE, "BookMyShow link must start with https://in.bookmyshow.com/"),
    sourceUrl: optionalUrl(/^https:\/\//, "Details link must be an https URL"),
    status: z.enum(["draft", "published", "archived"]),
  })
  .refine((e) => !e.endAt || e.endAt >= e.startAt, { message: "End must be after start", path: ["endAt"] });

export type EventInput = z.input<typeof eventInputSchema>;
