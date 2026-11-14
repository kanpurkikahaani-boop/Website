import "server-only";
import { absoluteUrl, site } from "@/data/site";
import { getAllPublished } from "@/lib/posts";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
/** CDATA can't contain "]]>": split it so the HTML survives intact. */
const cdata = (s: string) => `<![CDATA[${s.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;

/**
 * RSS 2.0 feed of published stories (v10): title, excerpt, cover image, author, date, link, and
 * the full post with an "Originally published on Kanpur Ki Kahaani" line (feed readers and
 * importers that copy the post keep the link back). Served at /rss.xml, /feed and /blogs/rss.xml.
 */
export async function rssResponse() {
  const posts = (await getAllPublished()).slice(0, 50);
  const items = posts
    .map((p) => {
      const link = absoluteUrl(`/blogs/${p.slug}`);
      const cover = p.coverUrl?.startsWith("https://") ? p.coverUrl : absoluteUrl(`/blogs/${p.slug}/opengraph-image`);
      const type = /\.png(\?|$)/i.test(cover) || cover.endsWith("/opengraph-image") ? "image/png" : /\.webp(\?|$)/i.test(cover) ? "image/webp" : "image/jpeg";
      const credit = `<p><em>Originally published on <a href="${esc(link)}">${esc(site.name)}</a>.</em></p>`;
      return `    <item>
      <title>${esc(p.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate>
      <dc:creator>${esc(p.author)}</dc:creator>
      <description>${esc(p.excerpt || p.seoDescription || "")}</description>
      <media:content url="${esc(cover)}" medium="image" type="${type}" />
      <media:thumbnail url="${esc(cover)}" />
      <content:encoded>${cdata(`<p><img src="${esc(cover)}" alt="${esc(p.coverAlt ?? p.title)}" /></p>${credit}${p.html}`)}</content:encoded>
${p.tags.map((t) => `      <category>${esc(t)}</category>`).join("\n")}
    </item>`;
    })
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${esc(site.name)} — Stories</title>
    <link>${absoluteUrl("/blogs")}</link>
    <atom:link href="${absoluteUrl("/rss.xml")}" rel="self" type="application/rss+xml" />
    <description>${esc("Travel journals and deep-dives on Kanpur and the cities around it.")}</description>
    <language>en-in</language>
    <lastBuildDate>${new Date(posts[0]?.publishedAt ?? Date.now()).toUTCString()}</lastBuildDate>
    <image>
      <url>${absoluteUrl("/icon")}</url>
      <title>${esc(site.name)} — Stories</title>
      <link>${absoluteUrl("/blogs")}</link>
    </image>
${items}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=0, s-maxage=300" } });
}
