"use client";

import type { Draft } from "immer";
import type {
  Application,
  ApplicationAnswers,
  ApplicationSection,
  Database,
  DocumentRecord,
  ID,
  Recommendation,
  TimelineEntry,
} from "@/lib/domain/types";
import {
  canAssignReviewers,
  canDecideApplication,
  canEditOwnApplication,
  canOpenDocument,
  canReviewApplication,
  canViewApplication,
  isAdmin,
  isStaff,
} from "@/lib/domain/permissions";
import { formForCohort, reviewsOf, STATUS_LABEL, weightedScore, windowState } from "@/lib/domain/selectors";
import { sectionOfField, validateApplication } from "@/lib/domain/validation";
import { checkAddress, resolveCandidate } from "@/lib/sim/residence";
import { SAMPLE_PROOFS } from "@/lib/seed/applications";
import { auditDenied, commit, useDemoStore } from "@/lib/store/store";
import { nowISO } from "@/lib/clock";
import { uid } from "@/lib/utils";

type D = Draft<Database>;

const COHORT_CODE: Record<string, string> = { c_winter27: "W27", c_spring27: "S27", c_summer27: "U27", c_summer26: "S26", c_spring26: "P26" };

function tl(app: Draft<Application>, entry: Omit<TimelineEntry, "id">) {
  app.timeline.push({ id: uid("tl"), ...entry });
}

function getApp(db: D, id: ID, fail: (r: string) => never) {
  const app = db.applications[id];
  if (!app) fail("That application no longer exists.");
  return app;
}

/* ------------------------------------------------------------------ */
/* Applicant side                                                      */
/* ------------------------------------------------------------------ */

export function startApplication(cohortId: ID) {
  return commit((db, ctx) => {
    const me = db.users[ctx.actorId];
    if (!me) ctx.fail("Choose a demo identity first.");
    if (isStaff(db as Database, ctx.actorId)) ctx.fail("Staff accounts can't apply. Switch to an applicant identity.");
    const existing = Object.values(db.applications).find((a) => a.applicantId === ctx.actorId && a.cohortId === cohortId);
    if (existing) return existing.id;
    const form = formForCohort(db as Database, cohortId);
    const ws = windowState(form as never, ctx.now);
    if (!form || ws !== "open")
      ctx.fail(ws === "upcoming" ? "This application window hasn't opened yet." : ws === "closed" ? "This application window has closed." : "There is no published application form for this cohort.");
    const id = uid("a");
    db.applications[id] = {
      id,
      applicantId: ctx.actorId,
      cohortId,
      formId: form!.id,
      formVersionId: form!.publishedVersionId!,
      status: "draft",
      answers: { about: { fullName: me.name, preferredName: me.firstName, email: me.email, pronouns: me.pronouns }, idea: { ventureName: me.ventureName }, residence: {}, custom: {} },
      documentIds: [],
      createdAt: ctx.now,
      updatedAt: ctx.now,
      lastSavedAt: ctx.now,
      currentSection: "about",
      changeRequests: [],
      timeline: [{ id: uid("tl"), at: ctx.now, status: "draft", label: "Application started", visibility: "applicant", actorId: ctx.actorId }],
      resubmissions: 0,
    };
    ctx.audit({ action: "application.start", entityType: "application", entityId: id, cohortId, summary: `Started a ${db.cohorts[cohortId]?.name} application` });
    return id;
  });
}

/** Field keys that a patch touches, e.g. "idea.problem". */
function patchKeys(patch: AnswersPatch) {
  const keys: string[] = [];
  for (const [section, fields] of Object.entries(patch)) {
    if (!fields || typeof fields !== "object") continue;
    for (const k of Object.keys(fields)) {
      if (section === "residence" && (k === "proofDocumentId" || k === "proofType")) keys.push("residence.proof");
      else if (section === "residence" && k === "check") keys.push("residence.address");
      else keys.push(`${section}.${k}`);
    }
  }
  return keys;
}

export type AnswersPatch = {
  about?: Partial<ApplicationAnswers["about"]>;
  idea?: Partial<ApplicationAnswers["idea"]>;
  residence?: Partial<ApplicationAnswers["residence"]>;
  custom?: ApplicationAnswers["custom"];
  commitment?: Partial<NonNullable<ApplicationAnswers["commitment"]>>;
};

