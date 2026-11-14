/**
 * Fonts and text sizes offered in the blog editor (v10). Shared by the editor's dropdowns and the
 * sanitizer, so a font can only reach the published page if it is in this list.
 *
 * The site's own fonts are loaded by next/font under generated family names, so they are referred
 * to through the CSS variables the site already defines (--font-display / --font-sans). The other
 * fonts are common system fonts with fallbacks (phones without Tahoma or Verdana use the fallback).
 * Values are written without quotes so they survive the style-attribute round trip unchanged.
 */
export const BLOG_FONTS: { label: string; value: string }[] = [
  { label: "Default", value: "" },
  { label: "Playfair Display (site headings)", value: "var(--font-display)" },
  { label: "Plus Jakarta Sans (site text)", value: "var(--font-sans)" },
  { label: "Arial", value: "Arial, Helvetica, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Times New Roman", value: "Times New Roman, Times, serif" },
  { label: "Verdana", value: "Verdana, Geneva, sans-serif" },
  { label: "Tahoma", value: "Tahoma, Geneva, sans-serif" },
  { label: "Trebuchet MS", value: "Trebuchet MS, Helvetica, sans-serif" },
  { label: "Courier New", value: "Courier New, Courier, monospace" },
];

/** Relative sizes (em) so text scales with the article body on every screen. */
export const BLOG_SIZES: { label: string; value: string }[] = [
  { label: "Small", value: "0.875em" },
  { label: "Normal", value: "" },
  { label: "Large", value: "1.25em" },
  { label: "Extra large", value: "1.5em" },
];

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Regexes the sanitizer accepts for `font-family` (quotes and spacing are tolerated). */
export const FONT_FAMILY_PATTERNS: RegExp[] = BLOG_FONTS.filter((f) => f.value).map(
  (f) => new RegExp(`^${f.value.split(",").map((part) => `["']?${esc(part.trim())}["']?`).join("\\s*,\\s*")}$`, "i"),
);

/** Regexes the sanitizer accepts for `font-size`. */
export const FONT_SIZE_PATTERNS: RegExp[] = BLOG_SIZES.filter((s) => s.value).map((s) => new RegExp(`^${esc(s.value)}$`));

/** Normalise a stored font-family for comparison with the list (drops quotes and extra spaces). */
export const normaliseFont = (v: string | null | undefined) => (v ?? "").replace(/["']/g, "").replace(/\s*,\s*/g, ", ").trim();
