/** v9 Google links: Map + Photos buttons on every item. Runs with the e2e stack (tests/run-e2e.sh). */
import { mkdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

const SHOTS = "reports/screenshots";
mkdirSync(SHOTS, { recursive: true });
const MAPS = /^https:\/\/www\.google\.com\/maps\/(search\/\?api=1&query=|dir\/\?api=1&origin=)/;
const IMAGES = /^https:\/\/www\.google\.com\/search\?q=[^&]+&udm=2$/;

/** Minimum number of Map/Photos pairs each page must show (from the inventory). */
const PAGES: [string, number][] = [
  ["/", 20],
  ["/tourism", 14],
  ["/culture-history", 13],
  ["/celebrations", 6],
  ["/food-nightlife", 5],
  ["/shopping", 7],
  ["/outdoor-sports", 6],
  ["/nearby", 14],
  ["/cities/lucknow", 25],
  ["/cities/varanasi", 25],
  ["/events", 6],
  ["/weather", 4],
  ["/news/kanpur", 1],
  // /news' newspaper directory only lists links verified to be online (needs network); covered by google:coverage.
  ["/news?city=lucknow", 1],
  ["/accommodation", 6],
  ["/campus", 10],
  ["/blogs/navaratri-in-kanpur", 2],
];

async function settle(page: Page) {
  // Fade-in sections render on scroll.
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 700) {
      scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 40));
    }
    scrollTo(0, 0);
  });
}

