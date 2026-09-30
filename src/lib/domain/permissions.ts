import type { Application, Conversation, Database, DocumentRecord, ID, Membership, Submission, User } from "./types";

/**
 * Shared permission logic. Every listing, search, route guard and mutation
 * calls into these functions so the rules live in exactly one place.
 *
 * IMPORTANT: this is client-side demo logic. It demonstrates the intended
 * product behaviour; production must enforce the same rules on the server.
 */

export type Decision = { ok: true } | { ok: false; reason: string };
const allow: Decision = { ok: true };
const deny = (reason: string): Decision => ({ ok: false, reason });

/* ------------------------------------------------------------------ */
/* Role and scope helpers                                              */
/* ------------------------------------------------------------------ */

export function isExec(db: Database, userId?: ID | null) {
  return !!userId && !!db.users[userId]?.staffRoles.includes("executive_admin");
}
export function isProgramAdmin(db: Database, userId?: ID | null) {
  return !!userId && !!db.users[userId]?.staffRoles.includes("program_admin");
}
export function isAdmin(db: Database, userId?: ID | null) {
  return isExec(db, userId) || isProgramAdmin(db, userId);
}
export function isInstructor(db: Database, userId?: ID | null) {
  return !!userId && !!db.users[userId]?.staffRoles.includes("instructor");
}
export function isMentor(db: Database, userId?: ID | null) {
  return !!userId && !!db.users[userId]?.staffRoles.includes("mentor");
}
export function isStaff(db: Database, userId?: ID | null) {
  return !!userId && (db.users[userId]?.staffRoles.length ?? 0) > 0;
}

export function membershipsOf(db: Database, userId: ID, role?: Membership["role"]) {
  return Object.values(db.memberships).filter((m) => m.userId === userId && m.status === "active" && (!role || m.role === role));
}

/** A person's active fellow membership (latest cohort first). */
export function fellowMembership(db: Database, userId?: ID | null): Membership | undefined {
  if (!userId) return undefined;
  return membershipsOf(db, userId, "fellow").sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1))[0];
}
export function isFellow(db: Database, userId?: ID | null) {
  return !!fellowMembership(db, userId);
}

/** Cohorts an admin may manage. Executives: all cohorts. Program admins: assigned cohorts only. */
export function adminCohortIds(db: Database, userId?: ID | null): ID[] {
  if (!userId) return [];
  if (isExec(db, userId)) return Object.keys(db.cohorts);
  if (isProgramAdmin(db, userId)) return membershipsOf(db, userId, "program_admin").map((m) => m.cohortId);
  return [];
}
export function adminCanManageCohort(db: Database, userId: ID | null | undefined, cohortId: ID) {
  return adminCohortIds(db, userId).includes(cohortId);
}

export function instructorScopes(db: Database, userId?: ID | null) {
  if (!userId) return [];
  return membershipsOf(db, userId, "instructor").map((m) => ({ cohortId: m.cohortId, trackId: m.trackId! }));
}
export function instructorTrackIds(db: Database, userId?: ID | null): ID[] {
  return [...new Set(instructorScopes(db, userId).map((s) => s.trackId))];
}
export function instructorCohortIds(db: Database, userId?: ID | null): ID[] {
  return [...new Set(instructorScopes(db, userId).map((s) => s.cohortId))];
}

export function activeMentorAssignments(db: Database, mentorId: ID) {
  return Object.values(db.mentorAssignments).filter((a) => a.mentorId === mentorId && a.status === "active");
}
export function mentorFellowIds(db: Database, mentorId?: ID | null): ID[] {
  if (!mentorId) return [];
  return activeMentorAssignments(db, mentorId).map((a) => a.fellowId);
}
export function mentorsOfFellow(db: Database, fellowId: ID): ID[] {
  return Object.values(db.mentorAssignments)
    .filter((a) => a.fellowId === fellowId && a.status === "active")
    .map((a) => a.mentorId);
}
export function isAssignedMentor(db: Database, mentorId: ID, fellowId: ID) {
  return Object.values(db.mentorAssignments).some((a) => a.mentorId === mentorId && a.fellowId === fellowId && a.status === "active");
}

/** Applications only (no fellow membership, no staff role) — cannot use fellowship features. */
export function isApplicantOnly(db: Database, userId?: ID | null) {
  return !!userId && !isStaff(db, userId) && !isFellow(db, userId);
}

/* ------------------------------------------------------------------ */
/* Portal guards                                                       */
/* ------------------------------------------------------------------ */

export type Portal = "applicant" | "workspace" | "staff" | "admin";

