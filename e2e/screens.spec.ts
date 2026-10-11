import { expect, test } from "@playwright/test";
import { expectNoHorizontalScroll, expectTapTargets, mockPhotos } from "./helpers";

// These use /dev/preview, which renders real components with fake data.
test.beforeEach(async ({ page }) => {
  await mockPhotos(page);
});

const shot = (name: string) => ({ path: `test-results/screens/${name}.png`, fullPage: true });

test("browse grid: cards, kinds, likes-you badge, two sections", async ({ page }, info) => {
  await page.goto("/dev/preview");
  await expect(page.getByRole("heading", { name: "Browse" })).toBeVisible();
  await expect(page.locator("main li.sketch")).toHaveCount(8);
  await expect(page.getByText("Likes you!")).toBeVisible();
  await expect(page.getByText("More people you might like")).toBeVisible();
  await expectNoHorizontalScroll(page);
  await expectTapTargets(page);
  await page.screenshot(shot(`browse-${info.project.name}`));
});

test("photos stay hidden until pressed and held, and hide on release", async ({ page }) => {
  await page.goto("/dev/preview");
  const photo = page.locator(".protected-photo").first();
  await expect(photo.getByText("Hold to view")).toBeVisible();
  // No real <img> of anyone's photo in the page.
  expect(await page.locator("main img").count()).toBe(0);

  const box = (await photo.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await expect(photo.getByText("Hold to view")).toBeHidden({ timeout: 3000 });
  const painted = await photo.locator("canvas").evaluate((c: HTMLCanvasElement) =>
    c.getContext("2d")!.getImageData(0, 0, c.width, c.height).data.some((v) => v !== 0)
  );
  expect(painted).toBe(true);

  await page.mouse.up();
  await expect(photo.getByText("Hold to view")).toBeVisible();
  const cleared = await photo.locator("canvas").evaluate((c: HTMLCanvasElement) =>
    c.getContext("2d")!.getImageData(0, 0, c.width, c.height).data.every((v) => v === 0)
  );
  expect(cleared).toBe(true);
});

test("right-click on a photo is blocked", async ({ page }) => {
  await page.goto("/dev/preview");
  const prevented = await page.locator(".protected-photo").first().evaluate((el) => {
    const e = new MouseEvent("contextmenu", { bubbles: true, cancelable: true });
    el.dispatchEvent(e);
    return e.defaultPrevented;
  });
  expect(prevented).toBe(true);
});

test("liking someone open to both asks Date or Friend", async ({ page }) => {
  await page.goto("/dev/preview");
  // Rhea (index 1) is open to dating and friends.
  await page.getByRole("button", { name: "Like Rhea" }).click();
  const sheet = page.getByRole("dialog", { name: "Like Rhea as…" });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole("button", { name: /Date/ })).toBeVisible();
  await expect(sheet.getByRole("button", { name: /Friend/ })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();
});

test("filters open in a sheet and update the URL", async ({ page }) => {
  await page.goto("/dev/preview");
  await page.getByRole("button", { name: /^Filters/ }).click();
  const sheet = page.getByRole("dialog", { name: "Filters" });
  await expect(sheet).toBeVisible();
  await sheet.getByLabel("Branch").selectOption("Civil");
  await sheet.getByLabel("Age from").fill("18");
  await sheet.getByRole("button", { name: "Show results" }).click();
  await expect(page).toHaveURL(/branch=Civil/);
  await expect(page).toHaveURL(/ageMin=18/);
  await expect(page.getByRole("button", { name: /Remove filter Civil/ })).toBeVisible();

  await page.getByRole("radio", { name: /friends/ }).click();
  await expect(page).toHaveURL(/here=friends/);

  await page.getByLabel("Search profiles").fill("margao");
  await expect(page).toHaveURL(/q=margao/);
});

test("swipe view: pass and like buttons per kind", async ({ page }, info) => {
  await page.goto("/dev/preview?screen=swipe");
  await expect(page.getByRole("button", { name: "Pass on Aisha" })).toBeVisible();
  // Aisha is friends-only, so there's no dating button.
  await expect(page.getByRole("button", { name: "Like Aisha as a friend" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Like Aisha as a date" })).toHaveCount(0);
  await page.getByRole("button", { name: "Pass on Aisha" }).click();
  await expect(page.getByRole("button", { name: "Like Rhea as a date" })).toBeVisible();
  await expectNoHorizontalScroll(page);
  await page.screenshot(shot(`swipe-${info.project.name}`));
});

test("likes page has tabs for received and sent", async ({ page }, info) => {
  await page.goto("/dev/preview?screen=likes");
  await expect(page.getByRole("tab", { name: /Likes you \(2\)/ })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("button", { name: "Like back" })).toHaveCount(2);
  await page.getByRole("tab", { name: /Sent/ }).click();
  await expect(page.getByRole("button", { name: "Withdraw like" })).toBeVisible();
  await expectNoHorizontalScroll(page);
  await page.screenshot(shot(`likes-${info.project.name}`));
});

test("chat thread shows messages, shared WhatsApp and a composer", async ({ page }, info) => {
  await page.goto("/dev/preview?screen=chat");
  await expect(page.getByText("Hiii! Saw you're in Computer too 👋")).toBeVisible();
  await expect(page.getByText(/shared their WhatsApp/)).toBeVisible();
  await expect(page.getByLabel("Message")).toBeVisible();
  await expect(page.getByRole("button", { name: "Send" })).toBeDisabled();
  await page.getByLabel("Message").fill("hello!");
  await expect(page.getByRole("button", { name: "Send" })).toBeEnabled();
  await page.getByRole("button", { name: /More options for Rhea/ }).click();
  await expect(page.getByRole("button", { name: /Report Rhea/ })).toBeVisible();
  await page.getByRole("button", { name: /Report Rhea/ }).click();
  await expect(page.getByRole("dialog", { name: "Report Rhea" })).toBeVisible();
  await expect(page.getByLabel("Harassment or bullying")).toBeVisible();
  await expectNoHorizontalScroll(page);
  await page.screenshot({ path: `test-results/screens/chat-${info.project.name}.png` });
});

test("onboarding wizard validates each step", async ({ page }, info) => {
  await page.goto("/dev/preview?screen=onboarding");
  await expect(page.getByText("Step 1 of 5")).toBeVisible();
  await expect(page.getByLabel("First name")).toHaveValue("Anika");
  await expect(page.getByText("From your admit card").first()).toBeVisible();
  await page.screenshot(shot(`onboarding-${info.project.name}`));
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByText("Where are you from?")).toBeVisible();
  await page.getByLabel("From (hometown)").fill("Ponda");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByText("Step 2 of 5")).toBeVisible();
  await page.getByRole("radio", { name: /Dating/ }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByText("Pick who you'd like to see for dating.")).toBeVisible();
  await page.getByRole("radio", { name: "Men", exact: true }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByText("Step 3 of 5")).toBeVisible();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByText(/Add 3 photos/).last()).toBeVisible();
  await expectNoHorizontalScroll(page);
});

test("verify screen offers PDF and photo upload", async ({ page }, info) => {
  await page.goto("/dev/preview?screen=verify");
  await expect(page.getByRole("tab", { name: /PDF from portal/ })).toHaveAttribute("aria-selected", "true");
  await page.getByRole("button", { name: "Verify me" }).click();
  await expect(page.getByText("Choose your admit card PDF.")).toBeVisible();
  await page.getByRole("tab", { name: /Photo of card/ }).click();
  await expect(page.getByRole("button", { name: "Send for review" })).toBeVisible();
  await expectNoHorizontalScroll(page);
  await page.screenshot(shot(`verify-${info.project.name}`));

  await page.goto("/dev/preview?screen=pending");
  await expect(page.getByText("We're checking your card")).toBeVisible();
});

test("admin reports list", async ({ page }) => {
  await page.goto("/dev/preview?screen=admin");
  await expect(page.getByText("Kept messaging after I said no.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Ban Rohan" })).toBeVisible();
});

test("phone tab bar is visible on mobile with badges", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile", "mobile only");
  await page.goto("/dev/preview");
  const tabs = page.getByRole("navigation", { name: "Primary" });
  await expect(tabs).toBeVisible();
  for (const label of ["Browse", "Likes", "Chats", "Profile"]) {
    await expect(tabs.getByRole("link", { name: new RegExp(label) })).toBeVisible();
  }
  await expect(tabs.getByText("3")).toBeVisible();
});
