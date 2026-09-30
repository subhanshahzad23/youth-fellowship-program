// Sweeps every route as an appropriate persona; reports console errors, hydration warnings,
// failed requests and horizontal overflow; saves viewport screenshots.
// Usage: BASE=http://localhost:3100 node scripts/route-sweep.mjs <outDir> [width]
import { chromium } from '@playwright/test';
import fs from 'fs';
const BASE = process.env.BASE || 'http://localhost:3100';
const out = process.argv[2] || 'sweep';
const width = Number(process.argv[3] || 1440);
fs.mkdirSync(out, { recursive: true });
const R = [
  ['', '/'], ['', '/demo'], ['', '/tracks/founder-foundations'], ['', '/tracks/venture-building'], ['', '/cohorts/winter-2027'], ['', '/cohorts/spring-2026'], ['', '/apply'], ['', '/apply/summer-2027'], ['', '/apply/spring-2026'], ['', '/does-not-exist'],
  ['u_maya', '/apply/winter-2027'], ['u_maya', '/applicant/dashboard'], ['u_maya', '/applicant/applications'], ['u_maya', '/applicant/applications/a_maya_w27'], ['u_fatima', '/applicant/applications/a_fatima_w27'], ['u_maya', '/applicant/settings'], ['u_maya', '/workspace/dashboard'],
  ['u_noah', '/workspace/dashboard'], ['u_noah', '/workspace/learning'], ['u_noah', '/workspace/learning/ff-1/ff-1-2'], ['u_noah', '/workspace/learning/ff-2/ff-2-3'], ['u_noah', '/workspace/assignments'], ['u_noah', '/workspace/messages?c=cv_daniel_noah'], ['u_noah', '/workspace/cohort'], ['u_noah', '/workspace/mentorship'], ['u_noah', '/workspace/announcements'], ['u_noah', '/workspace/settings'], ['u_noah', '/admin/dashboard'],
  ['u_elena', '/staff/dashboard'], ['u_elena', '/staff/content'], ['u_elena', '/staff/content/ff-2?s=ff-2-1'], ['u_elena', '/staff/submissions'], ['u_elena', '/staff/messages'], ['u_elena', '/staff/announcements'], ['u_elena', '/staff/settings'], ['u_elena', '/staff/content/vb-1'],
  ['u_daniel', '/staff/dashboard'], ['u_daniel', '/staff/mentees'], ['u_daniel', '/staff/messages?c=cv_daniel_diego'],
  ['u_amira', '/admin/dashboard'], ['u_amira', '/admin/applications'], ['u_amira', '/admin/applications/a_sara_w27'], ['u_amira', '/admin/forms'], ['u_amira', '/admin/forms/f_winter27'], ['u_amira', '/admin/cohorts'], ['u_amira', '/admin/cohorts/c_summer26'], ['u_amira', '/admin/people'], ['u_amira', '/admin/curriculum'], ['u_amira', '/admin/announcements'], ['u_amira', '/admin/messages'], ['u_amira', '/admin/safeguarding?r=rp_jamal_ryan'], ['u_amira', '/admin/audit'], ['u_amira', '/admin/settings'],
  ['u_priya', '/admin/dashboard'], ['u_priya', '/admin/applications/a_jonah_w27'], ['u_priya', '/admin/audit'],
];
const browser = await chromium.launch();
const results = [];
for (const [persona, path] of R) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 } });
  await ctx.addInitScript((p) => { if (p && !localStorage.getItem('launchpad-fellowship-demo')) localStorage.setItem('launchpad-fellowship-demo', JSON.stringify({ state: { personaId: p }, version: 8 })); }, persona);
  const page = await ctx.newPage();
  const issues = [];
  page.on('pageerror', (e) => issues.push('pageerror: ' + e.message.slice(0, 200)));
  page.on('console', (m) => { const t = m.text(); if ((m.type() === 'error' || m.type() === 'warning') && !/Download the React DevTools/.test(t)) issues.push(m.type() + ': ' + t.slice(0, 200)); });
  page.on('response', (r) => { if (r.status() >= 400 && !(path === '/does-not-exist' && r.url().endsWith('/does-not-exist'))) issues.push(`HTTP ${r.status()} ${r.url().replace(BASE, '')}`); });
  try {
    await page.goto(BASE + path, { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(1800);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    const title = await page.title();
    const h1 = await page.locator('h1').first().innerText().catch(() => '(no h1)');
    const name = `${persona || 'public'}${path.replace(/[/?=&]/g, '_')}`.slice(0, 90);
    await page.screenshot({ path: `${out}/${name}.png` });
    results.push({ persona, path, overflow, title, h1: h1.slice(0, 60), issues });
  } catch (e) {
    results.push({ persona, path, error: e.message.slice(0, 200), issues });
  }
  await ctx.close();
}
await browser.close();
for (const r of results) {
  const flag = r.error || r.overflow > 0 || r.issues.length ? '!!' : 'ok';
  console.log(`${flag} ${r.persona || '-'} ${r.path} | h1="${r.h1 ?? ''}" | overflow=${r.overflow ?? '?'} ${r.error ? '| ' + r.error : ''}`);
  for (const i of r.issues.slice(0, 4)) console.log('     ' + i);
}
