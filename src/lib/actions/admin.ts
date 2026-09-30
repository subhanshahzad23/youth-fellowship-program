"use client";

import type { Database, FormQuestion, ID, MembershipRole } from "@/lib/domain/types";
import { canCreateCohort, canManageCohort, canManageForms, isMentor } from "@/lib/domain/permissions";
import { commit, plain } from "@/lib/store/store";
import { addMonthsISO, uid } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Application forms                                                   */
/* ------------------------------------------------------------------ */

const TEMPLATE_QUESTIONS: FormQuestion[] = [
  { id: "q_tpl_started", kind: "long", label: "Tell us about something you have started.", required: true, wordLimit: 150 },
  { id: "q_tpl_support", kind: "multi", label: "Which kinds of support would help most?", required: true, maxChoices: 3, options: ["Finding customers", "Money and pricing", "Building a prototype", "Confidence speaking"] },
];

export function createForm(cohortId: ID) {
  return commit((db, ctx) => {
    const d = canManageForms(db as Database, ctx.actorId, cohortId);
    if (!d.ok) ctx.fail(d.reason);
    if (Object.values(db.forms).some((f) => f.cohortId === cohortId)) ctx.fail("This cohort already has an application form.");
    const cohort = db.cohorts[cohortId];
    const id = uid("f");
    const opens = new Date(Date.parse(ctx.now) + 14 * 86400000).toISOString();
    const closes = new Date(Date.parse(ctx.now) + 74 * 86400000).toISOString();
    db.forms[id] = {
      id,
      cohortId,
      title: `${cohort.name} application`,
      intro: "Tell us about you and your idea. It saves as you go.",
      opensAt: opens,
      closesAt: closes,
      status: "draft",
      draftQuestions: TEMPLATE_QUESTIONS.map((q) => ({ ...q, id: uid("q") })),
      draftUpdatedAt: ctx.now,
      createdAt: ctx.now,
      updatedAt: ctx.now,
    };
    ctx.audit({ action: "form.create", entityType: "form", entityId: id, cohortId, summary: `Created a draft application form for ${cohort.name}` });
    return id;
  });
}

/** Edits go to draftQuestions; published versions (and submitted applications) are untouched. */
export function updateFormDraft(formId: ID, patch: { title?: string; intro?: string; questions?: FormQuestion[] }) {
  return commit((db, ctx) => {
    const form = db.forms[formId];
    if (!form) ctx.fail("Form not found.");
    const d = canManageForms(db as Database, ctx.actorId, form.cohortId);
    if (!d.ok) ctx.fail(d.reason);
    if (patch.title !== undefined) form.title = patch.title;
    if (patch.intro !== undefined) form.intro = patch.intro;
    if (patch.questions) {
      for (const q of patch.questions) {
        if (!q.label.trim()) ctx.fail("Every question needs a label.");
        if ((q.kind === "select" || q.kind === "multi") && (!q.options || q.options.filter((o) => o.trim()).length < 2)) ctx.fail(`“${q.label}” needs at least two options.`);
      }
      form.draftQuestions = patch.questions;
      form.draftUpdatedAt = ctx.now;
    }
    form.updatedAt = ctx.now;
  });
}

export function startFormDraft(formId: ID) {
  return commit((db, ctx) => {
    const form = db.forms[formId];
    if (!form) ctx.fail("Form not found.");
    const d = canManageForms(db as Database, ctx.actorId, form.cohortId);
    if (!d.ok) ctx.fail(d.reason);
    if (!form.draftQuestions) {
      const current = form.publishedVersionId ? db.formVersions[form.publishedVersionId] : undefined;
      form.draftQuestions = plain(current?.questions ?? []);
      form.draftUpdatedAt = ctx.now;
    }
  });
}

export function discardFormDraft(formId: ID) {
  return commit((db, ctx) => {
    const form = db.forms[formId];
    if (!form) ctx.fail("Form not found.");
    const d = canManageForms(db as Database, ctx.actorId, form.cohortId);
    if (!d.ok) ctx.fail(d.reason);
    if (!form.publishedVersionId) ctx.fail("This form has never been published — delete questions instead.");
    form.draftQuestions = undefined;
    form.draftUpdatedAt = undefined;
  });
}

export function updateFormWindow(formId: ID, opensAt: string, closesAt: string) {
  return commit((db, ctx) => {
    const form = db.forms[formId];
    if (!form) ctx.fail("Form not found.");
    const d = canManageForms(db as Database, ctx.actorId, form.cohortId);
    if (!d.ok) ctx.fail(d.reason);
    if (!opensAt || !closesAt) ctx.fail("Choose both an opening and a closing date.");
    if (closesAt <= opensAt) ctx.fail("The closing date must be after the opening date.");
    form.opensAt = opensAt;
    form.closesAt = closesAt;
    form.updatedAt = ctx.now;
    ctx.audit({ action: "form.window", entityType: "form", entityId: formId, cohortId: form.cohortId, summary: `Set ${form.title} window: ${opensAt.slice(0, 10)} → ${closesAt.slice(0, 10)}` });
  });
}

