import { chromium } from '@playwright/test';
import fs from 'fs';
const OUT = process.cwd() + '/docs/reference';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto('https://www.mural.co/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(6000);
const hideWidgets = async () => page.evaluate(() => { document.querySelectorAll('iframe[src*="qualified"], #q-messenger-frame, [id*="qualified"], #onetrust-consent-sdk').forEach(e => e.style.display='none'); });
await hideWidgets();
const cs = `(el) => { const s = getComputedStyle(el); const r = el.getBoundingClientRect(); return { tag: el.tagName, cls: (el.className||'').toString().slice(0,80), text: (el.innerText||'').slice(0,60).replace(/\\n/g,' | '), rect: [Math.round(r.x),Math.round(r.y),Math.round(r.width),Math.round(r.height)], ff: s.fontFamily.slice(0,40), fs: s.fontSize, fw: s.fontWeight, lh: s.lineHeight, ls: s.letterSpacing, color: s.color, bg: s.backgroundColor, bgi: s.backgroundImage.slice(0,140), br: s.borderRadius, border: s.border, pos: s.position, shadow: s.boxShadow.slice(0,160), transition: s.transition.slice(0,160), padding: s.padding, transform: s.transform, opacity: s.opacity }; }`;
const data = {};
data.navWrap = await page.evaluate(`(() => { const f = ${cs}; const n = document.querySelector('.navbar_menu'); const chain = []; let e = n; for (let i=0;i<6&&e;i++){ chain.push(f(e)); e = e.parentElement; } return chain; })()`);
data.navLinks = await page.evaluate(`(() => { const f = ${cs}; return [...document.querySelectorAll('.navbar_component a, .navbar_component button, .navbar_component .w-dropdown-toggle')].filter(e=>e.getBoundingClientRect().width>0).slice(0,30).map(f); })()`);
data.heroH1Spans = await page.evaluate(`(() => { const f = ${cs}; const h = document.querySelector('.home_hero-h1'); return [f(h), ...[...h.querySelectorAll('*')].map(f)]; })()`);
data.heroOther = await page.evaluate(`(() => { const f = ${cs}; const h = document.querySelector('.home_hero-h1'); let sec = h.closest('section') || h.parentElement.parentElement; const els = [...sec.querySelectorAll('p, input, button, a, form')].slice(0,20).map(f); return { section: f(sec), els }; })()`);
data.bodySections = await page.evaluate(`(() => { const f = ${cs}; return [...document.querySelectorAll('section, .section, [class*="section_"]')].filter(e=>e.getBoundingClientRect().height>100).slice(0,40).map(e=>{ const o=f(e); o.top = Math.round(e.getBoundingClientRect().top + scrollY); return o; }); })()`);
data.paras = await page.evaluate(`(() => { const f = ${cs}; return [...document.querySelectorAll('p')].filter(e=>e.innerText.length>40).slice(0,25).map(f); })()`);
data.eyebrows = await page.evaluate(`(() => { const f = ${cs}; return [...document.querySelectorAll('*')].filter(e=>{const s=getComputedStyle(e); return s.textTransform==='uppercase' && e.children.length===0 && e.innerText && e.innerText.length<60;}).slice(0,20).map(f); })()`);
data.buttons = await page.evaluate(`(() => { const f = ${cs}; return [...document.querySelectorAll('a.button, .button, [class*="button"]')].filter(e=>e.getBoundingClientRect().width>0).slice(0,30).map(f); })()`);
fs.writeFileSync(OUT + '/../mural-audit-raw-1440.json', JSON.stringify(data, null, 1));
// Full page scroll screenshots
const H = await page.evaluate(() => document.documentElement.scrollHeight);
console.log('docHeight', H);
let i = 0;
for (let y = 0; y < H; y += 850) {
  await page.evaluate((y) => window.scrollTo(0, y), y);
  await page.waitForTimeout(900);
  await hideWidgets();
  await page.screenshot({ path: `${OUT}/mural-1440-scroll-${String(i).padStart(2,'0')}.png` });
  i++;
}
// nav at scrolled state
await page.evaluate(() => window.scrollTo(0, 1200)); await page.waitForTimeout(800);
data.navScrolled = await page.evaluate(`(() => { const f = ${cs}; const n = document.querySelector('.navbar_menu'); const chain = []; let e = n; for (let i=0;i<6&&e;i++){ chain.push(f(e)); e = e.parentElement; } return chain; })()`);
fs.writeFileSync(OUT + '/../mural-audit-raw-1440.json', JSON.stringify(data, null, 1));
await browser.close();
