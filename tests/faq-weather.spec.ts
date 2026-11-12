/**
 * Update v8 acceptance tests: FAQ sections + /faq + Weather upgrades. Runs with the e2e stack
 * (tests/run-e2e.sh). Open-Meteo, BigDataCloud, RainViewer and map tiles are mocked from recorded
 * response shapes, so the tests need no network.
 */
import { expect, test, type Page, type Request } from "@playwright/test";
import { allFaqGroups, faqs } from "../src/data/faqs";
import { plainAnswer } from "../src/lib/faq-text";

const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");

/** An Open-Meteo forecast response for "now" in IST, distinct per latitude. */
function forecast(lat: number) {
  const ist = new Date(Date.now() + 5.5 * 3600_000);
  const day = (d: number) => new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate() + d)).toISOString().slice(0, 10);
  const hh = String(ist.getUTCHours()).padStart(2, "0");
  const base = lat > 27 ? 18 : 29; // "your location" (lat 28.6) is cooler than Kanpur
  const hours = Array.from({ length: 48 }, (_, i) => `${day(Math.floor(i / 24))}T${String(i % 24).padStart(2, "0")}:00`);
  return {
    current: { time: `${day(0)}T${hh}:15`, temperature_2m: base, apparent_temperature: base + 2, relative_humidity_2m: 55, wind_speed_10m: 9, weather_code: 2 },
    hourly: { time: hours, temperature_2m: hours.map((_, i) => base - 4 + (i % 24) / 3), precipitation_probability: hours.map((_, i) => (i * 7) % 60), weather_code: hours.map(() => 2) },
    daily: {
      time: Array.from({ length: 7 }, (_, i) => day(i)),
      weather_code: [2, 61, 1, 0, 3, 2, 1],
      temperature_2m_max: [base + 3, base + 1, 30, 31, 32, 30, 29],
      temperature_2m_min: [base - 8, base - 9, 15, 16, 17, 15, 14],
      precipitation_probability_max: [10, 70, 5, 0, 20, 10, 5],
      sunrise: Array.from({ length: 7 }, (_, i) => `${day(i)}T06:31`),
      sunset: Array.from({ length: 7 }, (_, i) => `${day(i)}T17:22`),
      uv_index_max: [5.2, 4, 5, 6, 5, 5, 5],
    },
  };
}

interface Mocks {
  weatherFails?: boolean;
  radarFails?: boolean;
  requests: Request[];
}

async function mockApis(page: Page, opts: Partial<Mocks> = {}): Promise<Mocks> {
  const m: Mocks = { requests: [], ...opts };
  page.on("request", (r) => m.requests.push(r));
  await page.route("https://api.open-meteo.com/**", (route) => {
    if (m.weatherFails) return route.fulfill({ status: 503, body: "down" });
    const lat = Number(new URL(route.request().url()).searchParams.get("latitude"));
    return route.fulfill({ json: forecast(lat), headers: { "access-control-allow-origin": "*" } });
  });
  await page.route("https://api.bigdatacloud.net/**", (route) => route.fulfill({ json: { city: "New Delhi", locality: "Connaught Place" }, headers: { "access-control-allow-origin": "*" } }));
  await page.route("https://api.rainviewer.com/**", (route) => {
    if (m.radarFails) return route.fulfill({ status: 500, body: "" });
    const now = Math.floor(Date.now() / 1000 / 600) * 600;
    const past = Array.from({ length: 13 }, (_, i) => ({ time: now - (12 - i) * 600, path: `/v2/radar/${now - (12 - i) * 600}` }));
    return route.fulfill({ json: { version: "2.0", generated: now, host: "https://tilecache.rainviewer.com", radar: { past, nowcast: [] } }, headers: { "access-control-allow-origin": "*" } });
  });
  await page.route("https://tilecache.rainviewer.com/**", (route) => route.fulfill({ body: PNG, contentType: "image/png" }));
  await page.route("https://tile.openstreetmap.org/**", (route) => route.fulfill({ body: PNG, contentType: "image/png" }));
  return m;
}

const FAQ_PAGES = ["/", "/tourism", "/culture-history", "/celebrations", "/food-nightlife", "/shopping", "/outdoor-sports", "/nearby", "/cities/varanasi", "/events", "/weather", "/news", "/accommodation", "/campus", "/blogs", "/team", "/playlist"];

