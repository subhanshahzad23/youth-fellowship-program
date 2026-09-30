import { chromium } from '@playwright/test';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto('https://www.mural.co/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(6000);
const hidden = await page.evaluate(() => [...document.querySelectorAll('body *')].filter(e => { const s = getComputedStyle(e); const r = e.getBoundingClientRect(); return r.top > 900 && r.height > 20 && (parseFloat(s.opacity) < 0.5 || (s.transform !== 'none' && !/matrix\(1, 0, 0, 1, 0, 0\)/.test(s.transform))); }).slice(0, 25).map(e => { const s = getComputedStyle(e); return { cls: e.className.toString().slice(0,50), top: Math.round(e.getBoundingClientRect().top + scrollY), op: s.opacity, tr: s.transform, trans: s.transition.slice(0,100) }; }));
console.log('OFFSCREEN INITIAL', JSON.stringify(hidden, null, 0));
const black = await page.evaluate(() => [...document.querySelectorAll('body *')].filter(e => { const s = getComputedStyle(e); const r = e.getBoundingClientRect(); return (s.backgroundColor === 'rgb(0, 0, 0)' || /Dots/.test(s.backgroundImage)) && r.width > 1000 && r.height > 300; }).slice(0,5).map(e => { const s = getComputedStyle(e); const r = e.getBoundingClientRect(); return { cls: e.className.toString().slice(0,60), rect: [r.x, r.y + scrollY, r.width, r.height].map(Math.round), bg: s.backgroundColor, bgi: s.backgroundImage.slice(0,160), bgs: s.backgroundSize, br: s.borderRadius }; }));
console.log('BLACK', JSON.stringify(black, null, 0));
// scroll to results section and sample reveal
const top = await page.evaluate(() => document.querySelector('.section_results').getBoundingClientRect().top + scrollY);
await page.evaluate((y) => window.scrollTo(0, y - 700), top); await page.waitForTimeout(60);
const sample = async () => page.evaluate(() => [...document.querySelectorAll('.section_results *')].filter(e => e.children.length < 3 && e.getBoundingClientRect().height > 20).slice(0, 6).map(e => { const s = getComputedStyle(e); return [e.className.toString().slice(0,30), s.opacity, s.transform].join(' | '); }));
console.log('REVEAL t=60', JSON.stringify(await sample()));
await page.waitForTimeout(300); console.log('REVEAL t=360', JSON.stringify(await sample()));
await page.waitForTimeout(1000); console.log('REVEAL t=1360', JSON.stringify(await sample()));
// testimonial carousel
const tb = await page.evaluate(() => [...document.querySelectorAll('.section_testimonials [class*="arrow"], .section_testimonials button')].slice(0,4).map(e => ({ cls: e.className.toString().slice(0,50), trans: getComputedStyle(e).transition.slice(0,80) })));
console.log('CAROUSEL', JSON.stringify(tb));
const cards = await page.evaluate(() => [...document.querySelectorAll('.section_resources [class*="card"]')].slice(0,2).map(e => { const s = getComputedStyle(e); return { cls: e.className.toString().slice(0,50), br: s.borderRadius, shadow: s.boxShadow, border: s.border, trans: s.transition.slice(0,120), padding: s.padding }; }));
console.log('RES CARDS', JSON.stringify(cards));
const tabs = await page.evaluate(() => [...document.querySelectorAll('.tabs1_menu > *')].slice(0,2).map(e => { const s = getComputedStyle(e); return { cls: e.className.toString().slice(0,50), bg: s.backgroundColor, br: s.borderRadius, padding: s.padding, fs: s.fontSize, fw: s.fontWeight, ff: s.fontFamily.slice(0,20), trans: s.transition.slice(0,120), h: e.getBoundingClientRect().height }; }));
console.log('TABS', JSON.stringify(tabs));
const foot = await page.evaluate(() => { const f = document.querySelector('.section-footer'); const a = f.querySelector('a'); const h = f.querySelector('[class*="heading"], h3, h4, strong'); const s = getComputedStyle(a); return { link: [s.fontSize, s.fontWeight, s.color, s.lineHeight], head: h ? [getComputedStyle(h).fontSize, getComputedStyle(h).fontWeight] : null }; });
console.log('FOOTER', JSON.stringify(foot));
await browser.close();