export function canAccessPortal(db: Database, userId: ID | null | undefined, portal: Portal): Decision {
  if (!userId || !db.users[userId]) return deny("Choose a demo identity to continue.");
  switch (portal) {
    case "applicant":
      if (isStaff(db, userId)) return deny("The applicant portal is for people applying to the fellowship. Staff review applications from the admin portal.");
      return allow;
    case "workspace":
      if (isFellow(db, userId)) return allow;
      if (isStaff(db, userId)) return deny("The fellow workspace is only available to enrolled fellows.");
      return deny("The fellow workspace opens once an application is approved and you join a cohort.");
    case "staff":
      if (isInstructor(db, userId) || isMentor(db, userId)) return allow;
      return deny("The staff portal is for track instructors and mentors.");
    case "admin":
      if (isAdmin(db, userId)) return allow;
      return deny("Program administration is limited to program and executive admins.");
  }
}

/** Where a user lands after choosing their identity. */
export function homeFor(db: Database, userId: ID | null | undefined): string {
  if (!userId || !db.users[userId]) return "/demo";
  if (isAdmin(db, userId)) return "/admin/dashboard";
  if (isInstructor(db, userId) || isMentor(db, userId)) return "/staff/dashboard";
  if (isFellow(db, userId)) return "/workspace/dashboard";
  return "/applicant/dashboard";
}

/* ------------------------------------------------------------------ */
/* Applications and documents                                          */
/* ------------------------------------------------------------------ */

export function isAssignedReviewer(db: Database, userId: ID | null | undefined, applicationId: ID) {
  if (!userId) return false;
  return Object.values(db.reviewerAssignments).some((r) => r.applicationId === applicationId && r.reviewerId === userId);
}

export function canViewApplication(db: Database, userId: ID | null | undefined, app: Application): Decision {
  if (!userId) return deny("Sign in to view applications.");
  if (app.applicantId === userId) return allow;
  if (app.status === "draft") return deny("Draft applications are private to the applicant until they are submitted.");
  if (isAssignedReviewer(db, userId, app.id)) return allow;
  if (adminCanManageCohort(db, userId, app.cohortId)) return allow;
  return deny("This application belongs to a cohort outside your assigned scope.");
}

/**
 * Residence documents are restricted to the applicant and explicitly
 * assigned reviewers. An executive title does NOT unlock them.
 */
export function canOpenDocument(db: Database, userId: ID | null | undefined, doc: DocumentRecord): Decision {
  if (!userId) return deny("Sign in to open documents.");
  if (doc.removedAt) return deny("This file was removed by its owner.");
  if (doc.ownerId === userId) return allow;
  if (doc.kind === "proof_of_residence" || doc.kind === "application_attachment") {
    if (doc.applicationId && isAssignedReviewer(db, userId, doc.applicationId)) return allow;
    return deny("Residence documents are restricted to the applicant and reviewers explicitly assigned to this application. Your role can see that a document exists, but not its contents.");
  }
  if (doc.kind === "submission_attachment") {
    const sub = Object.values(db.submissions).find((s) => s.versions.some((v) => v.attachmentIds.includes(doc.id)) || s.draftAttachmentIds.includes(doc.id));
    if (sub && canReviewSubmission(db, userId, sub).ok) return allow;
    if (sub && adminCanManageCohort(db, userId, sub.cohortId)) return allow;
    return deny("Only the fellow and their track instructor can open this file.");
  }
  return deny("You don't have access to this file.");
}

export function canReviewApplication(db: Database, userId: ID | null | undefined, app: Application): Decision {
  if (!userId) return deny("Sign in to review.");
  if (!isAssignedReviewer(db, userId, app.id)) return deny("Only reviewers assigned to this application can record scores.");
  if (!["submitted", "in_review"].includes(app.status)) return deny("Scoring is closed for applications that already have a decision or are waiting on changes.");
  return allow;
}

export function canDecideApplication(db: Database, userId: ID | null | undefined, app: Application): Decision {
  if (!userId) return deny("Sign in to decide.");
  if (!adminCanManageCohort(db, userId, app.cohortId))
    return deny("Final decisions are made by program admins for this cohort or by executive admins.");
  if (!["submitted", "in_review", "waitlisted"].includes(app.status))
    return deny(app.status === "changes_requested" ? "Waiting for the applicant to resubmit." : "This application already has a final decision.");
  return allow;
}

export function canAssignReviewers(db: Database, userId: ID | null | undefined, app: Application): Decision {
  if (!adminCanManageCohort(db, userId, app.cohortId)) return deny("Only admins for this cohort can assign reviewers.");
  if (app.status === "draft") return deny("Reviewers can be assigned after submission.");
  return allow;
}

export function canEditOwnApplication(db: Database, userId: ID | null | undefined, app: Application): Decision {
  if (app.applicantId !== userId) return deny("Only the applicant can edit this application.");
  if (app.status === "draft" || app.status === "changes_requested") return allow;
  return deny("Submitted answers are locked unless a reviewer requests changes.");
}