function assertEditable(db: D, app: Draft<Application>, actorId: ID, fail: (r: string) => never, keys: string[] = []) {
  const d = canEditOwnApplication(db as Database, actorId, app as Application);
  if (!d.ok) fail(d.reason);
  if (app.status === "changes_requested") {
    const open = app.changeRequests.find((c) => !c.resolvedAt);
    const allowed = open?.fields ?? [];
    const blocked = keys.filter((k) => !allowed.some((a) => k === a || (a.startsWith("custom.") && k === a) || (a === "residence.address" && k.startsWith("residence.address"))));
    if (blocked.length) fail("Only the fields the reviewer asked about can be changed. Other answers stay locked.");
  }
}

export function saveApplication(appId: ID, patch: AnswersPatch, opts: { section?: ApplicationSection } = {}) {
  return commit((db, ctx) => {
    const app = getApp(db, appId, ctx.fail);
    const keys = patchKeys(patch);
    assertEditable(db, app, ctx.actorId, ctx.fail, keys);
    const a = app.answers;
    if (patch.about) Object.assign(a.about, patch.about);
    if (patch.idea) Object.assign(a.idea, patch.idea);
    if (patch.residence) {
      // Changing the address invalidates the previous location check.
      if (patch.residence.address !== undefined && patch.residence.address !== a.residence.address && !patch.residence.check) a.residence.check = undefined;
      Object.assign(a.residence, patch.residence);
    }
    if (patch.custom) Object.assign(a.custom, patch.custom);
    if (patch.commitment) a.commitment = { ...(a.commitment ?? {}), ...patch.commitment };
    if (opts.section) app.currentSection = opts.section;
    app.updatedAt = ctx.now;
    app.lastSavedAt = ctx.now;
    return ctx.now;
  });
}

export function setCurrentSection(appId: ID, section: ApplicationSection) {
  return commit((db, ctx) => {
    const app = getApp(db, appId, ctx.fail);
    if (app.applicantId !== ctx.actorId) ctx.fail("Only the applicant can do that.");
    app.currentSection = section;
  });
}

export function runResidenceCheck(appId: ID, input: string, fixture?: string) {
  return commit((db, ctx) => {
    const app = getApp(db, appId, ctx.fail);
    assertEditable(db, app, ctx.actorId, ctx.fail, ["residence.address"]);
    if (!input.trim()) ctx.fail("Enter an address first.");
    const result = { ...checkAddress(input, fixture), checkedAt: ctx.now };
    app.answers.residence.address = input;
    app.answers.residence.check = result;
    app.lastSavedAt = ctx.now;
    app.updatedAt = ctx.now;
    return result;
  });
}

export function chooseResidenceCandidate(appId: ID, label: string) {
  return commit((db, ctx) => {
    const app = getApp(db, appId, ctx.fail);
    assertEditable(db, app, ctx.actorId, ctx.fail, ["residence.address"]);
    const check = app.answers.residence.check;
    if (!check) ctx.fail("Run the location check first.");
    app.answers.residence.check = { ...resolveCandidate(check as never, label), checkedAt: ctx.now };
    app.lastSavedAt = ctx.now;
    return app.answers.residence.check;
  });
}

function addDocument(db: D, doc: DocumentRecord) {
  db.documents[doc.id] = doc;
}

/** Attach one of the bundled, watermarked sample documents. */
export function attachSampleProof(appId: ID, sampleKey: (typeof SAMPLE_PROOFS)[number]["key"]) {
  return commit((db, ctx) => {
    const app = getApp(db, appId, ctx.fail);
    assertEditable(db, app, ctx.actorId, ctx.fail, ["residence.proof"]);
    const sample = SAMPLE_PROOFS.find((s) => s.key === sampleKey);
    if (!sample) ctx.fail("Sample not found.");
    const prev = app.answers.residence.proofDocumentId;
    if (prev && db.documents[prev]) db.documents[prev].removedAt = ctx.now;
    const id = uid("d");
    addDocument(db, {
      id,
      ownerId: ctx.actorId,
      kind: "proof_of_residence",
      applicationId: appId,
      name: sample!.name,
      mime: sample!.mime,
      size: sample!.size,
      source: "sample",
      sampleUrl: sample!.url,
      uploadedAt: ctx.now,
      restricted: true,
    });
    app.documentIds.push(id);
    app.answers.residence.proofDocumentId = id;
    app.answers.residence.proofType = sample!.title.replace(" (sample)", "");
    app.lastSavedAt = ctx.now;
    app.updatedAt = ctx.now;
    ctx.audit({ action: "document.attach", entityType: "document", entityId: id, cohortId: app.cohortId, summary: `Attached ${prev ? "replacement " : ""}proof of residence (${sample!.name})` });
    return id;
  });
}

