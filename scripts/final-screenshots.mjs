// Captures the finished-demo screenshots into docs/screenshots (run against a prod server).
import { chromium } from '@playwright/test';
const BASE = process.env.BASE || 'http://localhost:3100';
const OUT = 'docs/screenshots';
const browser = await chromium.launch();

async function session(width = 1440, height = 900) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(BASE + '/demo');
  await page.waitForFunction(() => window.__launchpad?.getState().hydrated);
  await page.evaluate(async () => { await window.__launchpad.resetDemo(); });
  const as = (id) => page.evaluate((p) => window.__launchpad.setPersona(p), id);
  const go = async (path, wait = 1600) => { await page.goto(BASE + path); await page.waitForFunction(() => window.__launchpad?.getState().hydrated); await page.waitForTimeout(wait); };
  const shot = (name, opts = {}) => page.screenshot({ path: `${OUT}/${name}.png`, ...opts });
  return { ctx, page, as, go, shot };
}

// ---------- Desktop ----------
{
  const { ctx, page, as, go, shot } = await session();
  await go('/', 2500); await shot('01-homepage-hero');
  await page.evaluate(() => window.scrollTo(0, 430)); await page.waitForTimeout(900);
  await page.getByRole('radio', { name: 'Program team' }).first().click(); await page.waitForTimeout(1300);
  await shot('02-homepage-workspace-program-team');
  const j = await page.evaluate(() => document.getElementById('journey').getBoundingClientRect().top + scrollY);
  await page.evaluate((y) => window.scrollTo(0, y + 1500), j); await page.waitForTimeout(1300); await shot('03-homepage-journey-sticky');
  await page.evaluate(() => document.getElementById('tracks').scrollIntoView()); await page.waitForTimeout(1200); await shot('04-homepage-tracks');
  await page.evaluate(() => document.getElementById('safeguarding').scrollIntoView()); await page.waitForTimeout(1200); await shot('05-homepage-safeguarding');
  await page.evaluate(() => document.getElementById('dates').scrollIntoView()); await page.waitForTimeout(1200); await shot('06-homepage-dates');

  await go('/demo'); await shot('07-demo-explorer');

  await as('u_maya'); await go('/apply/winter-2027');
  await page.getByRole('button', { name: /Inside the service area/ }).click(); await page.waitForTimeout(900);
  await page.getByRole('button', { name: /Utility bill/ }).first().click(); await page.waitForTimeout(1200);
  await shot('08-applicant-wizard-residence', { fullPage: true });

  await as('u_amira'); await go('/admin/applications'); await shot('09-admin-review-queue');
  await go('/admin/applications/a_sara_w27'); await shot('10-reviewer-detail-rubric', { fullPage: true });
  await as('u_priya'); await go('/admin/applications/a_jonah_w27');
  await page.getByRole('button', { name: /Check access|Request access/ }).first().click(); await page.waitForTimeout(900);
  await shot('11-restricted-document-executive'); await page.keyboard.press('Escape');

  // Approve Jonah as Amira through actions, then show the success panel via the UI
  await as('u_amira');
  await page.evaluate(() => { const A = window.__launchpad.actions.applications; A.saveReview('a_jonah_w27', { scores: { rc_motivation: 4, rc_idea: 4, rc_commitment: 4, rc_impact: 4 }, recommendation: 'approve', notes: 'Clear problem, real evidence.' }); A.submitReview('a_jonah_w27'); });
  await go('/admin/applications/a_jonah_w27');
  await page.getByRole('button', { name: /Approve and enroll/ }).first().click(); await page.waitForTimeout(400);
  await page.getByRole('dialog').getByRole('button', { name: /Approve and enroll/ }).click(); await page.waitForTimeout(2200);
  await page.getByRole('button', { name: /Open fellow workspace as/ }).or(page.getByRole('link', { name: /Open fellow workspace as/ })).first().scrollIntoViewIfNeeded(); await page.waitForTimeout(500);
  await shot('12-approval-enrollment-success');

  await go('/admin/forms/f_winter27'); await shot('13-form-builder');
  await as('u_priya'); await go('/admin/dashboard'); await shot('14-executive-dashboard', { fullPage: true });

  await as('u_noah'); await go('/workspace/dashboard'); await shot('15-fellow-dashboard', { fullPage: true });
  await go('/workspace/learning'); await shot('16-fellow-learning');
  await go('/workspace/learning/ff-1/ff-1-2'); await page.evaluate(() => window.scrollTo(0, 420)); await page.waitForTimeout(600); await shot('17-session-video-transcript');
  await go('/workspace/learning/ff-2/ff-2-3#assignment', 2200); await shot('18-assignment-panel');

  await as('u_elena'); await go('/staff/content/ff-2?s=ff-2-1');
  const title = page.getByRole('textbox', { name: /^Title/ }).first();
  await title.fill('Interviews that get past politeness (revised)'); await page.waitForTimeout(300);
  await page.getByRole('button', { name: /^Save draft/ }).first().click(); await page.waitForTimeout(1200);
  await page.getByRole('radio', { name: /Preview as learner/ }).first().click(); await page.waitForTimeout(900);
  await shot('19-instructor-editor-preview');
  await go('/staff/submissions'); await shot('20-instructor-submissions');

  await as('u_daniel'); await go('/staff/messages?c=cv_daniel_noah'); await shot('21-messaging-mentor-thread');
  await go('/staff/messages?to=u_aisha'); await shot('22-messaging-denied-unassigned');
  await as('u_amira'); await go('/admin/safeguarding?r=rp_jamal_ryan'); await shot('23-safeguarding-queue');
  await as('u_priya'); await go('/admin/messages?view=supervision'); await shot('24-supervision-export');
  await as('u_amira'); await go('/admin/curriculum?tab=notion'); await shot('25-notion-migration');
  await go('/admin/cohorts/c_summer26'); await shot('26-cohort-detail');
  await go('/admin/announcements'); await shot('27-announcements');
  await as('u_priya'); await go('/admin/audit'); await shot('28-audit-log');
  await ctx.close();
}

// ---------- Mobile (390) ----------
{
  const { ctx, page, as, go, shot } = await session(390, 844);
  await go('/', 2200); await shot('m01-homepage');
  await page.getByRole('button', { name: 'Open menu' }).click(); await page.waitForTimeout(500); await shot('m02-mobile-menu');
  await page.getByRole('button', { name: 'Close menu' }).click();
  await as('u_maya'); await go('/apply/winter-2027'); await shot('m03-applicant-wizard');
  await as('u_noah'); await go('/workspace/dashboard'); await shot('m04-fellow-dashboard');
  await go('/workspace/learning/ff-1/ff-1-1'); await shot('m05-session-reader');
  await go('/workspace/messages'); await shot('m06-inbox-list');
  await go('/workspace/messages?c=cv_daniel_noah'); await shot('m07-thread');
  await as('u_amira'); await go('/admin/applications'); await shot('m08-review-queue-cards');
  await go('/admin/safeguarding?r=rp_jamal_ryan'); await shot('m09-safeguarding');
  await ctx.close();
}
await browser.close();
console.log('done');
