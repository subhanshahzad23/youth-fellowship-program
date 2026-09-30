"use client";

import type { Database, ID, SessionContent, SessionKind } from "@/lib/domain/types";
import { canEditTrack, canReviewSubmission, canRunImport, canViewModule, fellowMembership, instructorScopes } from "@/lib/domain/permissions";
import { taskBlockOf } from "@/lib/domain/selectors";
import { planImport } from "@/lib/sim/notion";
import { commit, plain } from "@/lib/store/store";
import { uid, wordCount } from "@/lib/utils";

export const MIN_SUBMISSION_WORDS = 15;

/* ------------------------------------------------------------------ */
/* Fellow actions                                                      */
/* ------------------------------------------------------------------ */

/**
 * Completion rules:
 * - reading / video sessions: the fellow marks them complete;
 * - task sessions: complete on submission when no review is required,
 *   otherwise only when the instructor approves the submission.
 */
export function markSessionComplete(sessionId: ID) {
  return commit((db, ctx) => {
    const s = db.sessions[sessionId];
    if (!s || !s.published) ctx.fail("This session isn't available.");
    const v = canViewModule(db as Database, ctx.actorId, s!.moduleId);
    if (!v.ok) ctx.fail(v.reason);
    if (!fellowMembership(db as Database, ctx.actorId)) ctx.fail("Only fellows track progress.");
    if (s!.kind === "task") ctx.fail("Task sessions are completed by submitting the assignment.");
    if (Object.values(db.completions).some((c) => c.userId === ctx.actorId && c.sessionId === sessionId)) return false;
    const id = uid("sc");
    db.completions[id] = { id, userId: ctx.actorId, sessionId, completedAt: ctx.now };
    return true;
  });
}

export function markSessionIncomplete(sessionId: ID) {
  return commit((db, ctx) => {
    const s = db.sessions[sessionId];
    if (s?.kind === "task") ctx.fail("Task completion follows the review outcome.");
    const c = Object.values(db.completions).find((c) => c.userId === ctx.actorId && c.sessionId === sessionId);
    if (c) delete db.completions[c.id];
  });
}

function ensureSubmission(db: import("immer").Draft<Database>, actorId: ID, sessionId: ID, now: string, fail: (r: string) => never) {
  const s = db.sessions[sessionId];
  if (!s || !s.published || s.kind !== "task") fail("This session has no assignment.");
  const fm = fellowMembership(db as Database, actorId);
  if (!fm) fail("Only enrolled fellows can submit assignments.");
  const v = canViewModule(db as Database, actorId, s!.moduleId);
  if (!v.ok) fail(v.reason);
  let sub = Object.values(db.submissions).find((x) => x.fellowId === actorId && x.sessionId === sessionId);
  if (!sub) {
    const id = uid("sub");
    db.submissions[id] = { id, sessionId, fellowId: actorId, cohortId: fm!.cohortId, status: "draft", draftText: "", draftAttachmentIds: [], versions: [], feedback: [], updatedAt: now };
    sub = db.submissions[id];
  }
  return sub;
}

export function saveSubmissionDraft(sessionId: ID, text: string, attachmentIds?: ID[]) {
  return commit((db, ctx) => {
    const sub = ensureSubmission(db, ctx.actorId, sessionId, ctx.now, ctx.fail);
    if (sub.status === "submitted") ctx.fail("Your submission is with the instructor. You can edit again if they request changes.");
    if (sub.status === "reviewed") ctx.fail("This assignment has been reviewed and is complete.");
    sub.draftText = text;
    if (attachmentIds) sub.draftAttachmentIds = attachmentIds;
    sub.draftSavedAt = ctx.now;
    sub.updatedAt = ctx.now;
    return ctx.now;
  });
}

export function attachToSubmission(sessionId: ID, file: { name: string; mime: string; size: number; sampleUrl?: string; blobKey?: string }) {
  return commit((db, ctx) => {
    const sub = ensureSubmission(db, ctx.actorId, sessionId, ctx.now, ctx.fail);
    if (sub.status === "submitted" || sub.status === "reviewed") ctx.fail("Attachments can't be changed right now.");
    const id = uid("d");
    db.documents[id] = { id, ownerId: ctx.actorId, kind: "submission_attachment", name: file.name, mime: file.mime, size: file.size, source: file.sampleUrl ? "sample" : "upload", sampleUrl: file.sampleUrl, blobKey: file.blobKey, uploadedAt: ctx.now, restricted: false };
    sub.draftAttachmentIds.push(id);
    sub.draftSavedAt = ctx.now;
    return id;
  });
}

