export type DisplayStatus = "draft" | "scheduled" | "published";

/** Published with a future date = Scheduled (RLS hides it from visitors until then). */
export function displayStatus(status: string, publishedAt: string | null | undefined, now = Date.now()): DisplayStatus {
  if (status !== "published") return "draft";
  return publishedAt && Date.parse(publishedAt) > now ? "scheduled" : "published";
}