/** Attach a user-uploaded file. Bytes must already be stored in IndexedDB under blobKey. */
export function attachUploadedDocument(
  appId: ID,
  file: { name: string; mime: string; size: number; blobKey: string },
  target: { kind: "proof" } | { kind: "question"; questionId: ID },
) {
  return commit((db, ctx) => {
    const app = getApp(db, appId, ctx.fail);
    assertEditable(db, app, ctx.actorId, ctx.fail, [target.kind === "proof" ? "residence.proof" : `custom.${target.questionId}`]);
    const id = uid("d");
    addDocument(db, {
      id,
      ownerId: ctx.actorId,
      kind: target.kind === "proof" ? "proof_of_residence" : "application_attachment",
      applicationId: appId,
      name: file.name,
      mime: file.mime,
      size: file.size,
      source: "upload",
      blobKey: file.blobKey,
      uploadedAt: ctx.now,
      restricted: true,
    });
    app.documentIds.push(id);
    if (target.kind === "proof") {
      const prev = app.answers.residence.proofDocumentId;
      if (prev && db.documents[prev]) db.documents[prev].removedAt = ctx.now;
      app.answers.residence.proofDocumentId = id;
      app.answers.residence.proofType = app.answers.residence.proofType ?? "Uploaded document";
    } else {
      const prev = app.answers.custom[target.questionId];
      if (typeof prev === "string" && db.documents[prev]) db.documents[prev].removedAt = ctx.now;
      app.answers.custom[target.questionId] = id;
    }
    app.lastSavedAt = ctx.now;
    app.updatedAt = ctx.now;
    ctx.audit({ action: "document.upload", entityType: "document", entityId: id, cohortId: app.cohortId, summary: `Uploaded ${file.name}` });
    return id;
  });
}

export function attachSampleToQuestion(appId: ID, questionId: ID) {
  return commit((db, ctx) => {
    const app = getApp(db, appId, ctx.fail);
    assertEditable(db, app, ctx.actorId, ctx.fail, [`custom.${questionId}`]);
    const id = uid("d");
    addDocument(db, {
      id,
      ownerId: ctx.actorId,
      kind: "application_attachment",
      applicationId: appId,
      name: "idea-sketch-sample.png",
      mime: "image/png",
      size: 71680,
      source: "sample",
      sampleUrl: "/samples/idea-sketch-sample.png",
      uploadedAt: ctx.now,
      restricted: true,
    });
    app.documentIds.push(id);
    app.answers.custom[questionId] = id;
    app.lastSavedAt = ctx.now;
    return id;
  });
}

export function removeDocument(appId: ID, docId: ID) {
  return commit((db, ctx) => {
    const app = getApp(db, appId, ctx.fail);
    const doc = db.documents[docId];
    if (!doc || doc.ownerId !== ctx.actorId) ctx.fail("You can only remove your own files.");
    const isProof = app.answers.residence.proofDocumentId === docId;
    assertEditable(db, app, ctx.actorId, ctx.fail, [isProof ? "residence.proof" : `custom.${Object.keys(app.answers.custom).find((k) => app.answers.custom[k] === docId) ?? ""}`]);
    doc!.removedAt = ctx.now;
    if (isProof) {
      app.answers.residence.proofDocumentId = undefined;
      app.answers.residence.proofType = undefined;
    }
    for (const k of Object.keys(app.answers.custom)) if (app.answers.custom[k] === docId) app.answers.custom[k] = undefined;
    app.lastSavedAt = ctx.now;
    ctx.audit({ action: "document.remove", entityType: "document", entityId: docId, cohortId: app.cohortId, summary: `Removed ${doc!.name}` });
    return doc!.blobKey;
  });
}

