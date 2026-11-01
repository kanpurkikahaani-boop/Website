/**
 * Admin login & blog editing — end-to-end acceptance tests (v6 checklist).
 * Runs against a production build wired to tests/support/fake-supabase.mjs, where every database
 * call goes through the real migrations + Row Level Security in Postgres.
 */
import { expect, test, type Page } from "@playwright/test";

const SUPA = "http://127.0.0.1:54400";
const ADMIN = { email: "team@kanpurkikahaani.site", password: "Correct-Horse-Battery-9" };
const VISITOR = { email: "someone@gmail.com", password: "Visitor-Pass-12345" };
// 1×1 PNG
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");

async function passwordSignIn(page: Page, who = ADMIN, next = "/admin/blogs") {
  await page.goto(`/admin/login?next=${encodeURIComponent(next)}`);
  await page.fill("input[name=email]", who.email);
  await page.fill("input[name=password]", who.password);
  await page.click('button:has-text("Sign in with email")');
}

async function signOut(page: Page) {
  await page.goto("/admin");
  await page.getByRole("button", { name: "Sign out" }).first().click();
  await page.waitForURL("**/blogs");
}

const rest = (path: string, init: RequestInit = {}) =>
  fetch(`${SUPA}/rest/v1/${path}`, { ...init, headers: { apikey: "anon-test", "content-type": "application/json", Prefer: "return=representation", ...(init.headers ?? {}) } });

test.describe.configure({ mode: "serial" });

test.describe("signed out", () => {
  test("admin pages redirect to the login page", async ({ page }) => {
    for (const path of ["/admin", "/admin/blogs", "/admin/blogs/new"]) {
      await page.goto(path);
      await expect(page).toHaveURL(new RegExp(`/admin/login\\?next=${encodeURIComponent(path).replace(/%2F/g, "%2F")}`));
    }
    await expect(page.getByText("This area is for the Kanpur Ki Kahaani team only.")).toBeVisible();
  });

  test("public pages contain no admin controls", async ({ page, request }) => {
    const html = await (await request.get("/blogs/navaratri-in-kanpur")).text();
    expect(html).not.toContain("Edit this post");
    expect(html).not.toContain("Signed in as team");
    expect(html).not.toContain("/admin/blogs/");
    await page.goto("/blogs/navaratri-in-kanpur");
    await page.waitForTimeout(800);
    await expect(page.getByText("Edit this post")).toHaveCount(0);
    const blogs = await (await request.get("/blogs")).text();
    expect(blogs).not.toContain("+ New post");
  });

  test("admin pages are noindex and absent from the sitemap", async ({ request }) => {
    const login = await request.get("/admin/login");
    expect(login.headers()["x-robots-tag"]).toContain("noindex");
    expect(await login.text()).toMatch(/<meta name="robots" content="noindex, nofollow/);
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).not.toContain("/admin");
    expect(sitemap).not.toContain("/preview");
  });
});

test.describe("database (anon key, straight to Supabase)", () => {
  test("writes are rejected and drafts are invisible", async () => {
    const statuses = [
      (await rest("posts", { method: "POST", body: JSON.stringify({ slug: "hack", title: "Hacked" }) })).status,
      (await rest("authors", { method: "POST", body: JSON.stringify({ slug: "fake", name: "Fake" }) })).status,
      (await rest("post_revisions", { method: "POST", body: JSON.stringify({ post_id: "00000000-0000-0000-0000-000000000000", title: "x" }) })).status,
    ];
    for (const s of statuses) expect([401, 403]).toContain(s);
    // PATCH/DELETE succeed with zero rows (as on Supabase) because RLS hides every row from anon.
    expect(await (await rest("posts?slug=eq.navaratri-in-kanpur", { method: "PATCH", body: JSON.stringify({ title: "Defaced" }) })).json()).toEqual([]);
    expect(await (await rest("posts?slug=eq.navaratri-in-kanpur", { method: "DELETE" })).json()).toEqual([]);
    const still = await (await rest("posts?select=title&slug=eq.navaratri-in-kanpur")).json();
    expect(still[0].title).toContain("Navaratri");
    const drafts = await (await rest("posts?select=id&status=eq.draft")).json();
    expect(drafts).toEqual([]);
    const audit = await rest("admin_audit?select=id");
    expect(await audit.json()).toEqual([]);
    const upload = await fetch(`${SUPA}/storage/v1/object/blog-images/x/evil.png`, { method: "POST", headers: { apikey: "anon-test", "content-type": "image/png" }, body: PNG });
    expect(upload.status).toBe(403);
  });
});

