/**
 * Normalized domain model for the Launchpad Fellowship demo.
 * Every record has a stable string id. Relationships are expressed through
 * ids and join records (memberships, assignments) — never nested copies —
 * so a single change (e.g. an approval) is visible everywhere at once.
 *
 * All timestamps are ISO-8601 strings in UTC and are produced by the
 * injectable demo clock (see lib/clock.ts).
 */

export type ID = string;
export type ISODate = string;

/* ------------------------------------------------------------------ */
/* People and roles                                                    */
/* ------------------------------------------------------------------ */

/** Staff roles are attached to the user. Applicant/fellow capabilities are
 *  derived from applications and cohort memberships instead. */
export type StaffRole = "executive_admin" | "program_admin" | "instructor" | "mentor";

export interface User {
  id: ID;
  name: string;
  firstName: string;
  email: string;
  /** Public-facing, non-sensitive details */
  pronouns?: string;
  city?: string;
  bio?: string;
  ventureName?: string;
  ventureSummary?: string;
  ventureStage?: "Idea" | "Testing" | "Prototype" | "First customers" | "Growing";
  avatarHue: number; // deterministic colour for initials avatar
  staffRoles: StaffRole[];
  title?: string; // staff job title, e.g. "Program Director"
  createdAt: ISODate;
  /** Sensitive applicant fields — never shown in the fellow directory */
  private?: {
    dateOfBirth?: string;
    phone?: string;
    guardianName?: string;
    guardianEmail?: string;
  };
  notificationPrefs: NotificationPrefs;
  /** Marks the one-click walkthrough identities */
  persona?: PersonaKey;
  /** true for identities created through the simulated sign-up */
  createdViaSignup?: boolean;
}

export type PersonaKey = "maya" | "amira" | "noah" | "elena" | "daniel" | "priya";

export interface NotificationPrefs {
  digest: "daily" | "weekly" | "off";
  emailAnnouncements: boolean;
  emailMessages: boolean;
}

/* ------------------------------------------------------------------ */
/* Cohorts, tracks, memberships and assignments                        */
/* ------------------------------------------------------------------ */

export type CohortStatus = "active" | "intake" | "announced" | "completed";

export interface Cohort {
  id: ID;
  slug: string;
  name: string; // "Summer 2026"
  status: CohortStatus;
  startDate: ISODate;
  endDate: ISODate; // start + 18 months
  capacity: number;
  description: string;
  trackIds: ID[];
  location: string;
  createdAt: ISODate;
}

export interface Track {
  id: ID;
  slug: string;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  outcomes: string[];
  color: string; // in-canvas accent (never used as marketing chrome)
  order: number;
}

export type MembershipRole = "fellow" | "program_admin" | "instructor" | "mentor";

export interface Membership {
  id: ID;
  userId: ID;
  cohortId: ID;
  role: MembershipRole;
  /** fellows follow one primary track; instructors teach one track per membership */
  trackId?: ID;
  status: "active" | "ended";
  startedAt: ISODate;
  endedAt?: ISODate;
  /** set when the membership was created by an application approval */
  sourceApplicationId?: ID;
}

export interface MentorAssignment {
  id: ID;
  mentorId: ID;
  fellowId: ID;
  cohortId: ID;
  status: "active" | "ended";
  startedAt: ISODate;
  endedAt?: ISODate;
}

export interface ReviewerAssignment {
  id: ID;
  applicationId: ID;
  reviewerId: ID;
  assignedById: ID;
  assignedAt: ISODate;
}

/* ------------------------------------------------------------------ */
/* Application forms                                                   */
/* ------------------------------------------------------------------ */

export type QuestionKind = "short" | "long" | "select" | "multi" | "yesno" | "file";

export interface FormQuestion {
  id: ID;
  kind: QuestionKind;
  label: string;
  help?: string;
  required: boolean;
  options?: string[];
  wordLimit?: number;
  maxChoices?: number;
  /** Conditional visibility: show when another custom question equals value */
  showIf?: { questionId: ID; equals: string };
}

export interface FormVersion {
  id: ID;
  formId: ID;
  version: number;
  questions: FormQuestion[];
  publishedAt?: ISODate;
  publishedById?: ID;
}

