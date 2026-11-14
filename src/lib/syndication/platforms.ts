import "server-only";
import { createHmac, randomBytes } from "node:crypto";
import { attributionText, plainTags, portableHtml, portableMarkdown, scrubSecrets, tagName, type SyndicationPost } from "./format";

/**
 * Cross-posting adapters (v10). Each one publishes a copy of a post on another platform using
 * that platform's official API, with keys read ONLY from server environment variables. Every
 * copy starts with "Originally published on Kanpur Ki Kahaani" linking to our post, and sets the
 * canonical URL to our post wherever the platform's API allows it.
 *
 * Endpoints and fields follow each platform's published API documentation as of Nov 2026
 * (see SETUP.md → Syndication). They are unit-tested against recorded request shapes, not live.
 */
export type PlatformId = "devto" | "hashnode" | "blogger" | "wordpress" | "tumblr" | "medium";

export interface PublishResult {
  url: string | null;
  externalId: string | null;
  status: "published" | "draft";
}

export interface Platform {
  id: PlatformId;
  name: string;
  /** Env vars this adapter needs (names only — never their values). */
  env: string[];
  /** True if the copy gets a real canonical link to our post (not only the visible line). */
  canonical: boolean;
  /** Can publish as a draft for you to review on the platform first. */
  drafts: boolean;
  note: string;
  publish: (post: SyndicationPost, opts: { draft: boolean }) => Promise<PublishResult>;
}

const env = (name: string) => process.env[name]?.trim() || undefined;
export const isConfigured = (p: Platform) => p.env.every((n) => Boolean(env(n)));
const secretsOf = (p: Platform) => p.env.map(env);

const TIMEOUT = 25_000;

export class PlatformError extends Error {}

async function call(url: string, init: RequestInit & { json?: unknown }, label: string): Promise<unknown> {
  const { json, ...rest } = init;
  const res = await fetch(url, {
    ...rest,
    body: json !== undefined ? JSON.stringify(json) : rest.body,
    headers: { ...(json !== undefined ? { "Content-Type": "application/json" } : {}), Accept: "application/json", ...(rest.headers as Record<string, string>) },
    signal: AbortSignal.timeout(TIMEOUT),
    cache: "no-store",
  });
  const text = await res.text();
  let body: unknown = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    /* not JSON */
  }
  if (!res.ok) {
    const msg = typeof body === "object" && body ? JSON.stringify(body).slice(0, 400) : String(text).slice(0, 400);
    throw new PlatformError(`${label} answered ${res.status}: ${msg}`);
  }
  return body;
}

/* ── Dev.to (Forem API v1): api-key header, canonical_url supported ─────────── */
const devto: Platform = {
  id: "devto",
  name: "DEV (dev.to)",
  env: ["DEVTO_API_KEY"],
  canonical: true,
  drafts: true,
  note: "Sets the canonical URL to our post. Up to 4 tags.",
  async publish(post, { draft }) {
    const body = (await call(
      "https://dev.to/api/articles",
      {
        method: "POST",
        headers: { "api-key": env("DEVTO_API_KEY")!, Accept: "application/vnd.forem.api-v1+json" },
        json: {
          article: {
            title: post.title.slice(0, 128),
            body_markdown: portableMarkdown(post, { withCover: false }),
            published: !draft,
            canonical_url: post.canonicalUrl,
            description: post.excerpt.slice(0, 250),
            ...(post.coverUrl ? { main_image: post.coverUrl } : {}),
            tags: plainTags(post.tags, 4),
          },
        },
      },
      "DEV",
    )) as { id?: number; url?: string };
    return { url: body.url ?? null, externalId: body.id ? String(body.id) : null, status: draft ? "draft" : "published" };
  },
};