export function submitApplication(appId: ID) {
  return commit((db, ctx) => {
    const app = getApp(db, appId, ctx.fail);
    if (app.applicantId !== ctx.actorId) ctx.fail("Only the applicant can submit this application.");
    if (!["draft", "changes_requested"].includes(app.status)) ctx.fail("This application has already been submitted.");
    // On resubmission only the requested (editable) fields can block: everything else is locked
    // and was already accepted by the reviewer, so the applicant couldn't fix it anyway.
    const openRequest = app.status === "changes_requested" ? app.changeRequests.find((c) => !c.resolvedAt) : undefined;
    const issues = validateApplication(db as Database, app as Application).filter((i) => !openRequest || openRequest.fields.includes(i.field));
    if (issues.length) ctx.fail(`Please fix ${issues.length} ${issues.length === 1 ? "issue" : "issues"} before submitting.`);
    const cohort = db.cohorts[app.cohortId];
    const me = db.users[ctx.actorId];

    if (app.status === "draft") {
      const ws = windowState(db.forms[app.formId] as never, ctx.now);
      if (ws !== "open") ctx.fail(ws === "closed" ? "The application window has closed." : "The application window isn't open yet.");
      db.counters.applicationRef += 1;
      app.reference = `LP-${COHORT_CODE[app.cohortId] ?? "APP"}-${String(db.counters.applicationRef).padStart(4, "0")}`;
      app.status = "submitted";
      app.submittedAt = ctx.now;
      app.updatedAt = ctx.now;
      app.currentSection = "review";
      tl(app, { at: ctx.now, status: "submitted", label: "Application submitted", visibility: "applicant", actorId: ctx.actorId });

      // Auto-assign the cohort's first program admin as reviewer.
      const pa = Object.values(db.memberships).find((m) => m.cohortId === app.cohortId && m.role === "program_admin" && m.status === "active");
      if (pa && !Object.values(db.reviewerAssignments).some((r) => r.applicationId === app.id && r.reviewerId === pa.userId)) {
        const rid = uid("ra");
        db.reviewerAssignments[rid] = { id: rid, applicationId: app.id, reviewerId: pa.userId, assignedById: pa.userId, assignedAt: ctx.now };
        tl(app, { at: ctx.now, status: "submitted", label: `Reviewer assigned automatically`, visibility: "internal" });
        ctx.notify({ userId: pa.userId, kind: "review", title: `New application: ${me?.name}`, body: `${cohort?.name} · ${app.reference} · assigned to you`, href: `/admin/applications/${app.id}` });
      }
      ctx.email({
        toUserId: ctx.actorId,
        toEmail: app.answers.about.email ?? me?.email ?? "",
        toName: me?.name ?? "",
        subject: `We received your ${cohort?.name} application (${app.reference})`,
        preview: "Thanks for applying — here's what happens next.",
        bodyText: `Hi ${me?.firstName},\n\nThanks for applying to Launchpad Fellowship ${cohort?.name}. Your reference is ${app.reference}.\n\nAn assigned reviewer will read your application. You can follow its status from your applicant dashboard; your answers are now locked unless a reviewer asks for changes.\n\nLaunchpad Fellowship`,
        kind: "submission",
        relatedHref: `/applicant/applications/${app.id}`,
      });
      ctx.audit({ action: "application.submit", entityType: "application", entityId: app.id, cohortId: app.cohortId, summary: `Submitted application ${app.reference}` });
      return { reference: app.reference, resubmitted: false };
    }

    // Resubmission after requested changes: same application, same reference.
    const open = app.changeRequests.find((c) => !c.resolvedAt);
    if (open) open.resolvedAt = ctx.now;
    app.status = "in_review";
    app.resubmissions += 1;
    app.updatedAt = ctx.now;
    app.currentSection = "review";
    tl(app, { at: ctx.now, status: "in_review", label: "Resubmitted with the requested changes", visibility: "applicant", actorId: ctx.actorId });
    for (const r of Object.values(db.reviewerAssignments).filter((r) => r.applicationId === app.id))
      ctx.notify({ userId: r.reviewerId, kind: "review", title: `${me?.name} resubmitted`, body: `${app.reference} is ready for another look.`, href: `/admin/applications/${app.id}` });
    ctx.audit({ action: "application.resubmit", entityType: "application", entityId: app.id, cohortId: app.cohortId, summary: `Resubmitted ${app.reference} after requested changes` });
    return { reference: app.reference, resubmitted: true };
  });
}