export interface ApplicationForm {
  id: ID;
  cohortId: ID;
  title: string;
  intro: string;
  opensAt: ISODate;
  closesAt: ISODate;
  status: "draft" | "published";
  /** version applicants currently receive */
  publishedVersionId?: ID;
  /** unpublished edits live here and never touch submitted applications */
  draftQuestions?: FormQuestion[];
  draftUpdatedAt?: ISODate;
  createdAt: ISODate;
  updatedAt: ISODate;
}

/* ------------------------------------------------------------------ */
/* Applications and review                                             */
/* ------------------------------------------------------------------ */

export type ApplicationStatus =
  | "draft"
  | "submitted"
  | "in_review"
  | "changes_requested"
  | "waitlisted"
  | "approved"
  | "rejected";

export type EligibilityStatus = "unchecked" | "inside" | "outside" | "ambiguous" | "not_found";

export interface ResidenceCheck {
  input: string;
  status: EligibilityStatus;
  normalized?: string;
  district?: string;
  candidates?: { label: string; district: string; inside: boolean }[];
  checkedAt?: ISODate;
  fixture?: string;
}

export interface ApplicationAnswers {
  about: {
    fullName?: string;
    preferredName?: string;
    email?: string;
    dateOfBirth?: string;
    phone?: string;
    pronouns?: string;
    school?: string;
    guardianName?: string;
    guardianEmail?: string;
  };
  idea: {
    ventureName?: string;
    problem?: string;
    customer?: string;
    stage?: string;
    trackPreference?: ID;
    whyNow?: string;
  };
  residence: {
    address?: string;
    check?: ResidenceCheck;
    proofDocumentId?: ID;
    proofType?: string;
  };
  custom: Record<ID, string | string[] | undefined>;
  commitment?: {
    hoursPerWeek?: string;
    availability?: string[];
    agreeToCommunityStandards?: boolean;
  };
}

export type ApplicationSection = "about" | "idea" | "residence" | "questions" | "review";

export interface ChangeRequest {
  id: ID;
  requestedById: ID;
  requestedAt: ISODate;
  note: string;
  /** field keys like "idea.problem", "residence.proof", "custom.q_xxx" */
  fields: string[];
  resolvedAt?: ISODate;
}

export interface TimelineEntry {
  id: ID;
  at: ISODate;
  status: ApplicationStatus;
  actorId?: ID;
  label: string;
  note?: string;
  /** visible to the applicant? internal entries are staff-only */
  visibility: "applicant" | "internal";
}

export interface Application {
  id: ID;
  reference?: string; // assigned on first submission, e.g. LP-W27-0142
  applicantId: ID;
  cohortId: ID;
  formId: ID;
  formVersionId: ID;
  status: ApplicationStatus;
  answers: ApplicationAnswers;
  documentIds: ID[];
  createdAt: ISODate;
  updatedAt: ISODate;
  lastSavedAt?: ISODate;
  submittedAt?: ISODate;
  /** step the applicant last worked on — resumes here */
  currentSection: ApplicationSection;
  changeRequests: ChangeRequest[];
  timeline: TimelineEntry[];
  decision?: {
    outcome: "approved" | "waitlisted" | "rejected";
    decidedById: ID;
    decidedAt: ISODate;
    note?: string;
  };
  /** number of resubmissions after change requests */
  resubmissions: number;
}

export interface RubricCriterion {
  id: ID;
  label: string;
  description: string;
  weight: number; // percentage; all criteria sum to 100
  anchors: [string, string, string, string, string]; // 1..5 scale descriptors
}

export type Recommendation = "approve" | "waitlist" | "reject" | "changes";

export interface Review {
  id: ID;
  applicationId: ID;
  reviewerId: ID;
  scores: Record<ID, number | undefined>;
  recommendation?: Recommendation;
  notes: string;
  status: "draft" | "submitted";
  updatedAt: ISODate;
  submittedAt?: ISODate;
}

/* ------------------------------------------------------------------ */
/* Documents and files                                                 */
/* ------------------------------------------------------------------ */

export type DocumentKind = "proof_of_residence" | "application_attachment" | "submission_attachment" | "message_attachment";

export interface DocumentRecord {
  id: ID;
  ownerId: ID;
  kind: DocumentKind;
  applicationId?: ID;
  name: string;
  mime: string;
  size: number;
  source: "sample" | "upload";
  /** bundled asset path under /public for sample files */
  sampleUrl?: string;
  /** IndexedDB key for user-added bytes (never an object URL) */
  blobKey?: string;
  uploadedAt: ISODate;
  /** restricted documents are only openable by the owner and assigned reviewers */
  restricted: boolean;
  removedAt?: ISODate;
}

