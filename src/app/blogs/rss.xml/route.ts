import { rssResponse } from "@/lib/rss";

export const revalidate = 300;

/** Original feed address (kept working); the same feed is at /rss.xml and /feed. */
export const GET = () => rssResponse();
