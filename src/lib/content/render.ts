import "server-only";
import { generateHTML } from "@tiptap/html/server";
import type { JSONContent } from "@tiptap/core";
import { blogExtensions } from "./extensions";
import { enrichArticleHtml } from "./enrich";
import { htmlToText, readingMinutes, sanitizeBlogHtml } from "./sanitize";

/**
 * Tiptap JSON → enriched (heading ids, day badges, figures, "(opens in new tab)") →
 * sanitized HTML + reading time. Always run on the server before saving.
 */
export function renderPostContent(doc: JSONContent) {
  const html = sanitizeBlogHtml(enrichArticleHtml(generateHTML(doc, blogExtensions))).replace(/<p>\s*<\/p>/g, "");
  return { html, minutes: readingMinutes(htmlToText(html.replace(/<span class="sr-only">[^<]*<\/span>/g, ""))) };
}
