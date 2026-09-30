import { chromium } from '@playwright/test';
import fs from 'fs';
const OUT = process.cwd() + '/docs/reference';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const log = {};
await page.goto('https://www.mural.co/', { waitUntil: 'domcontentloaded', timeout: 60000 });
// capture early animation state during load
await page.waitForTimeout(400);
log.earlyAnims = await page.evaluate(() => document.getAnimations().slice(0,30).map(a => ({ name: a.animationName || a.transitionProperty || a.constructor.name, target: (a.effect?.target?.className||'').toString().slice(0,60), dur: a.effect?.getTiming?.().duration, easing: a.effect?.getTiming?.().easing, delay: a.effect?.getTiming?.().delay, iter: a.effect?.getTiming?.().iterations })));
await page.screenshot({ path: `${OUT}/mural-1440-load-400ms.png` });
await page.waitForTimeout(5000);
const hide = () => page.evaluate(() => { document.querySelectorAll('iframe[src*="qualified"], [id*="qualified"], #onetrust-consent-sdk').forEach(e => e.style.display='none'); });
await hide();
log.gsap = await page.evaluate(() => ({ gsap: !!window.gsap, st: !!window.ScrollTrigger, lenis: !!window.lenis || !!document.querySelector('.lenis'), webflow: !!window.Webflow, ix2: !!document.querySelector('[data-w-id]'), wid: document.querySelectorAll('[data-w-id]').length }));
log.loopAnims = await page.evaluate(() => document.getAnimations().slice(0,40).map(a => ({ name: a.animationName || a.transitionProperty || a.constructor.name, target: (a.effect?.target?.className||'').toString().slice(0,60), dur: a.effect?.getTiming?.().duration, easing: a.effect?.getTiming?.().easing, iter: a.effect?.getTiming?.().iterations })));
// Hero CTA hover
const cta = page.locator('.signup-form_submit').first();
const ctaStyle = async () => cta.evaluate(e => { const s = getComputedStyle(e); return { bg: s.backgroundColor, bgpos: s.backgroundPosition, bgi: s.backgroundImage.slice(0,120), filter: s.filter, border: s.border }; });
log.ctaBefore = await ctaStyle();
await page.locator('.home_hero-h1').screenshot({ path: `${OUT}/mural-hero-h1.png` });
const box = await cta.boundingBox();
await page.screenshot({ path: `${OUT}/mural-cta-before.png`, clip: { x: box.x - 10, y: box.y - 10, width: box.width + 20, height: box.height + 20 } });
await cta.hover(); await page.waitForTimeout(400);
log.ctaAfter = await ctaStyle();
await page.screenshot({ path: `${OUT}/mural-cta-hover.png`, clip: { x: box.x - 10, y: box.y - 10, width: box.width + 20, height: box.height + 20 } });
// green button component (link style) hover
const gb = page.locator('a.button_component').filter({ hasText: 'See more results' }).first();
if (await gb.count()) {
  await gb.scrollIntoViewIfNeeded(); await page.waitForTimeout(600); await hide();
  const b2 = await gb.boundingBox();
  const inner = async () => gb.evaluate(e => [...e.querySelectorAll('*')].map(c => { const s = getComputedStyle(c); return { cls: c.className.toString().slice(0,50), bg: s.backgroundColor, tr: s.transform, trans: s.transition.slice(0,120), br: s.borderRadius, w: c.getBoundingClientRect().width, h: c.getBoundingClientRect().height }; }).concat([{ self: true, bg: getComputedStyle(e).backgroundColor, bgi: getComputedStyle(e).backgroundImage.slice(0,200), bgpos: getComputedStyle(e).backgroundPosition, bgsize: getComputedStyle(e).backgroundSize, border: getComputedStyle(e).border, trans: getComputedStyle(e).transition }]));
  log.greenBtnBefore = await inner();
  await page.screenshot({ path: `${OUT}/mural-btn-green-before.png`, clip: { x: b2.x - 10, y: b2.y - 10, width: b2.width + 20, height: b2.height + 20 } });
  await gb.hover(); await page.waitForTimeout(150);
  await page.screenshot({ path: `${OUT}/mural-btn-green-hover-150ms.png`, clip: { x: b2.x - 10, y: b2.y - 10, width: b2.width + 20, height: b2.height + 20 } });
  await page.waitForTimeout(450);
  log.greenBtnAfter = await inner();
  await page.screenshot({ path: `${OUT}/mural-btn-green-hover.png`, clip: { x: b2.x - 10, y: b2.y - 10, width: b2.width + 20, height: b2.height + 20 } });
  await page.mouse.move(0, 0);
}
// nav dropdown
await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(600);
const prod = page.locator('.navbar_component').getByText('Product', { exact: true }).first();
log.prodCount = await prod.count();
if (log.prodCount) {
  await prod.hover(); await page.waitForTimeout(700); await hide();
  await page.screenshot({ path: `${OUT}/mural-nav-dropdown-product.png` });
  log.dropdown = await page.evaluate(() => { const els = [...document.querySelectorAll('.w-dropdown-list, [class*="dropdown"]')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 200 && r.height > 100; }); return els.slice(0,3).map(e => { const s = getComputedStyle(e); const r = e.getBoundingClientRect(); return { cls: e.className.toString().slice(0,80), rect: [r.x,r.y,r.width,r.height].map(Math.round), bg: s.backgroundColor, br: s.borderRadius, shadow: s.boxShadow, trans: s.transition.slice(0,120), text: e.innerText.slice(0,300) }; }); });
  const sol = page.locator('.navbar_component').getByText('Solutions', { exact: true }).first();
  await sol.hover(); await page.waitForTimeout(700); await hide();
  await page.screenshot({ path: `${OUT}/mural-nav-dropdown-solutions.png` });
  await page.mouse.move(700, 600);
}
// hero category selector
await page.evaluate(() => window.scrollTo(0, 500)); await page.waitForTimeout(800); await hide();
log.heroTabs = await page.evaluate(() => [...document.querySelectorAll('[class*="home-hero"] [class*="tab"], [class*="home-hero"] button, [class*="home_hero"] [role="tab"]')].slice(0,20).map(e => ({ cls: e.className.toString().slice(0,70), text: e.innerText.slice(0,40), rect: (r => [r.x,r.y,r.width,r.height].map(Math.round))(e.getBoundingClientRect()) })));
await page.screenshot({ path: `${OUT}/mural-hero-selector-default.png` });
for (const label of ['Marketing', 'Consulting', 'Research and Development', 'Sales']) {
  const t = page.getByText(label, { exact: true }).first();
  if (await t.count() && await t.isVisible()) { await t.click().catch(()=>{}); await page.waitForTimeout(900); await hide(); await page.screenshot({ path: `${OUT}/mural-hero-selector-${label.split(' ')[0].toLowerCase()}.png` }); }
}
fs.writeFileSync(OUT + '/../mural-audit-interactions.json', JSON.stringify(log, null, 1));
await browser.close();
