/**
 * npm run test:syndication — cross-posting adapters against recorded request shapes (fetch is
 * mocked; nothing is sent anywhere). Checks: right endpoint and auth header, canonical URL where
 * supported, the "Originally published on Kanpur Ki Kahaani" line linking to our post, absolute
 * links, drafts, and that tokens never leak into stored error messages.
 */
import assert from "node:assert/strict";
import { portableHtml, portableMarkdown, type SyndicationPost } from "../../src/lib/syndication/format";
import { oauth1Header, PLATFORMS, platformById, publishTo, toNpf } from "../../src/lib/syndication/platforms";

const post: SyndicationPost = {
  id: "11111111-1111-4111-8111-111111111111",
  slug: "navaratri-in-kanpur",
  title: "Navaratri in Kanpur",
  excerpt: "Nine nights of garba, pandals and food.",
  html: '<p>First <a href="/tourism">para</a><span class="sr-only"> (opens in new tab)</span>.</p><p></p><h2 id="day-1">Day 1</h2><figure class="kkk-figure align-right is-sized" style="width:50%"><img src="https://x.supabase.co/storage/v1/object/public/blog-images/a.jpg" alt="Pandal" /><figcaption class="kkk-caption">Pandal at night</figcaption></figure><p><span style="font-family:Georgia, serif">Second</span> para.</p>',
  coverUrl: "https://x.supabase.co/storage/v1/object/public/blog-images/cover.jpg",
  coverAlt: "Garba",
  tags: ["navaratri", "street-food", "kanpur", "festivals", "culture"],
  canonicalUrl: "https://kanpurkikahaani.site/blogs/navaratri-in-kanpur",
  siteName: "Kanpur Ki Kahaani",
  siteUrl: "https://kanpurkikahaani.site",
};

const ENV: Record<string, string> = {
  DEVTO_API_KEY: "devto-secret-123",
  HASHNODE_TOKEN: "hn-secret-123",
  HASHNODE_PUBLICATION_ID: "pub123",
  BLOGGER_BLOG_ID: "999",
  BLOGGER_CLIENT_ID: "cid",
  BLOGGER_CLIENT_SECRET: "csecret-123",
  BLOGGER_REFRESH_TOKEN: "refresh-123",
  WPCOM_ACCESS_TOKEN: "wp-secret-123",
  WPCOM_SITE: "kanpurkikahaani.wordpress.com",
  TUMBLR_CONSUMER_KEY: "ck",
  TUMBLR_CONSUMER_SECRET: "cs-secret",
  TUMBLR_TOKEN: "tok",
  TUMBLR_TOKEN_SECRET: "ts-secret",
  TUMBLR_BLOG: "kanpurkikahaani.tumblr.com",
  MEDIUM_TOKEN: "medium-secret-123",
};
Object.assign(process.env, ENV);

type Call = { url: string; method: string; headers: Record<string, string>; body: string };
let calls: Call[] = [];
let reply: (c: Call) => { status?: number; json: unknown } = () => ({ json: {} });
globalThis.fetch = (async (input: RequestInfo | URL, init: RequestInit = {}) => {
  const c: Call = { url: String(input), method: init.method ?? "GET", headers: Object.fromEntries(Object.entries((init.headers as Record<string, string>) ?? {})), body: String(init.body ?? "") };
  calls.push(c);
  const r = reply(c);
  return new Response(JSON.stringify(r.json), { status: r.status ?? 200, headers: { "Content-Type": "application/json" } });
}) as typeof fetch;

let passed = 0;
const t = async (name: string, fn: () => Promise<void> | void) => {
  calls = [];
  await fn();
  passed++;
  console.log(`✓ ${name}`);
};
const body = (c: Call) => JSON.parse(c.body);
const ATTR = "Originally published on";

