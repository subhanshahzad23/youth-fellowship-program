// Usage: node scripts/shot.mjs <path> <out.png> [personaId] [width] [fullPage]
import { chromium } from '@playwright/test';
const [, , path = '/', out = 'shot.png', persona = '', width = '1440', full = '1'] = process.argv;
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: Number(width), height: 900 } });
if (persona) await ctx.addInitScript((p) => { if (!localStorage.getItem('launchpad-fellowship-demo')) localStorage.setItem('launchpad-fellowship-demo', JSON.stringify({ state: { personaId: p }, version: 8 })); }, persona);
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text().slice(0, 300)); });
await page.goto('http://localhost:3000' + path, { waitUntil: 'networkidle', timeout: 90000 });
await page.waitForTimeout(1200);
await page.screenshot({ path: out, fullPage: full === '1' });
const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
console.log(JSON.stringify({ overflow, errors: errors.slice(0, 12) }));
await browser.close();
