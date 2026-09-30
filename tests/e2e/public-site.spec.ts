import { expect, test } from "@playwright/test";
import { freshDemo } from "./helpers";

test.describe("public website", () => {
  test("desktop: nav dropdown, apply chooser, role preview → portal, FAQ, footer dialog", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await freshDemo(page, undefined, "/");
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Start with an idea.");

    // Tracks dropdown
    await page.getByRole("button", { name: "Tracks" }).hover();
    const trackLink = page.getByRole("link", { name: /Venture Building/ }).first();
    await expect(trackLink).toBeVisible();
    await trackLink.click();
    await expect(page).toHaveURL(/\/tracks\/venture-building/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Venture Building");

    // Apply chooser lists both open intakes
    await page.goto("/");
    await page.getByRole("button", { name: /^Apply$/ }).click();
    await expect(page.getByRole("link", { name: /Winter 2027/ }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Spring 2027/ }).first()).toBeVisible();
    await page.keyboard.press("Escape");

    // Role preview switches copy, then "Explore this workspace" signs in as that persona
    const program = page.getByRole("radio", { name: "Program team" }).first();
    await program.click();
    await expect(program).toHaveAttribute("aria-checked", "true");
    await expect(page.getByText(/score applications with a rubric/).first()).toBeVisible();
    await page.getByRole("button", { name: "Explore this workspace" }).first().click();
    await expect(page).toHaveURL(/\/admin\/dashboard/);

    // FAQ accordion
    await page.goto("/#faqs");
    const q = page.getByRole("button", { name: "How is residence checked?" });
    await q.click();
    await expect(q).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByText(/only a location check/)).toBeVisible();

    // Footer content dialog
    await page.getByRole("button", { name: "Accessibility" }).click();
    await expect(page.getByRole("dialog")).toContainText("keyboard");
    await page.keyboard.press("Escape");

    expect(errors).toEqual([]);
  });

  test("mobile: menu opens, groups expand, links navigate, no horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();
    const dialog = page.getByRole("dialog", { name: "Site menu" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Tracks" }).click();
    await dialog.getByRole("link", { name: "Leadership & Impact" }).click();
    await expect(page).toHaveURL(/\/tracks\/leadership-impact/);
    for (const path of ["/", "/tracks/founder-foundations", "/cohorts/summer-2026", "/demo"]) {
      await page.goto(path);
      await page.waitForTimeout(600);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `overflow on ${path}`).toBeLessThanOrEqual(0);
    }
  });

  test("interest registration for an upcoming cohort", async ({ page }) => {
    await page.goto("/cohorts/summer-2027");
    await page.getByRole("button", { name: "Register interest" }).first().click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Your name").fill("Jordan Rivera");
    await dialog.getByLabel("Email").fill("jordan@example.org");
    await dialog.getByRole("button", { name: "Register interest" }).click();
    await expect(dialog).toContainText("You're on the list");
  });

  test("reduced motion keeps all content and controls", async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // Journey falls back to the stacked list with all four stages visible in the DOM
    for (const t of ["Apply in one sitting", "Join a cohort that starts together", "Learn by doing, with real feedback", "Build with a mentor in your corner"]) {
      await expect(page.getByRole("heading", { name: new RegExp(t) }).last()).toBeAttached();
    }
    await page.getByRole("radio", { name: "Mentor" }).first().click();
    await expect(page.getByText(/staff oversight built in/).first()).toBeVisible();
    await ctx.close();
  });
});
