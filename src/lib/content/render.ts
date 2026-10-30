import "server-only";
import { generateHTML } from "@tiptap/html/server";
import type { JSONContent } from "@tiptap/core";
import { blogExtensions } from "./extensions";
import { htmlToText, readingMinutes, sanitizeBlogHtml } from "./sanitize";

/** Tiptap JSON → sanitized HTML + reading time. Always run on the server before saving. */
export function renderPostContent(doc: JSONContent) {
  const html = sanitizeBlogHtml(generateHTML(doc, blogExtensions));
  return { html, minutes: readingMinutes(htmlToText(html)) };
}
