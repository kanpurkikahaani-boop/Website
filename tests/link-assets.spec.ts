/** v11 link-earning pages: press kit + badges, distance guide + CSV, cite boxes. */
import { expect, test } from "@playwright/test";

const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

test.describe("press kit", () => {
  test("badges load, snippets use absolute links, footer + sitemap link it", async ({ page, request }) => {
    await page.goto("/press");
    await expect(page.getByRole("heading", { level: 1, name: "Press Kit & Link to Us" })).toBeVisible();
    for (const theme of ["light", "dark"]) {
      for (const ext of ["svg", "png"]) {
        const r = await request.get(`/badges/featured-${theme}.${ext}`);
        expect(r.status(), `${theme}.${ext}`).toBe(200);
      }
      const html = await page.getByLabel(`${theme === "light" ? "Light" : "Dark"} badge — HTML`).inputValue();
      expect(html).toMatch(new RegExp(`^<a href="https?://[^"]+/" title="[^"]+"><img src="https?://[^"]+/badges/featured-${theme}\\.svg" alt="Featured on Kanpur Ki Kahaani" width="240" height="64" /></a>$`));
    }
    const imgsOk = await page.locator("main img").evaluateAll((imgs) => imgs.every((i) => (i as HTMLImageElement).complete && (i as HTMLImageElement).naturalWidth > 0));
    expect(imgsOk).toBe(true);
    await expect(page.getByLabel("Paragraph")).toHaveValue(/Lucknow, Agra, Prayagraj, Varanasi and Ayodhya/);
    await expect(page.locator('footer a[href="/press"]')).toHaveText("Press & link to us");
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).toContain("/press</loc>");
    expect(sitemap).toContain("/guides/distances-from-kanpur</loc>");
  });
});

test.describe("distance guide", () => {
  test("table is sorted, matches the CSV, has Dataset markup and a cite box", async ({ page, request }) => {
    await page.goto("/guides/distances-from-kanpur");
    const rows = await page.locator("table tbody tr").evaluateAll((trs) => trs.map((tr) => [...tr.querySelectorAll("th,td")].map((c) => c.textContent!.trim())));
    expect(rows.map((r) => r[0])).toEqual(["Lucknow", "Prayagraj", "Ayodhya", "Agra", "Varanasi"]);
    const road = rows.map((r) => Number(r[1].replace(/\D/g, "")));
    expect([...road].sort((a, b) => a - b)).toEqual(road);
    // Straight-line Kanpur–Lucknow from city-centre coordinates: ~72 km.
    expect(Number(rows[0][2].replace(/\D/g, ""))).toBeGreaterThan(60);
    expect(Number(rows[0][2].replace(/\D/g, ""))).toBeLessThan(85);

    const csv = await request.get("/guides/distances-from-kanpur.csv");
    expect(csv.headers()["content-type"]).toContain("text/csv");
    const lines = (await csv.text()).trim().split("\n");
    expect(lines[0]).toMatch(/^# Distances from Kanpur .* CC BY 4\.0/);
    expect(lines[1]).toBe("city,straight_line_km,road_km_approx,drive_time,train_time,fastest_way,nearest_airport,best_time,guide_url");
    expect(lines.slice(2).map((l) => l.split(",")[0])).toEqual(rows.map((r) => r[0]));

    const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
    const dataset = ld.map((t) => JSON.parse(t)).flat().find((b) => b["@type"] === "Dataset");
    expect(dataset.distribution[0].contentUrl).toMatch(/\/guides\/distances-from-kanpur\.csv$/);
    expect(dataset.license).toBe("https://creativecommons.org/licenses/by/4.0/");

    await expect(page.getByRole("heading", { name: "Cite or link to this page" })).toBeVisible();
    await expect(page.getByLabel("Link (HTML)")).toHaveValue(/^<a href="https?:\/\/[^"]+\/guides\/distances-from-kanpur">Distances from Kanpur/);
    await expect(page.getByLabel("Citation")).toHaveValue(/Kanpur Ki Kahaani \(2026\)\. Distances from Kanpur.*\(accessed \d{1,2} \w+ \d{4}\)/);
  });

  test("mobile: no sideways page scroll (the table scrolls inside its box)", async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 800 }, userAgent: UA });
    const page = await ctx.newPage();
    for (const path of ["/guides/distances-from-kanpur", "/press"]) {
      await page.goto(path);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), path).toBeLessThanOrEqual(0);
    }
    await ctx.close();
  });

  test("Nearby links to the guide; guides and stories offer a cite box", async ({ page }) => {
    await page.goto("/nearby");
    await expect(page.getByRole("link", { name: "Distances from Kanpur" }).first()).toHaveAttribute("href", "/guides/distances-from-kanpur");
    for (const path of ["/nearby", "/celebrations", "/culture-history", "/blogs/navaratri-in-kanpur"]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { name: "Cite or link to this page" }), path).toBeVisible();
      await expect(page.getByLabel("Link (HTML)"), path).toHaveValue(new RegExp(`href="https?://[^"]+${path.replace(/\//g, "\\/")}"`));
    }
  });
});