export function publishForm(formId: ID) {
  return commit((db, ctx) => {
    const form = db.forms[formId];
    if (!form) ctx.fail("Form not found.");
    const d = canManageForms(db as Database, ctx.actorId, form.cohortId);
    if (!d.ok) ctx.fail(d.reason);
    const questions = form.draftQuestions ?? (form.publishedVersionId ? db.formVersions[form.publishedVersionId]?.questions : undefined);
    if (!questions) ctx.fail("Add at least one question before publishing.");
    const versions = Object.values(db.formVersions).filter((v) => v.formId === formId);
    const version = versions.length + 1;
    const vid = uid("fv");
    db.formVersions[vid] = { id: vid, formId, version, questions: plain(questions!), publishedAt: ctx.now, publishedById: ctx.actorId };
    form.publishedVersionId = vid;
    form.status = "published";
    form.draftQuestions = undefined;
    form.draftUpdatedAt = undefined;
    form.updatedAt = ctx.now;
    ctx.audit({ action: "form.publish", entityType: "form", entityId: formId, cohortId: form.cohortId, summary: `Published ${form.title} (version ${version}). Existing applications keep the version they started with.` });
    return version;
  });
}

/* ------------------------------------------------------------------ */
/* Cohorts, people and assignments                                     */
/* ------------------------------------------------------------------ */

export function createCohort(input: { name: string; startDate: string; capacity: number; description: string; location: string }) {
  return commit((db, ctx) => {
    const d = canCreateCohort(db as Database, ctx.actorId);
    if (!d.ok) ctx.fail(d.reason);
    if (!input.name.trim()) ctx.fail("Give the cohort a name.");
    if (Object.values(db.cohorts).some((c) => c.name.toLowerCase() === input.name.trim().toLowerCase())) ctx.fail("A cohort with that name already exists.");
    if (!input.startDate) ctx.fail("Choose a start date.");
    const id = uid("c");
    const slug = input.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const start = new Date(input.startDate + "T00:00:00Z").toISOString();
    db.cohorts[id] = {
      id,
      slug,
      name: input.name.trim(),
      status: "announced",
      startDate: start,
      endDate: addMonthsISO(start, 18),
      capacity: input.capacity,
      description: input.description.trim() || "A new Launchpad Fellowship cohort.",
      trackIds: Object.keys(db.tracks),
      location: input.location.trim() || "Larkhaven Makers Hall + online",
      createdAt: ctx.now,
    };
    ctx.audit({ action: "cohort.create", entityType: "cohort", entityId: id, cohortId: id, summary: `Created cohort ${input.name.trim()}` });
    return id;
  });
}

export function updateCohort(cohortId: ID, patch: { name?: string; startDate?: string; capacity?: number; description?: string; location?: string; status?: "active" | "intake" | "announced" | "completed" }) {
  return commit((db, ctx) => {
    const d = canManageCohort(db as Database, ctx.actorId, cohortId);
    if (!d.ok) ctx.fail(d.reason);
    const c = db.cohorts[cohortId];
    if (patch.name !== undefined) {
      if (!patch.name.trim()) ctx.fail("Name can't be empty.");
      c.name = patch.name.trim();
    }
    if (patch.startDate) {
      c.startDate = new Date(patch.startDate + "T00:00:00Z").toISOString();
      c.endDate = addMonthsISO(c.startDate, 18);
    }
    if (patch.capacity !== undefined) {
      if (patch.capacity < 1) ctx.fail("Capacity must be at least 1.");
      c.capacity = patch.capacity;
    }
    if (patch.description !== undefined) c.description = patch.description;
    if (patch.location !== undefined) c.location = patch.location;
    if (patch.status) c.status = patch.status;
    ctx.audit({ action: "cohort.update", entityType: "cohort", entityId: cohortId, cohortId, summary: `Updated ${c.name} details` });
  });
}

export function assignStaff(cohortId: ID, userId: ID, role: Exclude<MembershipRole, "fellow">, trackId?: ID) {
  return commit((db, ctx) => {
    const d = canManageCohort(db as Database, ctx.actorId, cohortId);
    if (!d.ok) ctx.fail(d.reason);
    const u = db.users[userId];
    if (!u) ctx.fail("Person not found.");
    const needed = role === "program_admin" ? "program_admin" : role;
    if (!u.staffRoles.includes(needed as never)) ctx.fail(`${u.name} doesn't have the ${role.replace("_", " ")} role.`);
    if (role === "program_admin" && !db.users[ctx.actorId]?.staffRoles.includes("executive_admin")) ctx.fail("Only executive admins can change program admin scope.");
    if (role === "instructor" && !trackId) ctx.fail("Choose the track this instructor teaches.");
    const dup = Object.values(db.memberships).find((m) => m.userId === userId && m.cohortId === cohortId && m.role === role && m.status === "active" && (role !== "instructor" || m.trackId === trackId));
    if (dup) ctx.fail(`${u.name} is already assigned.`);
    const id = uid("m");
    db.memberships[id] = { id, userId, cohortId, role, trackId, status: "active", startedAt: ctx.now };
    ctx.notify({ userId, kind: "system", title: `You've been added to ${db.cohorts[cohortId].name}`, body: `Role: ${role.replace("_", " ")}${trackId ? ` · ${db.tracks[trackId]?.name}` : ""}`, href: role === "program_admin" ? `/admin/cohorts/${cohortId}` : "/staff/dashboard" });
    ctx.audit({ action: "membership.create", entityType: "membership", entityId: id, cohortId, summary: `Assigned ${u.name} as ${role.replace("_", " ")}${trackId ? ` (${db.tracks[trackId]?.name})` : ""} to ${db.cohorts[cohortId].name}` });
  });
}

