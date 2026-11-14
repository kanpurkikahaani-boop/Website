/**
 * Update v10 acceptance tests: paragraph spacing, fonts, captions, crop/resize/align, view counts,
 * syndication tracker, RSS / sitemap / canonical. Runs with the e2e stack (tests/run-e2e.sh).
 */
import { mkdirSync } from "node:fs";
import { expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";
import pg from "pg";
import sharp from "sharp";

const { Client } = pg;

const ADMIN = { email: "team@kanpurkikahaani.site", password: "Correct-Horse-Battery-9" };
// A normal desktop browser (Playwright's default "HeadlessChrome" is — correctly — treated as a bot).
const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";
const SHOTS = "reports/screenshots";
mkdirSync(SHOTS, { recursive: true });

test.describe.configure({ mode: "serial" });

const title = `Evening Aarti at Bithoor ${Date.now().toString().slice(-6)}`;
let slug = "";
let postId = "";

/** admin.spec.ts changes the password in its reset test; accept either. */
async function signIn(page: Page) {
  for (const password of [ADMIN.password, "Brand-New-Pass-2026"]) {
    await page.goto("/admin/login?next=%2Fadmin%2Fblogs");
    await page.fill("input[name=email]", ADMIN.email);
    await page.fill("input[name=password]", password);
    await page.click('button:has-text("Sign in with email")');
    const ok = await Promise.race([
      page.waitForURL("**/admin/blogs", { timeout: 15_000 }).then(() => true),
      page.getByText("That email and password didn't match").waitFor({ timeout: 15_000 }).then(() => false),
    ]).catch(() => false);
    if (ok) return;
  }
  throw new Error("admin sign-in failed");
}

/** A 1600×900 photo-like test image with distinct quadrants, so crops are visible. */
async function testPhoto() {
  const block = (color: string) => sharp({ create: { width: 800, height: 450, channels: 3, background: color } }).png().toBuffer();
  return sharp({ create: { width: 1600, height: 900, channels: 3, background: "#1c1412" } })
    .composite([
      { input: await block("#c86a4b"), left: 0, top: 0 },
      { input: await block("#d9a24a"), left: 800, top: 0 },
      { input: await block("#5b6b62"), left: 0, top: 450 },
      { input: await block("#8e2b1e"), left: 800, top: 450 },
    ])
    .png()
    .toBuffer();
}

const css = (page: Page, selector: string, prop: string) => page.locator(selector).first().evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), prop);

async function visitor(browser: Browser, ua = UA, width = 1280): Promise<{ ctx: BrowserContext; page: Page }> {
  const ctx = await browser.newContext({ userAgent: ua, viewport: { width, height: 900 } });
  await ctx.addInitScript(() => {
    try {
      localStorage.setItem("kkk-nl-dismissed-at", String(Date.now()));
    } catch {
      /* ignore */
    }
  });
  return { ctx, page: await ctx.newPage() };
}

