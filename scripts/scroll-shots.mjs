// Usage: node scripts/scroll-shots.mjs <path> <outPrefix> [personaId] [width] [height] [step]
import { chromium } from '@playwright/test';
const [, , path = '/', prefix = 'shot', persona = '', width = '1440', height = '900', stepArg = ''] = process.argv;
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: Number(width), height: Number(height) } });
if (persona) await ctx.addInitScript((p) => { if (!localStorage.getItem('launchpad-fellowship-demo')) localStorage.setItem('launchpad-fellowship-demo', JSON.stringify({ state: { personaId: p }, version: 8 })); }, persona);
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text().slice(0, 240)); });
await page.goto('http://localhost:3000' + path, { waitUntil: 'networkidle', timeout: 90000 });
await page.waitForTimeout(2200);
const H = await page.evaluate(() => document.documentElement.scrollHeight);
const step = Number(stepArg || Math.round(Number(height) * 0.9));
let i = 0;
for (let y = 0; y < H; y += step) {
  await page.evaluate((y) => window.scrollTo(0, y), y);
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${prefix}-${String(i).padStart(2, '0')}.png` });
  i++;
}
const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
console.log(JSON.stringify({ H, shots: i, overflow, errors: errors.slice(0, 10) }));
await browser.close();