export function removeSubmissionAttachment(sessionId: ID, docId: ID) {
  return commit((db, ctx) => {
    const sub = Object.values(db.submissions).find((x) => x.fellowId === ctx.actorId && x.sessionId === sessionId);
    if (!sub) ctx.fail("Nothing to remove.");
    if (sub!.status === "submitted" || sub!.status === "reviewed") ctx.fail("Attachments can't be changed right now.");
    sub!.draftAttachmentIds = sub!.draftAttachmentIds.filter((d) => d !== docId);
    if (db.documents[docId]) db.documents[docId].removedAt = ctx.now;
    return db.documents[docId]?.blobKey;
  });
}

export function submitAssignment(sessionId: ID) {
  return commit((db, ctx) => {
    const sub = ensureSubmission(db, ctx.actorId, sessionId, ctx.now, ctx.fail);
    if (sub.status === "submitted") ctx.fail("Already submitted — waiting for your instructor.");
    if (sub.status === "reviewed") ctx.fail("This assignment is already complete.");
    const words = wordCount(sub.draftText);
    if (words < MIN_SUBMISSION_WORDS) ctx.fail(`Write at least ${MIN_SUBMISSION_WORDS} words before submitting (you have ${words}).`);
    const session = db.sessions[sessionId];
    const task = taskBlockOf(session.published);
    const versionId = uid("sv");
    sub.versions.push({ id: versionId, text: sub.draftText, attachmentIds: [...sub.draftAttachmentIds], submittedAt: ctx.now });
    sub.updatedAt = ctx.now;
    const me = db.users[ctx.actorId];
    const mod = db.modules[session.moduleId];
    if (task && !task.requiresReview) {
      sub.status = "reviewed";
      if (!Object.values(db.completions).some((c) => c.userId === ctx.actorId && c.sessionId === sessionId)) {
        const id = uid("sc");
        db.completions[id] = { id, userId: ctx.actorId, sessionId, completedAt: ctx.now };
      }
      ctx.audit({ action: "submission.submit", entityType: "submission", entityId: sub.id, cohortId: sub.cohortId, summary: `Submitted “${session.published?.title}” (no review required — complete)` });
      return { completed: true };
    }
    sub.status = "submitted";
    const instructors = Object.values(db.memberships).filter((m) => m.role === "instructor" && m.status === "active" && m.cohortId === sub.cohortId && m.trackId === mod.trackId);
    for (const i of instructors)
      ctx.notify({ userId: i.userId, kind: "assignment", title: `${me?.name} ${sub.versions.length > 1 ? "resubmitted" : "submitted"} an assignment`, body: `${session.published?.title} · ${db.cohorts[sub.cohortId]?.name}`, href: `/staff/submissions?s=${sub.id}` });
    ctx.audit({ action: sub.versions.length > 1 ? "submission.resubmit" : "submission.submit", entityType: "submission", entityId: sub.id, cohortId: sub.cohortId, summary: `${sub.versions.length > 1 ? "Resubmitted" : "Submitted"} “${session.published?.title}” (version ${sub.versions.length})` });
    return { completed: false };
  });
}

/* ------------------------------------------------------------------ */
/* Instructor review                                                   */
/* ------------------------------------------------------------------ */

export function reviewSubmission(submissionId: ID, decision: "approved" | "changes_requested", text: string) {
  return commit((db, ctx) => {
    const sub = db.submissions[submissionId];
    if (!sub) ctx.fail("Submission not found.");
    const d = canReviewSubmission(db as Database, ctx.actorId, sub as never);
    if (!d.ok) ctx.fail(d.reason);
    if (sub.status !== "submitted") ctx.fail("This submission isn't waiting for review.");
    if (!text.trim()) ctx.fail("Write feedback for the fellow before sending.");
    const version = sub.versions[sub.versions.length - 1];
    sub.feedback.push({ id: uid("fb"), authorId: ctx.actorId, text: text.trim(), decision, at: ctx.now, versionId: version?.id });
    sub.status = decision === "approved" ? "reviewed" : "changes_requested";
    sub.updatedAt = ctx.now;
    const session = db.sessions[sub.sessionId];
    if (decision === "approved" && !Object.values(db.completions).some((c) => c.userId === sub.fellowId && c.sessionId === sub.sessionId)) {
      const id = uid("sc");
      db.completions[id] = { id, userId: sub.fellowId, sessionId: sub.sessionId, completedAt: ctx.now };
    }
    ctx.notify({
      userId: sub.fellowId,
      kind: "feedback",
      title: decision === "approved" ? `${db.users[ctx.actorId]?.name} approved your assignment` : `${db.users[ctx.actorId]?.name} requested changes`,
      body: `${session?.published?.title}: ${text.trim().slice(0, 110)}`,
      href: `/workspace/learning/${session?.moduleId}/${sub.sessionId}#assignment`,
    });
    ctx.audit({ action: decision === "approved" ? "submission.approve" : "submission.request_changes", entityType: "submission", entityId: sub.id, cohortId: sub.cohortId, summary: `${decision === "approved" ? "Approved" : "Requested changes on"} ${db.users[sub.fellowId]?.name}'s “${session?.published?.title}”` });
  });
}