test.describe("v10 blog editor → published page", () => {
  test("write: paragraphs + blank line, two fonts + size, cropped/resized/aligned image with caption; publish", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await signIn(page);
    await page.goto("/admin/blogs/new");
    await page.fill("#post-title", title);
    await page.fill("#post-excerpt", "Lamps, bells and the Ganga at dusk in Bithoor, a short drive from Kanpur.");
    const body = page.getByLabel("Post body");
    await body.click();
    await page.keyboard.type("The first paragraph is about the ghats at dusk.");
    await page.keyboard.press("Enter");
    await page.keyboard.type("The second paragraph follows straight after.");
    await page.keyboard.press("Enter");
    await page.keyboard.press("Enter"); // a blank line
    await page.keyboard.type("The third paragraph comes after a blank line.");
    await page.keyboard.press("Enter");
    await page.keyboard.type("This paragraph is set in Georgia.");
    await page.keyboard.press("Enter");
    await page.keyboard.type("This paragraph is set in Playfair Display.");

    // Fonts + size from the toolbar.
    await body.getByText("This paragraph is set in Georgia.").click({ clickCount: 3 });
    await page.selectOption("#tb-font", { label: "Georgia" });
    await page.selectOption("#tb-size", { label: "Large" });
    await body.getByText("This paragraph is set in Playfair Display.").click({ clickCount: 3 });
    await page.selectOption("#tb-font", { label: "Playfair Display (site headings)" });
    await expect(body.locator('span[style*="Georgia"]')).toHaveText("This paragraph is set in Georgia.");
    await expect(body.locator('span[style*="font-display"]')).toHaveText("This paragraph is set in Playfair Display.");

    // Save the draft first: a new post moves to its edit URL after its first save.
    await page.getByRole("button", { name: "Save draft" }).click();
    await expect(page).toHaveURL(/\/admin\/blogs\/[0-9a-f-]+\/edit/, { timeout: 20_000 });
    await expect(body.locator('span[style*="Georgia"]')).toBeVisible();

    // Image: crop 4:3 on insert, with alt + caption.
    await body.getByText("This paragraph is set in Playfair Display.").click();
    await page.keyboard.press("End");
    // ProseMirror picks up native caret moves on the next selectionchange; a person is never this fast.
    await page.waitForTimeout(150);
    await page.keyboard.press("Enter");
    await page.locator("[role=toolbar][aria-label=Formatting] input[type=file]").setInputFiles({ name: "Aarti.png", mimeType: "image/png", buffer: await testPhoto() });
    const crop = page.getByRole("dialog", { name: "Crop and add image" });
    await expect(crop.getByRole("radio", { name: "4:3" })).toBeEnabled();
    await crop.getByRole("radio", { name: "4:3" }).click();
    await crop.getByLabel(/Alt text/).fill("Evening aarti lamps on the Ganga at Bithoor");
    await crop.getByLabel(/Caption/).fill("Aarti lamps on the Ganga");
    await crop.getByRole("button", { name: "Insert image" }).click();
    const fig = body.locator("figure.kkk-figure");
    const img = fig.locator("img");
    await expect(img).toHaveAttribute("src", /aarti-cropped-[0-9a-f]{8}\.png$/);
    await expect.poll(() => img.evaluate((i: HTMLImageElement) => Math.round((i.naturalWidth / i.naturalHeight) * 100))).toBe(133);

    // Resize to 50 % and align right from the image toolbar.
    await fig.hover();
    await fig.getByRole("button", { name: "50%", exact: true }).click();
    await fig.hover();
    await fig.getByRole("button", { name: "Align right" }).click();
    await expect(fig).toHaveClass(/align-right/);
    await expect(fig).toHaveClass(/is-sized/);

    // Re-open crop later: 1:1 this time (starts from the uncropped original).
    await fig.hover();
    await fig.getByRole("button", { name: "Crop image" }).click();
    const recrop = page.getByRole("dialog", { name: "Crop image" });
    await expect(recrop.getByRole("radio", { name: "1:1" })).toBeEnabled();
    await recrop.getByRole("radio", { name: "1:1" }).click();
    const before = await img.getAttribute("src");
    await recrop.getByRole("button", { name: "Save crop" }).click();
    await expect(img).not.toHaveAttribute("src", before!);
    await expect.poll(() => img.evaluate((i: HTMLImageElement) => Math.round((i.naturalWidth / i.naturalHeight) * 100))).toBe(100);

    // Caption stays editable after inserting.
    await fig.locator("figcaption").click();
    await page.keyboard.press("End");
    await page.waitForTimeout(150);
    await page.keyboard.type(" at dusk");
    await expect(fig.locator("figcaption")).toHaveText("Aarti lamps on the Ganga at dusk");

    await page.getByRole("button", { name: "Publish", exact: true }).click();
    await expect(page.getByText("Published — it's live on the site.")).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/blogs\/[0-9a-f-]+\/edit/);
    postId = page.url().match(/blogs\/([0-9a-f-]+)\/edit/)![1];
    slug = await page.inputValue("#post-slug");

    // Editor measurements to compare with the published page.
    await page.reload();
    const ed = page.getByLabel("Post body");
    await expect(ed.locator("figure.kkk-figure img")).toBeVisible();
    await ed.locator("p").first().scrollIntoViewIfNeeded();
    await page.mouse.move(0, 0);
    await ed.screenshot({ path: `${SHOTS}/v10-editor-1280.png` });
    const editorMargin = await css(page, ".ProseMirror > p", "margin-bottom");
    expect(parseFloat(editorMargin)).toBeGreaterThan(18);
    test.info().annotations.push({ type: "editor p margin-bottom", description: editorMargin });
  });

  test("published page matches the editor (desktop)", async ({ browser }) => {
    const { ctx, page } = await visitor(browser);
    await page.goto(`/blogs/${slug}`);
    const art = page.locator("#article-body");
    // Paragraphs with real gaps (the original bug: zero margin) and the blank line kept.
    expect(await art.locator("p").filter({ hasText: /paragraph/ }).count()).toBe(5);
    const mb = parseFloat(await css(page, "#article-body #introduction > p:nth-of-type(2)", "margin-bottom"));
    expect(mb).toBeGreaterThan(18);
    expect(mb).toBeLessThan(26); // 1.2em of 18px = 21.6px
    expect(parseFloat(await css(page, "#article-body", "line-height"))).toBeCloseTo(18 * 1.7, 1);
    expect(await art.locator("p:empty").count()).toBe(1);
    const blank = await art.locator("p:empty").evaluate((p) => p.getBoundingClientRect().height);
    expect(blank).toBeGreaterThan(20);

    // Fonts and size.
    const georgia = art.locator('span[style*="Georgia"]');
    await expect(georgia).toHaveText("This paragraph is set in Georgia.");
    expect(await georgia.evaluate((e) => getComputedStyle(e).fontFamily)).toMatch(/^Georgia/);
    expect(await georgia.evaluate((e) => getComputedStyle(e).fontSize)).toBe("22.5px");
    const playfair = art.locator('span[style*="font-display"]');
    expect(await playfair.evaluate((e) => getComputedStyle(e).fontFamily)).toMatch(/Playfair/i);

    // Figure: cropped file only, 50 % wide, right-aligned, caption under it (small, centred, muted, italic).
    const fig = art.locator("figure.kkk-figure");
    await expect(fig).toHaveClass(/align-right/);
    await expect(fig).toHaveAttribute("style", /width:\s*50%/);
    const img = fig.locator("img");
    await expect(img).toHaveAttribute("src", /aarti-cropped-[0-9a-f]{8}\.png$/);
    await expect(img).toHaveAttribute("alt", "Evening aarti lamps on the Ganga at Bithoor");
    await img.scrollIntoViewIfNeeded();
    await expect.poll(() => img.evaluate((i: HTMLImageElement) => i.naturalWidth > 0 && i.naturalWidth === i.naturalHeight)).toBe(true);
    const html = await page.content();
    expect(html).not.toMatch(/aarti-[0-9a-f]{8}\.png/); // the uncropped original is never loaded
    expect(html).not.toContain("data-original-src");
    expect(await fig.evaluate((f) => getComputedStyle(f).float)).toBe("right");
    const col = await art.evaluate((a) => a.getBoundingClientRect().width);
    const fw = await fig.evaluate((f) => f.getBoundingClientRect().width);
    expect(Math.abs(fw / col - 0.5)).toBeLessThan(0.02);
    const cap = fig.locator("figcaption");
    await expect(cap).toHaveText("Aarti lamps on the Ganga at dusk");
    expect(await cap.evaluate((c) => [getComputedStyle(c).fontStyle, getComputedStyle(c).textAlign])).toEqual(["italic", "center"]);
    expect(parseFloat(await cap.evaluate((c) => getComputedStyle(c).fontSize))).toBeLessThan(16);

    await art.locator("p").first().scrollIntoViewIfNeeded();
    await art.screenshot({ path: `${SHOTS}/v10-post-1280.png` });
    await ctx.close();
  });

  test("published page on mobile: image full width, no float, no sideways scroll", async ({ browser }) => {
    const { ctx, page } = await visitor(browser, UA, 375);
    await page.goto(`/blogs/${slug}`);
    const art = page.locator("#article-body");
    const fig = art.locator("figure.kkk-figure");
    expect(await fig.evaluate((f) => getComputedStyle(f).float)).toBe("none");
    const col = await art.evaluate((a) => a.getBoundingClientRect().width);
    const fw = await fig.evaluate((f) => f.getBoundingClientRect().width);
    expect(fw).toBeGreaterThan(col * 0.98);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
    expect(parseFloat(await css(page, "#article-body #introduction > p:nth-of-type(2)", "margin-bottom"))).toBeGreaterThan(18);
    await art.locator("p").first().scrollIntoViewIfNeeded();
    await art.screenshot({ path: `${SHOTS}/v10-post-375.png` });
    await ctx.close();
  });

  test("existing posts get the spacing fix too (Navaratri)", async ({ browser }) => {
    const { ctx, page } = await visitor(browser, "Googlebot/2.1 (+http://www.google.com/bot.html)");
    await page.goto("/blogs/navaratri-in-kanpur");
    expect(await page.locator("#article-body p").count()).toBeGreaterThan(3);
    const mb = parseFloat(await css(page, "#article-body > div:last-child p", "margin-bottom"));
    expect(mb).toBeGreaterThan(18);
    await ctx.close();
  });
});

