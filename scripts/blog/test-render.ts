/** npm run test:blog — renderer, sanitizer and syndication-format checks (no network, no DB). */
import assert from "node:assert/strict";
import { renderPostContent } from "../../src/lib/content/render-core";

let passed = 0;
const t = (name: string, fn: () => void) => {
  fn();
  passed++;
  console.log(`✓ ${name}`);
};

const doc = {
  type: "doc",
  content: [
    { type: "paragraph" }, // leading blank line: trimmed
    { type: "paragraph", content: [{ type: "text", text: "Georgia text", marks: [{ type: "textStyle", attrs: { fontFamily: "Georgia, serif", fontSize: "1.25em" } }] }] },
    { type: "paragraph" }, // blank line typed by the author: kept
    { type: "paragraph" },
    { type: "paragraph", content: [{ type: "text", text: "Display", marks: [{ type: "textStyle", attrs: { fontFamily: "var(--font-display)" } }] }, { type: "text", text: " evil", marks: [{ type: "textStyle", attrs: { fontFamily: "x; background:url(javascript:1)", fontSize: "99px" } }] }] },
    { type: "figureImage", attrs: { src: "https://x.supabase.co/a.jpg", alt: "Ghat", width: 50, align: "right", originalSrc: "https://x.supabase.co/o.jpg", crop: { x: 1, y: 2, width: 3, height: 4 }, naturalWidth: 800, naturalHeight: 450 }, content: [{ type: "text", text: "A caption" }] },
    { type: "figureImage", attrs: { src: "https://x.supabase.co/b.jpg", alt: "", width: 100 } },
    { type: "paragraph", content: [{ type: "text", text: "Times", marks: [{ type: "textStyle", attrs: { fontFamily: "Times New Roman, Times, serif" } }] }] },
    { type: "paragraph" }, // trailing blank: trimmed
  ],
};
const html = renderPostContent(doc as never).html;

t("blank lines between paragraphs are kept; leading/trailing ones trimmed", () => {
  assert.equal((html.match(/<p><\/p>/g) ?? []).length, 2);
  assert.ok(!html.startsWith("<p></p>") && !html.endsWith("<p></p>"));
});
t("allowed fonts and sizes survive", () => {
  assert.match(html, /<span style="font-family:Georgia, serif;font-size:1\.25em">Georgia text<\/span>/);
  assert.match(html, /font-family:var\(--font-display\)/);
  assert.match(html, /font-family:(&quot;)?Times New Roman(&quot;)?, Times, serif/);
});
t("unknown fonts / sizes / CSS are stripped", () => {
  assert.ok(!/javascript|background|99px/.test(html), html);
});
t("figure: class, width, alt, intrinsic size, caption; editor-only data dropped", () => {
  assert.match(html, /<figure class="kkk-figure align-right is-sized" style="width:50%"><img src="https:\/\/x\.supabase\.co\/a\.jpg" alt="Ghat" loading="lazy" width="800" height="450" \/><figcaption class="kkk-caption">A caption<\/figcaption><\/figure>/);
  assert.ok(!/data-original-src|data-crop|o\.jpg/.test(html), "original/crop must not reach readers");
});
t("full-width figure has no inline width", () => {
  assert.match(html, /<figure class="kkk-figure align-center"><img src="https:\/\/x\.supabase\.co\/b\.jpg"/);
});

t("images: https kept, other http dropped", () => {
  const h = renderPostContent({ type: "doc", content: [{ type: "figureImage", attrs: { src: "http://evil.example.com/x.jpg", alt: "x" } }, { type: "figureImage", attrs: { src: "https://ok.example.com/y.jpg", alt: "y" } }] } as never).html;
  assert.ok(!h.includes("evil.example.com"), h);
  assert.ok(h.includes("https://ok.example.com/y.jpg"));
});

console.log(`\n${passed} passed`);
