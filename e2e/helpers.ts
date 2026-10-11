import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, type Page } from "@playwright/test";

// A tiny solid PNG served in place of real (encrypted) photos.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAEklEQVR4nGP4z8CAFWEXHbQSACj/P8Fu7N9hAAAAAElFTkSuQmCC",
  "base64"
);

export async function mockPhotos(page: Page) {
  await page.route("**/api/photos/**", (route) => route.fulfill({ body: PNG, contentType: "image/png" }));
}

/** Fails if the page scrolls sideways (the #1 mobile layout bug). */
export async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, "page is wider than the screen").toBeLessThanOrEqual(1);
}

/** Every visible button/link must be at least `min` px tall and wide-ish to tap on a phone. */
export async function expectTapTargets(page: Page, selector = "main button, main a, nav a", min = 40) {
  const small = await page.$$eval(
    selector,
    (els, m) =>
      els
        .filter((el) => {
          const r = el.getBoundingClientRect();
          const style = getComputedStyle(el);
          return r.width > 0 && r.height > 0 && style.visibility !== "hidden" && !el.closest("p, li.text-sm");
        })
        .filter((el) => {
          const r = el.getBoundingClientRect();
          return r.height < m && !(el as HTMLElement).innerText.includes("\n") && el.tagName === "BUTTON";
        })
        .map((el) => `${el.tagName} "${(el as HTMLElement).innerText || el.getAttribute("aria-label")}" ${Math.round(el.getBoundingClientRect().height)}px`),
    min
  );
  expect(small, `tap targets under ${min}px`).toEqual([]);
}

export function readFixture(name: string) {
  return readFileSync(path.join(__dirname, "..", "tests", "fixtures", name));
}