/* ------------------------------------------------------------------ */
/* Documents                                                           */
/* ------------------------------------------------------------------ */

/**
 * Re-checks permission at the moment of opening (not just when rendering a
 * button). Denied attempts are written to the audit log.
 */
const lastDocAudit = new Map<string, number>();

export function openDocument(docId: ID): { ok: true; doc: DocumentRecord } | { ok: false; error: string } {
  const { db, personaId } = useDemoStore.getState();
  const doc = db.documents[docId];
  if (!doc) return { ok: false, error: "This document no longer exists." };
  const d = canOpenDocument(db, personaId, doc);
  const app = doc.applicationId ? db.applications[doc.applicationId] : undefined;
  // Collapse duplicate audit entries from rapid re-opens (and React dev double effects).
  const key = `${personaId}:${docId}:${d.ok}`;
  const recent = Date.now() - (lastDocAudit.get(key) ?? 0) < 3000;
  lastDocAudit.set(key, Date.now());
  if (recent) return d.ok ? { ok: true, doc } : { ok: false, error: d.reason };
  if (!d.ok) {
    auditDenied({ action: "document.view", entityType: "document", entityId: docId, cohortId: app?.cohortId, summary: `Attempted to open ${doc.name}${app?.reference ? ` for ${app.reference}` : ""} — access restricted` });
    return { ok: false, error: d.reason };
  }
  if (personaId !== doc.ownerId) {
    commit((_db, ctx) => {
      ctx.audit({ action: "document.view", entityType: "document", entityId: docId, cohortId: app?.cohortId, summary: `Viewed ${doc.kind === "proof_of_residence" ? "proof of residence" : doc.name}${app?.reference ? ` for ${app.reference}` : ""}` });
    });
  }
  return { ok: true, doc };
}

/* ------------------------------------------------------------------ */
/* Staff side                                                          */
/* ------------------------------------------------------------------ */

const lastViewAudit = new Map<string, number>();

export function recordApplicationView(appId: ID) {
  const { db, personaId } = useDemoStore.getState();
  const app = db.applications[appId];
  if (!app || !personaId || app.applicantId === personaId) return;
  if (!canViewApplication(db, personaId, app).ok) return;
  const key = `${personaId}:${appId}`;
  const last = lastViewAudit.get(key) ?? 0;
  if (Date.now() - last < 10 * 60 * 1000) return;
  lastViewAudit.set(key, Date.now());
  commit((_db, ctx) => ctx.audit({ action: "application.view", entityType: "application", entityId: appId, cohortId: app.cohortId, summary: `Viewed application ${app.reference}` }));
}

export function assignReviewer(appId: ID, reviewerId: ID) {
  return commit((db, ctx) => {
    const app = getApp(db, appId, ctx.fail);
    const d = canAssignReviewers(db as Database, ctx.actorId, app as Application);
    if (!d.ok) ctx.fail(d.reason);
    const reviewer = db.users[reviewerId];
    if (!reviewer || !isAdmin(db as Database, reviewerId)) ctx.fail("Reviewers must be program or executive admins.");
    if (Object.values(db.reviewerAssignments).some((r) => r.applicationId === appId && r.reviewerId === reviewerId)) ctx.fail(`${reviewer!.name} is already assigned.`);
    const id = uid("ra");
    db.reviewerAssignments[id] = { id, applicationId: appId, reviewerId, assignedById: ctx.actorId, assignedAt: ctx.now };
    tl(app, { at: ctx.now, status: app.status, label: `${reviewer!.name} assigned as reviewer`, visibility: "internal", actorId: ctx.actorId });
    if (reviewerId !== ctx.actorId)
      ctx.notify({ userId: reviewerId, kind: "review", title: `${db.users[app.applicantId]?.name} was assigned to you`, body: `${db.cohorts[app.cohortId]?.name} · ${app.reference}`, href: `/admin/applications/${appId}` });
    ctx.audit({ action: "review.assign", entityType: "application", entityId: appId, cohortId: app.cohortId, summary: `Assigned ${reviewer!.name} to review ${app.reference}` });
  });
}

