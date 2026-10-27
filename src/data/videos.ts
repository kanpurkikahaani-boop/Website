import type { Video } from "./types";

/**
 * "Kanpur in Motion" videos on the home page.
 * ⚠️ PLACEHOLDER IDS — replace each `id` with a real 11-character YouTube video ID
 * (the part after `watch?v=`). Until then the card shows a branded poster and
 * clicking it opens a YouTube search for the caption instead of an embed.
 */
export const VIDEO_ID_PLACEHOLDER = "REPLACE_ME";

export const videos: Video[] = [
  { id: VIDEO_ID_PLACEHOLDER, title: "Kanpur city tour film", caption: "Kanpur city tour film" },
  { id: VIDEO_ID_PLACEHOLDER, title: "Street food trail through Kanpur", caption: "Street food trail through Kanpur" },
  { id: VIDEO_ID_PLACEHOLDER, title: "Heritage walk: old Cawnpore", caption: "Heritage walk: old Cawnpore" },
];

export function isRealVideoId(id: string) {
  return /^[A-Za-z0-9_-]{11}$/.test(id);
}
