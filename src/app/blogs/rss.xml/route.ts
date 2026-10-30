import { absoluteUrl, site } from "@/data/site";
import { getAllPublished } from "@/lib/posts";

export const revalidate = 300;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** RSS 2.0 feed of published stories at /blogs/rss.xml */
export async function GET() {
  const posts = (await getAllPublished()).slice(0, 50);
  const items = posts
    .map((p) => {
      const link = absoluteUrl(`/blogs/${p.slug}`);
      return `    <item>
      <title>${esc(p.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate>
      <description>${esc(p.excerpt)}</description>
${p.tags.map((t) => `      <category>${esc(t)}</category>`).join("\n")}
    </item>`;
    })
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(site.name)} — Stories</title>
    <link>${absoluteUrl("/blogs")}</link>
    <atom:link href="${absoluteUrl("/blogs/rss.xml")}" rel="self" type="application/rss+xml" />
    <description>${esc("Travel journals and deep-dives on Kanpur and the cities around it.")}</description>
    <language>en-in</language>
    <lastBuildDate>${new Date(posts[0]?.publishedAt ?? Date.now()).toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