test.describe("v10 view counts", () => {
  const countText = (page: Page) => page.getByTestId("view-count");

  test("counted once per visitor per 24 h; bots and the team aren't counted; admin list shows it", async ({ browser, request }) => {
    // The page visits earlier in this file were real visitors too: start from the current total.
    const base = (await (await request.get(`/api/views/${slug}`)).json()).views as number;
    expect(base).toBeGreaterThanOrEqual(1);
    const label = (n: number) => `👁${n} ${n === 1 ? "view" : "views"}`;

    const a = await visitor(browser);
    await a.page.goto(`/blogs/${slug}`);
    await expect(countText(a.page)).toHaveText(label(base + 1));
    await expect(a.page.getByTestId("view-badge")).toHaveText(label(base + 1)); // also next to the reading time
    await a.page.reload();
    await expect(countText(a.page)).toHaveText(label(base + 1)); // refresh doesn't double-count
    await a.page.goto(`/blogs/${slug}`);
    await expect(countText(a.page)).toHaveText(label(base + 1));

    const b = await visitor(browser);
    await b.page.goto(`/blogs/${slug}`);
    await expect(countText(b.page)).toHaveText(label(base + 2));

    const bot = await visitor(browser, "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)");
    await bot.page.goto(`/blogs/${slug}`);
    await expect(countText(bot.page)).toHaveText(label(base + 2));
    const r = await bot.page.request.post(`/api/views/${slug}`, { headers: { "user-agent": "curl/8.0" } });
    expect((await r.json()).counted).toBe(false);

    // The team: signed in (admin hint cookie) → shown, not counted.
    const team = await visitor(browser);
    await signIn(team.page);
    await team.page.goto(`/blogs/${slug}`);
    await expect(countText(team.page)).toHaveText(label(base + 2));
    await team.page.goto("/admin/blogs");
    const row = team.page.locator("tr", { hasText: title });
    await expect(row.getByTestId("admin-views")).toHaveText(String(base + 2));

    // A new visitor still counts (the 24-hour expiry itself is covered by the SQL check in SETUP.md).
    const c = await visitor(browser);
    await c.page.goto(`/blogs/${slug}`);
    await expect(countText(c.page)).toHaveText(label(base + 3));
    expect((await (await request.get(`/api/views/${slug}`)).json()).views).toBe(base + 3);

    // Direct calls from other sites are refused.
    const cross = await a.page.request.post(`/api/views/${slug}`, { headers: { "sec-fetch-site": "cross-site" } });
    expect(cross.status()).toBe(403);
    for (const x of [a, b, bot, team, c]) await x.ctx.close();
  });
});