export function canManageForms(db: Database, userId: ID | null | undefined, cohortId: ID): Decision {
  if (adminCanManageCohort(db, userId, cohortId)) return allow;
  return deny("Only admins for this cohort can edit its application form.");
}

export function canManageCohort(db: Database, userId: ID | null | undefined, cohortId: ID): Decision {
  if (adminCanManageCohort(db, userId, cohortId)) return allow;
  return deny("This cohort is outside your assigned scope.");
}

export function canCreateCohort(db: Database, userId: ID | null | undefined): Decision {
  if (isExec(db, userId)) return allow;
  return deny("Only executive admins can create new cohorts.");
}

/* ------------------------------------------------------------------ */
/* Learning                                                            */
/* ------------------------------------------------------------------ */

export function canEditTrack(db: Database, userId: ID | null | undefined, trackId: ID): Decision {
  if (instructorTrackIds(db, userId).includes(trackId)) return allow;
  const track = db.tracks[trackId];
  return deny(`Only instructors assigned to ${track?.name ?? "this track"} can edit its sessions.`);
}

export function trackOfSubmission(db: Database, sub: Submission) {
  const session = db.sessions[sub.sessionId];
  return session ? db.modules[session.moduleId]?.trackId : undefined;
}

export function canReviewSubmission(db: Database, userId: ID | null | undefined, sub: Submission): Decision {
  const trackId = trackOfSubmission(db, sub);
  if (instructorScopes(db, userId).some((s) => s.cohortId === sub.cohortId && s.trackId === trackId)) return allow;
  return deny("Submissions are reviewed by the instructor assigned to this track and cohort.");
}

export function canViewModule(db: Database, userId: ID | null | undefined, moduleId: ID): Decision {
  const mod = db.modules[moduleId];
  if (!mod) return deny("Module not found.");
  const fm = fellowMembership(db, userId);
  if (fm) return fm.trackId === mod.trackId ? allow : deny("This module belongs to a different track than yours.");
  if (instructorTrackIds(db, userId).includes(mod.trackId) || isAdmin(db, userId)) return allow;
  return deny("Learning content is available to enrolled fellows and staff.");
}

export function canRunImport(db: Database, userId: ID | null | undefined): Decision {
  return isAdmin(db, userId) ? allow : deny("Only program or executive admins can run the curriculum migration.");
}

/* ------------------------------------------------------------------ */
/* Messaging                                                           */
/* ------------------------------------------------------------------ */

/** Can `senderId` start or continue a one-to-one conversation with `recipientId`? */
export function canMessage(db: Database, senderId: ID | null | undefined, recipientId: ID): Decision & { cohortId?: ID } {
  if (!senderId || !db.users[senderId]) return deny("Sign in to send messages.");
  const recipient = db.users[recipientId];
  if (!recipient) return deny("That person doesn't exist.");
  if (senderId === recipientId) return deny("You can't message yourself.");

  const senderFellow = fellowMembership(db, senderId);
  const recipFellow = fellowMembership(db, recipientId);

  // Executive admins may message anyone with a fellowship role.
  if (isExec(db, senderId)) {
    if (recipFellow) return { ok: true, cohortId: recipFellow.cohortId };
    if (isStaff(db, recipientId)) return { ok: true, cohortId: membershipsOf(db, recipientId)[0]?.cohortId ?? "c_summer26" };
    return deny("Applicants can't be messaged before they join a cohort.");
  }

  // Program admins: fellows and staff in their cohorts.
  if (isProgramAdmin(db, senderId)) {
    const scope = adminCohortIds(db, senderId);
    if (recipFellow && scope.includes(recipFellow.cohortId)) return { ok: true, cohortId: recipFellow.cohortId };
    const shared = membershipsOf(db, recipientId).find((m) => scope.includes(m.cohortId));
    if (shared && isStaff(db, recipientId)) return { ok: true, cohortId: shared.cohortId };
    return deny("Program admins can message fellows and staff within their assigned cohorts.");
  }

  if (isMentor(db, senderId) && !isInstructor(db, senderId)) {
    if (recipFellow && isAssignedMentor(db, senderId, recipientId)) return { ok: true, cohortId: recipFellow.cohortId };
    return deny("Mentors can only message fellows assigned to them.");
  }

  if (isInstructor(db, senderId)) {
    const cohorts = instructorCohortIds(db, senderId);
    if (recipFellow && cohorts.includes(recipFellow.cohortId)) return { ok: true, cohortId: recipFellow.cohortId };
    return deny("Instructors can message fellows in the cohorts they teach.");
  }

  if (senderFellow) {
    const c = senderFellow.cohortId;
    if (recipFellow) {
      if (recipFellow.cohortId === c) return { ok: true, cohortId: c };
      return deny("Fellows can only message people in their own cohort.");
    }
    if (isInstructor(db, recipientId) && instructorCohortIds(db, recipientId).includes(c)) return { ok: true, cohortId: c };
    if (isMentor(db, recipientId)) {
      if (isAssignedMentor(db, recipientId, senderId)) return { ok: true, cohortId: c };
      return deny("You can message mentors who are assigned to you.");
    }
    if (isProgramAdmin(db, recipientId) && adminCohortIds(db, recipientId).includes(c)) return { ok: true, cohortId: c };
    if (isExec(db, recipientId)) return deny("Contact your program manager, who can bring in the executive team.");
    return deny("Messaging is limited to your cohort.");
  }

  return deny("Messaging opens once you join a cohort as a fellow.");
}

