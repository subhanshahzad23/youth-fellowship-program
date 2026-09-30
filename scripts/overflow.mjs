// Usage: node scripts/overflow.mjs <path> [persona] [width]
import { chromium } from '@playwright/test';
const [, , path = '/', persona = '', width = '390'] = process.argv;
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: Number(width), height: 844 } });
if (persona) await ctx.addInitScript((p) => { if (!localStorage.getItem('launchpad-fellowship-demo')) localStorage.setItem('launchpad-fellowship-demo', JSON.stringify({ state: { personaId: p }, version: 8 })); }, persona);
const page = await ctx.newPage();
await page.goto((process.env.BASE || 'http://localhost:3000') + path, { waitUntil: 'networkidle', timeout: 90000 });
await page.waitForTimeout(2500);
const res = await page.evaluate(() => {
  const W = document.documentElement.clientWidth;
  const out = [];
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect();
    if (r.right > W + 1 && r.width > 0) {
      // skip if an ancestor clips overflow
      let p = el.parentElement, clipped = false;
      while (p && p !== document.body) { const s = getComputedStyle(p); if (/(hidden|clip|auto|scroll)/.test(s.overflowX) && p.getBoundingClientRect().right <= W + 1) { clipped = true; break; } p = p.parentElement; }
      if (!clipped) out.push({ tag: el.tagName, cls: (el.className?.baseVal ?? el.className ?? '').toString().slice(0, 90), right: Math.round(r.right), w: Math.round(r.width), text: (el.innerText || '').slice(0, 40) });
    }
  }
  return { W, sw: document.documentElement.scrollWidth, items: out.slice(0, 15) };
});
console.log(JSON.stringify(res, null, 1));
await browser.close();
