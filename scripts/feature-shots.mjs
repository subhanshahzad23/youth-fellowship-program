// Curated screenshots of the key interactions for the pitch.
// Usage: BASE=http://localhost:3100 node scripts/feature-shots.mjs docs/screenshots/features
import { chromium } from '@playwright/test';
import fs from 'fs';

const BASE = process.env.BASE || 'http://localhost:3100';
const out = process.argv[2] || 'docs/screenshots/features';
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const shot = (page, name) => page.screenshot({ path: `${out}/${name}.png` });
const wait = (page, ms) => page.waitForTimeout(ms);

async function desktop() {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/');
  await wait(page, 1800);
  await shot(page, '01-home-hero');

  await page.getByRole('navigation', { name: 'Main' }).getByRole('button', { name: 'Services' }).hover();
  await wait(page, 500);
  await shot(page, '02-services-dropdown');
  await page.mouse.move(700, 700);
  await wait(page, 400);

  const toStage = async (s) => {
    await page.evaluate((stage) => {
      const el = document.getElementById('petition-stack');
      window.scrollTo(0, el.offsetTop + (el.offsetHeight - window.innerHeight) * (stage / 7.4));
    }, s);
    await wait(page, 2200);
  };
  await toStage(0.02);
  await wait(page, 2500);
  await shot(page, '03-3d-stack-layer-1');
  await toStage(3.6);
  await shot(page, '04-3d-stack-building');
  await toStage(7.4);
  await shot(page, '05-3d-stack-filing-ready');

  await page.evaluate(() => document.getElementById('process').scrollIntoView());
  await page.evaluate(() => window.scrollBy(0, 300));
  await wait(page, 1200);
  await shot(page, '06-four-step-process');

  await page.evaluate(() => document.getElementById('roi').scrollIntoView());
  await page.evaluate(() => window.scrollBy(0, 150));
  await wait(page, 1000);
  await shot(page, '07-roi-calculator');

  await page.evaluate(() => document.getElementById('testimonials').scrollIntoView());
  await wait(page, 1000);
  await shot(page, '08-video-testimonials');
  await page.getByRole('button', { name: /Play testimonial from Managing Attorney, California/ }).first().click();
  await wait(page, 1500);
  await shot(page, '09-testimonial-player');
  await page.keyboard.press('Escape');

  await page.evaluate(() => document.getElementById('security').scrollIntoView());
  await wait(page, 1000);
  await shot(page, '10-security-card');

  await page.goto(BASE + '/book-a-call');
  await wait(page, 1500);
  const booking = page.getByTestId('booking');
  await booking.scrollIntoViewIfNeeded();
  await booking.locator('button[data-day]:not([disabled])').first().click();
  await booking.getByRole('list', { name: 'Available times' }).locator('button:not([disabled])').nth(2).click();
  await wait(page, 400);
  await shot(page, '11-booking-calendar');
  await booking.getByRole('button', { name: /^Continue with/ }).click();
  await booking.getByLabel('Your name').fill('Alex Morgan');
  await booking.locator('#b-email').fill('alex@examplefirm.com');
  await booking.locator('#b-firm').fill('Example Immigration Law');
  await booking.getByLabel('Firm size').selectOption('2–5 attorneys');
  await booking.getByLabel('Typical volume').selectOption('3–5 cases a month');
  await booking.getByRole('button', { name: 'O-1', exact: true }).click();
  await booking.getByRole('button', { name: 'EB-1A', exact: true }).click();
  await booking.getByRole('button', { name: 'Confirm booking' }).click();
  await wait(page, 1500);
  await page.evaluate(() => { const el = document.querySelector('[data-testid=booking]'); window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 110); });
  await wait(page, 500);
  await shot(page, '12-booking-confirmed');

  for (const [path, name] of [['/case-drafting', '13-case-drafting'], ['/case-management', '14-case-management'], ['/about', '15-about'], ['/who-we-serve/growing-firms', '16-segment-page'], ['/resources', '17-resources'], ['/blog/paralegal-outsourcing-cost-vs-in-house', '18-article'], ['/sample-work/o1a-exhibits-format', '19-sample-work'], ['/casey', '20-casey'], ['/design-system', '21-design-system']]) {
    await page.goto(BASE + path);
    await wait(page, 1500);
    await shot(page, name);
  }
  await ctx.close();
}

async function mobile() {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto(BASE + '/');
  await wait(page, 1800);
  await shot(page, 'm01-home');
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('dialog', { name: 'Site menu' }).getByRole('button', { name: 'Services' }).click();
  await wait(page, 500);
  await shot(page, 'm02-menu');
  await page.getByRole('button', { name: 'Close menu' }).click();
  await page.evaluate(() => document.getElementById('petition-stack').scrollIntoView());
  await page.evaluate(() => window.scrollBy(0, 160));
  await wait(page, 1200);
  await shot(page, 'm03-stack-fallback');
  await page.goto(BASE + '/book-a-call');
  await wait(page, 1500);
  await page.getByTestId('booking').scrollIntoViewIfNeeded();
  await shot(page, 'm04-booking');
  await ctx.close();
}

await desktop();
await mobile();
await browser.close();
console.log('feature shots saved to', out);
