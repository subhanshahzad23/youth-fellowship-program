import { expect, test } from "@playwright/test";

const ROUTES = [
  "/", "/case-drafting", "/case-management", "/about", "/book-a-call",
  "/who-we-serve", "/who-we-serve/solo-and-small-firms", "/who-we-serve/growing-firms", "/who-we-serve/large-and-high-volume",
  "/resources", "/blog", "/blog/paralegal-outsourcing-cost-vs-in-house", "/blog/output-verification-ai-tools",
  "/podcast", "/podcast/attorneys-as-seen-by-paralegals", "/podcast/rfe-season-without-overtime",
  "/case-studies", "/case-studies/high-volume-cap-season",
  "/sample-work", "/sample-work/eb2-niw-business-plan", "/faq",
  "/casey", "/ai-use-policy", "/privacy-policy", "/design-system",
];

const WIDTHS = [390, 768, 1440];

for (const width of WIDTHS) {
  test.describe(`every route at ${width}px`, () => {
    test.use({ viewport: { width, height: 900 } });
    for (const path of ROUTES) {
      test(`${path} loads cleanly`, async ({ page }) => {
        const problems: string[] = [];
        page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
        page.on("console", (m) => {
          if (m.type() === "error" && !/WebGL|GPU stall|GL Driver/i.test(m.text())) problems.push(`console: ${m.text()}`);
        });
        const res = await page.goto(path);
        expect(res?.status(), "HTTP status").toBe(200);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        await expect(page.locator("footer")).toContainText("Goodcase is not a law firm");
        await page.waitForTimeout(400);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(overflow, "horizontal overflow (px)").toBeLessThanOrEqual(0);
        expect(problems).toEqual([]);
      });
    }
  });
}

test("unknown routes show the branded 404", async ({ page }) => {
  const res = await page.goto("/no-such-page");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("This page isn't in the file.");
});
