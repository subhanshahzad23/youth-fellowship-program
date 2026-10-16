// Sweeps every Goodcase route: reports console errors, hydration warnings, failed
// requests and horizontal overflow; saves screenshots (viewport, or full page with --full).
// Usage: BASE=http://localhost:3100 node scripts/route-sweep.mjs <outDir> [width] [--full]
import { chromium } from '@playwright/test';
import fs from 'fs';

const BASE = process.env.BASE || 'http://localhost:3100';
const out = process.argv[2] || 'sweep';
const width = Number(process.argv[3] || 1440);
const full = process.argv.includes('--full');
const only = process.env.ONLY ? process.env.ONLY.split(',') : null;
fs.mkdirSync(out, { recursive: true });

const ROUTES = [
  '/', '/case-drafting', '/case-management', '/about', '/book-a-call',
  '/who-we-serve', '/who-we-serve/solo-and-small-firms', '/who-we-serve/growing-firms', '/who-we-serve/large-and-high-volume',
  '/resources', '/blog', '/blog/paralegal-outsourcing-cost-vs-in-house', '/blog/ai-for-immigration-lawyers-safely',
  '/podcast', '/podcast/attorneys-as-seen-by-paralegals', '/podcast/anatomy-of-an-o1-petition',
  '/case-studies', '/case-studies/solo-o1-backlog',
  '/sample-work', '/sample-work/o1a-exhibits-format', '/faq',
  '/casey', '/ai-use-policy', '/privacy-policy', '/design-system', '/does-not-exist',
].filter((r) => !only || only.includes(r));

const browser = await chromium.launch();
const results = [];
for (const path of ROUTES) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await ctx.newPage();
  const issues = [];
  page.on('pageerror', (e) => issues.push('pageerror: ' + e.message.slice(0, 200)));
  page.on('console', (m) => {
    const t = m.text();
    if ((m.type() === 'error' || m.type() === 'warning') && !/Download the React DevTools|GPU stall|WebGL|GL Driver/i.test(t)) issues.push(m.type() + ': ' + t.slice(0, 200));
  });
  page.on('response', (r) => {
    if (r.status() >= 400 && !(path === '/does-not-exist' && r.url().endsWith('/does-not-exist'))) issues.push(`HTTP ${r.status()} ${r.url().replace(BASE, '')}`);
  });
  try {
    await page.goto(BASE + path, { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(1200);
    if (full) {
      // Scroll through so whileInView reveals fire, then back to the top.
      const h = await page.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y < h; y += 700) {
        await page.evaluate((yy) => window.scrollTo(0, yy), y);
        await page.waitForTimeout(90);
      }
      await page.waitForTimeout(600);
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    const title = await page.title();
    const h1 = await page.locator('h1').first().innerText().catch(() => '(no h1)');
    const name = `${width}${path === '/' ? '_home' : path.replace(/[/?=&]/g, '_')}`.slice(0, 90);
    await page.screenshot({ path: `${out}/${name}.png`, fullPage: full });
    results.push({ path, overflow, title, h1: h1.replace(/\n/g, ' ').slice(0, 60), issues });
  } catch (e) {
    results.push({ path, error: e.message.slice(0, 200), issues });
  }
  await ctx.close();
}
await browser.close();
let bad = 0;
for (const r of results) {
  const flag = r.error || r.overflow > 0 || r.issues.length ? '!!' : 'ok';
  if (flag === '!!') bad++;
  console.log(`${flag} ${r.path} | h1="${r.h1 ?? ''}" | overflow=${r.overflow ?? '?'} ${r.error ? '| ' + r.error : ''}`);
  for (const i of r.issues.slice(0, 4)) console.log('     ' + i);
}
console.log(`${results.length - bad}/${results.length} clean at ${width}px`);