test.describe("sign-in rules", () => {
  test("a non-admin Google account is signed out with a clear message", async ({ page }) => {
    await fetch(`${SUPA}/__control/google?email=${VISITOR.email}`);
    await page.goto("/admin/login");
    await page.click('button:has-text("Continue with Google")');
    await expect(page).toHaveURL(/error=forbidden/);
    await expect(page.getByText("This account doesn't have team access.")).toBeVisible();
    await page.goto("/admin/blogs");
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("a non-admin password account is signed out too", async ({ page }) => {
    await passwordSignIn(page, VISITOR);
    await expect(page.getByText("This account doesn't have team access.")).toBeVisible();
    const cookies = await page.context().cookies();
    expect(cookies.find((c) => c.name.startsWith("sb-") && c.value)).toBeUndefined();
  });

  test("password attempts are rate-limited (5 per 15 min)", async ({ page }) => {
    for (let i = 0; i < 5; i++) await passwordSignIn(page, { email: "nobody@example.com", password: `wrong-${i}` });
    await expect(page.getByText(/Too many attempts\. Please wait \d+ minutes?/)).toBeVisible();
    await expect(page.getByText(/didn't match/)).toHaveCount(0);
  });

  test("?next= only accepts internal admin paths", async ({ page }) => {
    await passwordSignIn(page, ADMIN, "https://evil.example/steal");
    await expect(page).toHaveURL(/\/admin\/blogs$/);
    await signOut(page);
  });

  test("admin can sign in with Google", async ({ page }) => {
    await fetch(`${SUPA}/__control/google?email=${ADMIN.email}`);
    await page.goto("/admin/login?next=%2Fadmin%2Fsettings");
    await page.click('button:has-text("Continue with Google")');
    await expect(page).toHaveURL(/\/admin\/settings$/);
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
    const session = (await page.context().cookies()).find((c) => c.name.startsWith("sb-") && c.name.includes("auth-token"));
    expect(session?.httpOnly).toBe(true);
    expect(session?.sameSite).toBe("Lax");
    await signOut(page);
  });

  test("sessions older than 7 days are ended", async ({ page }) => {
    await passwordSignIn(page);
    await expect(page).toHaveURL(/\/admin\/blogs/);
    await fetch(`${SUPA}/__control/age-session?email=${ADMIN.email}&days=8`);
    await page.goto("/admin/blogs");
    await expect(page).toHaveURL(/error=expired/);
    await expect(page.getByText(/signed out after 7 days/)).toBeVisible();
  });
});

test.describe("writing and publishing", () => {
  const title = `E2E Test Story ${Date.now().toString().slice(-6)}`;
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  let editUrl = "";

  test.beforeEach(async ({ page }) => {
    await passwordSignIn(page);
    await expect(page).toHaveURL(/\/admin\/blogs/);
  });

  test("create a draft, autosave, upload an image, preview, publish", async ({ page, context, request }) => {
    await page.goto("/admin/blogs/new");
    await page.fill("#post-title", title);
    const body = page.getByLabel("Post body");
    await body.click();
    await page.keyboard.type("## The first day\nKanpur wakes up early for this. ");
    // Autosave (blur or 20 s) creates the draft; the editor then moves to its edit URL.
    await expect(page).toHaveURL(/\/admin\/blogs\/[0-9a-f-]+\/edit/, { timeout: 45_000 });
    await expect(page.getByText(/Saved · \d+s ago/)).toBeVisible();
    await expect(page.getByLabel("Post body")).toContainText("Kanpur wakes up early for this.");
    editUrl = page.url();

    // Image upload: alt text is required before inserting.
    await page.locator('input[type=file][accept="image/jpeg,image/png,image/webp"]').first().setInputFiles({ name: "Ganga Ghat.PNG", mimeType: "image/png", buffer: PNG });
    const insert = page.getByRole("button", { name: "Insert image" });
    await expect(insert).toBeDisabled();
    const dialog = page.getByRole("dialog", { name: "Add image" });
    await dialog.getByLabel(/Alt text/).fill("Sunrise over the Ganga at Bithoor");
    await dialog.getByLabel(/Caption/).fill("Representative image");
    await insert.click();
    await expect(body.locator("img[alt='Sunrise over the Ganga at Bithoor']")).toHaveAttribute("src", /blog-images\/[0-9a-f-]+\/ganga-ghat-[0-9a-f]{8}\.png/);

    // Preview opens the real template behind a signed token, marked as a draft.
    const [preview] = await Promise.all([context.waitForEvent("page"), page.getByRole("button", { name: "Preview ↗" }).click()]);
    await preview.waitForLoadState();
    expect(preview.url()).toMatch(new RegExp(`/blogs/${slug}\\?preview=`));
    await expect(preview.getByText(/Preview — draft, not visible to readers/)).toBeVisible();
    await expect(preview.locator("h1")).toHaveText(title);
    await preview.close();
    const anonPreview = await request.get(preview.url(), { headers: { cookie: "" } });
    expect(anonPreview.status()).toBe(404);

    await page.getByRole("button", { name: "Publish", exact: true }).click();
    await expect(page.getByText("Published — it's live on the site.")).toBeVisible();
    await expect((await request.get("/blogs")).text()).resolves.toContain(title);
    await expect((await request.get("/")).text()).resolves.toContain(title);
    expect((await request.get(`/blogs/${slug}`)).status()).toBe(200);
  });

  test("edit a live post and restore an older revision", async ({ page, request }) => {
    await page.goto(editUrl);
    const body = page.getByLabel("Post body");
    await body.click();
    await page.keyboard.press("End");
    await page.keyboard.type(" EDITED-LINE");
    await page.getByRole("button", { name: "Update", exact: true }).click();
    await expect(page.getByText(/Updated — the live post/)).toBeVisible();
    await expect((await request.get(`/blogs/${slug}`)).text()).resolves.toContain("EDITED-LINE");

    await page.getByRole("button", { name: "History" }).click();
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Restore this version" }).first().click();
    await expect(page.getByText("Older version restored.")).toBeVisible();
    await expect(body).not.toContainText("EDITED-LINE");
    await expect((await request.get(`/blogs/${slug}`)).text()).resolves.not.toContain("EDITED-LINE");
  });

  test("changing a published slug leaves a permanent redirect", async ({ page, request }) => {
    await page.goto(editUrl);
    await page.fill("#post-slug", `${slug}-renamed`);
    await expect(page.getByText(/will redirect here \(301\) automatically/)).toBeVisible();
    await page.getByRole("button", { name: "Update", exact: true }).click();
    await expect(page.getByText(/Updated/)).toBeVisible();
    const old = await request.get(`/blogs/${slug}`, { maxRedirects: 0 });
    expect([301, 308]).toContain(old.status());
    expect(old.headers().location).toContain(`/blogs/${slug}-renamed`);
    expect((await request.get(`/blogs/${slug}-renamed`)).status()).toBe(200);
  });

  test("unpublish, schedule, then Trash and restore", async ({ page, request }) => {
    await page.goto(editUrl);
    await page.getByRole("button", { name: "Unpublish (back to draft)" }).click();
    await expect(page.getByText("Unpublished — it's a draft again.")).toBeVisible();
    expect((await request.get(`/blogs/${slug}-renamed`)).status()).toBe(404);

    await page.fill("#post-date", "2030-01-01T10:00");
    await page.getByRole("button", { name: "Schedule", exact: true }).click();
    await expect(page.getByText(/Scheduled for 1 Jan 2030/)).toBeVisible();
    await expect(page.locator("aside strong", { hasText: /^Scheduled$/ })).toBeVisible();
    expect((await request.get(`/blogs/${slug}-renamed`)).status()).toBe(404);
    await expect((await request.get("/blogs")).text()).resolves.not.toContain(title);

    await page.goto(`/admin/blogs?q=${encodeURIComponent(title)}`);
    await expect(page.locator("td span", { hasText: /^Scheduled$/ })).toBeVisible();
    await page.getByRole("button", { name: "Delete" }).click();
    const move = page.getByRole("button", { name: "Move to Trash" });
    await expect(move).toBeDisabled();
    await page.getByRole("dialog").getByRole("textbox").fill(title);
    await move.click();
    await expect(page.getByText("No posts match.")).toBeVisible();

    await page.goto("/admin/blogs?view=trash");
    await expect(page.getByText(title)).toBeVisible();
    await page.getByRole("button", { name: "Restore" }).click();
    await expect(page.getByText("The Trash is empty.")).toBeVisible();
    await page.goto("/admin/settings");
    await expect(page.getByRole("cell", { name: "Moved to Trash" }).first()).toBeVisible();
    await expect(page.getByRole("cell", { name: "Restored" }).first()).toBeVisible();
  });

  test("duplicate makes a new draft", async ({ page }) => {
    await page.goto(`/admin/blogs?q=${encodeURIComponent(title)}`);
    await page.getByRole("button", { name: "Duplicate" }).click();
    await expect(page).toHaveURL(/\/edit$/);
    await expect(page.locator("#post-title")).toHaveValue(`Copy of ${title}`);
  });
});

test.describe("admin shortcuts on the live site", () => {
  test("edit pill, + New post and admin bar appear only for the admin", async ({ page }) => {
    await passwordSignIn(page);
    await page.goto("/blogs/navaratri-in-kanpur");
    await expect(page.getByRole("link", { name: "✎ Edit this post" })).toHaveAttribute("href", /\/admin\/blogs\/[0-9a-f-]+\/edit/);
    await expect(page.getByText("Signed in as team")).toBeVisible();
    await page.goto("/blogs");
    await expect(page.getByRole("link", { name: "+ New post" })).toBeVisible();

    await page.getByRole("button", { name: "Sign out" }).click();
    await page.waitForURL("**/blogs");
    await page.goto("/blogs/navaratri-in-kanpur");
    await page.waitForTimeout(800);
    await expect(page.getByText("Edit this post")).toHaveCount(0);
  });

  test("after sign-out the back button doesn't reveal admin pages", async ({ page }) => {
    await passwordSignIn(page);
    await page.goto("/admin/blogs");
    await signOut(page);
    await page.goBack(); // admin pages are no-store, so the browser asks again and is sent to login
    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(page.getByRole("heading", { name: "Blogs" })).toHaveCount(0);
  });
});

test.describe("password reset and 2-step verification", () => {
  test("forgot password → email link → new password works", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByRole("button", { name: "Forgot password?" }).click();
    await page.fill("input[name=email]", ADMIN.email);
    await page.getByRole("button", { name: "Email me a reset link" }).click();
    await expect(page.getByText(/If that address belongs to the team/)).toBeVisible();
    const mail = await (await fetch(`${SUPA}/__control/mail`)).json();
    await page.goto(mail.link);
    await expect(page).toHaveURL(/\/admin\/reset-password/);
    await page.fill("input[name=password]", "Brand-New-Pass-2026");
    await page.fill("input[name=confirm]", "Brand-New-Pass-2026");
    await page.getByRole("button", { name: "Save new password" }).click();
    await expect(page.getByText("Your new password is saved.")).toBeVisible();
    await signOut(page);
    ADMIN.password = "Brand-New-Pass-2026";
    await passwordSignIn(page);
    await expect(page).toHaveURL(/\/admin\/blogs/);
  });

  test("turning on 2-step verification asks for a code at sign-in", async ({ page }) => {
    await passwordSignIn(page, ADMIN, "/admin/settings");
    await page.getByRole("button", { name: "Enable 2-step verification" }).click();
    await expect(page.getByAltText("QR code for your authenticator app")).toBeVisible();
    const { code } = await (await fetch(`${SUPA}/__control/totp?email=${ADMIN.email}`)).json();
    await page.getByLabel(/Enter the 6-digit code/).fill(code);
    await page.getByRole("button", { name: "Confirm and turn on" }).click();
    await expect(page.getByText(/On\./)).toBeVisible();
    await signOut(page);

    await passwordSignIn(page);
    await expect(page).toHaveURL(/step=mfa/);
    await page.goto("/admin/blogs"); // can't skip the second step
    await expect(page).toHaveURL(/step=mfa/);
    await page.getByLabel(/6-digit code/).fill("000000");
    await page.getByRole("button", { name: "Verify and continue" }).click();
    await expect(page.getByText(/That code didn't work/)).toBeVisible();
    const { code: code2 } = await (await fetch(`${SUPA}/__control/totp?email=${ADMIN.email}`)).json();
    await page.getByLabel(/6-digit code/).fill(code2);
    await page.getByRole("button", { name: "Verify and continue" }).click();
    await expect(page).toHaveURL(/\/admin\/blogs/);
    await fetch(`${SUPA}/__control/reset-factors`);
  });
});
