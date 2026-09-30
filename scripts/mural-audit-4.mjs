import { chromium } from '@playwright/test';
import fs from 'fs';
const OUT = process.cwd() + '/docs/reference';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto('https://www.mural.co/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(6000);
const hide = () => page.evaluate(() => { document.querySelectorAll('iframe[src*="qualified"], [id*="qualified"], #onetrust-consent-sdk').forEach(e => e.style.display='none'); });
await hide();
const log = {};
log.navItems = await page.evaluate(() => [...document.querySelectorAll('.navbar_menu *')].filter(e => e.children.length === 0 && e.innerText && e.innerText.trim().length > 2 && e.getBoundingClientRect().width > 0).slice(0, 20).map(e => ({ tag: e.tagName, cls: e.className.toString().slice(0,60), text: e.innerText.trim(), parent: e.parentElement.className.toString().slice(0,60), gp: e.parentElement.parentElement.className.toString().slice(0,60) })));
// hover Product by position
const prodBox = await page.evaluate(() => { const el = [...document.querySelectorAll('.navbar_menu *')].find(e => e.children.length === 0 && e.innerText?.trim() === 'Product'); const r = el.getBoundingClientRect(); return { x: r.x + r.width/2, y: r.y + r.height/2 }; });
await page.mouse.move(prodBox.x, prodBox.y); await page.waitForTimeout(150);
await page.screenshot({ path: `${OUT}/mural-nav-dropdown-product-150ms.png`, clip: { x: 0, y: 0, width: 1440, height: 700 } });
await page.waitForTimeout(700); await hide();
await page.screenshot({ path: `${OUT}/mural-nav-dropdown-product.png` });
log.dropdown = await page.evaluate(() => [...document.querySelectorAll('*')].filter(e => { const s = getComputedStyle(e); const r = e.getBoundingClientRect(); return r.width > 300 && r.height > 150 && r.y > 60 && r.y < 140 && s.backgroundColor === 'rgb(255, 255, 255)'; }).slice(0,4).map(e => { const s = getComputedStyle(e); const r = e.getBoundingClientRect(); return { cls: e.className.toString().slice(0,80), rect: [r.x,r.y,r.width,r.height].map(Math.round), br: s.borderRadius, shadow: s.boxShadow, trans: s.transition.slice(0,160), padding: s.padding, text: e.innerText.slice(0,400) }; }));
const solBox = await page.evaluate(() => { const el = [...document.querySelectorAll('.navbar_menu *')].find(e => e.children.length === 0 && e.innerText?.trim() === 'Resources'); const r = el.getBoundingClientRect(); return { x: r.x + r.width/2, y: r.y + r.height/2 }; });
await page.mouse.move(solBox.x, solBox.y); await page.waitForTimeout(800); await hide();
await page.screenshot({ path: `${OUT}/mural-nav-dropdown-resources.png` });
await page.mouse.move(700, 800); await page.waitForTimeout(500);
// hero selector - find "Which team" element
await page.evaluate(() => window.scrollTo(0, 450)); await page.waitForTimeout(900); await hide();
log.selector = await page.evaluate(() => { const w = [...document.querySelectorAll('*')].find(e => e.children.length===0 && /Which team/.test(e.innerText||'')); if (!w) return null; let c = w; for (let i=0;i<4;i++) c = c.parentElement; return { html: c.outerHTML.slice(0, 1500), items: [...c.querySelectorAll('*')].filter(e=>e.children.length===0 && e.innerText?.trim()).map(e=>({ text: e.innerText.trim().slice(0,40), cls: e.className.toString().slice(0,50), tag: e.tagName, rect: (r=>[r.x,r.y,r.width,r.height].map(Math.round))(e.getBoundingClientRect()) })).slice(0,20) }; });
await page.screenshot({ path: `${OUT}/mural-hero-selector-default.png` });
const items = (log.selector?.items || []).filter(i => /Marketing|Consulting|Research|Sales|Product/.test(i.text) && i.rect[2] > 0);
let n = 0;
for (const it of items.slice(0, 5)) {
  await page.mouse.click(it.rect[0] + it.rect[2]/2, it.rect[1] + it.rect[3]/2); await page.waitForTimeout(250);
  await page.screenshot({ path: `${OUT}/mural-hero-selector-${n}-250ms.png` });
  await page.waitForTimeout(900); await hide();
  await page.screenshot({ path: `${OUT}/mural-hero-selector-${n}.png` });
  n++;
  // returns? check if selector items moved; re-query
}
fs.writeFileSync(OUT + '/../mural-audit-interactions-2.json', JSON.stringify(log, null, 1));
await browser.close();
