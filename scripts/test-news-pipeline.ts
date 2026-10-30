/** Fixture-based tests for feed parsing → stored rows (no network). */
import assert from "node:assert/strict";
import type { NewsSource } from "../src/data/newsSources";
import { parser, toRow } from "../src/lib/news/to-row";

const now = new Date("2026-10-30T06:00:00+05:30");
const recent = new Date(now.getTime() - 2 * 3600e3).toUTCString();
const old = new Date(now.getTime() - 40 * 864e5).toUTCString();

const publisherFeed = `<?xml version="1.0"?><rss version="2.0"><channel><title>City</title>
<item><title>Green Park pitch ready for Kanpur Test match</title><link>https://example-paper.in/kanpur/green-park-test?utm_source=rss&amp;id=7</link>
<description><![CDATA[<p><img src="https://example-paper.in/photo.jpg"/>The Green Park groundstaff have prepared a fresh pitch ahead of the Test, with curators expecting turn from day three. Full report inside with many more paragraphs of article text that must never be stored in full by the aggregator.</p>]]></description>
<category>Sports</category><pubDate>${recent}</pubDate></item>
<item><title>Kanpur: Green Park pitch ready (repost)</title><link>https://example-paper.in/kanpur/green-park-test?utm_medium=x&amp;id=7</link><pubDate>${recent}</pubDate></item>
<item><title>Delhi metro fare hike announced</title><link>https://example-paper.in/delhi/metro</link><pubDate>${recent}</pubDate></item>
<item><title>Old Kanpur story</title><link>https://example-paper.in/kanpur/old</link><pubDate>${old}</pubDate></item>
</channel></rss>`;

const googleFeed = `<?xml version="1.0"?><rss version="2.0"><channel><title>Google News</title>
<item><title>लखनऊ में बारिश से मौसम सुहाना - Amar Ujala</title><link>https://news.google.com/rss/articles/CBMiabc?oc=5</link>
<description>&lt;a href="https://news.google.com/rss/articles/CBMiabc"&gt;लखनऊ में बारिश से मौसम सुहाना&lt;/a&gt;&amp;nbsp;&amp;nbsp;&lt;font color="#6f6f6f"&gt;Amar Ujala&lt;/font&gt;</description>
<pubDate>${recent}</pubDate><source url="https://www.amarujala.com">Amar Ujala</source></item>
</channel></rss>`;

const national: NewsSource = { name: "Example Paper", homepage: "https://example-paper.in", feedUrl: "x", language: "en", scope: "national", active: true, verifiedAt: "" };
const gnews: NewsSource = { name: "Google News", homepage: "https://news.google.com", feedUrl: "y", language: "hi", scope: "aggregator", city: "lucknow", genre: "weather-environment", active: true, verifiedAt: "" };

(async () => {
  const a = await parser.parseString(publisherFeed);
  const rows = a.items.map((i) => toRow(i, national, now)).filter(Boolean);
  // Delhi story dropped (no matching city), 40-day-old story dropped
  assert.equal(rows.length, 2);
  const [r] = rows;
  assert.equal(r!.city, "kanpur");
  assert.equal(r!.genre, "sports");
  assert.equal(r!.url, "https://example-paper.in/kanpur/green-park-test?id=7", "UTM stripped");
  assert.equal(rows[0]!.url, rows[1]!.url, "both tracking variants canonicalise to the same URL (de-dup key)");
  assert.ok(r!.summary && r!.summary.length <= 141, "summary truncated to ~140 chars");
  assert.ok(!/img|<|https:\/\/example-paper.in\/photo/.test(r!.summary!), "no HTML or image URLs stored");
  assert.ok(!("image" in r!) && !("content" in r!), "no image/body fields");

  const g = await parser.parseString(googleFeed);
  const gr = toRow(g.items[0], gnews, now)!;
  assert.equal(gr.source_name, "Amar Ujala", "credits original publisher");
  assert.equal(gr.source_homepage, "https://amarujala.com");
  assert.equal(gr.title, "लखनऊ में बारिश से मौसम सुहाना", "publisher suffix removed");
  assert.equal(gr.summary, null, "title-only description is not repeated");
  assert.equal(gr.city, "lucknow");
  assert.equal(gr.genre, "weather-environment");
  assert.equal(gr.language, "hi");

  // A dead feed (settled rejection) must not stop processing of the others
  const results = await Promise.allSettled([Promise.reject(new Error("HTTP 404")), parser.parseString(publisherFeed)]);
  assert.equal(results[0].status, "rejected");
  assert.equal(results[1].status, "fulfilled");
  console.log("news pipeline: all fixture assertions passed");
})();