/* ------------------------------------------------------------------ */
/* Instructor content editing                                          */
/* ------------------------------------------------------------------ */

function editableSession(db: import("immer").Draft<Database>, actorId: ID, sessionId: ID, fail: (r: string) => never) {
  const s = db.sessions[sessionId];
  if (!s) fail("Session not found.");
  const mod = db.modules[s!.moduleId];
  const d = canEditTrack(db as Database, actorId, mod.trackId);
  if (!d.ok) fail(d.reason);
  return s!;
}

/** Saves to the draft only. Fellows keep seeing the published version. */
export function saveSessionDraft(sessionId: ID, content: SessionContent) {
  return commit((db, ctx) => {
    const s = editableSession(db, ctx.actorId, sessionId, ctx.fail);
    if (!content.title.trim()) ctx.fail("Give the session a title.");
    s.draft = content;
    s.draftUpdatedAt = ctx.now;
    s.draftUpdatedById = ctx.actorId;
    return ctx.now;
  });
}

export function publishSession(sessionId: ID) {
  return commit((db, ctx) => {
    const s = editableSession(db, ctx.actorId, sessionId, ctx.fail);
    const content = s.draft ?? s.published;
    if (!content) ctx.fail("Nothing to publish yet.");
    if (!content!.blocks.length) ctx.fail("Add at least one content block before publishing.");
    if (s.kind === "task" && !content!.blocks.some((b) => b.type === "task")) ctx.fail("Task sessions need a task block before publishing.");
    s.published = plain(content!) as never;
    s.draft = undefined;
    s.draftUpdatedAt = undefined;
    s.status = "published";
    s.publishedAt = ctx.now;
    const mod = db.modules[s.moduleId];
    mod.updatedAt = ctx.now;
    ctx.audit({ action: "session.publish", entityType: "session", entityId: s.id, summary: `Published “${content!.title}” in ${mod.title}` });
  });
}

export function discardSessionDraft(sessionId: ID) {
  return commit((db, ctx) => {
    const s = editableSession(db, ctx.actorId, sessionId, ctx.fail);
    if (!s.published) ctx.fail("This session has never been published — delete it instead.");
    s.draft = undefined;
    s.draftUpdatedAt = undefined;
  });
}

export function createSession(moduleId: ID, kind: SessionKind) {
  return commit((db, ctx) => {
    const mod = db.modules[moduleId];
    if (!mod) ctx.fail("Module not found.");
    const d = canEditTrack(db as Database, ctx.actorId, mod.trackId);
    if (!d.ok) ctx.fail(d.reason);
    const id = `${moduleId}-${uid("s").slice(2, 7)}`;
    const blocks: SessionContent["blocks"] = [
      { id: `${id}-b1`, type: "text", text: "Start writing here. Fellows won't see this session until you publish it." },
    ];
    if (kind === "task")
      blocks.push({ id: `${id}-b2`, type: "task", title: "Your task", instructions: "Describe what fellows should do.", deliverable: "What should they submit?", requiresReview: true });
    db.sessions[id] = {
      id,
      moduleId,
      order: mod.sessionIds.length + 1,
      kind,
      status: "draft",
      draft: { title: kind === "task" ? "New assignment" : kind === "video" ? "New video session" : "New reading", summary: "", durationMin: 15, blocks },
      draftUpdatedAt: ctx.now,
      draftUpdatedById: ctx.actorId,
    };
    mod.sessionIds.push(id);
    ctx.audit({ action: "session.create", entityType: "session", entityId: id, summary: `Created a draft ${kind} session in ${mod.title}` });
    return id;
  });
}

