import "server-only";
import { createHash, randomUUID } from "node:crypto";

/**
 * Public view counts (v10). A view is counted at most once per visitor per post per 24 hours
 * (enforced in the database by record_post_view), never for bots/crawlers, and never for the
 * team: anyone with the admin hint cookie is shown the number without being counted.
 */
export const VISITOR_COOKIE = "kkk_vid";
export const VISITOR_MAX_AGE = 60 * 60 * 24 * 365; // one year

/** Crawlers, link previewers, monitoring and headless tools. */
const BOT_UA =
  /bot\b|bot\/|crawl|spider|slurp|mediapartners|facebookexternalhit|facebot|embedly|quora link preview|outbrain|pinterest|vkshare|w3c_validator|whatsapp|telegrambot|discordbot|slackbot|skypeuripreview|bingpreview|yandex|baidu|duckduckgo|applebot|semrush|ahrefs|mj12|dotbot|petalbot|bytespider|gptbot|claudebot|perplexity|ccbot|headlesschrome|phantomjs|lighthouse|pagespeed|chrome-lighthouse|gtmetrix|pingdom|uptimerobot|statuscake|curl\/|wget\/|python-requests|python-urllib|aiohttp|httpx|go-http-client|okhttp|java\/|libwww|node-fetch|axios\/|postmanruntime|insomnia|preview/i;

export function isBot(userAgent: string | null | undefined) {
  const ua = (userAgent ?? "").trim();
  return ua.length < 12 || BOT_UA.test(ua);
}

/** A valid visitor id from the cookie, or a new one (the caller sets the cookie). */
export function visitorId(cookieValue: string | undefined) {
  return cookieValue && /^[0-9a-f-]{36}$/.test(cookieValue) ? { id: cookieValue, isNew: false } : { id: randomUUID(), isNew: true };
}

/** Only this hash is stored, never the cookie value itself. */
export const visitorHash = (id: string) => createHash("sha256").update(`kkk-view:${id}`).digest("hex");
