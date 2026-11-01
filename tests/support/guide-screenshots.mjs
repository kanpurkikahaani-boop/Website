// Captures the screenshots used in ADMIN_GUIDE.md (run against the e2e stack: see tests/run-e2e.sh).
import { chromium } from "playwright";

const BASE = "http://localhost:3100";
const OUT = "docs/admin-guide";
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");

const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 1280, height: 860 } });
const shot = (name, opts = {}) => page.screenshot({ path: `${OUT}/${name}.png`, ...opts });

await page.goto(`${BASE}/admin/login`);
await shot("01-sign-in");

await page.fill("input[name=email]", "team@kanpurkikahaani.site");
await page.fill("input[name=password]", "Correct-Horse-Battery-9");
await page.click('button:has-text("Sign in with email")');
await page.waitForURL("**/admin/blogs");
await page.goto(`${BASE}/admin`);
await shot("02-dashboard");
await page.goto(`${BASE}/admin/blogs`);
await shot("03-post-list");

await page.goto(`${BASE}/admin/blogs/new`);
await page.fill("#post-title", "A Morning at Bithoor Ghat");
await page.fill("#post-standfirst", "Where the Ganga slows down and the city's history begins.");
await page.getByLabel("Post body").click();
await page.keyboard.type("## Getting there\nLeave Kanpur before sunrise and the road is yours. ");
await page.waitForURL(/\/edit$/, { timeout: 45000 });
await page.waitForTimeout(800);
await shot("04-editor");

await page.getByLabel("Post body").click();
await page.keyboard.press("End");
await page.keyboard.press("Shift+Home");
await page.getByRole("button", { name: "Add or edit link" }).click();
await page.getByLabel("Link address").fill("touri");
await page.waitForTimeout(300);
await shot("05-link-panel", { clip: { x: 0, y: 150, width: 1280, height: 520 } });
await page.keyboard.press("Escape");

await page.locator('input[type=file][accept="image/jpeg,image/png,image/webp"]').first().setInputFiles({ name: "ghat.png", mimeType: "image/png", buffer: PNG });
await page.getByRole("dialog", { name: "Add image" }).getByLabel(/Alt text/).fill("Steps of Bithoor Ghat at sunrise");
await shot("06-image-dialog");
await page.getByRole("button", { name: "Cancel" }).click();

await page.locator("aside").scrollIntoViewIfNeeded();
await page.locator("aside").screenshot({ path: `${OUT}/07-publish-panel.png` });

await page.getByRole("button", { name: "History" }).click();
await page.waitForTimeout(500);
await shot("08-history");
await page.getByRole("button", { name: "Close history" }).click();

await page.goto(`${BASE}/admin/blogs?view=trash`);
await shot("09-trash");
await page.goto(`${BASE}/admin/settings`);
await shot("10-settings");
await page.goto(`${BASE}/blogs/navaratri-in-kanpur`);
await page.waitForSelector("text=Edit this post");
await shot("11-edit-pill");
await b.close();
console.log("screenshots saved to", OUT);