test.describe("v10.1 view counts when the database isn't migrated", () => {
  test("readers see no broken counter; the team is told what to fix", async ({ browser }) => {
    const pg = new Client({ host: process.env.PGHOST ?? "/var/lib/postgresql/kkk", port: Number(process.env.PGPORT ?? 54329), user: process.env.PGUSER ?? "postgres", database: process.env.PGDATABASE ?? "kkk_e2e" });
    await pg.connect();
    await pg.query("alter table public.post_view_counts rename to post_view_counts_off");
    try {
      const reader = await visitor(browser);
      await reader.page.goto(`/blogs/${slug}`);
      await expect(reader.page.getByTestId("view-count-help")).toBeAttached();
      await expect(reader.page.getByTestId("view-count-help")).toHaveText("");
      await expect(reader.page.getByTestId("view-badge")).toHaveCount(0);
      const team = await visitor(browser);
      await signIn(team.page);
      await team.page.goto(`/blogs/${slug}`);
      await expect(team.page.getByTestId("view-count-help")).toContainText("0010_views_and_syndication.sql");
      await team.page.goto("/admin/blogs");
      await expect(team.page.getByTestId("views-problem")).toContainText("0010_views_and_syndication.sql");
      for (const x of [reader, team]) await x.ctx.close();
    } finally {
      await pg.query("alter table public.post_view_counts_off rename to post_view_counts");
      await pg.end();
    }
  });
});

