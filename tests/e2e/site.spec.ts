import { expect, test } from "@playwright/test";

test.describe("Header, hero and conversion rules", () => {
  test("home hero shows the headline, CTAs and the first-case offer under the hero", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Our team drafts the rest.");
    const hero = page.locator("[data-hero]");
    await expect(hero.getByRole("link", { name: "Book a 30-minute call" })).toBeVisible();
    await expect(hero.locator("[data-offer]")).toContainText("First case at half price");
    await expect(hero.locator("[data-offer]")).toContainText("Money-back guarantee");
  });

  for (const path of ["/", "/case-drafting", "/case-management", "/about"]) {
    test(`offer sits under the hero and above the closing button on ${path}`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator("[data-hero] [data-offer]")).toHaveCount(1);
      const cta = page.locator("section[aria-labelledby='cta-h']");
      await expect(cta.locator("[data-offer]")).toHaveCount(1);
      const offerBox = await cta.locator("[data-offer]").boundingBox();
      const btnBox = await cta.getByRole("link", { name: "Book a 30-minute call" }).boundingBox();
      expect(offerBox!.y).toBeLessThan(btnBox!.y);
    });
  }

  test("Services and Who we serve dropdowns open and navigate", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Main" });
    await nav.getByRole("button", { name: "Services" }).click();
    await expect(page.getByRole("link", { name: /Case management/ }).first()).toBeVisible();
    await page.getByRole("link", { name: "Case drafting Filing-ready petitions in your format" }).click();
    await expect(page).toHaveURL(/\/case-drafting$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Filing-ready petitions");

    await nav.getByRole("button", { name: "Who we serve" }).click();
    for (const name of ["Overview", "Solo and small firms", "Growing firms", "Large and high-volume"]) {
      await expect(page.getByRole("link", { name: new RegExp(name) }).first()).toBeVisible();
    }
    await page.getByRole("link", { name: "Growing firms Flexible capacity as volume climbs" }).click();
    await expect(page).toHaveURL(/\/who-we-serve\/growing-firms$/);
  });

  test("Book a call CTA turns black after the hero", async ({ page }) => {
    await page.goto("/");
    const cta = page.getByTestId("nav-cta");
    await expect(cta).toHaveClass(/bg-jade/);
    await page.evaluate(() => window.scrollTo(0, 2200));
    await expect(cta).toHaveClass(/bg-void/);
  });

  test("practice selector swaps the case board", async ({ page }) => {
    await page.goto("/");
    const board = page.getByTestId("case-board");
    await board.getByRole("radio", { name: "High-volume" }).first().click();
    await expect(board.getByText("H-1B cap season").first()).toBeVisible();
    await board.getByRole("radio", { name: "Small firm" }).first().click();
    await expect(board.getByText("Climate engineer").first()).toBeVisible();
  });

  test("concept pill lists every page group", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("concept-pill").click();
    const index = page.getByRole("navigation", { name: "Page index" });
    for (const g of ["Home", "Case drafting", "Overview", "Resource hub", "Casey", "Design system"]) await expect(index.getByRole("link", { name: g })).toBeVisible();
    await index.getByRole("link", { name: "About · process · security" }).click();
    await expect(page).toHaveURL(/\/about$/);
  });
});

test.describe("Mobile menu", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("opens, expands a group and navigates", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();
    const dialog = page.getByRole("dialog", { name: "Site menu" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Services" }).click();
    await dialog.getByRole("link", { name: "Case management" }).click();
    await expect(page).toHaveURL(/\/case-management$/);
    await expect(dialog).toBeHidden();
  });
});

test.describe("3D petition stack", () => {
  test("desktop builds the three.js stack on scroll and splits into case types", async ({ page }) => {
    await page.goto("/");
    const section = page.getByTestId("petition-stack");
    await expect(section).toHaveAttribute("data-mode", "3d");
    await page.evaluate(() => window.scrollTo(0, document.getElementById("petition-stack")!.offsetTop));
    await expect(section.locator("canvas")).toHaveCount(1, { timeout: 20_000 });
    await expect(section.getByText("Layer 1 of 7")).toBeVisible();
    await page.evaluate(() => {
      const el = document.getElementById("petition-stack")!;
      window.scrollTo(0, el.offsetTop + (el.offsetHeight - window.innerHeight) * 0.6);
    });
    await expect(section.getByText(/Layer [4-6] of 7/)).toBeVisible();
    await page.evaluate(() => {
      const el = document.getElementById("petition-stack")!;
      window.scrollTo(0, el.offsetTop + el.offsetHeight - window.innerHeight - 4);
    });
    await expect(section.getByText("Layer 7 of 7")).toBeVisible();
    await expect(section.getByText("Ready to sign")).toBeVisible();
    await expect(section.getByRole("link", { name: /See what.s in each package/ })).toBeVisible();
  });

  test.describe("reduced motion", () => {
    test.use({ reducedMotion: "reduce" });
    test("falls back to the CSS stack with tap-to-expand layers", async ({ page }) => {
      await page.goto("/");
      const section = page.getByTestId("petition-stack");
      await expect(section).toHaveAttribute("data-mode", "css");
      await expect(section.locator("canvas")).toHaveCount(0);
      await section.getByRole("button", { name: /Two-step quality review/ }).click();
      await expect(section.getByText("A second specialist checks every criterion")).toBeVisible();
    });
  });

  test.describe("mobile", () => {
    test.use({ viewport: { width: 390, height: 844 } });
    test("uses the CSS stack on phones", async ({ page }) => {
      await page.goto("/");
      await expect(page.getByTestId("petition-stack")).toHaveAttribute("data-mode", "css");
    });
  });
});

test.describe("Video testimonials", () => {
  test("play opens a captioned video dialog", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Play testimonial from Managing Attorney, California/ }).first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText("Managing Attorney, California");
    const video = dialog.getByTestId("testimonial-video");
    await expect(video).toBeVisible();
    await expect(video.locator("track[kind=captions]")).toHaveAttribute("src", /testimonial-volume\.vtt/);
    const res = await page.request.get("/media/testimonial-volume.mp4");
    expect(res.status()).toBe(200);
  });
});
