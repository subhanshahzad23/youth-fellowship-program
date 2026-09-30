import { chromium } from '@playwright/test';
const OUT = process.cwd() + '/docs/reference';
const browser = await chromium.launch();
const hideCss = 'iframe[src*="qualified"], [id*="qualified"], #onetrust-consent-sdk { display:none !important; }';
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('https://www.mural.co/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(6000); await page.addStyleTag({ content: hideCss });
  await page.evaluate(() => window.scrollTo(0, 450)); await page.waitForTimeout(900);
  const tiles = page.locator('.home-hero_card-button-title');
  const c = await tiles.count(); console.log('tiles', c);
  for (let i = 0; i < c; i++) {
    const t = tiles.nth(i); if (!(await t.isVisible())) continue;
    const label = (await t.innerText()).split(' ')[0].toLowerCase();
    await t.click(); await page.waitForTimeout(200);
    await page.screenshot({ path: `${OUT}/mural-hero-selector-${label}-200ms.png` });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${OUT}/mural-hero-selector-${label}.png` });
    console.log(label, await page.evaluate(() => [...document.querySelectorAll('.home-hero_right-col_p')].filter(p => p.getBoundingClientRect().height > 0).map(p => p.innerText.slice(0, 80))));
  }
  // sticky tabs behaviour: record positions while scrolling through solutions section
  const top = await page.evaluate(() => document.querySelector('.section_solutions1').getBoundingClientRect().top + scrollY);
  const rows = [];
  for (let y = top; y < top + 4200; y += 400) {
    await page.evaluate((y) => window.scrollTo(0, y), y); await page.waitForTimeout(500);
    rows.push(await page.evaluate(() => { const tabs = [...document.querySelectorAll('.section_solutions1 [class*="tab"]')].filter(e => /link|button|menu/.test(e.className)).slice(0,1).map(e => { const r = e.getBoundingClientRect(); return { cls: e.className.slice(0,50), top: Math.round(r.top), pos: getComputedStyle(e.parentElement).position }; }); const act = document.querySelector('.section_solutions1 .w--current, .section_solutions1 [aria-selected="true"]'); return { y: scrollY, tabs, active: act ? act.innerText.slice(0,40) : null }; }));
  }
  console.log(JSON.stringify(rows));
  await ctx.close();
}
for (const [w, h] of [[1024, 800], [768, 1024], [390, 844]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: w < 500, hasTouch: w < 800, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto('https://www.mural.co/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(6000); await page.addStyleTag({ content: hideCss });
  await page.screenshot({ path: `${OUT}/mural-${w}-hero.png` });
  const H = await page.evaluate(() => document.documentElement.scrollHeight);
  const info = await page.evaluate(() => { const h = document.querySelector('.home_hero-h1'); const s = getComputedStyle(h); const n = document.querySelector('.navbar_inner'); const ns = n ? getComputedStyle(n) : null; return { h1: [s.fontSize, s.lineHeight, s.letterSpacing], nav: n ? [n.getBoundingClientRect().width, n.getBoundingClientRect().height, ns.borderRadius, ns.padding] : null, overflow: document.documentElement.scrollWidth }; });
  console.log(w, H, JSON.stringify(info));
  for (const frac of [0.12, 0.3, 0.55]) { await page.evaluate((y) => window.scrollTo(0, y), Math.round(H * frac)); await page.waitForTimeout(800); await page.screenshot({ path: `${OUT}/mural-${w}-at-${Math.round(frac*100)}.png` }); }
  if (w < 1000) {
    await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(500);
    const btn = page.locator('.w-nav-button, .navbar_menu-button').first();
    if (await btn.count() && await btn.isVisible()) { await btn.click(); await page.waitForTimeout(800); await page.screenshot({ path: `${OUT}/mural-${w}-menu-open.png` }); }
  }
  await ctx.close();
}
await browser.close();
