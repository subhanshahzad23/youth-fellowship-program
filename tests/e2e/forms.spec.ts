import fs from "node:fs";
import { expect, test, type Page } from "@playwright/test";

test.describe("ROI calculator", () => {
  test("defaults and slider changes compute correctly", async ({ page }) => {
    await page.goto("/");
    const roi = page.getByTestId("roi").first();
    await roi.scrollIntoViewIfNeeded();
    // 4 cases × ($2,920 − $500) + 4 × (6 − 2) h × $300
    await expect(roi.getByTestId("roi-monthly")).toHaveText("$14,480");
    await expect(roi.getByTestId("roi-annual")).toHaveText("$173,760");
    await expect(roi.getByTestId("roi-hours")).toHaveText("16 h");
    await expect(roi.getByTestId("roi-first")).toHaveText("$250");
    await roi.getByLabel("Cases per month").fill("10");
    // 10 × 2,420 + 40 h × 300 = 24,200 + 12,000
    await expect(roi.getByTestId("roi-monthly")).toHaveText("$36,200");
    await expect(roi.getByTestId("roi-annual")).toHaveText("$434,400");
    await roi.getByLabel("Goodcase flat fee per case").fill("1000");
    await expect(roi.getByTestId("roi-drafting")).toHaveText("$19,200");
    await expect(roi.getByTestId("roi-first")).toHaveText("$500");
  });
});

async function pickSlot(page: Page) {
  const booking = page.getByTestId("booking");
  let day = booking.locator("button[data-day]:not([disabled])").first();
  if ((await day.count()) === 0) {
    await booking.getByRole("button", { name: "Next month" }).click();
    day = booking.locator("button[data-day]:not([disabled])").first();
  }
  await day.click();
  await booking.getByRole("list", { name: "Available times" }).locator("button:not([disabled])").first().click();
  await booking.getByRole("button", { name: /^Continue with/ }).click();
  return booking;
}

test.describe("Booking calendar", () => {
  test("validates, books, downloads a real .ics and survives reload", async ({ page }) => {
    await page.goto("/book-a-call");
    const booking = await pickSlot(page);
    await booking.getByRole("button", { name: "Confirm booking" }).click();
    await expect(booking.getByRole("alert").first()).toContainText("Enter your name");
    await expect(booking.getByRole("alert").first()).toContainText("Choose your firm size");

    await booking.getByLabel("Your name").fill("Alex Morgan");
    await booking.locator("#b-email").fill("alex@examplefirm.com");
    await booking.locator("#b-firm").fill("Example Immigration Law");
    await booking.getByLabel("Firm size").selectOption("2–5 attorneys");
    await booking.getByLabel("Typical volume").selectOption("3–5 cases a month");
    await booking.getByRole("button", { name: "O-1", exact: true }).click();
    await expect(booking.locator("[data-offer]")).toBeVisible();
    await booking.getByRole("button", { name: "Confirm booking" }).click();

    const done = page.getByTestId("booking-done");
    await expect(done).toContainText("You're booked, Alex.");
    await expect(done.getByRole("link", { name: "Google Calendar" })).toHaveAttribute("href", /calendar\.google\.com.*action=TEMPLATE/);

    const [download] = await Promise.all([page.waitForEvent("download"), done.getByTestId("ics").click()]);
    expect(download.suggestedFilename()).toBe("goodcase-intro-call.ics");
    const ics = fs.readFileSync((await download.path())!, "utf8");
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toMatch(/DTSTART:\d{8}T\d{6}Z/);
    expect(ics).toContain("SUMMARY:Goodcase intro call (30 min)");

    await page.reload();
    await expect(page.getByTestId("booking")).toContainText("You already have a call");
    await page.getByRole("button", { name: "View booking" }).click();
    await page.getByRole("button", { name: "Cancel booking" }).click();
    await expect(page.getByTestId("booking")).not.toContainText("You already have a call");
  });
});

test.describe("Contact form and newsletter", () => {
  test("contact form shows an error summary, then a success state", async ({ page }) => {
    await page.goto("/book-a-call#contact");
    const form = page.getByTestId("contact-form");
    await form.getByRole("button", { name: "Send message" }).click();
    const alert = form.getByRole("alert").first();
    await expect(alert).toContainText("Enter your name");
    await expect(alert).toContainText("Choose what your message is about");
    await form.getByLabel("Your name").fill("Jordan Lee");
    await form.getByLabel("Work email").fill("jordan@examplefirm.com");
    await form.getByLabel("What's it about?").selectOption("Pricing");
    await form.getByLabel("Message").fill("We file about eight O-1 petitions a month and want to discuss pricing.");
    await form.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByTestId("contact-success")).toContainText("Thanks, Jordan");
  });

  test("newsletter validates, subscribes and detects duplicates", async ({ page }) => {
    await page.goto("/about");
    const email = page.getByLabel("Work email");
    await email.fill("not-an-email");
    await page.getByRole("button", { name: "Subscribe" }).click();
    await expect(page.getByText("Enter a valid work email")).toBeVisible();
    await email.fill("partner@examplefirm.com");
    await page.getByRole("button", { name: "Subscribe" }).click();
    await expect(page.getByText("You're subscribed.")).toBeVisible();
    await page.getByRole("button", { name: "Use another email" }).click();
    await page.getByLabel("Work email").fill("PARTNER@examplefirm.com");
    await page.getByRole("button", { name: "Subscribe" }).click();
    await expect(page.getByText("You're already on the list.")).toBeVisible();
  });
});
