import { chromium } from '@playwright/test';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
const fonts = [
  ['Instrument Serif', 400, '-0.035em', 1.0, 92],
  ['Newsreader', 300, '-0.05em', 1.1, 80],
  ['Source Serif 4', 300, '-0.05em', 1.1, 80],
  ['Fraunces', 300, '-0.05em', 1.1, 80],
  ['Literata', 300, '-0.05em', 1.1, 80],
];
const html = `<html><head><link href="https://fonts.googleapis.com/css2?family=Instrument+Serif&family=Newsreader:opsz,wght@6..72,300&family=Source+Serif+4:opsz,wght@8..60,300&family=Fraunces:opsz,wght@9..144,300&family=Literata:opsz,wght@7..72,300&display=block" rel="stylesheet"></head><body style="background:#000;margin:0;padding:20px 40px;color:#8c8c8c">` +
 fonts.map(([f,w,ls,lh,fs]) => `<div style="font-family:'${f}';font-weight:${w};font-size:${fs}px;letter-spacing:${ls};line-height:${lh};margin-bottom:14px">Sync up. Speed up. <span style="color:#fff">Stand out.</span> <span style="font:12px sans-serif;color:#0c7;letter-spacing:0">${f}</span></div>`).join('') + '</body></html>';
await page.setContent(html); await page.waitForTimeout(3000);
await page.screenshot({ path: 'docs/reference/font-comparison.png' });
await browser.close();
