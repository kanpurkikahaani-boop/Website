import { rssResponse } from "@/lib/rss";

export const revalidate = 300;

/** RSS feed of published stories (see src/lib/rss.ts). */
export const GET = () => rssResponse();
