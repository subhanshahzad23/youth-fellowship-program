import { chromium } from '@playwright/test';
const OUT = process.cwd() + '/docs/reference';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36' });
const page = await ctx.newPage();
await page.goto('https://www.mural.co/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(6000);
// cookie banner: decline non-essential
for (const sel of ['#onetrust-reject-all-handler', 'button:has-text("Reject")', 'button:has-text("Decline")', 'button:has-text("Necessary only")']) {
  const b = page.locator(sel).first();
  if (await b.count() && await b.isVisible().catch(()=>false)) { await b.click().catch(()=>{}); console.log('dismissed via', sel); break; }
}
await page.waitForTimeout(1500);
await page.screenshot({ path: `${OUT}/mural-1440-hero.png` });
const info = await page.evaluate(() => {
  const cs = (el) => { const s = getComputedStyle(el); const r = el.getBoundingClientRect(); return { tag: el.tagName, cls: (el.className||'').toString().slice(0,80), text: (el.innerText||'').slice(0,80).replace(/\n/g,' | '), rect: [Math.round(r.x),Math.round(r.y),Math.round(r.width),Math.round(r.height)], ff: s.fontFamily.slice(0,60), fs: s.fontSize, fw: s.fontWeight, lh: s.lineHeight, ls: s.letterSpacing, color: s.color, bg: s.backgroundColor, br: s.borderRadius, border: s.border, pos: s.position, shadow: s.boxShadow.slice(0,120), transition: s.transition.slice(0,120), padding: s.padding }; };
  const out = {};
  out.title = document.title;
  out.headings = [...document.querySelectorAll('h1,h2,h3')].slice(0,60).map(cs);
  const nav = document.querySelector('header') || document.querySelector('nav');
  out.nav = nav ? cs(nav) : null;
  out.navChildren = nav ? [...nav.querySelectorAll('a,button')].slice(0,40).map(cs) : [];
  out.sections = [...document.querySelectorAll('main > *, section')].slice(0,40).map(cs);
  out.bodyFont = cs(document.body);
  out.fonts = [...document.fonts].map(f=>f.family+' '+f.weight+' '+f.style+' '+f.status).filter((v,i,a)=>a.indexOf(v)===i).slice(0,40);
  out.docHeight = document.documentElement.scrollHeight;
  return out;
});
console.log(JSON.stringify(info, null, 1));
await browser.close();