/* ------------------------------------------------------------------ */
/* Learning                                                            */
/* ------------------------------------------------------------------ */

export type SessionKind = "reading" | "video" | "task";

export type ContentBlock =
  | { id: ID; type: "heading"; text: string }
  | { id: ID; type: "text"; text: string } // lightweight markdown: **bold**, *italic*, [link](url), lists "- "
  | { id: ID; type: "callout"; tone: "tip" | "example" | "warning"; title: string; text: string }
  | { id: ID; type: "list"; ordered: boolean; items: string[] }
  | { id: ID; type: "video"; title: string; src: string; poster?: string; captions?: string; durationSec: number; transcript: { t: number; text: string }[] }
  | { id: ID; type: "file"; title: string; description: string; href: string; fileName: string; size: string }
  | { id: ID; type: "task"; title: string; instructions: string; deliverable: string; requiresReview: boolean; rubric?: string[] }
  | { id: ID; type: "quote"; text: string; attribution: string };

export interface SessionContent {
  title: string;
  summary: string;
  durationMin: number;
  blocks: ContentBlock[];
}

export interface Session {
  id: ID;
  moduleId: ID;
  order: number;
  kind: SessionKind;
  status: "published" | "draft";
  /** what fellows see */
  published?: SessionContent;
  /** instructor edits in progress; never shown to fellows */
  draft?: SessionContent;
  draftUpdatedAt?: ISODate;
  draftUpdatedById?: ID;
  publishedAt?: ISODate;
  showcase?: boolean;
  notionBlockId?: string;
}

export interface Module {
  id: ID;
  trackId: ID;
  order: number;
  title: string;
  summary: string;
  suggestedMonths: string; // "Months 1–3"
  sessionIds: ID[];
  notionPageId?: string;
  updatedAt: ISODate;
}

export interface SessionCompletion {
  id: ID;
  userId: ID;
  sessionId: ID;
  completedAt: ISODate;
}

export type SubmissionStatus = "draft" | "submitted" | "changes_requested" | "reviewed";

export interface SubmissionVersion {
  id: ID;
  text: string;
  attachmentIds: ID[];
  submittedAt: ISODate;
}

export interface SubmissionFeedback {
  id: ID;
  authorId: ID;
  text: string;
  decision: "approved" | "changes_requested" | "comment";
  at: ISODate;
  versionId?: ID;
}

export interface Submission {
  id: ID;
  sessionId: ID;
  fellowId: ID;
  cohortId: ID;
  status: SubmissionStatus;
  draftText: string;
  draftAttachmentIds: ID[];
  draftSavedAt?: ISODate;
  versions: SubmissionVersion[];
  feedback: SubmissionFeedback[];
  updatedAt: ISODate;
}

/* ------------------------------------------------------------------ */
/* Messaging and safeguarding                                          */
/* ------------------------------------------------------------------ */

export type ConversationKind = "direct" | "mentor" | "group";

export interface Conversation {
  id: ID;
  kind: ConversationKind;
  cohortId: ID;
  participantIds: ID[];
  title?: string; // group conversations only
  createdAt: ISODate;
  createdById: ID;
  lastMessageAt: ISODate;
}

export interface MessageAttachment {
  id: ID;
  name: string;
  mime: string;
  size: number;
  sampleUrl?: string;
  blobKey?: string;
}

export interface Message {
  id: ID;
  conversationId: ID;
  senderId: ID;
  body: string;
  attachments: MessageAttachment[];
  sentAt: ISODate;
  readBy: Record<ID, ISODate>;
  reactions?: Record<string, ID[]>;
  /** deterministic keyword rule match (not AI) */
  autoFlag?: { rule: string; matched: string; at: ISODate };
  hidden?: { byId: ID; reason: string; at: ISODate };
  simulated?: boolean;
}

export type ReportStatus = "open" | "in_review" | "resolved";