export function unassignReviewer(appId: ID, reviewerId: ID) {
  return commit((db, ctx) => {
    const app = getApp(db, appId, ctx.fail);
    const d = canAssignReviewers(db as Database, ctx.actorId, app as Application);
    if (!d.ok) ctx.fail(d.reason);
    const ra = Object.values(db.reviewerAssignments).find((r) => r.applicationId === appId && r.reviewerId === reviewerId);
    if (!ra) ctx.fail("That reviewer isn't assigned.");
    delete db.reviewerAssignments[ra!.id];
    tl(app, { at: ctx.now, status: app.status, label: `${db.users[reviewerId]?.name} unassigned`, visibility: "internal", actorId: ctx.actorId });
    ctx.audit({ action: "review.unassign", entityType: "application", entityId: appId, cohortId: app.cohortId, summary: `Removed ${db.users[reviewerId]?.name} as reviewer on ${app.reference}` });
  });
}

export function saveReview(appId: ID, patch: { scores?: Record<ID, number | undefined>; recommendation?: Recommendation; notes?: string }) {
  return commit((db, ctx) => {
    const app = getApp(db, appId, ctx.fail);
    const d = canReviewApplication(db as Database, ctx.actorId, app as Application);
    if (!d.ok) ctx.fail(d.reason);
    let review = Object.values(db.reviews).find((r) => r.applicationId === appId && r.reviewerId === ctx.actorId);
    if (review?.status === "submitted") ctx.fail("Your review is already submitted.");
    if (!review) {
      const id = uid("rv");
      db.reviews[id] = { id, applicationId: appId, reviewerId: ctx.actorId, scores: {}, notes: "", status: "draft", updatedAt: ctx.now };
      review = db.reviews[id];
      ctx.audit({ action: "review.start", entityType: "review", entityId: id, cohortId: app.cohortId, summary: `Started a review of ${app.reference}` });
    }
    if (patch.scores) review.scores = { ...review.scores, ...patch.scores };
    if (patch.recommendation !== undefined) review.recommendation = patch.recommendation;
    if (patch.notes !== undefined) review.notes = patch.notes;
    review.updatedAt = ctx.now;
    if (app.status === "submitted") {
      app.status = "in_review";
      tl(app, { at: ctx.now, status: "in_review", label: "Review started", visibility: "applicant", actorId: ctx.actorId });
    }
    return review.id;
  });
}

export function submitReview(appId: ID) {
  return commit((db, ctx) => {
    const app = getApp(db, appId, ctx.fail);
    const d = canReviewApplication(db as Database, ctx.actorId, app as Application);
    if (!d.ok) ctx.fail(d.reason);
    const review = Object.values(db.reviews).find((r) => r.applicationId === appId && r.reviewerId === ctx.actorId);
    if (!review) ctx.fail("Score the application before submitting your review.");
    const missing = db.rubric.filter((c) => review!.scores[c.id] === undefined);
    if (missing.length) ctx.fail(`Score every criterion before submitting (missing: ${missing.map((m) => m.label).join(", ")}).`);
    if (!review!.recommendation) ctx.fail("Choose a recommendation before submitting.");
    review!.status = "submitted";
    review!.submittedAt = ctx.now;
    review!.updatedAt = ctx.now;
    const score = weightedScore(db as Database, review as never);
    tl(app, { at: ctx.now, status: app.status, label: `${db.users[ctx.actorId]?.name} submitted a review (${score}/100, recommends ${review!.recommendation})`, visibility: "internal", actorId: ctx.actorId });
    ctx.audit({ action: "review.submit", entityType: "review", entityId: review!.id, cohortId: app.cohortId, summary: `Submitted review for ${app.reference}: ${score}/100, recommends ${review!.recommendation}` });
    return score;
  });
}

/**
 * Final decision. Approval is one atomic transition:
 * status → decision → timeline → fellow membership on the SAME identity →
 * in-app notification → simulated welcome email → audit entries.
 * Re-running approval is idempotent (no duplicate membership or person).
 */