test.describe("FAQ sections", () => {
  test("every page has its FAQ in the server HTML, with matching FAQPage JSON-LD", async ({ request }) => {
    for (const path of FAQ_PAGES) {
      const html = await (await request.get(path)).text();
      const group = allFaqGroups().find((g) => g.path === path)!;
      expect(group, path).toBeTruthy();
      // The answers are in the HTML without JavaScript.
      for (const f of group.items) expect(html, `${path}: ${f.id}`).toContain(`id="faq-${f.id}"`);
      const blocks = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
      const faqLd = blocks.flat().find((b) => b["@type"] === "FAQPage");
      expect(faqLd, `${path} FAQPage`).toBeTruthy();
      expect(faqLd.mainEntity.length).toBe(group.items.length);
      for (const [i, f] of group.items.entries()) {
        expect(faqLd.mainEntity[i].name).toBe(f.question);
        expect(faqLd.mainEntity[i].acceptedAnswer.text).toBe(plainAnswer(f.answer));
      }
      expect(html.toLowerCase()).not.toMatch(/itenary|\bwea\b/);
    }
  });

  test("visible answer text equals the JSON-LD text; first item open; deep link opens an item", async ({ page }) => {
    await mockApis(page);
    await page.goto("/tourism#faq-is-there-a-map-of-tourist-places");
    const target = page.locator("#faq-is-there-a-map-of-tourist-places");
    await expect(target).toHaveAttribute("open", "");
    await expect(page.locator("details.faq-item").first()).toHaveAttribute("open", "");
    await expect(target.locator("p").first()).toBeVisible();
    const visible = ((await target.locator("p").first().textContent()) ?? "").replace(/\s*↗\s*/g, " ").replace(/\s+/g, " ").trim();
    const expected = plainAnswer(faqs.tourism.find((f) => f.id === "is-there-a-map-of-tourist-places")!.answer).replace(/\s+/g, " ");
    expect(visible).toBe(expected);
    // Toggling works with the keyboard.
    const second = page.locator("details.faq-item").nth(1);
    await second.locator("summary").focus();
    await page.keyboard.press("Enter");
    await expect(second).toHaveAttribute("open", "");
  });

  test("city page: FAQ sits before Explore Other Cities", async ({ page }) => {
    await mockApis(page);
    await page.goto("/cities/varanasi");
    const order = await page.evaluate(() => {
      const faq = document.getElementById("faq")!;
      const others = document.getElementById("others-title")!;
      return faq.compareDocumentPosition(others) & Node.DOCUMENT_POSITION_FOLLOWING;
    });
    expect(order).toBeTruthy();
  });

  test("/faq: pills, search filters, JSON-LD only general questions, footer + sitemap link", async ({ page, request }) => {
    await page.goto("/faq");
    await expect(page.getByRole("navigation", { name: "FAQ topics" }).first().getByRole("link")).toHaveCount(allFaqGroups().length);
    await page.getByLabel("Search FAQs").fill("laddu");
    await expect(page.locator("details.faq-item:visible")).not.toHaveCount(0);
    const visibleCount = await page.locator("details.faq-item:visible").count();
    expect(visibleCount).toBeLessThan(10);
    await page.getByLabel("Search FAQs").fill("zzzz-no-match");
    await expect(page.locator("[data-faq-empty]")).toBeVisible();
    const html = await (await request.get("/faq")).text();
    const ld = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1])).flat().filter((b) => b["@type"] === "FAQPage");
    expect(ld).toHaveLength(1);
    expect(ld[0].mainEntity.length).toBe(faqs.home.length + faqs.blogs.length + faqs.team.length);
    // Page-local anchors are rebased to their own page.
    expect(html).toContain('href="/tourism#planner"');
    await expect(page.locator('footer a[href="/faq"]')).toHaveText("FAQs");
    expect(await (await request.get("/sitemap.xml")).text()).toContain("/faq</loc>");
  });

  test("home FAQ live line shows the mocked Kanpur weather", async ({ page }) => {
    await mockApis(page);
    await page.goto("/#faq-what-is-the-weather-like-in-kanpur-today");
    await expect(page.locator("#faq-what-is-the-weather-like-in-kanpur-today")).toContainText("Today in Kanpur");
    await expect(page.locator("#faq-what-is-the-weather-like-in-kanpur-today")).toContainText("10% chance of rain");
  });
});