export function deleteDraftSession(sessionId: ID) {
  return commit((db, ctx) => {
    const s = editableSession(db, ctx.actorId, sessionId, ctx.fail);
    if (s.published) ctx.fail("Published sessions can't be deleted in the demo. Unpublish isn't supported — edit it instead.");
    const mod = db.modules[s.moduleId];
    mod.sessionIds = mod.sessionIds.filter((id) => id !== sessionId);
    delete db.sessions[sessionId];
    ctx.audit({ action: "session.delete", entityType: "session", entityId: sessionId, summary: `Deleted an unpublished draft session from ${mod.title}` });
  });
}

/** Reorder takes effect immediately (it changes structure, not content). */
export function moveSession(sessionId: ID, direction: -1 | 1) {
  return commit((db, ctx) => {
    const s = editableSession(db, ctx.actorId, sessionId, ctx.fail);
    const mod = db.modules[s.moduleId];
    const i = mod.sessionIds.indexOf(sessionId);
    const j = i + direction;
    if (j < 0 || j >= mod.sessionIds.length) return;
    [mod.sessionIds[i], mod.sessionIds[j]] = [mod.sessionIds[j], mod.sessionIds[i]];
    mod.sessionIds.forEach((id, idx) => {
      if (db.sessions[id]) db.sessions[id].order = idx + 1;
    });
    ctx.audit({ action: "session.reorder", entityType: "module", entityId: mod.id, summary: `Reordered sessions in ${mod.title}` });
  });
}

/* ------------------------------------------------------------------ */
/* Notion migration (simulated)                                        */
/* ------------------------------------------------------------------ */

export function runNotionImport() {
  return commit((db, ctx) => {
    const d = canRunImport(db as Database, ctx.actorId);
    if (!d.ok) ctx.fail(d.reason);
    const plan = planImport(db as Database);
    let created = 0;
    let updated = 0;
    let skipped = 0;
    const details: { notionId: string; title: string; kind: "module" | "session"; result: "created" | "updated" | "skipped"; targetId?: string }[] = [];
    for (const item of plan) {
      if (item.kind === "module") {
        if (item.action === "update" && item.targetId) {
          db.modules[item.targetId].title = item.title;
          db.modules[item.targetId].updatedAt = ctx.now;
          updated++;
          details.push({ notionId: item.notionId, title: item.title, kind: "module", result: "updated", targetId: item.targetId });
        } else {
          skipped++;
          details.push({ notionId: item.notionId, title: item.title, kind: "module", result: "skipped", targetId: item.targetId });
        }
        continue;
      }
      const content = item.content!;
      if (item.action === "skip") {
        skipped++;
        details.push({ notionId: item.notionId, title: item.title, kind: "session", result: "skipped", targetId: item.targetId });
      } else if (item.action === "update" && item.targetId) {
        const s = db.sessions[item.targetId];
        s.published = { title: content.title, summary: content.summary, durationMin: content.durationMin, blocks: content.blocks } as never;
        s.publishedAt = ctx.now;
        s.status = "published";
        updated++;
        details.push({ notionId: item.notionId, title: item.title, kind: "session", result: "updated", targetId: item.targetId });
      } else if (item.action === "create" && item.moduleId && db.modules[item.moduleId]) {
        const id = item.notionId.replace(/^ntn-/, "");
        if (db.sessions[id]) {
          skipped++;
          continue;
        }
        const mod = db.modules[item.moduleId];
        db.sessions[id] = {
          id,
          moduleId: mod.id,
          order: mod.sessionIds.length + 1,
          kind: content.kind,
          status: "published",
          published: { title: content.title, summary: content.summary, durationMin: content.durationMin, blocks: content.blocks } as never,
          publishedAt: ctx.now,
          notionBlockId: item.notionId,
        };
        mod.sessionIds.push(id);
        created++;
        details.push({ notionId: item.notionId, title: item.title, kind: "session", result: "created", targetId: id });
      }
    }
    const runId = uid("imp");
    db.imports[runId] = { id: runId, at: ctx.now, byId: ctx.actorId, created, updated, skipped, details };
    ctx.audit({ action: "import.notion", entityType: "import", entityId: runId, summary: `Ran simulated Notion import: ${created} created, ${updated} updated, ${skipped} skipped`, meta: { created, updated, skipped } });
    return { created, updated, skipped, runId };
  });
}

export function instructorTrackSummary(db: Database, userId: ID) {
  return instructorScopes(db, userId);
}
