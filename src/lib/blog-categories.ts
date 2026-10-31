/** Blog categories (stored as slugs on posts.category). */
export const BLOG_CATEGORIES = [
  { slug: "celebrations", name: "Celebrations" },
  { slug: "food", name: "Food" },
  { slug: "culture-history", name: "Culture & History" },
  { slug: "travel", name: "Travel" },
  { slug: "city-life", name: "City Life" },
  { slug: "people", name: "People" },
] as const;

export function categoryName(slug?: string | null) {
  return BLOG_CATEGORIES.find((c) => c.slug === slug)?.name ?? "";
}
