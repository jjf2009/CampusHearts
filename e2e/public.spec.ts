import { expect, test } from "@playwright/test";
import { expectNoHorizontalScroll } from "./helpers";

test.describe("public pages", () => {
  test("landing explains the product and links to login", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Find your");
    await expect(page.getByText("Goa College of Engineering only")).toBeVisible();
    await expectNoHorizontalScroll(page);

    // FAQ answers expand
    const faq = page.getByText("I'm a fresher without an ID card or GEC email. Can I join?");
    await faq.click();
    await expect(page.getByText(/Provisional Admit Card PDF/)).toBeVisible();

    await page.getByRole("link", { name: "Join Campus Buddy" }).click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("login asks for an email and explains seniors vs freshers", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByText(/@gec\.ac\.in/).first()).toBeVisible();
    await expect(page.getByText(/admit card next/)).toBeVisible();
    await expectNoHorizontalScroll(page);
  });

  for (const [path, heading] of [
    ["/safety", "Safety & rules"],
    ["/terms", "Terms"],
    ["/privacy", "Privacy"],
  ]) {
    test(`${path} renders`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toContainText(heading);
      await expectNoHorizontalScroll(page);
    });
  }

  test("app pages send logged-out visitors to login", async ({ page }) => {
    for (const path of ["/explore", "/likes", "/chats", "/profile", "/settings", "/admin", "/verify"]) {
      await page.goto(path);
      await expect(page, path).toHaveURL(/\/login$/);
    }
  });

  test("old routes redirect", async ({ page }) => {
    await page.goto("/signup");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("unknown pages: logged-out visitors go to login; public 404s are friendly", async ({ page }) => {
    await page.goto("/this-does-not-exist");
    await expect(page).toHaveURL(/\/login$/);
    const res = await page.goto("/dev/preview/does-not-exist");
    expect(res?.status()).toBe(404);
    await expect(page.getByText("Oops, nothing here")).toBeVisible();
  });

  test("sends security headers and a web manifest", async ({ request }) => {
    const res = await request.get("/");
    expect(res.headers()["x-frame-options"]).toBe("DENY");
    expect(res.headers()["x-content-type-options"]).toBe("nosniff");
    const manifest = await request.get("/manifest.webmanifest");
    expect(manifest.ok()).toBeTruthy();
    expect((await manifest.json()).name).toBe("Campus Buddy");
  });

  test("photo and admin APIs refuse anonymous callers", async ({ request }) => {
    expect((await request.get("/api/photos/00000000-0000-4000-8000-000000000001/0-1.bin")).status()).toBe(401);
    expect((await request.post("/api/admin", { data: { action: "unban" } })).status()).toBe(404);
    expect((await request.post("/api/verify-admission")).status()).toBe(401);
    expect((await request.delete("/api/account")).status()).toBe(401);
  });
});
