import type { AuditEvent, Database, ID } from "@/lib/domain/types";
import { adminCanManageCohort, canViewAuditEvent, isExec } from "@/lib/domain/permissions";

/** Human-readable labels for audit actions. Unknown actions fall back to a tidy version of the key. */
const ACTION_LABELS: Record<string, string> = {
  "application.start": "Started an application",
  "application.submit": "Submitted an application",
  "application.resubmit": "Resubmitted an application",
  "application.view": "Viewed an application",
  "application.approve": "Approved an application",
  "application.waitlist": "Waitlisted an application",
  "application.reject": "Declined an application",
  "application.request_changes": "Requested changes",
  "review.assign": "Assigned a reviewer",
  "review.unassign": "Removed a reviewer",
  "review.start": "Started a review",
  "review.submit": "Submitted a review",
  "document.view": "Opened a document",
  "document.upload": "Uploaded a document",
  "document.attach": "Attached a document",
  "document.remove": "Removed a document",
  "cohort.create": "Created a cohort",
  "cohort.update": "Updated cohort details",
  "membership.create": "Added a member",
  "membership.end": "Ended a role",
  "membership.track": "Changed a fellow's track",
  "mentor.assign": "Paired a mentor",
  "mentor.end": "Ended a mentor pairing",
  "mentor.reassign": "Reassigned a mentor",
  "form.create": "Created an application form",
  "form.publish": "Published an application form",
  "form.window": "Changed an application window",
  "session.create": "Created a session",
  "session.publish": "Published a session",
  "session.delete": "Deleted a draft session",
  "session.reorder": "Reordered sessions",
  "import.notion": "Ran the curriculum import",
  "submission.submit": "Submitted an assignment",
  "submission.approve": "Approved an assignment",
  "submission.request_changes": "Requested assignment changes",
  "conversation.start": "Started a conversation",
  "message.hide": "Hid a message",
  "message.restore": "Restored a message",
  "report.create": "Reported a message",
  "report.review": "Started a report review",
  "report.resolve": "Resolved a report",
  "announcement.send": "Sent an announcement",
  "export.applications": "Exported applications",
  "export.conversations": "Exported conversations",
  "export.audit": "Exported the audit log",
  "user.signup": "Created an account",
  "demo.window_scenario": "Changed a demo scenario",
};

export function actionLabel(action: string) {
  if (ACTION_LABELS[action]) return ACTION_LABELS[action];
  const [head, ...rest] = action.split(".");
  const tail = rest.join(" ").replace(/_/g, " ");
  const h = head.replace(/_/g, " ");
  return `${h.charAt(0).toUpperCase()}${h.slice(1)}${tail ? ` · ${tail}` : ""}`;
}

export const ACTION_GROUPS: { value: string; label: string; prefixes: string[] }[] = [
  { value: "applications", label: "Applications & reviews", prefixes: ["application.", "review."] },
  { value: "documents", label: "Documents", prefixes: ["document."] },
  { value: "people", label: "Cohorts & people", prefixes: ["cohort.", "membership.", "mentor.", "user."] },
  { value: "forms", label: "Application forms", prefixes: ["form."] },
  { value: "learning", label: "Curriculum & assignments", prefixes: ["session.", "module.", "import.", "submission."] },
  { value: "safeguarding", label: "Messaging & safeguarding", prefixes: ["conversation.", "message.", "report."] },
  { value: "announcements", label: "Announcements", prefixes: ["announcement."] },
  { value: "exports", label: "Exports", prefixes: ["export."] },
  { value: "demo", label: "Demo controls", prefixes: ["demo."] },
];

export function actionGroup(action: string) {
  return ACTION_GROUPS.find((g) => g.prefixes.some((p) => action.startsWith(p)))?.value ?? "other";
}

export const ENTITY_LABELS: Record<AuditEvent["entityType"], string> = {
  application: "Application",
  document: "Document",
  review: "Review",
  cohort: "Cohort",
  membership: "Membership",
  form: "Form",
  session: "Session",
  module: "Module",
  submission: "Submission",
  conversation: "Conversation",
  message: "Message",
  report: "Report",
  announcement: "Announcement",
  export: "Export",
  user: "Person",
  import: "Import",
  system: "System",
};

