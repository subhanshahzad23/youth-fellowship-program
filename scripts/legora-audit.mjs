import { chromium } from '@playwright/test';
const OUT = process.cwd() + '/docs/reference-legora';
const browser = await chromium.launch({ args: ['--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('https://legora.com/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(5000);
await page.evaluate(() => document.querySelectorAll('[id*="cookie"], [class*="cookie"], [id*="onetrust"]').forEach(e => e.remove()));
const top = await page.evaluate(() => { const h = [...document.querySelectorAll('h2,h1,h3')].find(e => /aOS/.test(e.textContent)); return h ? h.getBoundingClientRect().top + scrollY : 0; });
const info = await page.evaluate(() => {
  const canv = [...document.querySelectorAll('canvas')].map(c => { const r = c.getBoundingClientRect(); return { w: r.width, h: r.height, top: r.top + scrollY, ctx: c.getAttribute('data-engine') || '', cls: c.className.toString().slice(0, 60), parent: c.parentElement?.className?.toString().slice(0, 80) }; });
  const scripts = [...document.scripts].map(s => s.src).filter(Boolean).filter(s => /three|gl|spline|rive|lottie|unicorn/i.test(s)).slice(0, 10);
  return { canv, scripts, H: document.documentElement.scrollHeight };
});
console.log('aOS top', top, JSON.stringify(info, null, 1));
for (let i = 0; i < 16; i++) {
  await page.evaluate((y) => window.scrollTo(0, y), top - 100 + i * 350);
  await page.waitForTimeout(1300);
  await page.screenshot({ path: `${OUT}/aos-${String(i).padStart(2, '0')}.png` });
}
await browser.close();
