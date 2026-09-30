import type { Application, Database, ID, Membership, User } from "@/lib/domain/types";
import { adminCohortIds, fellowMembership, isAssignedReviewer, isExec, mentorsOfFellow } from "@/lib/domain/permissions";

export type PersonRole = "fellow" | "applicant" | "executive_admin" | "program_admin" | "instructor" | "mentor";

export const PERSON_ROLE_LABEL: Record<PersonRole, string> = {
  fellow: "Fellow",
  applicant: "Applicant",
  executive_admin: "Executive admin",
  program_admin: "Program admin",
  instructor: "Instructor",
  mentor: "Mentor",
};

export interface PersonRow {
  user: User;
  roles: PersonRole[];
  /** in-scope cohorts this person is connected to */
  cohortIds: ID[];
  fellow?: Membership;
  mentorId?: ID;
  /** non-draft applications the viewer may see */
  apps: Application[];
}

/**
 * Everyone an admin may look up: fellows and staff in their cohorts, and
 * applicants who submitted to those cohorts. Executives also see staff
 * without a cohort assignment (e.g. other executives).
 */
export function peopleInScope(db: Database, viewerId: ID): PersonRow[] {
  const scope = adminCohortIds(db, viewerId);
  const exec = isExec(db, viewerId);
  const rows = new Map<ID, PersonRow>();
  const get = (userId: ID) => {
    const user = db.users[userId];
    if (!user) return undefined;
    let r = rows.get(userId);
    if (!r) {
      r = { user, roles: [], cohortIds: [], apps: [] };
      rows.set(userId, r);
    }
    return r;
  };
  const addRole = (r: PersonRow, role: PersonRole) => !r.roles.includes(role) && r.roles.push(role);
  const addCohort = (r: PersonRow, id: ID) => !r.cohortIds.includes(id) && r.cohortIds.push(id);

  for (const m of Object.values(db.memberships)) {
    if (m.status !== "active" || !scope.includes(m.cohortId)) continue;
    const r = get(m.userId);
    if (!r) continue;
    addCohort(r, m.cohortId);
    if (m.role === "fellow") addRole(r, "fellow");
  }
  for (const a of Object.values(db.applications)) {
    if (a.status === "draft") continue;
    if (!scope.includes(a.cohortId) && !isAssignedReviewer(db, viewerId, a.id)) continue;
    const r = get(a.applicantId);
    if (!r) continue;
    addRole(r, "applicant");
    if (scope.includes(a.cohortId)) addCohort(r, a.cohortId);
    r.apps.push(a);
  }
  for (const u of Object.values(db.users)) {
    if (!u.staffRoles.length) continue;
    const inScope = rows.has(u.id) || exec || u.id === viewerId;
    if (!inScope) continue;
    const r = get(u.id)!;
    for (const role of u.staffRoles) addRole(r, role);
  }
  for (const r of rows.values()) {
    const fm = fellowMembership(db, r.user.id);
    if (fm && scope.includes(fm.cohortId)) {
      r.fellow = fm;
      r.mentorId = mentorsOfFellow(db, r.user.id)[0];
    }
    r.apps.sort((a, b) => ((a.submittedAt ?? "") < (b.submittedAt ?? "") ? 1 : -1));
    const order: PersonRole[] = ["executive_admin", "program_admin", "instructor", "mentor", "fellow", "applicant"];
    r.roles.sort((a, b) => order.indexOf(a) - order.indexOf(b));
  }
  return [...rows.values()].sort((a, b) => a.user.name.localeCompare(b.user.name));
}

/** The mentor conversation between a mentor and a fellow, if one exists. */
export function mentorConversationId(db: Database, mentorId: ID, fellowId: ID) {
  return Object.values(db.conversations).find((c) => c.kind === "mentor" && c.participantIds.includes(mentorId) && c.participantIds.includes(fellowId))?.id;
}