test.describe("Weather page", () => {
  test("metadata, static H2, today strip, hourly row, tomorrow card, last updated, IMD link", async ({ page }) => {
    await mockApis(page);
    await page.goto("/weather");
    await expect(page).toHaveTitle("Kanpur Weather Today & Tomorrow – Live Rain Radar & Forecast | Kanpur Ki Kahaani");
    expect(await page.locator('meta[name="description"]').getAttribute("content")).toBe(
      "Live Kanpur weather now: current temperature, rain today, tomorrow's forecast, hourly and 7-day outlook, and a live rain radar. Check the weather at your location too.",
    );
    await expect(page.getByRole("heading", { level: 2, name: "Kanpur weather right now" })).toBeVisible();
    const today = page.locator("#today");
    await expect(today).toContainText("32° / 21°C");
    await expect(today).toContainText("10%");
    await expect(today).toContainText("6:31 am");
    await expect(today).toContainText("5:22 pm");
    await expect(today).toContainText("5 Moderate");
    await expect(page.locator("#hourly li")).toHaveCount(24);
    await expect(page.locator("#hourly li").first()).toContainText("Now");
    await expect(page.locator("#tomorrow")).toContainText("Tomorrow in Kanpur");
    await expect(page.locator("#tomorrow")).toContainText("70%");
    await expect(page.getByText(/Last updated .* IST · refreshes every 30 minutes/)).toBeVisible();
    await expect(page.locator('a[href="https://mausam.imd.gov.in"]').first()).toBeVisible();
  });

  test("?city= preselects and stays in sync; live FAQ lines follow the city", async ({ page }) => {
    await mockApis(page);
    await page.goto("/weather?city=lucknow");
    await expect(page.getByRole("button", { name: "Lucknow", pressed: true })).toBeVisible();
    await expect(page.locator("#today-title")).toHaveText("Today in Lucknow");
    await expect(page.locator("#faq-what-is-the-current-temperature-in-kanpur")).toContainText("Right now in Lucknow: 29°C");
    await page.getByRole("button", { name: "Agra", exact: true }).click();
    await expect(page).toHaveURL(/city=agra/);
    await expect(page.locator("#faq-what-is-the-current-temperature-in-kanpur")).toContainText("Right now in Agra");
  });

  test("radar loads lazily with attribution and play/pause", async ({ page }) => {
    const m = await mockApis(page);
    await page.goto("/weather");
    await expect(page.locator("#today")).toContainText("°C");
    expect(m.requests.some((r) => r.url().includes("rainviewer"))).toBe(false); // not before scrolling
    await page.locator("#radar").scrollIntoViewIfNeeded();
    await expect(page.locator(".leaflet-container")).toBeVisible();
    await expect(page.locator(".leaflet-control-attribution")).toContainText("RainViewer");
    await expect(page.locator(".leaflet-control-attribution")).toContainText("OpenStreetMap");
    await expect(page.getByText(/Radar at .* IST \(latest\)/)).toBeVisible();
    await page.getByRole("button", { name: "Play last 2 hours" }).click();
    await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();
    await expect(page.getByText(/\(latest\)/)).toBeHidden({ timeout: 3000 });
  });

  test("radar failure falls back to the IMD link", async ({ page }) => {
    await mockApis(page, { radarFails: true });
    await page.goto("/weather");
    await expect(page.locator("#today")).toContainText("°C");
    await page.locator("#radar").scrollIntoViewIfNeeded();
    await expect(page.locator("#radar")).toContainText("couldn't load");
    await expect(page.locator('#radar a[href="https://mausam.imd.gov.in"]')).toBeVisible();
  });

  test("weather API failure: nothing breaks, live FAQ lines are hidden", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await mockApis(page, { weatherFails: true });
    await page.goto("/weather");
    await expect(page.getByText("We couldn't reach the weather service.")).toBeVisible();
    await expect(page.locator("#faq-what-is-the-current-temperature-in-kanpur")).not.toContainText("Right now in");
    await expect(page.locator("#faq-what-is-the-current-temperature-in-kanpur")).toContainText("The “Kanpur weather right now” card");
    expect(errors).toEqual([]);
  });
});

test.describe("Use my location", () => {
  test("allow: shows the place name, nothing stored but the choice, no coordinates to our servers", async ({ browser, baseURL }) => {
    const context = await browser.newContext({ geolocation: { latitude: 28.61394, longitude: 77.20902 }, permissions: ["geolocation"] });
    const page = await context.newPage();
    const m = await mockApis(page);
    await page.goto("/weather");
    // Geolocation is never requested before the click.
    expect(m.requests.some((r) => r.url().includes("latitude=28.61"))).toBe(false);
    await page.getByRole("button", { name: /Use my location/ }).click();
    await expect(page.locator("#today-title")).toHaveText("Today in New Delhi");
    await expect(page.getByRole("button", { name: /Use my location/ })).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("#faq-what-is-the-current-temperature-in-kanpur")).toContainText("Right now in New Delhi: 18°C");
    // Coordinates are rounded and only go to Open-Meteo / BigDataCloud.
    const withCoords = m.requests.filter((r) => /28\.61|77\.21/.test(r.url() + (r.postData() ?? "")));
    expect(withCoords.length).toBeGreaterThan(0);
    for (const r of withCoords) expect(new URL(r.url()).host).toMatch(/^(api\.open-meteo\.com|api\.bigdatacloud\.net)$/);
    expect(withCoords.every((r) => !r.url().includes("28.61394"))).toBe(true);
    const own = m.requests.filter((r) => r.url().startsWith(baseURL!));
    for (const r of own) expect(r.url() + (r.postData() ?? "")).not.toMatch(/28\.61|77\.21/);
    // Storage: the choice only.
    const storage = await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } }));
    expect(storage.local["kkk-weather-use-location"]).toBe("1");
    expect(JSON.stringify(storage)).not.toMatch(/28\.61|77\.21/);
    await context.close();
  });

  test("deny: friendly message and Kanpur", async ({ browser }) => {
    const context = await browser.newContext({ permissions: [] });
    const page = await context.newPage();
    await mockApis(page);
    await page.goto("/weather?city=agra");
    await page.evaluate(() => {
      navigator.geolocation.getCurrentPosition = (_ok, fail) => fail?.({ code: 1, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3, message: "denied" } as GeolocationPositionError);
    });
    await page.getByRole("button", { name: /Use my location/ }).click();
    await expect(page.getByText(/Location access is off, so we're showing Kanpur/)).toBeVisible();
    await expect(page.locator("#today-title")).toHaveText("Today in Kanpur");
    await context.close();
  });
});