test.describe("Google Map + Photos links", () => {
  for (const [path, min] of PAGES) {
    test(`${path}: every pair is well-formed, opens in a new tab, never nested`, async ({ page }) => {
      await page.route(/open-meteo|bigdatacloud|rainviewer|openstreetmap|spotify|youtube/, (r) => r.abort());
      await page.goto(path);
      await settle(page);
      const groups = page.locator("[data-google-links]");
      expect(await groups.count(), path).toBeGreaterThanOrEqual(min);
      const bad = await groups.evaluateAll((els, [mapsRe, imagesRe]) => {
        const maps = new RegExp(mapsRe);
        const images = new RegExp(imagesRe);
        const problems: string[] = [];
        for (const g of els) {
          const [m, p] = [...g.querySelectorAll("a")];
          if (!m || !p) problems.push("missing link");
          else {
            if (!maps.test(m.href)) problems.push(`maps ${m.href}`);
            if (!images.test(p.href)) problems.push(`images ${p.href}`);
            for (const a of [m, p]) {
              if (a.target !== "_blank" || !/nofollow/.test(a.rel) || !/noopener/.test(a.rel)) problems.push(`attrs ${a.href}`);
              if (a.parentElement?.closest("a")) problems.push(`nested ${a.href}`);
            }
            if (!/^Open .+ in Google Maps \(new tab\)$/.test(m.getAttribute("aria-label") ?? "")) problems.push(`label ${m.getAttribute("aria-label")}`);
            if (!/^See photos of .+ on Google Images \(new tab\)$/.test(p.getAttribute("aria-label") ?? "")) problems.push(`label ${p.getAttribute("aria-label")}`);
          }
        }
        return problems;
      }, [MAPS.source, IMAGES.source]);
      expect(bad, path).toEqual([]);
      expect(await page.locator("a a").count()).toBe(0);
    });
  }

  test("clicking Map on a linked card opens Google in a new tab, not the card's page", async ({ page, context }) => {
    await context.addInitScript(() => localStorage.setItem("kkk-nl-dismissed-at", String(Date.now()))); // no newsletter popup
    await page.goto("/");
    await settle(page);
    const card = page.locator("article", { has: page.getByRole("link", { name: "Lucknow" }) }).first();
    await card.scrollIntoViewIfNeeded();
    await context.route(/google\.com/, (r) => r.fulfill({ status: 200, body: "ok" }));
    // A real mouse click at the button's position: proves the button sits above the card's own link.
    const box = (await card.getByRole("link", { name: /Open Lucknow in Google Maps/ }).boundingBox())!;
    const [popup] = await Promise.all([context.waitForEvent("page"), page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)]);
    expect(popup.url()).toMatch(/google\.com\/maps\/search\/\?api=1&query=Lucknow%2C\+Uttar\+Pradesh/);
    expect(new URL(page.url()).pathname).toBe("/");
    await popup.close();
  });

  test("ambiguous names carry the right city", async ({ page }) => {
    await page.goto("/tourism");
    await settle(page);
    const href = await page.getByRole("link", { name: /^Open JK Temple .* in Google Maps/ }).first().getAttribute("href");
    expect(decodeURIComponent(href!.replace(/\+/g, " "))).toContain("JK Temple, Sarvodaya Nagar, Kanpur, Uttar Pradesh");
    await page.goto("/cities/lucknow");
    await settle(page);
    const chowk = await page.getByRole("link", { name: /^Open Chowk in Google Maps/ }).first().getAttribute("href");
    expect(decodeURIComponent(chowk!.replace(/\+/g, " "))).toContain("Lucknow, Uttar Pradesh");
    await page.goto("/accommodation");
    const stay = page.locator("[data-google-links] a").first();
    expect(decodeURIComponent((await stay.getAttribute("href"))!.replace(/\+/g, " "))).toMatch(/query=.+, Kanpur, Uttar Pradesh/);
  });

  test("weather: large buttons follow the selected city", async ({ page }) => {
    await page.route(/open-meteo|bigdatacloud|rainviewer|openstreetmap/, (r) => r.abort());
    await page.goto("/weather?city=agra");
    await expect(page.getByRole("link", { name: "Open Agra in Google Maps (new tab)" })).toHaveText(/Open in Google Maps/);
    await page.getByRole("button", { name: "Lucknow", exact: true }).click();
    await expect(page.getByRole("link", { name: "See photos of Lucknow on Google Images (new tab)" })).toHaveAttribute("href", /q=Lucknow\+weather&udm=2/);
  });

  test("mobile: 44px tap targets and no sideways scroll", async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 800 } });
    const page = await ctx.newPage();
    await page.route(/open-meteo|bigdatacloud|rainviewer|openstreetmap|spotify|youtube/, (r) => r.abort());
    for (const path of ["/", "/tourism", "/food-nightlife", "/cities/varanasi", "/accommodation", "/weather", "/news", "/campus", "/nearby"]) {
      await page.goto(path);
      await settle(page);
      const heights = await page.locator("[data-google-links] a").evaluateAll((as) => as.filter((a) => (a as HTMLElement).offsetParent).map((a) => a.getBoundingClientRect().height));
      expect(Math.min(...heights), path).toBeGreaterThanOrEqual(44);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), path).toBeLessThanOrEqual(0);
    }
    await ctx.close();
  });

  test("screenshots at 375px and 1280px", async ({ browser }) => {
    for (const width of [375, 1280]) {
      const ctx = await browser.newContext({ viewport: { width, height: 900 } });
      await ctx.addInitScript(() => {
        try {
          localStorage.setItem("kkk-nl-dismissed-at", String(Date.now()));
        } catch {
          /* ignore */
        }
      });
      const page = await ctx.newPage();
      await page.route(/open-meteo|bigdatacloud|rainviewer|openstreetmap|spotify|youtube/, (r) => r.abort());
      for (const [name, path, sel] of [
        ["home", "/", "#beyond-title"],
        ["tourism", "/tourism", "#sights-title"],
        ["food", "/food-nightlife", "#taste-title"],
        ["city", "/cities/varanasi", "#places-title"],
        ["stays", "/accommodation", "#stays-title"],
        ["weather", "/weather", "#now-title"],
        ["news", "/news?city=lucknow", "main"],
      ] as const) {
        await page.goto(path);
        await settle(page);
        await page.waitForTimeout(600);
        await page.addStyleTag({ content: "header{position:static!important}" });
        // Centre the first Map/Photos pair after the section heading.
        await page.evaluate((selector) => {
          const top = document.querySelector(selector)!.getBoundingClientRect().top + scrollY;
          const g = [...document.querySelectorAll("[data-google-links]")].find((el) => el.getBoundingClientRect().top + scrollY > top);
          g?.scrollIntoView({ block: "center" });
        }, sel);
        await page.waitForTimeout(1500); // let fade-in sections finish
        await page.screenshot({ path: `${SHOTS}/google-links-${name}-${width}.png` });
      }
      await ctx.close();
    }
  });
});