export interface MessageReport {
  id: ID;
  messageId: ID;
  conversationId: ID;
  cohortId: ID;
  reporterId?: ID; // absent for automatic flags
  source: "participant" | "keyword_rule";
  reason: string;
  details?: string;
  status: ReportStatus;
  createdAt: ISODate;
  assignedToId?: ID;
  resolution?: { outcome: "no_action" | "message_hidden" | "warning_sent" | "escalated"; note: string; byId: ID; at: ISODate };
  history: { at: ISODate; byId?: ID; action: string; note?: string }[];
}

export interface PendingReply {
  id: ID;
  conversationId: ID;
  fromId: ID;
  body: string;
  dueAt: ISODate;
  triggeredByMessageId: ID;
}

/* ------------------------------------------------------------------ */
/* Announcements, notifications, outbox                                */
/* ------------------------------------------------------------------ */

export interface Announcement {
  id: ID;
  senderId: ID;
  scope: "all" | ID; // "all" or a cohort id
  audience: "fellows" | "fellows_and_staff";
  title: string;
  body: string;
  status: "draft" | "sending" | "delivered";
  recipientIds: ID[];
  createdAt: ISODate;
  sentAt?: ISODate;
  deliveredAt?: ISODate;
}

export type NotificationKind =
  | "announcement"
  | "message"
  | "application"
  | "review"
  | "feedback"
  | "assignment"
  | "moderation"
  | "enrollment"
  | "system";

export interface AppNotification {
  id: ID;
  userId: ID;
  kind: NotificationKind;
  title: string;
  body: string;
  href: string;
  createdAt: ISODate;
  readAt?: ISODate;
}

export interface OutboxEmail {
  id: ID;
  toUserId?: ID;
  toEmail: string;
  toName: string;
  subject: string;
  preview: string;
  bodyText: string;
  kind: "welcome" | "announcement" | "digest" | "decision" | "changes_requested" | "interest" | "submission";
  relatedHref?: string;
  createdAt: ISODate;
  status: "simulated";
  announcementId?: ID;
}

export interface InterestRegistration {
  id: ID;
  cohortId: ID;
  name: string;
  email: string;
  createdAt: ISODate;
}

/* ------------------------------------------------------------------ */
/* Audit and migration                                                 */
/* ------------------------------------------------------------------ */

export interface AuditEvent {
  id: ID;
  at: ISODate;
  actorId: ID;
  action: string; // e.g. "application.approve", "document.view", "message.hide"
  entityType: "application" | "document" | "review" | "cohort" | "membership" | "form" | "session" | "module" | "submission" | "conversation" | "message" | "report" | "announcement" | "export" | "user" | "import" | "system";
  entityId: ID;
  cohortId?: ID;
  summary: string;
  outcome: "success" | "denied";
  meta?: Record<string, string | number | boolean | undefined>;
}

export interface ImportRun {
  id: ID;
  at: ISODate;
  byId: ID;
  created: number;
  updated: number;
  skipped: number;
  details: { notionId: string; title: string; kind: "module" | "session"; result: "created" | "updated" | "skipped"; targetId?: ID }[];
}

/* ------------------------------------------------------------------ */
/* Database root                                                       */
/* ------------------------------------------------------------------ */

export interface Database {
  users: Record<ID, User>;
  cohorts: Record<ID, Cohort>;
  tracks: Record<ID, Track>;
  memberships: Record<ID, Membership>;
  mentorAssignments: Record<ID, MentorAssignment>;
  reviewerAssignments: Record<ID, ReviewerAssignment>;
  forms: Record<ID, ApplicationForm>;
  formVersions: Record<ID, FormVersion>;
  applications: Record<ID, Application>;
  rubric: RubricCriterion[];
  reviews: Record<ID, Review>;
  documents: Record<ID, DocumentRecord>;
  modules: Record<ID, Module>;
  sessions: Record<ID, Session>;
  completions: Record<ID, SessionCompletion>;
  submissions: Record<ID, Submission>;
  conversations: Record<ID, Conversation>;
  messages: Record<ID, Message>;
  reports: Record<ID, MessageReport>;
  pendingReplies: Record<ID, PendingReply>;
  /** conversation ids that already received their one scripted reply */
  repliedConversations: Record<ID, true>;
  announcements: Record<ID, Announcement>;
  notifications: Record<ID, AppNotification>;
  outbox: Record<ID, OutboxEmail>;
  interest: Record<ID, InterestRegistration>;
  audit: Record<ID, AuditEvent>;
  imports: Record<ID, ImportRun>;
  counters: { applicationRef: number };
}