export function actorName(db: Database, actorId: ID) {
  if (actorId === "demo_control") return "Demo control";
  if (actorId === "anonymous") return "Website visitor";
  return db.users[actorId]?.name ?? "Former member";
}

/** Audit events the viewer may see (execs: all; program admins: events in their cohorts). */
export function visibleAuditEvents(db: Database, viewerId: ID | null | undefined) {
  return Object.values(db.audit)
    .filter((e) => canViewAuditEvent(db, viewerId, e.cohortId))
    .sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : a.id < b.id ? 1 : -1));
}

/** Narrow events to a set of cohorts. Cross-cohort events (no cohort) stay visible to execs when unfiltered. */
export function eventsForCohorts(db: Database, viewerId: ID | null | undefined, events: AuditEvent[], cohortIds: ID[], filter: "all" | ID) {
  const exec = isExec(db, viewerId);
  return events.filter((e) => (e.cohortId ? cohortIds.includes(e.cohortId) : exec && filter === "all"));
}

/**
 * Where an audit event should link to in the admin portal, or undefined when
 * the record no longer exists or sits outside the viewer's scope.
 */
export function auditEntityHref(db: Database, viewerId: ID | null | undefined, e: AuditEvent): string | undefined {
  const inScope = (cohortId?: ID) => (cohortId ? adminCanManageCohort(db, viewerId, cohortId) : isExec(db, viewerId));
  switch (e.entityType) {
    case "application": {
      const a = db.applications[e.entityId];
      return a && inScope(a.cohortId) ? `/admin/applications/${a.id}` : undefined;
    }
    case "review": {
      const r = db.reviews[e.entityId];
      const a = r ? db.applications[r.applicationId] : undefined;
      return a && inScope(a.cohortId) ? `/admin/applications/${a.id}` : undefined;
    }
    case "document": {
      const d = db.documents[e.entityId];
      const appId = d?.applicationId ?? (db.applications[e.entityId] ? e.entityId : undefined);
      const a = appId ? db.applications[appId] : undefined;
      return a && inScope(a.cohortId) ? `/admin/applications/${a.id}` : undefined;
    }
    case "cohort":
      return db.cohorts[e.entityId] && inScope(e.entityId) ? `/admin/cohorts/${e.entityId}` : undefined;
    case "membership": {
      const m = db.memberships[e.entityId];
      if (m && inScope(m.cohortId)) return m.role === "fellow" ? `/admin/people?u=${m.userId}` : `/admin/cohorts/${m.cohortId}`;
      const ma = db.mentorAssignments[e.entityId];
      if (ma && inScope(ma.cohortId)) return `/admin/people?u=${ma.fellowId}`;
      return e.cohortId && db.cohorts[e.cohortId] && inScope(e.cohortId) ? `/admin/cohorts/${e.cohortId}` : undefined;
    }
    case "form":
      return db.forms[e.entityId] && inScope(db.forms[e.entityId].cohortId) ? `/admin/forms/${e.entityId}` : undefined;
    case "session": {
      const s = db.sessions[e.entityId];
      return s ? `/admin/curriculum?m=${s.moduleId}` : undefined;
    }
    case "module":
      return db.modules[e.entityId] ? `/admin/curriculum?m=${e.entityId}` : undefined;
    case "import":
      return "/admin/curriculum";
    case "submission": {
      const s = db.submissions[e.entityId];
      return s && inScope(s.cohortId) ? `/admin/people?u=${s.fellowId}` : undefined;
    }
    case "conversation": {
      const c = db.conversations[e.entityId];
      return c && inScope(c.cohortId) ? `/admin/messages?c=${c.id}` : undefined;
    }
    case "message": {
      const m = db.messages[e.entityId];
      const c = m ? db.conversations[m.conversationId] : undefined;
      return c && inScope(c.cohortId) ? `/admin/messages?c=${c.id}` : undefined;
    }
    case "report": {
      const r = db.reports[e.entityId];
      return r && inScope(r.cohortId) ? `/admin/safeguarding?r=${r.id}` : undefined;
    }
    case "announcement":
      return db.announcements[e.entityId] ? `/admin/announcements?id=${e.entityId}` : undefined;
    case "user":
      return db.users[e.entityId] ? `/admin/people?u=${e.entityId}` : undefined;
    default:
      return undefined;
  }
}
