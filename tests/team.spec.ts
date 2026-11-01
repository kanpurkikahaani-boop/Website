/** /team page + navigation acceptance tests (v7). Runs with the e2e stack (tests/run-e2e.sh). */
import { expect, test } from "@playwright/test";
import { team } from "../src/data/team";

test.describe("Team tab", () => {
  for (const width of [1024, 1280]) {
    test(`navbar at ${width}px: one line, Team between Blogs and Spotify, active on /team`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/team");
      const items = page.locator("header nav > ul > li");
      const tops = await items.evaluateAll((lis) => lis.map((li) => li.getBoundingClientRect().bottom));
      expect(Math.max(...tops) - Math.min(...tops)).toBeLessThan(20); // single row
      const labels = await items.evaluateAll((lis) => lis.map((li) => li.querySelector("a,button")?.textContent?.trim() || li.querySelector("a")?.getAttribute("aria-label")));
      const blogs = labels.indexOf("Blogs");
      expect(labels[blogs + 1]).toBe("Team");
      expect(labels[blogs + 2]).toBe("City Playlist on Spotify");
      await expect(page.locator('header a[href="/team"][aria-current="page"]')).toHaveCount(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
    });
  }

  test("mobile menu: Blogs → Team → City Playlist", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/");
    await page.getByRole("button", { name: /menu/i }).first().click();
    const rows = await page.locator('[role="dialog"] nav a').evaluateAll((as) => as.map((a) => a.textContent?.trim()));
    const b = rows.indexOf("Blogs");
    expect(rows[b + 1]).toBe("Team");
    expect(rows[b + 2]).toContain("City Playlist");
  });

  test("every member shows the right photo, name, role and alt text", async ({ page }) => {
    await page.goto("/team");
    const cards = page.locator("article");
    await expect(cards).toHaveCount(team.length);
    for (const [i, m] of team.entries()) {
      const card = cards.nth(i);
      await expect(card.locator("h3")).toHaveText(m.name);
      await expect(card.getByText(m.role, { exact: true })).toBeVisible();
      const img = card.locator("img");
      await expect(img).toHaveAttribute("alt", `Portrait of ${m.name}, ${m.role} at Kanpur Ki Kahaani`);
      expect(decodeURIComponent((await img.getAttribute("src")) ?? "")).toContain(m.photo);
    }
  });

  test("last card is centred and Read more works with keyboard and mouse", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/team");
    const box = await page.locator("article").last().boundingBox();
    expect(Math.abs(box!.x + box!.width / 2 - 640)).toBeLessThan(4);
    const more = page.getByRole("button", { name: /Read more about Monisha MS/ });
    await more.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("button", { name: /Read less about Monisha MS/ })).toHaveAttribute("aria-expanded", "true");
    await page.getByRole("button", { name: /Read less about Monisha MS/ }).click();
    await expect(page.getByRole("button", { name: /Read more about Monisha MS/ })).toHaveAttribute("aria-expanded", "false");
  });

  test("JSON-LD, sitemap and the Navaratri author box", async ({ page, request }) => {
    await page.goto("/team");
    const ld = await page.locator('script[type="application/ld+json"]').evaluateAll((s) => s.map((x) => JSON.parse(x.textContent ?? "{}")));
    const about = ld.find((d) => d["@type"] === "AboutPage");
    expect(about.mainEntity.member).toHaveLength(7);
    for (const p of about.mainEntity.member) expect(p.image).toMatch(/^https?:\/\/.+\/images\/team\/.+\.jpg$/);
    expect(ld.some((d) => d["@type"] === "BreadcrumbList")).toBe(true);
    expect(await (await request.get("/sitemap.xml")).text()).toContain("/team</loc>");

    await page.goto("/blogs/navaratri-in-kanpur");
    const box = page.locator('section[aria-labelledby="author-title"]');
    await expect(box.locator('img[src*="rakshaa-mukesh"]')).toHaveCount(1);
    await expect(box.getByText("Reddit & Medium Lead, Kanpur Ki Kahaani")).toBeVisible();
    await expect(box.getByRole("link", { name: "Meet the team →" })).toHaveAttribute("href", "/team");
  });
});
