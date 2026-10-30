import { CATEGORY_HINTS, CITY_KEYWORDS, DEFAULT_GENRE, GENRE_KEYWORDS, NEWS_CITIES, type Genre, type NewsCity } from "./taxonomy";

const norm = (s: string) => ` ${s.toLowerCase().replace(/\s+/g, " ")} `;

function hits(text: string, words: string[]) {
  let n = 0;
  for (const w of words) {
    const isLatin = /^[a-z0-9 ]+$/.test(w.trim());
    if (isLatin) {
      // word-boundary match for Latin keywords (so "bhu" doesn't match "bhutan")
      const re = new RegExp(`(^|[^a-z0-9])${w.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`, "i");
      if (re.test(text)) n++;
    } else if (text.includes(w)) {
      n++;
    }
  }
  return n;
}

/** City: the feed's default city, else the city with the most keyword hits; null if none match. */
export function classifyCity(text: string, feedCity?: NewsCity): NewsCity | null {
  if (feedCity) return feedCity;
  const t = norm(text);
  let best: NewsCity | null = null;
  let bestHits = 0;
  for (const c of NEWS_CITIES) {
    const h = hits(t, CITY_KEYWORDS[c]);
    if (h > bestHits) {
      best = c;
      bestHits = h;
    }
  }
  return best;
}

/** Genre: feed default → feed category → keyword dictionary → "Local News". */
export function classifyGenre(text: string, categories: string[] = [], feedGenre?: Genre): Genre {
  if (feedGenre) return feedGenre;
  for (const cat of categories) for (const [re, g] of CATEGORY_HINTS) if (re.test(cat)) return g;
  const t = norm(text);
  let best: Genre = DEFAULT_GENRE;
  let bestHits = 0;
  for (const [g, words] of Object.entries(GENRE_KEYWORDS) as [Genre, string[]][]) {
    const h = hits(t, words);
    if (h > bestHits) {
      best = g;
      bestHits = h;
    }
  }
  return best;
}
