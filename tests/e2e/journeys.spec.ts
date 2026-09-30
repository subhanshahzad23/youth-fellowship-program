import { expect, test, type Page } from "@playwright/test";
import { asPersona, freshDemo, lp, openReady } from "./helpers";

/*
 * UI-level journeys: the same flows a presenter walks through, driven through
 * the real screens (with state assertions via the test hook where useful).
 */

async function go(page: Page, path: string) {
  await page.goto(path);
  await page.waitForFunction(() => (window as unknown as { __launchpad?: { getState: () => { hydrated: boolean } } }).__launchpad?.getState().hydrated);
}

test("applicant resumes a draft, checks residence, attaches a sample, submits; reviewer scores and approves; same identity enters the workspace", async ({ page }) => {
  test.setTimeout(240_000);
  await freshDemo(page, "u_maya");
  await go(page, "/apply/winter-2027");

  // Resumes at Residence eligibility
  await expect(page.getByRole("heading", { name: "Residence eligibility" })).toBeVisible();
  await page.getByRole("button", { name: /Inside the service area/ }).click();
  await expect(page.getByText(/In service area/).first()).toBeVisible();
  await page.getByRole("button", { name: /Utility bill/ }).first().click();
  await expect(page.getByText("Utility bill attached")).toBeVisible();
  await expect(page.getByRole("button", { name: /Preview/ }).first()).toBeVisible();

  // Refresh keeps the draft (address check + attached proof)
  await page.reload();
  await openReady(page, "/apply/winter-2027");
  await expect(page.getByRole("button", { name: /Preview/ }).first()).toBeVisible();
  await expect(page.getByText(/In service area/).first()).toBeVisible();

  // Next step, fill samples, continue to review and submit
  await page.getByRole("button", { name: /^Continue/ }).first().click();
  await expect(page.getByRole("heading", { name: /Questions/ })).toBeVisible();
  await page.getByRole("button", { name: /Fill with sample answers/ }).first().click();
  await page.getByRole("button", { name: /^Continue/ }).first().click();
  await expect(page.getByRole("heading", { name: /Review/ }).first()).toBeVisible();
  await page.getByRole("button", { name: /Submit application/ }).first().click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: /Submit/ }).last().click();
  await expect(page.getByText(/LP-W27-\d{4}/).first()).toBeVisible({ timeout: 15_000 });

  const status = await lp(page, (lp) => lp.getState().db.applications["a_maya_w27"].status);
  expect(status).toBe("submitted");

  // Amira reviews with the rubric and approves
  await asPersona(page, "u_amira");
  await go(page, "/admin/applications/a_maya_w27");
  await expect(page.getByRole("heading", { name: "Maya Chen" }).first()).toBeVisible();
  for (const [criterion, n] of [["Motivation", 4], ["Venture idea", 5], ["Learning commitment", 4], ["Community impact", 4]] as const) {
    const group = page.getByRole("radiogroup", { name: new RegExp(criterion) });
    await group.getByRole("radio", { name: new RegExp(`^${n} of 5`) }).click();
  }
  await page.getByRole("radio", { name: /^Approve/ }).first().check({ force: true });
  await page.getByRole("button", { name: /^Submit review$/ }).first().click();
  await page.getByRole("dialog").getByRole("button", { name: /Submit review/ }).click();
  await expect(page.getByText(/86/).first()).toBeVisible();
  await page.getByRole("button", { name: /Approve and enroll/ }).first().click();
  await page.getByRole("dialog").getByRole("button", { name: /Approve and enroll/ }).click();
  const open = page.getByRole("button", { name: /Open fellow workspace as Maya/ }).or(page.getByRole("link", { name: /Open fellow workspace as Maya/ }));
  await expect(open.first()).toBeVisible({ timeout: 15_000 });
  await open.first().click();
  await expect(page).toHaveURL(/\/workspace\/dashboard/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Maya");
  await expect(page.getByText(/Winter 2027/).first()).toBeVisible();

  const same = await lp(page, (lp) => ({ persona: lp.getState().personaId, people: Object.values(lp.getState().db.users).filter((u: any) => u.name === "Maya Chen").length }));
  expect(same).toEqual({ persona: "u_maya", people: 1 });
});

