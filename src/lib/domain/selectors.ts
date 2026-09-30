import type {
  Application,
  ApplicationForm,
  ApplicationStatus,
  Cohort,
  ContentBlock,
  Conversation,
  Database,
  FormQuestion,
  ID,
  Message,
  Module,
  Review,
  Session,
  SessionContent,
  Submission,
  User,
} from "./types";
import {
  adminCohortIds,
  conversationAccess,
  fellowMembership,
  instructorScopes,
  isAssignedReviewer,
  mentorFellowIds,
} from "./permissions";
import { daysBetween } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* People                                                              */
/* ------------------------------------------------------------------ */

export function userName(db: Database, id?: ID | null) {
  if (!id) return "Unknown";
  return db.users[id]?.name ?? "Former member";
}

export function fellowsOfCohort(db: Database, cohortId: ID): User[] {
  return Object.values(db.memberships)
    .filter((m) => m.cohortId === cohortId && m.role === "fellow" && m.status === "active")
    .map((m) => db.users[m.userId])
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function staffOfCohort(db: Database, cohortId: ID) {
  return Object.values(db.memberships)
    .filter((m) => m.cohortId === cohortId && m.role !== "fellow" && m.status === "active")
    .map((m) => ({ membership: m, user: db.users[m.userId] }))
    .filter((x) => x.user);
}

export function trackOfFellow(db: Database, userId: ID) {
  const fm = fellowMembership(db, userId);
  return fm?.trackId ? db.tracks[fm.trackId] : undefined;
}

/* ------------------------------------------------------------------ */
/* Cohorts                                                             */
/* ------------------------------------------------------------------ */

export function cohortBySlugOrId(db: Database, key: string): Cohort | undefined {
  return db.cohorts[key] ?? Object.values(db.cohorts).find((c) => c.slug === key);
}

export function sortedCohorts(db: Database) {
  return Object.values(db.cohorts).sort((a, b) => (a.startDate < b.startDate ? -1 : 1));
}

/** 1-based program month (1..18) or null if not started / finished */
export function cohortMonth(cohort: Cohort, now: string) {
  if (now < cohort.startDate) return null;
  const months = Math.floor(daysBetween(cohort.startDate, now) / 30.44) + 1;
  return months > 18 ? null : months;
}

export function cohortPhaseLabel(cohort: Cohort, now: string) {
  if (now < cohort.startDate) return `Starts ${new Date(cohort.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}`;
  const m = cohortMonth(cohort, now);
  if (m === null) return "Completed";
  return `Month ${m} of 18`;
}

/* ------------------------------------------------------------------ */
/* Application forms and windows                                       */
/* ------------------------------------------------------------------ */

export type WindowState = "upcoming" | "open" | "closed" | "unpublished";

export function formForCohort(db: Database, cohortId: ID): ApplicationForm | undefined {
  return Object.values(db.forms).find((f) => f.cohortId === cohortId);
}

export function windowState(form: ApplicationForm | undefined, now: string): WindowState {
  if (!form || form.status !== "published" || !form.publishedVersionId) return "unpublished";
  if (now < form.opensAt) return "upcoming";
  if (now > form.closesAt) return "closed";
  return "open";
}

export function openForms(db: Database, now: string) {
  return Object.values(db.forms).filter((f) => windowState(f, now) === "open");
}

export function questionsForApplication(db: Database, app: Application): FormQuestion[] {
  return db.formVersions[app.formVersionId]?.questions ?? [];
}

export function visibleQuestions(questions: FormQuestion[], custom: Application["answers"]["custom"]) {
  return questions.filter((q) => !q.showIf || custom[q.showIf.questionId] === q.showIf.equals);
}

/* ------------------------------------------------------------------ */
/* Applications and review                                             */
/* ------------------------------------------------------------------ */

export const STATUS_LABEL: Record<ApplicationStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  in_review: "In review",
  changes_requested: "Changes requested",
  waitlisted: "Waitlisted",
  approved: "Approved",
  rejected: "Not successful",
};

