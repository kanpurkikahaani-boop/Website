import type { GlossaryItem, KeyFact, PlanItem, ReadingItem } from "@/lib/posts";

/**
 * Empty values for a new post's article fields. Lives outside the "use client" editor module:
 * values exported from a client module reach server components only as references, not data.
 */
export const EMPTY_RICH_FIELDS = {
  authorId: "",
  category: "",
  standfirst: "",
  titleEmphasis: "",
  pullQuote: "",
  coverCaption: "",
  coverCredit: "",
  coverFocal: "",
  keyFacts: [] as KeyFact[],
  furtherReading: [] as ReadingItem[],
  glossary: [] as GlossaryItem[],
  planVisit: [] as PlanItem[],
};