export function decideApplication(appId: ID, outcome: "approved" | "waitlisted" | "rejected", note: string) {
  return commit((db, ctx) => {
    const app = getApp(db, appId, ctx.fail);
    const d = canDecideApplication(db as Database, ctx.actorId, app as Application);
    if (!d.ok) ctx.fail(d.reason);
    const submitted = reviewsOf(db as Database, appId).filter((r) => r.status === "submitted");
    if (!submitted.length) ctx.fail("At least one submitted review is required before a final decision.");
    const applicant = db.users[app.applicantId];
    const cohort = db.cohorts[app.cohortId];
    const actor = db.users[ctx.actorId];

    app.status = outcome;
    app.decision = { outcome, decidedById: ctx.actorId, decidedAt: ctx.now, note: note || undefined };
    app.updatedAt = ctx.now;
    const labels = { approved: "Approved — welcome to the fellowship", waitlisted: "Placed on the waitlist", rejected: "Application not successful" };
    tl(app, { at: ctx.now, status: outcome, label: labels[outcome], visibility: "applicant", actorId: ctx.actorId, note: note || undefined });

    let membershipId: ID | undefined;
    if (outcome === "approved") {
      const existing = Object.values(db.memberships).find((m) => m.userId === app.applicantId && m.cohortId === app.cohortId && m.role === "fellow");
      if (existing) {
        existing.status = "active";
        membershipId = existing.id;
      } else {
        membershipId = uid("m");
        db.memberships[membershipId] = {
          id: membershipId,
          userId: app.applicantId,
          cohortId: app.cohortId,
          role: "fellow",
          trackId: app.answers.idea.trackPreference ?? "t_ff",
          status: "active",
          startedAt: ctx.now,
          sourceApplicationId: app.id,
        };
      }
      // Carry non-sensitive venture details onto the same person record.
      applicant.ventureName = app.answers.idea.ventureName ?? applicant.ventureName;
      applicant.ventureSummary = app.answers.idea.problem ?? applicant.ventureSummary;
      applicant.ventureStage = (app.answers.idea.stage as never) ?? applicant.ventureStage;
      ctx.notify({ userId: applicant.id, kind: "enrollment", title: `You're in — welcome to ${cohort.name}`, body: "Your fellow workspace is ready. Meet your cohort and start orientation.", href: "/workspace/dashboard" });
      ctx.email({
        toUserId: applicant.id,
        toEmail: app.answers.about.email ?? applicant.email,
        toName: applicant.name,
        subject: `Welcome to Launchpad Fellowship — ${cohort.name}`,
        preview: `You're in, ${applicant.firstName}. Your fellow workspace is ready.`,
        bodyText: `Hi ${applicant.firstName},\n\nCongratulations — your application ${app.reference} has been approved and you're now a ${cohort.name} fellow.\n\nYour fellow workspace is ready: sign in with the same account you applied with to meet your cohort, start orientation and message your program team.${note ? `\n\nA note from the team: ${note}` : ""}\n\nSee you soon,\n${actor?.name}\nLaunchpad Fellowship`,
        kind: "welcome",
        relatedHref: "/workspace/dashboard",
      });
      ctx.audit({ action: "application.approve", entityType: "application", entityId: app.id, cohortId: app.cohortId, summary: `Approved ${app.reference}` });
      ctx.audit({ action: "membership.create", entityType: "membership", entityId: membershipId, cohortId: app.cohortId, summary: `Enrolled ${applicant.name} as a ${cohort.name} fellow (same identity, no new account)` });
    } else {
      const title = outcome === "waitlisted" ? `Your ${cohort.name} application: waitlist` : `Your ${cohort.name} application`;
      ctx.notify({ userId: applicant.id, kind: "application", title: outcome === "waitlisted" ? "You're on the waitlist" : "An update on your application", body: note || STATUS_LABEL[outcome], href: `/applicant/applications/${app.id}` });
      ctx.email({
        toUserId: applicant.id,
        toEmail: app.answers.about.email ?? applicant.email,
        toName: applicant.name,
        subject: title,
        preview: outcome === "waitlisted" ? "You're on the waitlist — we'll be in touch if a place opens." : "Thank you for applying.",
        bodyText:
          outcome === "waitlisted"
            ? `Hi ${applicant.firstName},\n\nThank you for applying. You're on the ${cohort.name} waitlist and we'll contact you straight away if a place opens.${note ? `\n\n${note}` : ""}\n\n${actor?.name}`
            : `Hi ${applicant.firstName},\n\nThank you for applying to ${cohort.name}. We're not able to offer you a place this time.${note ? `\n\n${note}` : ""}\n\nWe'd love to hear from you again in a future intake.\n\n${actor?.name}`,
        kind: "decision",
        relatedHref: `/applicant/applications/${app.id}`,
      });
      ctx.audit({ action: `application.${outcome === "waitlisted" ? "waitlist" : "reject"}`, entityType: "application", entityId: app.id, cohortId: app.cohortId, summary: `${outcome === "waitlisted" ? "Waitlisted" : "Rejected"} ${app.reference}` });
    }
    return { membershipId, applicantId: applicant.id };
  });
}