test.describe("v10 syndication tracker", () => {
  test("admin page lists posts; manual entries with links; editor panel shows platform set-up", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await signIn(page);
    await page.goto("/admin/syndication");
    await expect(page.getByRole("heading", { level: 1, name: "Syndication" })).toBeVisible();
    await expect(page.getByText("DEV (dev.to)")).toBeVisible();
    await expect(page.getByText(/not set up \(needs/).first()).toBeVisible();
    const block = page.getByTestId("syndication-post").filter({ hasText: title });
    await block.getByPlaceholder("Site, e.g. LinkedIn").fill("LinkedIn");
    await block.getByPlaceholder("https://…").fill("https://www.linkedin.com/pulse/evening-aarti-bithoor-kkk");
    await block.getByRole("button", { name: "Add link" }).click();
    const link = block.getByRole("link", { name: /LinkedIn/ });
    await expect(link).toHaveAttribute("href", "https://www.linkedin.com/pulse/evening-aarti-bithoor-kkk");
    await expect(link).toHaveAttribute("target", "_blank");
    await page.reload();
    await expect(page.getByTestId("syndication-post").filter({ hasText: title }).getByRole("link", { name: /LinkedIn/ })).toBeVisible();
    // Only https links are accepted.
    await block.getByPlaceholder("Site, e.g. LinkedIn").fill("Somewhere");
    await block.getByPlaceholder("https://…").fill("http://insecure.example.com/post");
    await block.getByRole("button", { name: "Add link" }).click();
    await expect(block.getByRole("alert")).toContainText("https://");
    await page.screenshot({ path: `${SHOTS}/v10-admin-syndication-1280.png`, fullPage: true });

    // Editor sidebar: Syndicate panel.
    await page.goto(`/admin/blogs/${postId}/edit`);
    await page.locator("summary", { hasText: /^Syndicate/ }).click();
    const panel = page.locator("details", { hasText: "Cross-post to" });
    await expect(panel.getByText(/Not set up — add DEVTO_API_KEY/)).toBeVisible();
    await expect(panel.getByRole("checkbox", { name: /DEV \(dev\.to\)/ })).toBeDisabled();
    await expect(panel.getByRole("link", { name: /LinkedIn/ })).toBeVisible();
    await expect(panel.getByRole("button", { name: "Cross-post" })).toBeDisabled();
  });

  test("tracker is admin-only in the database", async () => {
    const r = await fetch("http://127.0.0.1:54400/rest/v1/post_syndications?select=*", { headers: { apikey: "anon-test" } });
    expect(await r.json()).toEqual([]);
    const ins = await fetch("http://127.0.0.1:54400/rest/v1/post_syndications", {
      method: "POST",
      headers: { apikey: "anon-test", "content-type": "application/json" },
      body: JSON.stringify({ post_id: postId, platform: "Spam", status: "manual" }),
    });
    expect(ins.status).toBeGreaterThanOrEqual(400);
    const rpc = await fetch("http://127.0.0.1:54400/rest/v1/rpc/record_post_view", {
      method: "POST",
      headers: { apikey: "anon-test", "content-type": "application/json" },
      body: JSON.stringify({ p_slug: slug, p_visitor: "a".repeat(64) }),
    });
    expect(rpc.status).toBeGreaterThanOrEqual(400); // only the website's server may count views
  });
});

