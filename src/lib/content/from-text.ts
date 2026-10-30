import type { JSONContent } from "@tiptap/core";

/** Convert the legacy "paragraphs + `## ` headings" post format into a Tiptap document. */
export function textToTiptap(body: string): JSONContent {
  const blocks = body.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  return {
    type: "doc",
    content: blocks.map((b) =>
      b.startsWith("## ")
        ? { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: b.slice(3) }] }
        : { type: "paragraph", content: [{ type: "text", text: b }] },
    ),
  };
}