export function requestChanges(appId: ID, fields: string[], note: string) {
  return commit((db, ctx) => {
    const app = getApp(db, appId, ctx.fail);
    const d = canDecideApplication(db as Database, ctx.actorId, app as Application);
    if (!d.ok) ctx.fail(d.reason);
    if (!fields.length) ctx.fail("Choose at least one field that needs changes.");
    if (!note.trim()) ctx.fail("Explain what the applicant should change.");
    app.status = "changes_requested";
    app.changeRequests.push({ id: uid("cr"), requestedById: ctx.actorId, requestedAt: ctx.now, note, fields });
    app.currentSection = sectionOfField(fields[0]);
    app.updatedAt = ctx.now;
    tl(app, { at: ctx.now, status: "changes_requested", label: "Changes requested", visibility: "applicant", actorId: ctx.actorId, note });
    const applicant = db.users[app.applicantId];
    ctx.notify({ userId: applicant.id, kind: "application", title: "Changes requested on your application", body: note.slice(0, 140), href: `/applicant/applications/${app.id}` });
    ctx.email({
      toUserId: applicant.id,
      toEmail: app.answers.about.email ?? applicant.email,
      toName: applicant.name,
      subject: `Action needed: update your ${db.cohorts[app.cohortId]?.name} application`,
      preview: "A reviewer asked for a few changes.",
      bodyText: `Hi ${applicant.firstName},\n\n${note}\n\nYou can update just these parts and resubmit from your applicant dashboard. Everything else stays as you submitted it.\n\n${db.users[ctx.actorId]?.name}`,
      kind: "changes_requested",
      relatedHref: `/applicant/applications/${app.id}`,
    });
    ctx.audit({ action: "application.request_changes", entityType: "application", entityId: app.id, cohortId: app.cohortId, summary: `Requested changes on ${app.reference} (${fields.join(", ")})` });
  });
}

/** Non-sensitive CSV export of the visible queue. Residence documents are never included. */
export function exportApplicationsCsv(appIds: ID[]) {
  const { db } = useDemoStore.getState();
  const rows = [["Reference", "Applicant", "Cohort", "Track preference", "Status", "Submitted", "Location check", "Average score", "Reviewers"]];
  for (const id of appIds) {
    const a = db.applications[id];
    if (!a) continue;
    const scores = reviewsOf(db, id).filter((r) => r.status === "submitted").map((r) => weightedScore(db, r)).filter((n): n is number => n !== null);
    rows.push([
      a.reference ?? "",
      db.users[a.applicantId]?.name ?? "",
      db.cohorts[a.cohortId]?.name ?? "",
      db.tracks[a.answers.idea.trackPreference ?? ""]?.name ?? "",
      STATUS_LABEL[a.status],
      a.submittedAt?.slice(0, 10) ?? "",
      a.answers.residence.check?.status ?? "unchecked",
      scores.length ? String(Math.round(scores.reduce((x, y) => x + y, 0) / scores.length)) : "",
      Object.values(db.reviewerAssignments).filter((r) => r.applicationId === id).map((r) => db.users[r.reviewerId]?.name).join("; "),
    ]);
  }
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  commit((_db, ctx) => ctx.audit({ action: "export.applications", entityType: "export", entityId: uid("exp"), summary: `Exported ${appIds.length} applications to CSV (no documents)`, meta: { count: appIds.length } }));
  return `# Launchpad Fellowship demo export — fictional data — generated ${nowISO()}\n${csv}`;
}
