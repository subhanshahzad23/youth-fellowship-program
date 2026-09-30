import { expect, test } from "@playwright/test";
import { asPersona, freshDemo, lp, openReady } from "./helpers";

/*
 * Connected state transitions and action-level permission boundaries.
 * These drive the same typed actions the UI uses (via window.__launchpad),
 * including hand-crafted ids a UI would never offer.
 */

test.describe("applications → review → enrollment", () => {
  test("submit, restricted documents, rubric, idempotent approval on the same identity", async ({ page }) => {
    await freshDemo(page, "u_maya");

    // Maya resumes her draft and completes the remaining sections.
    const submitted = await lp(page, (lp) => {
      const A = lp.actions.applications;
      const app = "a_maya_w27";
      const check = A.runResidenceCheck(app, "14 alder row, eastbank 00212", "inside");
      const proof = A.attachSampleProof(app, "utility");
      const saved = A.saveApplication(app, {
        custom: { q_w_started: "I ran a textbook swap table in the common room.", q_w_team: "No", q_w_support: ["Finding customers", "Money and pricing"] },
        commitment: { hoursPerWeek: "6–8 hours", availability: ["Tuesday evenings"], agreeToCommunityStandards: true },
      });
      const sub = A.submitApplication(app);
      const again = A.submitApplication(app);
      return { check, proof: proof.ok, saved: saved.ok, sub, again };
    });
    expect(submitted.check.ok).toBe(true);
    expect(submitted.check.value.status).toBe("inside");
    expect(submitted.proof && submitted.saved).toBe(true);
    expect(submitted.sub.ok).toBe(true);
    expect(submitted.sub.value.reference).toMatch(/^LP-W27-\d{4}$/);
    expect(submitted.again.ok).toBe(false); // no duplicate submission

    // Persisted across reload; auto-assigned to Amira.
    await page.reload();
    await openReady(page, "/demo");
    const afterReload = await lp(page, (lp) => {
      const db = lp.getState().db;
      const a = db.applications["a_maya_w27"];
      const reviewers = Object.values(db.reviewerAssignments).filter((r: any) => r.applicationId === "a_maya_w27").map((r: any) => r.reviewerId);
      return { status: a.status, reviewers, proof: a.answers.residence.proofDocumentId };
    });
    expect(afterReload.status).toBe("submitted");
    expect(afterReload.reviewers).toContain("u_amira");

    // Priya (executive) cannot open the residence document; the denial is audited.
    await asPersona(page, "u_priya");
    const priya = await lp(page, (lp, docId) => {
      const r = lp.actions.applications.openDocument(docId);
      const denied = Object.values(lp.getState().db.audit).filter((e: any) => e.entityId === docId && e.outcome === "denied");
      return { ok: r.ok, denied: denied.length };
    }, afterReload.proof);
    expect(priya.ok).toBe(false);
    expect(priya.denied).toBeGreaterThan(0);

    // Amira (assigned reviewer) can open it, score, and approve.
    await asPersona(page, "u_amira");
    const decision = await lp(page, (lp, docId) => {
      const A = lp.actions.applications;
      const open = A.openDocument(docId);
      const early = A.decideApplication("a_maya_w27", "approved", "");
      const incomplete = (A.saveReview("a_maya_w27", { scores: { rc_motivation: 4 } }), A.submitReview("a_maya_w27"));
      A.saveReview("a_maya_w27", { scores: { rc_motivation: 4, rc_idea: 5, rc_commitment: 4, rc_impact: 4 }, recommendation: "approve", notes: "Strong evidence." });
      const review = A.submitReview("a_maya_w27");
      const approve = A.decideApplication("a_maya_w27", "approved", "Welcome!");
      const approveAgain = A.decideApplication("a_maya_w27", "approved", "");
      const db = lp.getState().db;
      const memberships = Object.values(db.memberships).filter((m: any) => m.userId === "u_maya" && m.role === "fellow");
      const welcome = Object.values(db.outbox).filter((e: any) => e.toUserId === "u_maya" && e.kind === "welcome");
      const audit = Object.values(db.audit).filter((e: any) => e.entityId === "a_maya_w27" && e.action === "application.approve");
      const mayaUsers = Object.values(db.users).filter((u: any) => u.name === "Maya Chen");
      return { open: open.ok, early: early.ok, incomplete: incomplete.ok, review: review.ok, score: review.value, approve: approve.ok, approveAgain: approveAgain.ok, memberships: memberships.length, cohort: (memberships[0] as any)?.cohortId, welcome: welcome.length, audit: audit.length, auditActor: (audit[0] as any)?.actorId, mayaUsers: mayaUsers.length };
    }, afterReload.proof);
    expect(decision.open).toBe(true);
    expect(decision.early).toBe(false); // needs a submitted review first
    expect(decision.incomplete).toBe(false); // incomplete rubric rejected
    expect(decision.review).toBe(true);
    expect(decision.score).toBe(86);
    expect(decision.approve).toBe(true);
    expect(decision.approveAgain).toBe(false);
    expect(decision.memberships).toBe(1);
    expect(decision.cohort).toBe("c_winter27");
    expect(decision.welcome).toBe(1);
    expect(decision.audit).toBe(1);
    expect(decision.auditActor).toBe("u_amira");
    expect(decision.mayaUsers).toBe(1); // same identity, no duplicate person

    const access = await lp(page, (lp) => {
      const db = lp.getState().db;
      return {
        maya: lp.permissions.canAccessPortal(db, "u_maya", "workspace").ok,
        jonah: lp.permissions.canAccessPortal(db, "u_jonah", "workspace").ok,
      };
    });
    expect(access.maya).toBe(true);
    expect(access.jonah).toBe(false); // other applicants gain nothing
  });

  test("requested changes lock other fields and resubmit to the same application", async ({ page }) => {
    await freshDemo(page, "u_amira");
    const req = await lp(page, (lp) => lp.actions.applications.requestChanges("a_jonah_w27", ["idea.customer"], "Tell us more about who your first customers are."));
    expect(req.ok).toBe(true);
    await asPersona(page, "u_jonah");
    const r = await lp(page, (lp) => {
      const A = lp.actions.applications;
      const locked = A.saveApplication("a_jonah_w27", { idea: { problem: "Changed problem" } });
      const allowed = A.saveApplication("a_jonah_w27", { idea: { customer: "Wheelchair users and parents with strollers at both Larkhaven college campuses." } });
      const resub = A.submitApplication("a_jonah_w27");
      const a = lp.getState().db.applications["a_jonah_w27"];
      return { locked: locked.ok, allowed: allowed.ok, resub: resub.ok, ref: a.reference, status: a.status, resubmissions: a.resubmissions };
    });
    expect(r.locked).toBe(false);
    expect(r.allowed).toBe(true);
    expect(r.resub).toBe(true);
    expect(r.ref).toBe("LP-W27-0151");
    expect(r.status).toBe("in_review");
    expect(r.resubmissions).toBe(1);
  });

  test("two cohort forms open at once; window scenarios gate new applications", async ({ page }) => {
    await freshDemo(page, "u_maya");
    const r = await lp(page, (lp) => {
      const A = lp.actions.applications;
      const spring = A.startApplication("c_spring27");
      lp.actions.comms.setWindowScenario("f_summer27", "upcoming");
      const early = A.startApplication("c_summer27");
      lp.actions.comms.setWindowScenario("f_summer27", "closed");
      const late = A.startApplication("c_summer27");
      lp.actions.comms.setWindowScenario("f_summer27", "open");
      const open = A.startApplication("c_summer27");
      const mine = Object.values(lp.getState().db.applications).filter((a: any) => a.applicantId === "u_maya").map((a: any) => a.cohortId).sort();
      return { spring: spring.ok, early: early.ok, earlyErr: early.error, late: late.ok, lateErr: late.error, open: open.ok, mine };
    });
    expect(r.spring).toBe(true);
    expect(r.early).toBe(false);
    expect(r.earlyErr).toMatch(/hasn't opened/);
    expect(r.late).toBe(false);
    expect(r.lateErr).toMatch(/closed/);
    expect(r.open).toBe(true);
    expect(r.mine).toEqual(["c_spring27", "c_summer27", "c_winter27"]);
  });
});

test.describe("learning", () => {
  test("assignment draft → submit → changes requested → resubmit → approved updates progress", async ({ page }) => {
    await freshDemo(page, "u_noah");
    const task = await lp(page, (lp) => {
      const db = lp.getState().db;
      const sub = Object.values(db.submissions).find((s: any) => s.fellowId === "u_noah" && s.status === "draft") as any;
      return { sessionId: sub.sessionId, subId: sub.id, before: lp.selectors.moduleProgress(db, "u_noah", db.sessions[sub.sessionId].moduleId).done };
    });
    const r1 = await lp(page, (lp, t) => {
      const L = lp.actions.learning;
      L.saveSubmissionDraft(t.sessionId, "Five interviews with renters and neighbors. Pattern: people keep broken things because carrying them to a shop is the real barrier, not cost. Next I will test a monthly repair day.");
      return L.submitAssignment(t.sessionId);
    }, task);
    expect(r1.ok).toBe(true);
    await asPersona(page, "u_elena");
    const r2 = await lp(page, (lp, t) => lp.actions.learning.reviewSubmission(t.subId, "changes_requested", "Lead with your strongest quote."), task);
    expect(r2.ok).toBe(true);
    await asPersona(page, "u_noah");
    const r3 = await lp(page, (lp, t) => {
      const L = lp.actions.learning;
      L.saveSubmissionDraft(t.sessionId, "“I put the lamp in the hallway for someone to take.” Five interviews with renters and neighbors showed carrying things to a shop is the barrier. Next: a monthly repair day.");
      return L.submitAssignment(t.sessionId);
    }, task);
    expect(r3.ok).toBe(true);
    await asPersona(page, "u_elena");
    const r4 = await lp(page, (lp, t) => {
      const r = lp.actions.learning.reviewSubmission(t.subId, "approved", "Great — approved.");
      const db = lp.getState().db;
      const sub = db.submissions[t.subId];
      return { ok: r.ok, status: sub.status, versions: sub.versions.length, after: lp.selectors.moduleProgress(db, "u_noah", db.sessions[t.sessionId].moduleId).done, complete: lp.selectors.isSessionComplete(db, "u_noah", t.sessionId) };
    }, task);
    expect(r4.ok).toBe(true);
    expect(r4.status).toBe("reviewed");
    expect(r4.versions).toBe(2);
    expect(r4.complete).toBe(true);
    expect(r4.after).toBe(task.before + 1);
  });

  test("instructor drafts stay private until publish; other tracks are denied", async ({ page }) => {
    await freshDemo(page, "u_elena");
    const r = await lp(page, (lp) => {
      const L = lp.actions.learning;
      const db0 = lp.getState().db;
      const s = db0.sessions["ff-1-1"];
      const draft = { ...s.published, title: "Problem discovery (revised)" };
      const save = L.saveSessionDraft("ff-1-1", draft);
      const visibleBefore = lp.getState().db.sessions["ff-1-1"].published.title;
      const pub = L.publishSession("ff-1-1");
      const visibleAfter = lp.getState().db.sessions["ff-1-1"].published.title;
      const other = L.saveSessionDraft("vb-1-1", lp.getState().db.sessions["vb-1-1"].published);
      return { save: save.ok, visibleBefore, pub: pub.ok, visibleAfter, other: other.ok, otherErr: other.error, original: s.published.title };
    });
    expect(r.save).toBe(true);
    expect(r.visibleBefore).toBe(r.original);
    expect(r.pub).toBe(true);
    expect(r.visibleAfter).toBe("Problem discovery (revised)");
    expect(r.other).toBe(false);
    expect(r.otherErr).toMatch(/Only instructors assigned to Venture Building/);
  });

  test("simulated Notion import maps all 18 modules and is idempotent", async ({ page }) => {
    await freshDemo(page, "u_amira");
    const r = await lp(page, (lp) => {
      const first = lp.actions.learning.runNotionImport();
      const modulesAfterFirst = Object.keys(lp.getState().db.modules).length;
      const sessionsAfterFirst = Object.keys(lp.getState().db.sessions).length;
      const second = lp.actions.learning.runNotionImport();
      return { first: first.value, second: second.value, modules: Object.keys(lp.getState().db.modules).length, modulesAfterFirst, sessions: Object.keys(lp.getState().db.sessions).length, sessionsAfterFirst };
    });
    expect(r.first.created).toBe(2);
    expect(r.first.updated).toBe(4);
    expect(r.second.created).toBe(0);
    expect(r.second.updated).toBe(0);
    expect(r.modules).toBe(18);
    expect(r.modulesAfterFirst).toBe(18);
    expect(r.sessions).toBe(r.sessionsAfterFirst);
  });
});

test.describe("messaging and safeguarding", () => {
  test("mentor, cross-cohort and applicant boundaries hold at action level", async ({ page }) => {
    await freshDemo(page, "u_daniel");
    const r = await lp(page, (lp) => {
      const M = lp.actions.messaging;
      const toAisha = M.startConversation("u_aisha", "Hi Aisha");
      const intoGraceThread = M.sendMessage("cv_grace_aisha", "Hello");
      const toNoah = M.startConversation("u_noah", "How did the cost sheet go?");
      return { toAisha: toAisha.ok, toAishaErr: toAisha.error, intoGraceThread: intoGraceThread.ok, toNoah: toNoah.ok, conv: toNoah.value };
    });
    expect(r.toAisha).toBe(false);
    expect(r.toAishaErr).toMatch(/assigned to them/);
    expect(r.intoGraceThread).toBe(false);
    expect(r.toNoah).toBe(true);
    expect(r.conv).toBe("cv_daniel_noah"); // reuses the existing supervised thread

    await asPersona(page, "u_noah");
    const n = await lp(page, (lp) => {
      const M = lp.actions.messaging;
      const before = lp.selectors.unreadIn(lp.getState().db, "u_noah", "cv_daniel_noah");
      M.markConversationRead("cv_daniel_noah");
      const after = lp.selectors.unreadIn(lp.getState().db, "u_noah", "cv_daniel_noah");
      const reply = M.sendMessage("cv_daniel_noah", "Costs were about $38 including parts.");
      const cross = M.startConversation("u_leo", "Hi Leo");
      return { before, after, reply: reply.ok, cross: cross.ok, crossErr: cross.error };
    });
    expect(n.before).toBeGreaterThan(0);
    expect(n.after).toBe(0);
    expect(n.reply).toBe(true);
    expect(n.cross).toBe(false);
    expect(n.crossErr).toMatch(/own cohort/);

    await asPersona(page, "u_maya");
    const m = await lp(page, (lp) => lp.actions.messaging.startConversation("u_noah", "hi"));
    expect(m.ok).toBe(false);

    await asPersona(page, "u_tyler");
    const t = await lp(page, (lp) => {
      const access = lp.permissions.conversationAccess(lp.getState().db, "u_tyler", lp.getState().db.conversations["cv_omar_tyler"]);
      const send = lp.actions.messaging.sendMessage("cv_omar_tyler", "Hello again");
      return { view: access.view, canSend: access.send, send: send.ok };
    });
    expect(t.view).toBe(true); // history preserved
    expect(t.canSend).toBe(false); // relationship ended → read-only
    expect(t.send).toBe(false);
  });

  test("scripted reply arrives once and survives reload without duplicating", async ({ page }) => {
    await freshDemo(page, "u_noah");
    await lp(page, (lp) => lp.actions.messaging.sendMessage("cv_noah_aisha", "Want to compare interview notes Thursday?"));
    await page.waitForTimeout(4500);
    const count = async () => lp(page, (lp) => Object.values(lp.getState().db.messages).filter((m: any) => m.conversationId === "cv_noah_aisha" && m.simulated).length);
    expect(await count()).toBe(1);
    await page.reload();
    await openReady(page, "/demo");
    await page.waitForTimeout(1500);
    expect(await count()).toBe(1);
    await lp(page, (lp) => lp.actions.messaging.sendMessage("cv_noah_aisha", "Great, see you then."));
    await page.waitForTimeout(4500);
    expect(await count()).toBe(1); // only one scripted reply per conversation
  });

  test("report → hide → resolve → placeholder for participants, original in export", async ({ page }) => {
    await freshDemo(page, "u_amira");
    const r = await lp(page, (lp) => {
      const M = lp.actions.messaging;
      const hide = M.hideMessage("msg_jamal_ryan_4", "Insulting language toward another fellow.", "rp_jamal_ryan");
      const resolve = M.resolveReport("rp_jamal_ryan", "message_hidden", "Hid the message and spoke with Jamal.");
      const exp = M.exportConversations(["cv_jamal_ryan", "cv_leo_kai"], "json");
      const db = lp.getState().db;
      return { hide: hide.ok, resolve: resolve.ok, status: db.reports["rp_jamal_ryan"].status, hidden: !!db.messages["msg_jamal_ryan_4"].hidden, exp };
    });
    expect(r.hide && r.resolve).toBe(true);
    expect(r.status).toBe("resolved");
    expect(r.hidden).toBe(true);
    // Amira's scope is Summer 2026 + Winter 2027 → the Spring 2026 thread is excluded from her export.
    expect(r.exp.ok).toBe(true);
    const parsed = JSON.parse(r.exp.content);
    expect(parsed.meta.conversationCount).toBe(1);
    expect(parsed.conversations[0].messages.find((m: any) => m.id === "msg_jamal_ryan_4").body).toMatch(/idiot/);

    await asPersona(page, "u_marcus");
    const denied = await lp(page, (lp) => lp.actions.messaging.hideMessage("msg_jamal_ryan_5", "test"));
    expect(denied.ok).toBe(false); // out of Marcus's scope

    await asPersona(page, "u_amira");
    const restore = await lp(page, (lp) => lp.actions.messaging.restoreMessage("msg_jamal_ryan_4", "Restored after review"));
    expect(restore.ok).toBe(true);
  });

  test("announcements respect sender scope and reach only that cohort", async ({ page }) => {
    await freshDemo(page, "u_amira");
    const r = await lp(page, (lp) => {
      const C = lp.actions.comms;
      const all = C.saveAnnouncementDraft({ scope: "all", audience: "fellows", title: "To everyone", body: "Hi" });
      const other = C.saveAnnouncementDraft({ scope: "c_spring26", audience: "fellows", title: "Spring only", body: "Hi" });
      const draft = C.saveAnnouncementDraft({ scope: "c_summer26", audience: "fellows", title: "Demo day logistics", body: "Arrive by 5pm." });
      const send = C.sendAnnouncement(draft.value);
      return { all: all.ok, other: other.ok, send: send.ok, count: send.value, id: draft.value };
    });
    expect(r.all).toBe(false);
    expect(r.other).toBe(false);
    expect(r.send).toBe(true);
    expect(r.count).toBe(12);
    await page.waitForTimeout(2600);
    const d = await lp(page, (lp, id) => {
      const db = lp.getState().db;
      const n = (uid: string) => Object.values(db.notifications).filter((x: any) => x.userId === uid && x.title === "Demo day logistics").length;
      const emails = Object.values(db.outbox).filter((e: any) => e.announcementId === id).length;
      return { status: db.announcements[id].status, noah: n("u_noah"), leo: n("u_leo"), emails };
    }, r.id);
    expect(d.status).toBe("delivered");
    expect(d.noah).toBe(1);
    expect(d.leo).toBe(0);
    expect(d.emails).toBe(12);
  });
});

test("reset restores seeded relationships and counts", async ({ page }) => {
  await freshDemo(page, "u_amira");
  const baseline = await lp(page, (lp) => {
    const db = lp.getState().db;
    return { apps: Object.keys(db.applications).length, memberships: Object.keys(db.memberships).length, messages: Object.keys(db.messages).length, reports: Object.values(db.reports).filter((r: any) => r.status !== "resolved").length };
  });
  await lp(page, (lp) => {
    lp.actions.applications.decideApplication("a_theo_w27", "approved", "");
    lp.actions.messaging.sendMessage("cv_amira_noah", "Checking in");
  });
  await lp(page, async (lp) => lp.resetDemo());
  const after = await lp(page, (lp) => {
    const db = lp.getState().db;
    return { apps: Object.keys(db.applications).length, memberships: Object.keys(db.memberships).length, messages: Object.keys(db.messages).length, reports: Object.values(db.reports).filter((r: any) => r.status !== "resolved").length, theo: db.applications["a_theo_w27"].status };
  });
  expect(after).toEqual({ ...baseline, theo: "in_review" });
});