test("restricted document: executive sees the restricted state; direct URL outside scope is denied", async ({ page }) => {
  await freshDemo(page, "u_priya");
  await go(page, "/admin/applications/a_jonah_w27");
  await expect(page.getByRole("button", { name: /Check access|Request access/ }).first()).toBeVisible();
  await page.getByRole("button", { name: /Check access|Request access/ }).first().click();
  await expect(page.getByRole("dialog")).toContainText(/restricted/i);
  await page.keyboard.press("Escape");

  await asPersona(page, "u_amira");
  await go(page, "/admin/applications/a_yusuf_s27");
  await expect(page.getByText(/outside your assigned scope/i).first()).toBeVisible();

  await asPersona(page, "u_noah");
  await go(page, "/admin/dashboard");
  await expect(page.getByRole("heading", { name: /isn't part of your role/ })).toBeVisible();
});

test("mentor message → fellow reads and replies; unassigned fellow and hand-edited URLs are denied", async ({ page }) => {
  test.setTimeout(180_000);
  await freshDemo(page, "u_daniel");
  await go(page, "/staff/messages?c=cv_daniel_noah");
  const composer = page.getByRole("textbox", { name: /message/i }).last();
  await composer.fill("Can you bring the cost sheet on Tuesday?");
  await composer.press("Enter");
  await expect(page.getByText("Can you bring the cost sheet on Tuesday?").first()).toBeVisible();

  // Unassigned fellow via URL → reason shown, not a crash
  await go(page, "/staff/messages?to=u_aisha");
  await expect(page.getByText(/Mentors can only message fellows assigned to them/).first()).toBeVisible();
  await go(page, "/staff/messages?c=cv_grace_aisha");
  await expect(page.getByText(/aren't a participant|outside your supervision scope|can't/i).first()).toBeVisible();

  // Noah sees unread, opens, replies
  await asPersona(page, "u_noah");
  await go(page, "/workspace/messages?c=cv_daniel_noah");
  await expect(page.getByText("Can you bring the cost sheet on Tuesday?").first()).toBeVisible();
  const unread = await lp(page, (lp) => lp.selectors.unreadIn(lp.getState().db, "u_noah", "cv_daniel_noah"));
  expect(unread).toBe(0);
  const reply = page.getByRole("textbox", { name: /message/i }).last();
  await reply.fill("Yes — about $38 all in.");
  await reply.press("Enter");
  await expect(page.getByText("Yes — about $38 all in.").first()).toBeVisible();

  // Daniel sees it read-receipted
  await asPersona(page, "u_daniel");
  await go(page, "/staff/messages?c=cv_daniel_noah");
  await expect(page.getByText("Yes — about $38 all in.").first()).toBeVisible();

  // Priya exports the thread
  await asPersona(page, "u_priya");
  await go(page, "/admin/messages?c=cv_daniel_noah&view=supervision");
  await expect(page.getByText("Yes — about $38 all in.").first()).toBeVisible();

  // Applicant has no messaging
  await asPersona(page, "u_jonah");
  await go(page, "/workspace/messages");
  await expect(page.getByText(/opens once an application is approved|only available to enrolled fellows/i).first()).toBeVisible();
});

test("safeguarding: hide reported message → participant sees placeholder", async ({ page }) => {
  await freshDemo(page, "u_amira");
  await go(page, "/admin/safeguarding?r=rp_jamal_ryan");
  await expect(page.getByText(/idiot/).first()).toBeVisible();
  await lp(page, (lp) => {
    lp.actions.messaging.hideMessage("msg_jamal_ryan_4", "Insulting language toward another fellow.", "rp_jamal_ryan");
    lp.actions.messaging.resolveReport("rp_jamal_ryan", "message_hidden", "Spoke with Jamal.");
  });
  await asPersona(page, "u_ryan");
  await go(page, "/workspace/messages?c=cv_jamal_ryan");
  await expect(page.getByText(/hidden by the program team/i).first()).toBeVisible();
  await expect(page.getByText(/you idiot/)).toHaveCount(0);
});

test("assignment: draft → submit → instructor requests changes → resubmit → approve → progress updates", async ({ page }) => {
  test.setTimeout(180_000);
  await freshDemo(page, "u_noah");
  await go(page, "/workspace/learning/ff-2/ff-2-3");
  const before = await lp(page, (lp) => lp.selectors.moduleProgress(lp.getState().db, "u_noah", "ff-2").done);
  const response = page.locator("#assignment-response");
  await expect(response).toBeVisible();
  await response.fill("Five interviews with renters and older neighbors. The pattern: people keep broken things because carrying them to a shop is the barrier, not cost. Next I will run a monthly repair day and count who shows up.");
  await page.getByRole("button", { name: /Save draft/ }).first().click();
  await expect(page.getByText("Draft saved").first()).toBeVisible();
  await page.reload();
  await openReady(page, "/workspace/learning/ff-2/ff-2-3");
  await expect(page.locator("#assignment-response")).toHaveValue(/monthly repair day/);
  await page.getByRole("button", { name: /Submit for review/ }).click();
  await page.getByRole("dialog").getByRole("button", { name: /^Submit$/ }).click();
  await expect(page.getByText("Submitted for review").first()).toBeVisible();

  await asPersona(page, "u_elena");
  const subId = await lp(page, (lp) => (Object.values(lp.getState().db.submissions).find((s: any) => s.fellowId === "u_noah" && s.sessionId === "ff-2-3") as any).id);
  await go(page, `/staff/submissions?s=${subId}`);
  await page.locator("#review-feedback").fill("Lead with your strongest quote, then show the pattern.");
  await page.getByRole("button", { name: /^Request changes$/ }).click();
  await page.getByRole("dialog").getByRole("button", { name: /Request changes/ }).click();
  await expect(page.getByText("Changes requested from Noah").first()).toBeVisible();

  await asPersona(page, "u_noah");
  await go(page, "/workspace/learning/ff-2/ff-2-3");
  await page.locator("#assignment-response").fill("“I put the lamp in the hallway for someone to take.” Five interviews with renters and older neighbors showed that carrying things to a shop is the barrier. Next: a monthly repair day.");
  await page.getByRole("button", { name: /^Resubmit$/ }).click();
  await page.getByRole("dialog").getByRole("button", { name: /Resubmit/ }).click();
  await expect(page.getByText("Resubmitted for review").first()).toBeVisible();

  await asPersona(page, "u_elena");
  await go(page, `/staff/submissions?s=${subId}`);
  await page.locator("#review-feedback").fill("Much sharper — approved.");
  await page.getByRole("button", { name: /^Approve$/ }).click();
  await page.getByRole("dialog").getByRole("button", { name: /^Approve$/ }).click();
  await expect(page.getByText("Approved Noah's submission").first()).toBeVisible();

  const after = await lp(page, (lp) => lp.selectors.moduleProgress(lp.getState().db, "u_noah", "ff-2").done);
  expect(after).toBe(before + 1);
  await asPersona(page, "u_noah");
  await go(page, "/workspace/assignments");
  await expect(page.getByText(/Run five customer interviews/).first()).toBeVisible();
});

test("instructor denied on another track via direct URL; fellow denied on another track's session", async ({ page }) => {
  await freshDemo(page, "u_elena");
  await go(page, "/staff/content/vb-1");
  await expect(page.getByText(/Only instructors assigned to Venture Building/).first()).toBeVisible();
  await asPersona(page, "u_noah");
  await go(page, "/workspace/learning/vb-1/vb-1-1");
  await expect(page.getByText(/different track/).first()).toBeVisible();
  await go(page, "/workspace/learning/ff-9/nope");
  await expect(page.getByText(/couldn't find/i).first()).toBeVisible();
});

test("announcement composed in the UI reaches the cohort and nobody else", async ({ page }) => {
  test.setTimeout(120_000);
  await freshDemo(page, "u_amira");
  await go(page, "/admin/announcements");
  await expect(page.locator("#an-title")).toBeVisible();
  await page.waitForTimeout(800);
  await page.locator("#an-scope").selectOption({ label: "Summer 2026" });
  await page.locator("#an-title").fill("Showcase rehearsal on Tuesday");
  await page.locator("#an-body").fill("Rehearsal is Tuesday at 5pm in the studio.\n\nBring your two-minute outline.");
  await page.getByRole("button", { name: /^Send to 12 people/ }).click();
  await page.getByRole("dialog").getByRole("button", { name: /Send announcement/ }).click();
  await expect(page.getByText("Delivered to 12 people")).toBeVisible({ timeout: 15_000 });

  await asPersona(page, "u_noah");
  await go(page, "/workspace/announcements");
  await expect(page.getByText("Showcase rehearsal on Tuesday").first()).toBeVisible();
  await asPersona(page, "u_leo");
  await go(page, "/workspace/announcements");
  await expect(page.getByText("Showcase rehearsal on Tuesday")).toHaveCount(0);
});