test.describe("v10 feeds and SEO tags", () => {
  test("RSS at /rss.xml, /feed and /blogs/rss.xml is valid and complete", async ({ page, request }) => {
    const res = await request.get("/rss.xml");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("application/rss+xml");
    const xml = await res.text();
    expect(await (await request.get("/feed")).text()).toBe(xml);
    expect((await request.get("/blogs/rss.xml")).status()).toBe(200);
    await page.goto("about:blank");
    const info = await page.evaluate((x) => {
      const doc = new DOMParser().parseFromString(x, "application/xml");
      if (doc.querySelector("parsererror")) return { error: doc.querySelector("parsererror")!.textContent };
      const items = [...doc.querySelectorAll("item")].map((i) => ({
        title: i.querySelector("title")?.textContent,
        link: i.querySelector("link")?.textContent,
        description: i.querySelector("description")?.textContent,
        pubDate: i.querySelector("pubDate")?.textContent,
        image: i.getElementsByTagNameNS("http://search.yahoo.com/mrss/", "content")[0]?.getAttribute("url"),
        content: i.getElementsByTagNameNS("http://purl.org/rss/1.0/modules/content/", "encoded")[0]?.textContent,
      }));
      return { items, self: doc.getElementsByTagNameNS("http://www.w3.org/2005/Atom", "link")[0]?.getAttribute("href") };
    }, xml);
    expect(info.error).toBeUndefined();
    expect(info.self).toMatch(/\/rss\.xml$/);
    const item = info.items!.find((i) => i.link?.endsWith(`/blogs/${slug}`));
    expect(item).toBeTruthy();
    expect(item!.title).toBe(title);
    expect(item!.description).toContain("Lamps, bells");
    expect(new Date(item!.pubDate!).getTime()).toBeGreaterThan(Date.now() - 86_400_000);
    expect(item!.image).toMatch(/^https?:\/\/.+\/opengraph-image$/);
    expect(item!.content).toContain("Originally published on");
    expect(info.items!.some((i) => i.link?.endsWith("/blogs/navaratri-in-kanpur"))).toBe(true);
  });

  test("sitemap.xml + robots.txt", async ({ page, request }) => {
    const xml = await (await request.get("/sitemap.xml")).text();
    await page.goto("about:blank");
    const urls = await page.evaluate((x) => {
      const doc = new DOMParser().parseFromString(x, "application/xml");
      return doc.querySelector("parsererror") ? null : [...doc.querySelectorAll("url > loc")].map((l) => l.textContent ?? "");
    }, xml);
    expect(urls).not.toBeNull();
    for (const path of ["/", "/tourism", "/weather", "/faq", "/blogs", "/blogs/navaratri-in-kanpur", `/blogs/${slug}`]) {
      expect(urls!.some((u) => new URL(u).pathname === path), path).toBe(true);
    }
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toMatch(/Sitemap: https?:\/\/\S+\/sitemap\.xml/);
  });

  test("post page: self canonical, Open Graph + Twitter tags, feed link", async ({ page }) => {
    await page.goto(`/blogs/${slug}`);
    const attr = (sel: string, a = "content") => page.locator(sel).first().getAttribute(a);
    const canonical = await attr('link[rel="canonical"]', "href");
    expect(canonical).toMatch(new RegExp(`^https?://[^/]+/blogs/${slug}$`));
    expect(await attr('meta[property="og:url"]')).toBe(canonical);
    expect(await attr('meta[property="og:title"]')).toContain(title);
    expect(await attr('meta[property="og:description"]')).toContain("Lamps, bells");
    expect(await attr('meta[property="og:image"]')).toMatch(/\/blogs\/.+\/opengraph-image/);
    expect(await attr('meta[property="og:type"]')).toBe("article");
    expect(await attr('meta[name="twitter:card"]')).toBe("summary_large_image");
    expect(await attr('meta[name="twitter:image"]')).toBeTruthy();
    expect(await attr('link[rel="alternate"][type="application/rss+xml"]', "href")).toMatch(/\/rss\.xml$/);
    // Search Console placeholder: nothing is output until GOOGLE_SITE_VERIFICATION is set.
    expect(await page.locator('meta[name="google-site-verification"]').count()).toBe(0);
  });
});