/* ── Hashnode (GraphQL): Authorization header with a personal access token ─── */
const hashnode: Platform = {
  id: "hashnode",
  name: "Hashnode",
  env: ["HASHNODE_TOKEN", "HASHNODE_PUBLICATION_ID"],
  canonical: true,
  drafts: false,
  note: "Sets originalArticleURL (canonical) to our post. Publishes straight away.",
  async publish(post) {
    const query = `mutation PublishPost($input: PublishPostInput!) { publishPost(input: $input) { post { id url } } }`;
    const input = {
      title: post.title.slice(0, 250),
      subtitle: post.excerpt.slice(0, 250) || undefined,
      publicationId: env("HASHNODE_PUBLICATION_ID"),
      contentMarkdown: portableMarkdown(post, { withCover: false }),
      originalArticleURL: post.canonicalUrl,
      ...(post.coverUrl ? { coverImageOptions: { coverImageURL: post.coverUrl } } : {}),
      tags: post.tags.slice(0, 5).map((t) => ({ slug: t.replace(/[^a-z0-9-]/g, "").slice(0, 40), name: tagName(t) })),
    };
    const body = (await call("https://gql.hashnode.com", { method: "POST", headers: { Authorization: env("HASHNODE_TOKEN")! }, json: { query, variables: { input } } }, "Hashnode")) as {
      data?: { publishPost?: { post?: { id: string; url: string } } };
      errors?: { message: string }[];
    };
    if (body.errors?.length) throw new PlatformError(`Hashnode: ${body.errors.map((e) => e.message).join("; ")}`);
    const p = body.data?.publishPost?.post;
    if (!p) throw new PlatformError("Hashnode returned no post");
    return { url: p.url, externalId: p.id, status: "published" };
  },
};

