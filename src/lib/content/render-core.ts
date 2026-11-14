import { generateHTML } from "@tiptap/html/server";
import type { JSONContent } from "@tiptap/core";
import { blogExtensions } from "./extensions";
import { enrichArticleHtml } from "./enrich";
import { htmlToText, readingMinutes, sanitizeBlogHtml } from "./sanitize";

/** Empty paragraphs are the blank lines the author typed: keep them, except at the very start/end. */
const EMPTY_P = "(?:<p>(?:\\s|<br\\s*/?>)*</p>)";
const trimEmpty = (html: string) => html.replace(new RegExp(`^(?:\\s*${EMPTY_P})+`), "").replace(new RegExp(`(?:${EMPTY_P}\\s*)+$`), "");

/**
 * Tiptap JSON → enriched (heading ids, day badges, figures, "(opens in new tab)") →
 * sanitized HTML + reading time. Run on the server before saving, and again when a post is shown
 * (see posts.ts), so older posts pick up rendering fixes without being re-saved.
 */
export function renderPostContent(doc: JSONContent) {
  const html = trimEmpty(sanitizeBlogHtml(enrichArticleHtml(generateHTML(doc, blogExtensions))));
  return { html, minutes: readingMinutes(htmlToText(html.replace(/<span class="sr-only">[^<]*<\/span>/g, ""))) };
}
