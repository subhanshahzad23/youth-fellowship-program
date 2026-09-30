import type { Announcement, AppNotification, AuditEvent, Database, Membership, OutboxEmail } from "@/lib/domain/types";
import { ago } from "@/lib/clock";
import { APPLICATION_REF_START, buildApplications, FORMS, FORM_VERSIONS, RUBRIC } from "./applications";
import { buildLearning } from "./learning";
import { buildMessaging } from "./messaging";
import { buildMemberships, buildMentorAssignments, COHORTS, TRACKS, USERS } from "./people";

export const SEED_VERSION = 8;

const byId = <T extends { id: string }>(items: T[]) => Object.fromEntries(items.map((i) => [i.id, i])) as Record<string, T>;

export function createSeedDatabase(): Database {
  const users = structuredClone(USERS);
  const memberships: Membership[] = buildMemberships();
  const apps = buildApplications();
  const learning = buildLearning();
  const messaging = buildMessaging();

  // Link Noah's fellow membership to his original application.
  const noahM = memberships.find((m) => m.userId === "u_noah" && m.role === "fellow");
  if (noahM) noahM.sourceApplicationId = "a_noah_s26";

  // Approved Winter 2027 applicants already hold fellow membership (same identity).
  for (const a of apps.approvedSeeds) {
    if (memberships.some((m) => m.userId === a.applicantId && m.role === "fellow")) continue;
    memberships.push({
      id: `m_app_${a.applicationId}`,
      userId: a.applicantId,
      cohortId: a.cohortId,
      role: "fellow",
      trackId: a.trackId,
      status: "active",
      startedAt: a.decidedAt,
      sourceApplicationId: a.applicationId,
    });
    const u = users.find((x) => x.id === a.applicantId);
    const app = apps.applications.find((x) => x.id === a.applicationId);
    if (u && app) {
      u.ventureName = app.answers.idea.ventureName;
      u.ventureSummary = app.answers.idea.problem;
      u.ventureStage = (app.answers.idea.stage as never) ?? "Idea";
    }
  }

  /* -------------------------- Announcements ------------------------- */
  const fellowsIn = (cohortIds: string[]) => memberships.filter((m) => m.role === "fellow" && m.status === "active" && cohortIds.includes(m.cohortId)).map((m) => m.userId);
  const staffIn = (cohortIds: string[]) => [...new Set(memberships.filter((m) => m.role !== "fellow" && cohortIds.includes(m.cohortId)).map((m) => m.userId))];
  const activeCohorts = ["c_spring26", "c_summer26"];

  const announcements: Announcement[] = [
    {
      id: "an_showcase",
      senderId: "u_priya",
      scope: "all",
      audience: "fellows_and_staff",
      title: "Showcase season: save the dates",
      body:
        "The Spring 2026 showcase is on November 21 and the Summer 2026 showcase is on December 10, both at Larkhaven Makers Hall.\n\nEach fellow gets two minutes to share what they've learned so far — not a polished pitch, just an honest update. Friends and family are welcome. Your program manager will share the running order two weeks before.",
      status: "delivered",
      recipientIds: [...fellowsIn(activeCohorts), ...staffIn(activeCohorts)].filter((id) => id !== "u_priya"),
      createdAt: ago(12, 3),
      sentAt: ago(12, 2),
      deliveredAt: ago(12, 2),
    },
    {
      id: "an_officehours",
      senderId: "u_amira",
      scope: "c_summer26",
      audience: "fellows",
      title: "Office hours move to Thursdays",
      body:
        "From this week, instructor office hours for Summer 2026 run Thursdays 5–6pm at Eastbank Community Studio and online.\n\nBring one real artifact — an interview transcript, a price test, a draft — so we can work on something concrete together.",
      status: "delivered",
      recipientIds: fellowsIn(["c_summer26"]),
      createdAt: ago(5, 4),
      sentAt: ago(5, 3),
      deliveredAt: ago(5, 3),
    },
    {
      id: "an_launchplan",
      senderId: "u_marcus",
      scope: "c_spring26",
      audience: "fellows",
      title: "Launch planning workshop — November 7",
      body:
        "Spring 2026 fellows: our launch planning workshop is Saturday, November 7, 10am–1pm at Makers Hall.\n\nPlease complete the launch checklist worksheet beforehand. Lunch is provided; let us know about dietary needs.",
      status: "delivered",
      recipientIds: fellowsIn(["c_spring26"]),
      createdAt: ago(3, 5),
      sentAt: ago(3, 4),
      deliveredAt: ago(3, 4),
    },
    {
      id: "an_winter_welcome",
      senderId: "u_amira",
      scope: "c_winter27",
      audience: "fellows",
      title: "Welcome to Winter 2027",
      body: "Welcome! Your kickoff weekend is January 9–10, 2027. Over the next few weeks we'll share pre-work and introduce your mentors.",
      status: "draft",
      recipientIds: [],
      createdAt: ago(1, 2),
    },
  ];

  /* -------------------------- Notifications ------------------------- */
  const notifications: AppNotification[] = [];
  let nn = 0;
  const notify = (n: Omit<AppNotification, "id">) => notifications.push({ id: `n_${String(++nn).padStart(3, "0")}`, ...n });
  const isStaffUser = (id: string) => (users.find((u) => u.id === id)?.staffRoles.length ?? 0) > 0;
  const isAdminUser = (id: string) => !!users.find((u) => u.id === id)?.staffRoles.some((r) => r === "executive_admin" || r === "program_admin");

  for (const an of announcements.filter((a) => a.status === "delivered")) {
    for (const rid of an.recipientIds) {
      notify({
        userId: rid,
        kind: "announcement",
        title: an.title,
        body: an.body.split("\n")[0].slice(0, 140),
        // Program/executive admins can't open /staff — send them to the admin view (matches processSendingAnnouncements).
        href: `${isAdminUser(rid) ? "/admin" : isStaffUser(rid) ? "/staff" : "/workspace"}/announcements?id=${an.id}`,
        createdAt: an.deliveredAt!,
        readAt: rid === "u_noah" && an.id === "an_officehours" ? undefined : rid === "u_noah" ? ago(4) : ago(2),
      });
    }
  }
  const pendingSub = (fellowId: string) => learning.submissions.find((x) => x.fellowId === fellowId && x.status === "submitted")?.id ?? "";
  const direct: Omit<AppNotification, "id">[] = [
    { userId: "u_noah", kind: "message", title: "New message from Daniel Brooks", body: "Also: Elena mentioned your interview notes are due Friday…", href: "/workspace/messages?c=cv_daniel_noah", createdAt: ago(0, 18) },
    { userId: "u_noah", kind: "feedback", title: "Elena Ruiz reviewed your assignment", body: "Great work, Noah. The line about renters not owning tools is the sharpest part…", href: "/workspace/assignments", createdAt: ago(16, 3), readAt: ago(16) },
    { userId: "u_noah", kind: "assignment", title: "Customer interview notes due Friday", body: "Run five customer interviews — draft saved.", href: "/workspace/assignments", createdAt: ago(1, 2) },
    { userId: "u_maya", kind: "application", title: "Your Winter 2027 draft is saved", body: "Applications close November 15. Pick up where you left off: Residence.", href: "/applicant/applications/a_maya_w27", createdAt: ago(1, 1) },
    { userId: "u_maya", kind: "system", title: "Spring 2027 early applications are open", body: "A second intake is open until December 18 — you can apply to both.", href: "/cohorts/spring-2027", createdAt: ago(10), readAt: ago(9) },
    { userId: "u_fatima", kind: "application", title: "Changes requested on your application", body: "Amira asked for an updated proof of residence and more detail about your customers.", href: "/applicant/applications/a_fatima_w27", createdAt: ago(12) },
    { userId: "u_amira", kind: "application", title: "New application: Arjun Kapoor", body: "Winter 2027 · Venture Building · needs a reviewer", href: "/admin/applications/a_arjun_w27", createdAt: ago(0, 14) },
    { userId: "u_amira", kind: "review", title: "Jonah Reyes was assigned to you", body: "Winter 2027 · submitted yesterday", href: "/admin/applications/a_jonah_w27", createdAt: ago(1) },
    { userId: "u_amira", kind: "moderation", title: "A message was reported in Summer 2026", body: "Ryan O'Neil reported a message for harassment or insults.", href: "/admin/safeguarding?r=rp_jamal_ryan", createdAt: ago(1, 21) },
    { userId: "u_priya", kind: "moderation", title: "A message was reported in Summer 2026", body: "Open report awaiting review by the Summer 2026 program manager.", href: "/admin/safeguarding?r=rp_jamal_ryan", createdAt: ago(1, 21) },
    { userId: "u_priya", kind: "review", title: "Sara Lindqvist has one submitted review", body: "Jordan Okafor recommended approval. Amira's review is still in draft.", href: "/admin/applications/a_sara_w27", createdAt: ago(4), readAt: ago(3) },
    { userId: "u_elena", kind: "assignment", title: "Aisha Bello submitted an assignment", body: "Run five customer interviews · Summer 2026", href: `/staff/submissions?s=${pendingSub("u_aisha")}`, createdAt: ago(1, 6) },
    { userId: "u_elena", kind: "assignment", title: "Lily Novak submitted an assignment", body: "Summer 2026 · waiting for your review", href: `/staff/submissions?s=${pendingSub("u_lily")}`, createdAt: ago(2, 2) },
    { userId: "u_daniel", kind: "message", title: "New message from Diego Morales", body: "She said she'd consider a discount for Fresh Frames customers…", href: "/staff/messages?c=cv_daniel_diego", createdAt: ago(0, 3) },
    { userId: "u_marcus", kind: "application", title: "Yusuf Demir was assigned to you", body: "Spring 2027 · submitted 3 days ago", href: "/admin/applications/a_yusuf_s27", createdAt: ago(3) },
  ];
  direct.forEach(notify);

  /* ----------------------------- Outbox ----------------------------- */
  const outbox: OutboxEmail[] = [];
  let on = 0;
  const email = (e: Omit<OutboxEmail, "id" | "status">) => outbox.push({ id: `em_${String(++on).padStart(3, "0")}`, status: "simulated", ...e });
  const u = (id: string) => users.find((x) => x.id === id)!;

  for (const an of announcements.filter((a) => a.status === "delivered")) {
    for (const rid of an.recipientIds) {
      if (!u(rid).notificationPrefs.emailAnnouncements) continue;
      email({
        toUserId: rid,
        toEmail: u(rid).email,
        toName: u(rid).name,
        subject: an.title,
        preview: an.body.split("\n")[0].slice(0, 120),
        bodyText: `Hi ${u(rid).firstName},\n\n${an.body}\n\n— ${u(an.senderId).name}, Launchpad Fellowship`,
        kind: "announcement",
        announcementId: an.id,
        relatedHref: `/workspace/announcements?id=${an.id}`,
        createdAt: an.deliveredAt!,
      });
    }
  }
  for (const a of apps.approvedSeeds) {
    const app = apps.applications.find((x) => x.id === a.applicationId)!;
    const person = u(a.applicantId);
    if (a.cohortId !== "c_winter27") continue;
    email({
      toUserId: person.id,
      toEmail: person.email,
      toName: person.name,
      subject: "Welcome to Launchpad Fellowship — Winter 2027",
      preview: `You're in, ${person.firstName}. Your fellow workspace is ready.`,
      bodyText: `Hi ${person.firstName},\n\nCongratulations — your application ${app.reference} has been approved and you're now a Winter 2027 fellow.\n\nYour fellow workspace is ready: you can meet your cohort, start the orientation modules and message your program team. Kickoff weekend is January 9–10, 2027.\n\nSee you soon,\nAmira Hassan\nProgram Manager`,
      kind: "welcome",
      relatedHref: "/workspace/dashboard",
      createdAt: a.decidedAt,
    });
  }
  email({
    toUserId: "u_ravi",
    toEmail: u("u_ravi").email,
    toName: "Ravi Menon",
    subject: "Your Winter 2027 application: waitlist",
    preview: "You're on the waitlist — first in line if a place opens.",
    bodyText: "Hi Ravi,\n\nThank you for applying. We've placed you on the Winter 2027 waitlist. If a place opens before January 4 we'll contact you straight away.\n\nAmira Hassan",
    kind: "decision",
    relatedHref: "/applicant/applications/a_ravi_w27",
    createdAt: ago(19),
  });
  email({
    toUserId: "u_fatima",
    toEmail: u("u_fatima").email,
    toName: "Fatima Noor",
    subject: "Action needed: update your Winter 2027 application",
    preview: "Two small changes and we can finish your review.",
    bodyText: "Hi Fatima,\n\nWe'd like a couple of changes before we can finish reviewing your application:\n\n• Proof of residence — the uploaded bill is cropped so the address isn't visible.\n• Your customer — tell us more specifically who your first customers would be.\n\nYou can update just these parts and resubmit from your applicant dashboard.\n\nAmira Hassan",
    kind: "changes_requested",
    relatedHref: "/applicant/applications/a_fatima_w27",
    createdAt: ago(12),
  });
  email({
    toUserId: "u_noah",
    toEmail: u("u_noah").email,
    toName: "Noah Williams",
    subject: "You have 3 unread conversations",
    preview: "Daniel Brooks, Foundations circle and Amira Hassan are waiting on you.",
    bodyText: "Hi Noah,\n\nHere's your daily digest of unread messages:\n\n• Daniel Brooks (mentor) — 2 new messages\n• Foundations circle · Summer 2026 — 1 new message\n\nOpen your inbox: /workspace/messages\n\nYou're receiving this because your digest is set to daily. Change it in notification settings.",
    kind: "digest",
    relatedHref: "/workspace/messages",
    createdAt: ago(0, 2),
  });

  /* ------------------------------ Audit ----------------------------- */
  const audit: AuditEvent[] = [];
  let na = 0;
  const log = (e: Omit<AuditEvent, "id" | "outcome"> & { outcome?: AuditEvent["outcome"] }) =>
    audit.push({ id: `au_${String(++na).padStart(3, "0")}`, outcome: "success", ...e });

  log({ at: ago(70), actorId: "u_priya", action: "cohort.create", entityType: "cohort", entityId: "c_winter27", cohortId: "c_winter27", summary: "Created cohort Winter 2027" });
  log({ at: ago(46), actorId: "u_amira", action: "form.publish", entityType: "form", entityId: "f_winter27", cohortId: "c_winter27", summary: "Published Winter 2027 application form (version 1)" });
  log({ at: ago(11), actorId: "u_marcus", action: "form.publish", entityType: "form", entityId: "f_spring27", cohortId: "c_spring27", summary: "Published Spring 2027 early application form (version 1)" });
  log({ at: ago(12), actorId: "u_priya", action: "form.publish", entityType: "form", entityId: "f_summer27", cohortId: "c_summer27", summary: "Published Summer 2027 application form (opens Feb 1, 2027)" });
  for (const app of apps.applications.filter((a) => a.submittedAt)) {
    log({ at: app.submittedAt!, actorId: app.applicantId, action: "application.submit", entityType: "application", entityId: app.id, cohortId: app.cohortId, summary: `Submitted application ${app.reference}` });
  }
  for (const ra of apps.reviewerAssignments) {
    const app = apps.applications.find((a) => a.id === ra.applicationId)!;
    log({ at: ra.assignedAt, actorId: ra.assignedById, action: "review.assign", entityType: "application", entityId: app.id, cohortId: app.cohortId, summary: `Assigned ${u(ra.reviewerId).name} to review ${app.reference}` });
  }
  for (const rv of apps.reviews.filter((r) => r.status === "submitted")) {
    const app = apps.applications.find((a) => a.id === rv.applicationId)!;
    log({ at: rv.submittedAt!, actorId: rv.reviewerId, action: "review.submit", entityType: "review", entityId: rv.id, cohortId: app.cohortId, summary: `Submitted review for ${app.reference} (${rv.recommendation})` });
    log({ at: new Date(Date.parse(rv.submittedAt!) - 3600000).toISOString(), actorId: rv.reviewerId, action: "document.view", entityType: "document", entityId: app.answers.residence.proofDocumentId ?? app.id, cohortId: app.cohortId, summary: `Viewed proof of residence for ${app.reference}` });
  }
  for (const app of apps.applications.filter((a) => a.decision)) {
    log({ at: app.decision!.decidedAt, actorId: app.decision!.decidedById, action: `application.${app.decision!.outcome === "approved" ? "approve" : app.decision!.outcome === "waitlisted" ? "waitlist" : "reject"}`, entityType: "application", entityId: app.id, cohortId: app.cohortId, summary: `${app.decision!.outcome === "approved" ? "Approved" : app.decision!.outcome === "waitlisted" ? "Waitlisted" : "Rejected"} ${app.reference}` });
    if (app.decision!.outcome === "approved")
      log({ at: app.decision!.decidedAt, actorId: app.decision!.decidedById, action: "membership.create", entityType: "membership", entityId: `m_app_${app.id}`, cohortId: app.cohortId, summary: `Enrolled ${u(app.applicantId).name} as a fellow (same identity, no new account)` });
  }
  log({ at: ago(12), actorId: "u_amira", action: "application.request_changes", entityType: "application", entityId: "a_fatima_w27", cohortId: "c_winter27", summary: "Requested changes on LP-W27-0133 (residence proof, customer)" });
  log({ at: ago(3, 2), actorId: "u_priya", action: "document.view", entityType: "document", entityId: "d_a_sara_w27_proof", cohortId: "c_winter27", summary: "Attempted to open proof of residence for LP-W27-0144 — not an assigned reviewer", outcome: "denied" });
  log({ at: ago(19, 20), actorId: "u_marcus", action: "message.hide", entityType: "message", entityId: "msg_leo_kai_2", cohortId: "c_spring26", summary: "Hid a message sharing a phone number (off-platform contact)" });
  log({ at: ago(19, 20), actorId: "u_marcus", action: "report.resolve", entityType: "report", entityId: "rp_leo_kai", cohortId: "c_spring26", summary: "Resolved report: message hidden, reminder sent" });
  log({ at: ago(14), actorId: "u_priya", action: "export.conversations", entityType: "export", entityId: "exp_seed_1", cohortId: "c_spring26", summary: "Exported Spring 2026 conversations (JSON) for quarterly safeguarding review" });
  for (const an of announcements.filter((a) => a.status === "delivered")) {
    log({ at: an.sentAt!, actorId: an.senderId, action: "announcement.send", entityType: "announcement", entityId: an.id, cohortId: an.scope === "all" ? undefined : an.scope, summary: `Sent “${an.title}” to ${an.recipientIds.length} recipients (${an.scope === "all" ? "all cohorts" : COHORTS.find((c) => c.id === an.scope)?.name})` });
  }
  log({ at: ago(34), actorId: "u_amira", action: "mentor.reassign", entityType: "membership", entityId: "ma_012", cohortId: "c_summer26", summary: "Ended Omar Haddad's mentor assignment with Tyler Nash (conversation kept, now read-only)" });

  return {
    users: byId(users),
    cohorts: byId(structuredClone(COHORTS)),
    tracks: byId(structuredClone(TRACKS)),
    memberships: byId(memberships),
    mentorAssignments: byId(buildMentorAssignments()),
    reviewerAssignments: byId(apps.reviewerAssignments),
    forms: byId(structuredClone(FORMS)),
    formVersions: byId(structuredClone(FORM_VERSIONS)),
    applications: byId(apps.applications),
    rubric: structuredClone(RUBRIC),
    reviews: byId(apps.reviews),
    documents: byId(apps.documents),
    modules: byId(learning.modules),
    sessions: byId(learning.sessions),
    completions: byId(learning.completions),
    submissions: byId(learning.submissions),
    conversations: byId(messaging.conversations),
    messages: byId(messaging.messages),
    reports: byId(messaging.reports),
    pendingReplies: {},
    repliedConversations: {},
    announcements: byId(announcements),
    notifications: byId(notifications),
    outbox: byId(outbox),
    interest: {},
    audit: byId(audit),
    imports: {},
    counters: { applicationRef: APPLICATION_REF_START },
  };
}