/* ── Blogger (Google Blogger API v3): OAuth 2.0 refresh token ───────────────── */
async function googleAccessToken() {
  const form = new URLSearchParams({
    client_id: env("BLOGGER_CLIENT_ID")!,
    client_secret: env("BLOGGER_CLIENT_SECRET")!,
    refresh_token: env("BLOGGER_REFRESH_TOKEN")!,
    grant_type: "refresh_token",
  });
  const body = (await call("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: form.toString() }, "Google sign-in")) as { access_token?: string };
  if (!body.access_token) throw new PlatformError("Google returned no access token");
  return body.access_token;
}
const blogger: Platform = {
  id: "blogger",
  name: "Blogger",
  env: ["BLOGGER_BLOG_ID", "BLOGGER_CLIENT_ID", "BLOGGER_CLIENT_SECRET", "BLOGGER_REFRESH_TOKEN"],
  canonical: false,
  drafts: true,
  note: "Blogger has no canonical setting; the copy opens with the link back to our post.",
  async publish(post, { draft }) {
    const token = await googleAccessToken();
    const body = (await call(
      `https://www.googleapis.com/blogger/v3/blogs/${encodeURIComponent(env("BLOGGER_BLOG_ID")!)}/posts/?isDraft=${draft}`,
      { method: "POST", headers: { Authorization: `Bearer ${token}` }, json: { kind: "blogger#post", title: post.title, content: portableHtml(post), labels: post.tags.slice(0, 20).map(tagName) } },
      "Blogger",
    )) as { id?: string; url?: string };
    return { url: body.url ?? null, externalId: body.id ?? null, status: draft ? "draft" : "published" };
  },
};

/* ── WordPress.com (REST API v1.1): OAuth 2.0 bearer token ──────────────────── */
const wordpress: Platform = {
  id: "wordpress",
  name: "WordPress.com",
  env: ["WPCOM_ACCESS_TOKEN", "WPCOM_SITE"],
  canonical: false,
  drafts: true,
  note: "The API can't set a canonical on WordPress.com plans; the copy opens with the link back to our post.",
  async publish(post, { draft }) {
    const body = (await call(
      `https://public-api.wordpress.com/rest/v1.1/sites/${encodeURIComponent(env("WPCOM_SITE")!)}/posts/new`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${env("WPCOM_ACCESS_TOKEN")}` },
        json: { title: post.title, content: portableHtml(post), excerpt: post.excerpt, tags: post.tags.map(tagName).join(","), status: draft ? "draft" : "publish" },
      },
      "WordPress.com",
    )) as { ID?: number; URL?: string };
    return { url: body.URL ?? null, externalId: body.ID ? String(body.ID) : null, status: draft ? "draft" : "published" };
  },
};

/* ── Tumblr (API v2, Neue Post Format): OAuth 1.0a ─────────────────────────── */
const pct = (s: string) => encodeURIComponent(s).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
/** OAuth 1.0a HMAC-SHA1 Authorization header (JSON bodies are not part of the signature). */
export function oauth1Header(method: string, url: string, keys: { consumerKey: string; consumerSecret: string; token: string; tokenSecret: string }, nonce = randomBytes(16).toString("hex"), timestamp = Math.floor(Date.now() / 1000).toString()) {
  const params: Record<string, string> = {
    oauth_consumer_key: keys.consumerKey,
    oauth_nonce: nonce,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: timestamp,
    oauth_token: keys.token,
    oauth_version: "1.0",
  };
  const u = new URL(url);
  const all = [...Object.entries(params), ...[...u.searchParams.entries()]].map(([k, v]) => [pct(k), pct(v)]).sort(([a, x], [b, y]) => (a === b ? (x < y ? -1 : 1) : a < b ? -1 : 1));
  const base = [method.toUpperCase(), pct(`${u.origin}${u.pathname}`), pct(all.map(([k, v]) => `${k}=${v}`).join("&"))].join("&");
  const signature = createHmac("sha1", `${pct(keys.consumerSecret)}&${pct(keys.tokenSecret)}`).update(base).digest("base64");
  return `OAuth ${Object.entries({ ...params, oauth_signature: signature }).map(([k, v]) => `${pct(k)}="${pct(v)}"`).join(", ")}`;
}

type NpfBlock = Record<string, unknown>;
const decode = (s: string) => s.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
/** Our HTML → NPF blocks: headings, paragraphs, list items, quotes and images (plain text). */
export function toNpf(post: SyndicationPost): NpfBlock[] {
  const line = `${attributionText(post)}.`;
  const blocks: NpfBlock[] = [{ type: "text", text: line, formatting: [{ start: 0, end: line.length - 1, type: "italic" }, { start: line.indexOf(post.siteName), end: line.indexOf(post.siteName) + post.siteName.length, type: "link", url: post.canonicalUrl }] }];
  if (post.coverUrl) blocks.push({ type: "image", media: [{ url: post.coverUrl }], alt_text: post.coverAlt ?? post.title });
  const html = portableHtml(post, { withCover: false }).replace(/^<p><em>Originally published[\s\S]*?<\/p>/, "");
  for (const m of html.matchAll(/<(h2|h3|h4|p|li|blockquote)[^>]*>([\s\S]*?)<\/\1>|<img\b[^>]*>/g)) {
    if (m[0].startsWith("<img")) {
      const src = /\ssrc="([^"]+)"/.exec(m[0])?.[1];
      const alt = /\salt="([^"]*)"/.exec(m[0])?.[1];
      if (src) blocks.push({ type: "image", media: [{ url: src.replace(/&amp;/g, "&") }], ...(alt ? { alt_text: decode(alt) } : {}) });
    } else {
      const text = decode(m[2] ?? "");
      if (!text) continue;
      const subtype = m[1] === "h2" ? "heading1" : m[1] === "h3" || m[1] === "h4" ? "heading2" : m[1] === "li" ? "unordered-list-item" : m[1] === "blockquote" ? "quote" : undefined;
      blocks.push({ type: "text", text, ...(subtype ? { subtype } : {}) });
    }
  }
  blocks.push({ type: "link", url: post.canonicalUrl, title: `Read the full story on ${post.siteName}` });
  return blocks;
}
const tumblr: Platform = {
  id: "tumblr",
  name: "Tumblr",
  env: ["TUMBLR_CONSUMER_KEY", "TUMBLR_CONSUMER_SECRET", "TUMBLR_TOKEN", "TUMBLR_TOKEN_SECRET", "TUMBLR_BLOG"],
  canonical: false,
  drafts: true,
  note: "Tumblr has no canonical setting; the post opens with the link back and ends with a link card.",
  async publish(post, { draft }) {
    const blog = env("TUMBLR_BLOG")!.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    const url = `https://api.tumblr.com/v2/blog/${encodeURIComponent(blog)}/posts`;
    const auth = oauth1Header("POST", url, { consumerKey: env("TUMBLR_CONSUMER_KEY")!, consumerSecret: env("TUMBLR_CONSUMER_SECRET")!, token: env("TUMBLR_TOKEN")!, tokenSecret: env("TUMBLR_TOKEN_SECRET")! });
    const body = (await call(url, { method: "POST", headers: { Authorization: auth }, json: { content: toNpf(post), tags: post.tags.slice(0, 30).map(tagName).join(","), state: draft ? "draft" : "published", source_url: post.canonicalUrl } }, "Tumblr")) as {
      response?: { id?: string | number; id_string?: string };
    };
    const id = body.response?.id_string ?? (body.response?.id ? String(body.response.id) : null);
    const name = blog.replace(/\.tumblr\.com$/, "");
    return { url: id && !draft ? `https://www.tumblr.com/${name}/${id}` : null, externalId: id, status: draft ? "draft" : "published" };
  },
};

/* ── Medium (legacy API): only with an integration token issued before Medium stopped ─ */
const medium: Platform = {
  id: "medium",
  name: "Medium",
  env: ["MEDIUM_TOKEN"],
  canonical: true,
  drafts: true,
  note: "Only works with an old Medium integration token (Medium no longer issues new ones). Otherwise use Medium's “Import a story” (it sets the canonical) and add the link here by hand.",
  async publish(post, { draft }) {
    const headers = { Authorization: `Bearer ${env("MEDIUM_TOKEN")}` };
    const me = (await call("https://api.medium.com/v1/me", { headers }, "Medium")) as { data?: { id?: string } };
    if (!me.data?.id) throw new PlatformError("Medium returned no user id");
    const body = (await call(
      `https://api.medium.com/v1/users/${me.data.id}/posts`,
      { method: "POST", headers, json: { title: post.title, contentFormat: "html", content: `<h1>${post.title.replace(/</g, "&lt;")}</h1>${portableHtml(post)}`, canonicalUrl: post.canonicalUrl, tags: post.tags.slice(0, 3).map(tagName), publishStatus: draft ? "draft" : "public" } },
      "Medium",
    )) as { data?: { id?: string; url?: string } };
    return { url: body.data?.url ?? null, externalId: body.data?.id ?? null, status: draft ? "draft" : "published" };
  },
};

export const PLATFORMS: Platform[] = [devto, hashnode, blogger, wordpress, tumblr, medium];
export const platformById = (id: string) => PLATFORMS.find((p) => p.id === id);

/** Platforms with no publishing API we can use — post by hand, then add the link in the tracker. */
export const MANUAL_ONLY = [
  { name: "LinkedIn", note: "LinkedIn's API only creates short posts and link shares, not long-form articles, and needs an approved developer app. Publish the article by hand (or share the link), then add it here." },
  { name: "Medium", note: "Without an old integration token: on Medium use “Import a story” with our post's URL — it keeps the canonical link — then add the URL here." },
];

/** Run one adapter; errors come back as text with any token removed. */
export async function publishTo(p: Platform, post: SyndicationPost, draft: boolean): Promise<{ ok: true; result: PublishResult } | { ok: false; error: string }> {
  try {
    return { ok: true, result: await p.publish(post, { draft: draft && p.drafts }) };
  } catch (e) {
    const msg = e instanceof Error ? (e.name === "TimeoutError" ? `${p.name} did not answer in time` : e.message) : String(e);
    return { ok: false, error: scrubSecrets(msg, secretsOf(p)) };
  }
}