export interface ConversationAccess {
  view: boolean;
  send: boolean;
  mode: "participant" | "supervisor" | "none";
  reason?: string;
  readOnlyReason?: string;
}

export function conversationAccess(db: Database, userId: ID | null | undefined, conv: Conversation): ConversationAccess {
  if (!userId) return { view: false, send: false, mode: "none", reason: "Sign in to view messages." };
  const isParticipant = conv.participantIds.includes(userId);
  const supervises = adminCanManageCohort(db, userId, conv.cohortId);

  if (isParticipant) {
    // Re-evaluate the relationship: history stays visible, sending follows current rules.
    let sendDecision: Decision = allow;
    if (conv.kind === "group") {
      const stillMember =
        membershipsOf(db, userId).some((m) => m.cohortId === conv.cohortId) || supervises;
      sendDecision = stillMember ? allow : deny("You are no longer part of this cohort.");
    } else {
      for (const other of conv.participantIds.filter((p) => p !== userId)) {
        const d = canMessage(db, userId, other);
        if (!d.ok) {
          sendDecision = d;
          break;
        }
      }
    }
    return {
      view: true,
      send: sendDecision.ok,
      mode: "participant",
      readOnlyReason: sendDecision.ok ? undefined : `This conversation is now read-only because the relationship changed. ${(sendDecision as { reason: string }).reason} Earlier messages stay visible.`,
    };
  }
  if (supervises) {
    return { view: true, send: false, mode: "supervisor", readOnlyReason: "You are viewing this conversation as a supervisor. Participants can see that program staff review conversations." };
  }
  if (isApplicantOnly(db, userId)) return { view: false, send: false, mode: "none", reason: "Messaging opens once you join a cohort." };
  return { view: false, send: false, mode: "none", reason: "You aren't a participant in this conversation and it's outside your supervision scope." };
}

/* ------------------------------------------------------------------ */
/* Moderation, announcements, exports, audit                           */
/* ------------------------------------------------------------------ */

export function canModerate(db: Database, userId: ID | null | undefined, cohortId: ID): Decision {
  if (adminCanManageCohort(db, userId, cohortId)) return allow;
  return deny("Moderation is limited to admins for this cohort.");
}

export function canAnnounce(db: Database, userId: ID | null | undefined, scope: "all" | ID): Decision {
  if (scope === "all") return isExec(db, userId) ? allow : deny("Only executive admins can send announcements to every cohort.");
  if (adminCanManageCohort(db, userId, scope)) return allow;
  return deny("You can only announce to cohorts you manage.");
}

export function canViewAuditEvent(db: Database, userId: ID | null | undefined, cohortId?: ID) {
  if (isExec(db, userId)) return true;
  if (!cohortId) return false;
  return adminCanManageCohort(db, userId, cohortId);
}

/** Who can see a person in a directory, and which fields. */
export function directoryVisibleUserIds(db: Database, viewerId: ID | null | undefined): ID[] {
  if (!viewerId) return [];
  const fm = fellowMembership(db, viewerId);
  const fellowIdsIn = (cohortIds: ID[]) =>
    Object.values(db.memberships)
      .filter((m) => m.role === "fellow" && m.status === "active" && cohortIds.includes(m.cohortId))
      .map((m) => m.userId);
  if (isAdmin(db, viewerId)) return fellowIdsIn(adminCohortIds(db, viewerId));
  if (isInstructor(db, viewerId)) return fellowIdsIn(instructorCohortIds(db, viewerId));
  if (isMentor(db, viewerId)) return mentorFellowIds(db, viewerId);
  if (fm) return fellowIdsIn([fm.cohortId]);
  return [];
}

export function roleLabel(db: Database, user: User): string {
  if (user.staffRoles.includes("executive_admin")) return "Executive admin";
  if (user.staffRoles.includes("program_admin")) return "Program admin";
  if (user.staffRoles.includes("instructor")) return "Track instructor";
  if (user.staffRoles.includes("mentor")) return "Mentor";
  const fm = fellowMembership(db, user.id);
  if (fm) return `Fellow · ${db.cohorts[fm.cohortId]?.name ?? ""}`.trim();
  return "Applicant";
}