async function main() {
  await t("portable HTML: attribution first, absolute links, no classes/styles/sr-only, blank line kept", () => {
    const h = portableHtml(post);
    assert.ok(h.startsWith(`<p><em>${ATTR} <a href="${post.canonicalUrl}">Kanpur Ki Kahaani</a>.</em></p>`));
    assert.match(h, /href="https:\/\/kanpurkikahaani\.site\/tourism"/);
    assert.ok(!/class=|style=|sr-only|opens in new tab/.test(h), h);
    assert.match(h, /<p>&nbsp;<\/p>/);
    assert.match(h, /cover\.jpg/);
  });
  await t("markdown: attribution link, image + caption, heading", () => {
    const md = portableMarkdown(post, { withCover: false });
    assert.ok(md.startsWith(`*${ATTR} [Kanpur Ki Kahaani](${post.canonicalUrl}).*`), md.slice(0, 120));
    assert.match(md, /!\[Pandal\]\(https:\/\/x\.supabase\.co\/storage\/v1\/object\/public\/blog-images\/a\.jpg\)/);
    assert.match(md, /\*Pandal at night\*/);
    assert.match(md, /## Day 1/);
  });

  await t("DEV: api-key header, canonical_url, published, ≤4 plain tags, cover", async () => {
    reply = () => ({ status: 201, json: { id: 42, url: "https://dev.to/kkk/navaratri-42" } });
    const r = await publishTo(platformById("devto")!, post, false);
    assert.deepEqual(r, { ok: true, result: { url: "https://dev.to/kkk/navaratri-42", externalId: "42", status: "published" } });
    const c = calls[0];
    assert.equal(c.url, "https://dev.to/api/articles");
    assert.equal(c.headers["api-key"], ENV.DEVTO_API_KEY);
    const a = body(c).article;
    assert.equal(a.canonical_url, post.canonicalUrl);
    assert.equal(a.published, true);
    assert.deepEqual(a.tags, ["navaratri", "streetfood", "kanpur", "festivals"]);
    assert.equal(a.main_image, post.coverUrl);
    assert.ok(a.body_markdown.includes(ATTR));
  });
  await t("DEV: draft option sends published:false", async () => {
    reply = () => ({ json: { id: 43, url: "https://dev.to/kkk/x" } });
    const r = await publishTo(platformById("devto")!, post, true);
    assert.ok(r.ok && r.result.status === "draft");
    assert.equal(body(calls[0]).article.published, false);
  });
  await t("Hashnode: GraphQL publishPost with originalArticleURL + publication", async () => {
    reply = () => ({ json: { data: { publishPost: { post: { id: "p1", url: "https://kkk.hashnode.dev/navaratri" } } } } });
    const r = await publishTo(platformById("hashnode")!, post, false);
    assert.ok(r.ok && r.result.url === "https://kkk.hashnode.dev/navaratri");
    const c = calls[0];
    assert.equal(c.url, "https://gql.hashnode.com");
    assert.equal(c.headers.Authorization, ENV.HASHNODE_TOKEN);
    const input = body(c).variables.input;
    assert.equal(input.originalArticleURL, post.canonicalUrl);
    assert.equal(input.publicationId, "pub123");
    assert.equal(input.coverImageOptions.coverImageURL, post.coverUrl);
    assert.ok(input.contentMarkdown.includes(ATTR));
  });
  await t("Hashnode: GraphQL errors become a readable failure", async () => {
    reply = () => ({ json: { errors: [{ message: "Publication not found" }] } });
    const r = await publishTo(platformById("hashnode")!, post, false);
    assert.ok(!r.ok && r.error.includes("Publication not found"));
  });
  await t("Blogger: refresh token → access token → insert post (HTML with link back)", async () => {
    reply = (c) => (c.url.includes("oauth2") ? { json: { access_token: "ya29.temp" } } : { json: { id: "b1", url: "https://kkk.blogspot.com/2026/11/navaratri.html" } });
    const r = await publishTo(platformById("blogger")!, post, false);
    assert.ok(r.ok && r.result.url?.includes("blogspot"));
    assert.equal(calls[0].url, "https://oauth2.googleapis.com/token");
    assert.match(calls[0].body, /grant_type=refresh_token/);
    assert.equal(calls[1].url, "https://www.googleapis.com/blogger/v3/blogs/999/posts/?isDraft=false");
    assert.equal(calls[1].headers.Authorization, "Bearer ya29.temp");
    assert.ok(body(calls[1]).content.startsWith(`<p><em>${ATTR} <a href="${post.canonicalUrl}">`));
  });
  await t("WordPress.com: bearer token, posts/new, status publish/draft", async () => {
    reply = () => ({ json: { ID: 7, URL: "https://kanpurkikahaani.wordpress.com/2026/11/14/navaratri/" } });
    const r = await publishTo(platformById("wordpress")!, post, true);
    assert.ok(r.ok && r.result.status === "draft");
    assert.equal(calls[0].url, "https://public-api.wordpress.com/rest/v1.1/sites/kanpurkikahaani.wordpress.com/posts/new");
    assert.equal(calls[0].headers.Authorization, `Bearer ${ENV.WPCOM_ACCESS_TOKEN}`);
    assert.equal(body(calls[0]).status, "draft");
    assert.ok(body(calls[0]).content.includes(post.canonicalUrl));
  });
  await t("Tumblr: OAuth 1.0a header, NPF blocks with link back first and a link card last", async () => {
    reply = () => ({ status: 201, json: { response: { id_string: "765" } } });
    const r = await publishTo(platformById("tumblr")!, post, false);
    assert.ok(r.ok && r.result.url === "https://www.tumblr.com/kanpurkikahaani/765");
    const c = calls[0];
    assert.equal(c.url, "https://api.tumblr.com/v2/blog/kanpurkikahaani.tumblr.com/posts");
    assert.match(c.headers.Authorization, /^OAuth oauth_consumer_key="ck", oauth_nonce="[^"]+", oauth_signature_method="HMAC-SHA1", oauth_timestamp="\d+", oauth_token="tok", oauth_version="1.0", oauth_signature="[^"]+"$/);
    const b = body(c);
    assert.equal(b.content[0].formatting.find((f: { type: string }) => f.type === "link").url, post.canonicalUrl);
    assert.equal(b.content.at(-1).type, "link");
    assert.equal(b.source_url, post.canonicalUrl);
  });
  await t("OAuth 1.0a signature matches Twitter's published reference example", () => {
    // developer.x.com "Creating a signature" worked example (HMAC-SHA1, same scheme as Tumblr).
    const url = "https://api.twitter.com/1.1/statuses/update.json?include_entities=true&status=" + encodeURIComponent("Hello Ladies + Gentlemen, a signed OAuth request!");
    const h = oauth1Header(
      "POST",
      url,
      { consumerKey: "xvz1evFS4wEEPTGEFPHBog", consumerSecret: "kAcSOqF21Fu85e7zjz7ZN2U4ZRhfV3WpwPAoE3Z7kBw", token: "370773112-GmHxMAgYyLbNEtIKZeRNFsMKPR9EyMZeS9weJAEb", tokenSecret: "LswwdoUaIvS8ltyTt5jkRh4J50vUPVVHtR2YPi5kE" },
      "kYjzVBB8Y0ZFabxSWbWovY3uYSQ2pTgmZeNu2VS4cg",
      "1318622958",
    );
    assert.match(h, /oauth_signature="hCtSmYh%2BiHYCEqBWrE7C7hYmtUk%3D"/, h);
  });
  await t("NPF conversion: headings, image with alt, paragraphs", () => {
    const blocks = toNpf(post);
    assert.ok(blocks.some((b) => b.subtype === "heading1" && b.text === "Day 1"));
    assert.ok(blocks.some((b) => b.type === "image" && (b.alt_text as string) === "Pandal"));
    assert.ok(blocks.some((b) => b.type === "text" && b.text === "Second para."));
  });
  await t("Medium (legacy token): /me then create post with canonicalUrl", async () => {
    reply = (c) => (c.url.endsWith("/me") ? { json: { data: { id: "u1" } } } : { status: 201, json: { data: { id: "m1", url: "https://medium.com/@kkk/navaratri-m1" } } });
    const r = await publishTo(platformById("medium")!, post, false);
    assert.ok(r.ok && r.result.url?.includes("medium.com"));
    assert.equal(calls[1].url, "https://api.medium.com/v1/users/u1/posts");
    assert.equal(body(calls[1]).canonicalUrl, post.canonicalUrl);
    assert.equal(body(calls[1]).publishStatus, "public");
  });
  await t("errors never contain the token", async () => {
    reply = () => ({ status: 401, json: { error: `bad key ${ENV.DEVTO_API_KEY}` } });
    const r = await publishTo(platformById("devto")!, post, false);
    assert.ok(!r.ok);
    assert.ok(!r.error.includes(ENV.DEVTO_API_KEY) && r.error.includes("[hidden]"), r.error);
  });
  await t("every adapter is listed with env names only", () => {
    assert.deepEqual(PLATFORMS.map((p) => p.id), ["devto", "hashnode", "blogger", "wordpress", "tumblr", "medium"]);
  });
  console.log(`\n${passed} passed`);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