export function applicationsOf(db: Database, userId: ID) {
  return Object.values(db.applications)
    .filter((a) => a.applicantId === userId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

/** Applications visible in the admin queue for this user (never drafts). */
export function applicationsInScope(db: Database, userId: ID | null | undefined) {
  const cohorts = adminCohortIds(db, userId);
  return Object.values(db.applications).filter(
    (a) => a.status !== "draft" && (cohorts.includes(a.cohortId) || isAssignedReviewer(db, userId, a.id)),
  );
}

export function reviewersOf(db: Database, applicationId: ID) {
  return Object.values(db.reviewerAssignments)
    .filter((r) => r.applicationId === applicationId)
    .map((r) => db.users[r.reviewerId])
    .filter(Boolean);
}

export function reviewsOf(db: Database, applicationId: ID): Review[] {
  return Object.values(db.reviews).filter((r) => r.applicationId === applicationId);
}

/** Weighted total on a 0–100 scale; null if any criterion is unscored. */
export function weightedScore(db: Database, review: Pick<Review, "scores">): number | null {
  let total = 0;
  for (const c of db.rubric) {
    const s = review.scores[c.id];
    if (s === undefined || s === null) return null;
    total += (s / 5) * c.weight;
  }
  return Math.round(total);
}

export function partialScore(db: Database, review: Pick<Review, "scores">) {
  const scored = db.rubric.filter((c) => review.scores[c.id] !== undefined);
  return { scored: scored.length, total: db.rubric.length };
}

export function averageScore(db: Database, applicationId: ID): number | null {
  const scores = reviewsOf(db, applicationId)
    .filter((r) => r.status === "submitted")
    .map((r) => weightedScore(db, r))
    .filter((s): s is number => s !== null);
  if (!scores.length) return null;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

/* ------------------------------------------------------------------ */
/* Learning                                                            */
/* ------------------------------------------------------------------ */

export function modulesOfTrack(db: Database, trackId: ID): Module[] {
  return Object.values(db.modules)
    .filter((m) => m.trackId === trackId)
    .sort((a, b) => a.order - b.order);
}

export function sessionsOfModule(db: Database, moduleId: ID): Session[] {
  const mod = db.modules[moduleId];
  if (!mod) return [];
  return mod.sessionIds.map((id) => db.sessions[id]).filter(Boolean);
}

/** Only published content is visible to fellows. */
export function publishedSessionsOfModule(db: Database, moduleId: ID) {
  return sessionsOfModule(db, moduleId).filter((s) => s.published);
}

export function taskBlockOf(content?: SessionContent) {
  return content?.blocks.find((b) => b.type === "task") as Extract<ContentBlock, { type: "task" }> | undefined;
}

export function submissionFor(db: Database, fellowId: ID, sessionId: ID): Submission | undefined {
  return Object.values(db.submissions).find((s) => s.fellowId === fellowId && s.sessionId === sessionId);
}

export function isSessionComplete(db: Database, userId: ID, sessionId: ID) {
  return Object.values(db.completions).some((c) => c.userId === userId && c.sessionId === sessionId);
}

export type SessionState = "complete" | "not_started" | "in_progress" | "awaiting_review" | "changes_requested";

export function sessionState(db: Database, userId: ID, session: Session): SessionState {
  if (isSessionComplete(db, userId, session.id)) return "complete";
  if (session.kind === "task") {
    const sub = submissionFor(db, userId, session.id);
    if (!sub) return "not_started";
    if (sub.status === "submitted") return "awaiting_review";
    if (sub.status === "changes_requested") return "changes_requested";
    if (sub.status === "draft") return "in_progress";
  }
  return "not_started";
}

export function moduleProgress(db: Database, userId: ID, moduleId: ID) {
  const sessions = publishedSessionsOfModule(db, moduleId);
  const done = sessions.filter((s) => isSessionComplete(db, userId, s.id)).length;
  return { done, total: sessions.length, pct: sessions.length ? Math.round((done / sessions.length) * 100) : 0 };
}

export function trackProgress(db: Database, userId: ID, trackId: ID) {
  let done = 0;
  let total = 0;
  for (const m of modulesOfTrack(db, trackId)) {
    const p = moduleProgress(db, userId, m.id);
    done += p.done;
    total += p.total;
  }
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}

/** The session "Continue learning" should open. */
export function nextSessionFor(db: Database, userId: ID): { module: Module; session: Session } | null {
  const track = trackOfFellow(db, userId);
  if (!track) return null;
  const mods = modulesOfTrack(db, track.id);
  // Prefer an in-progress or changes-requested task first
  for (const m of mods)
    for (const s of publishedSessionsOfModule(db, m.id)) {
      const st = sessionState(db, userId, s);
      if (st === "changes_requested" || st === "in_progress") return { module: m, session: s };
    }
  for (const m of mods)
    for (const s of publishedSessionsOfModule(db, m.id)) {
      const st = sessionState(db, userId, s);
      if (st === "not_started") return { module: m, session: s };
    }
  const last = mods[mods.length - 1];
  const lastS = last ? publishedSessionsOfModule(db, last.id).slice(-1)[0] : undefined;
  return last && lastS ? { module: last, session: lastS } : null;
}

export function cohortLearningProgress(db: Database, cohortId: ID) {
  const fellows = fellowsOfCohort(db, cohortId);
  if (!fellows.length) return { avgPct: 0, fellows: 0, completedSessions: 0 };
  let sum = 0;
  let completed = 0;
  for (const f of fellows) {
    const t = trackOfFellow(db, f.id);
    if (!t) continue;
    const p = trackProgress(db, f.id, t.id);
    sum += p.pct;
    completed += p.done;
  }
  return { avgPct: Math.round(sum / fellows.length), fellows: fellows.length, completedSessions: completed };
}

/** Submissions an instructor can review. */
export function submissionsForInstructor(db: Database, userId: ID) {
  const scopes = instructorScopes(db, userId);
  return Object.values(db.submissions).filter((sub) => {
    if (sub.status === "draft") return false;
    const s = db.sessions[sub.sessionId];
    const trackId = s ? db.modules[s.moduleId]?.trackId : undefined;
    return scopes.some((sc) => sc.cohortId === sub.cohortId && sc.trackId === trackId);
  });
}

/* ------------------------------------------------------------------ */
/* Messaging                                                           */
/* ------------------------------------------------------------------ */

export function messagesOf(db: Database, conversationId: ID): Message[] {
  return Object.values(db.messages)
    .filter((m) => m.conversationId === conversationId)
    .sort((a, b) => (a.sentAt < b.sentAt ? -1 : 1));
}

export function visibleConversations(db: Database, userId: ID | null | undefined, mode: "inbox" | "supervision" = "inbox"): Conversation[] {
  if (!userId) return [];
  return Object.values(db.conversations)
    .filter((c) => {
      const a = conversationAccess(db, userId, c);
      if (!a.view) return false;
      return mode === "inbox" ? a.mode === "participant" : true;
    })
    .sort((a, b) => (a.lastMessageAt < b.lastMessageAt ? 1 : -1));
}

export function unreadIn(db: Database, userId: ID, conversationId: ID) {
  return messagesOf(db, conversationId).filter((m) => m.senderId !== userId && !m.readBy[userId]).length;
}

export function totalUnread(db: Database, userId: ID | null | undefined) {
  if (!userId) return 0;
  return visibleConversations(db, userId, "inbox").reduce((n, c) => n + unreadIn(db, userId, c.id), 0);
}

export function conversationTitle(db: Database, conv: Conversation, viewerId: ID | null | undefined) {
  if (conv.title) return conv.title;
  const others = conv.participantIds.filter((p) => p !== viewerId);
  return others.map((p) => userName(db, p)).join(", ") || "Conversation";
}

/** People the viewer may start a conversation with (recipient picker). */
export function mentorFellowsOf(db: Database, mentorId: ID) {
  return mentorFellowIds(db, mentorId).map((id) => db.users[id]).filter(Boolean);
}

/* ------------------------------------------------------------------ */
/* Notifications                                                       */
/* ------------------------------------------------------------------ */

export function notificationsOf(db: Database, userId: ID | null | undefined) {
  if (!userId) return [];
  return Object.values(db.notifications)
    .filter((n) => n.userId === userId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

/* ------------------------------------------------------------------ */
/* KPIs                                                                */
/* ------------------------------------------------------------------ */

export function applicationStatusCounts(apps: Application[]) {
  const counts: Record<ApplicationStatus, number> = { draft: 0, submitted: 0, in_review: 0, changes_requested: 0, waitlisted: 0, approved: 0, rejected: 0 };
  for (const a of apps) counts[a.status]++;
  return counts;
}
