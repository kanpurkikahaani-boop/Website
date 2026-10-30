import { z } from "zod";

export const CITY_SLUGS = ["kanpur", "lucknow", "agra", "prayagraj", "varanasi", "ayodhya"] as const;
export const SUBSCRIBE_SOURCES = ["home_popup", "home_band", "blog"] as const;
export type SubscribeSource = (typeof SUBSCRIBE_SOURCES)[number];

export const subscribeSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
  cities: z.array(z.enum(CITY_SLUGS)).max(6).default([]),
  source: z.enum(SUBSCRIBE_SOURCES),
  consent: z.literal(true),
  /** Honeypot: real people never see or fill this field. */
  website: z.string().max(0).optional().default(""),
});

export type SubscribeInput = z.input<typeof subscribeSchema>;
export type SubscribeResult = { status: "subscribed" | "exists" } | { status: "error"; message: string };