export function endMembership(membershipId: ID) {
  return commit((db, ctx) => {
    const m = db.memberships[membershipId];
    if (!m) ctx.fail("Assignment not found.");
    const d = canManageCohort(db as Database, ctx.actorId, m.cohortId);
    if (!d.ok) ctx.fail(d.reason);
    if (m.role === "program_admin" && !db.users[ctx.actorId]?.staffRoles.includes("executive_admin")) ctx.fail("Only executive admins can change program admin scope.");
    m.status = "ended";
    m.endedAt = ctx.now;
    ctx.audit({ action: "membership.end", entityType: "membership", entityId: m.id, cohortId: m.cohortId, summary: `Ended ${db.users[m.userId]?.name}'s ${m.role.replace("_", " ")} role in ${db.cohorts[m.cohortId]?.name}. Existing messages and history are kept.` });
  });
}

export function setFellowTrack(membershipId: ID, trackId: ID) {
  return commit((db, ctx) => {
    const m = db.memberships[membershipId];
    if (!m || m.role !== "fellow") ctx.fail("Fellow membership not found.");
    const d = canManageCohort(db as Database, ctx.actorId, m.cohortId);
    if (!d.ok) ctx.fail(d.reason);
    m.trackId = trackId;
    ctx.audit({ action: "membership.track", entityType: "membership", entityId: m.id, cohortId: m.cohortId, summary: `Moved ${db.users[m.userId]?.name} to ${db.tracks[trackId]?.name}` });
  });
}

/** Pair a mentor with a fellow. A fellow has one active mentor; any previous pairing ends (history kept). */
export function assignMentor(cohortId: ID, mentorId: ID, fellowId: ID) {
  return commit((db, ctx) => {
    const d = canManageCohort(db as Database, ctx.actorId, cohortId);
    if (!d.ok) ctx.fail(d.reason);
    if (!isMentor(db as Database, mentorId)) ctx.fail("That person isn't a mentor.");
    const fm = Object.values(db.memberships).find((m) => m.userId === fellowId && m.cohortId === cohortId && m.role === "fellow" && m.status === "active");
    if (!fm) ctx.fail("That fellow isn't active in this cohort.");
    const existing = Object.values(db.mentorAssignments).filter((a) => a.fellowId === fellowId && a.status === "active");
    if (existing.some((a) => a.mentorId === mentorId)) ctx.fail("They're already paired.");
    for (const a of existing) {
      a.status = "ended";
      a.endedAt = ctx.now;
      ctx.audit({ action: "mentor.end", entityType: "membership", entityId: a.id, cohortId, summary: `Ended ${db.users[a.mentorId]?.name}'s pairing with ${db.users[fellowId]?.name} (conversation kept, now read-only)` });
    }
    if (!Object.values(db.memberships).some((m) => m.userId === mentorId && m.cohortId === cohortId && m.role === "mentor" && m.status === "active")) {
      const mid = uid("m");
      db.memberships[mid] = { id: mid, userId: mentorId, cohortId, role: "mentor", status: "active", startedAt: ctx.now };
    }
    const id = uid("ma");
    db.mentorAssignments[id] = { id, mentorId, fellowId, cohortId, status: "active", startedAt: ctx.now };
    ctx.notify({ userId: fellowId, kind: "system", title: `${db.users[mentorId]?.name} is now your mentor`, body: "Say hello — you can message them from your inbox.", href: "/workspace/mentorship" });
    ctx.notify({ userId: mentorId, kind: "system", title: `You're now mentoring ${db.users[fellowId]?.name}`, body: db.users[fellowId]?.ventureName ?? "", href: "/staff/mentees" });
    ctx.audit({ action: "mentor.assign", entityType: "membership", entityId: id, cohortId, summary: `Paired ${db.users[mentorId]?.name} with ${db.users[fellowId]?.name}` });
  });
}

export function endMentorAssignment(assignmentId: ID) {
  return commit((db, ctx) => {
    const a = db.mentorAssignments[assignmentId];
    if (!a) ctx.fail("Pairing not found.");
    const d = canManageCohort(db as Database, ctx.actorId, a.cohortId);
    if (!d.ok) ctx.fail(d.reason);
    a.status = "ended";
    a.endedAt = ctx.now;
    ctx.audit({ action: "mentor.end", entityType: "membership", entityId: a.id, cohortId: a.cohortId, summary: `Ended ${db.users[a.mentorId]?.name}'s pairing with ${db.users[a.fellowId]?.name} (conversation kept, now read-only)` });
  });
}
