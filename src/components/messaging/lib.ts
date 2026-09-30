import type { Conversation, ConversationKind, Database, ID, Message, User } from "@/lib/domain/types";
import type { Decision, Portal } from "@/lib/domain/permissions";
import { adminCohortIds, canMessage, fellowMembership, isExec, isInstructor, isMentor, isProgramAdmin, roleLabel } from "@/lib/domain/permissions";
import { userName } from "@/lib/domain/selectors";
import { fmtDateLong, fmtRelative, fmtWeekday } from "@/lib/utils";

/** The only emoji allowed anywhere in the product UI. */
export const REACTIONS = [
  { emoji: "👍", label: "thumbs up" },
  { emoji: "🙌", label: "raised hands" },
  { emoji: "❤️", label: "heart" },
  { emoji: "😂", label: "laughing" },
] as const;

export const KIND_LABEL: Record<ConversationKind, string> = { direct: "Direct", mentor: "Mentor", group: "Group" };

export const MESSAGE_LIMIT = 2000;
export const MAX_ATTACHMENTS = 3;

export const SUPERVISION_NOTICE = "Program staff can review fellowship conversations to keep everyone safe.";

export const SAMPLE_ATTACHMENTS = [
  { key: "tally", label: "Pop-up tally sheet", name: "popup-tally-sheet.pdf", mime: "application/pdf", size: 2407, sampleUrl: "/samples/attachments/popup-tally-sheet.pdf" },
  { key: "prototype", label: "Stand prototype photo", name: "stand-prototype.png", mime: "image/png", size: 12155, sampleUrl: "/samples/attachments/stand-prototype.png" },
  { key: "notes", label: "Customer interview notes", name: "sample-interview-notes.pdf", mime: "application/pdf", size: 1736, sampleUrl: "/samples/sample-interview-notes.pdf" },
] as const;

export function messagesPath(portal: Portal) {
  return `/${portal}/messages`;
}

/** Merge query-string updates into the current params (null removes a key). */
export function hrefWith(pathname: string, current: URLSearchParams | { toString(): string }, updates: Record<string, string | null | undefined>) {
  const p = new URLSearchParams(current.toString());
  for (const [k, v] of Object.entries(updates)) {
    if (v === null || v === undefined || v === "") p.delete(k);
    else p.set(k, v);
  }
  const qs = p.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

/* ------------------------------------------------------------------ */
/* Dates                                                               */
/* ------------------------------------------------------------------ */

/** Relative time that never reads as "in the future" when the periodic clock lags behind a brand-new message. */
export function relTime(iso: string | undefined, now: string) {
  if (!iso) return "—";
  return fmtRelative(iso, iso > now ? iso : now);
}

export function dayKey(iso: string) {
  return iso.slice(0, 10);
}

export function dayLabel(iso: string, now: string) {
  const d = dayKey(iso);
  if (d === dayKey(now)) return "Today";
  const y = new Date(Date.parse(now) - 86400000).toISOString().slice(0, 10);
  if (d === y) return "Yesterday";
  if (iso.slice(0, 4) !== now.slice(0, 4)) return fmtDateLong(iso);
  return fmtWeekday(iso);
}

/* ------------------------------------------------------------------ */
/* Conversation helpers                                                */
/* ------------------------------------------------------------------ */

export function otherParticipants(db: Database, conv: Conversation, viewerId: ID | null): User[] {
  return conv.participantIds
    .filter((p) => p !== viewerId)
    .map((p) => db.users[p])
    .filter(Boolean);
}

/** Short text for a message in lists (respects hidden state for participants). */
export function previewOf(db: Database, m: Message | undefined, viewerId: ID, mode: "participant" | "supervisor", conv: Conversation) {
  if (!m) return "No messages yet";
  if (m.hidden && mode === "participant") return "Message hidden by the program team";
  const who = m.senderId === viewerId && mode === "participant" ? "You: " : conv.kind === "group" || mode === "supervisor" ? `${db.users[m.senderId]?.firstName ?? "Someone"}: ` : "";
  const body = m.body.trim() || (m.attachments.length ? `Sent ${m.attachments.length === 1 ? m.attachments[0].name : `${m.attachments.length} attachments`}` : "");
  return `${mode === "supervisor" && m.hidden ? "[Hidden] " : ""}${who}${body}`;
}

export function findDirectConversation(db: Database, a: ID, b: ID): Conversation | undefined {
  return Object.values(db.conversations).find((c) => c.kind !== "group" && c.participantIds.length === 2 && c.participantIds.includes(a) && c.participantIds.includes(b));
}

/** Human description of who this person can message (shown in the recipient picker). */
export function messagingRuleFor(db: Database, userId: ID): string {
  if (isExec(db, userId)) return "Executive admins can message fellows and staff in every cohort.";
  if (isProgramAdmin(db, userId)) {
    const names = adminCohortIds(db, userId).map((c) => db.cohorts[c]?.name).filter(Boolean);
    return `Program admins can message fellows and staff in the cohorts they manage${names.length ? ` (${names.join(", ")})` : ""}.`;
  }
  if (isMentor(db, userId) && !isInstructor(db, userId)) return "Mentors can message the fellows assigned to them.";
  if (isInstructor(db, userId)) return "Instructors can message fellows in the cohorts they teach.";
  const fm = fellowMembership(db, userId);
  if (fm) return `You can message fellows in ${db.cohorts[fm.cohortId]?.name ?? "your cohort"}, your track instructors, your mentor and your program manager.`;
  return "Messaging opens once you join a cohort.";
}

export interface Candidate {
  user: User;
  role: string;
  detail: string;
  decision: Decision;
}

/**
 * Everyone who could plausibly be messaged (fellows, instructors, mentors,
 * program admins), each with the permission decision for this sender.
 */
export function recipientCandidates(db: Database, senderId: ID): Candidate[] {
  const out: Candidate[] = [];
  for (const u of Object.values(db.users)) {
    if (u.id === senderId) continue;
    const fellow = fellowMembership(db, u.id);
    const eligible = !!fellow || u.staffRoles.some((r) => r === "instructor" || r === "mentor" || r === "program_admin");
    if (!eligible) continue;
    const detail = fellow ? [u.ventureName, db.cohorts[fellow.cohortId]?.name].filter(Boolean).join(" · ") : u.title ?? "";
    out.push({ user: u, role: roleLabel(db, u), detail, decision: canMessage(db, senderId, u.id) });
  }
  return out.sort((a, b) => (a.decision.ok === b.decision.ok ? a.user.name.localeCompare(b.user.name) : a.decision.ok ? -1 : 1));
}

export function matchesPerson(u: User, term: string) {
  const t = term.toLowerCase();
  return u.name.toLowerCase().includes(t) || (u.ventureName ?? "").toLowerCase().includes(t);
}

export function participantSummary(db: Database, conv: Conversation, viewerId: ID | null, max = 3) {
  const names = conv.participantIds.filter((p) => p !== viewerId).map((p) => userName(db, p));
  if (names.length <= max) return names.join(", ");
  return `${names.slice(0, max).join(", ")} +${names.length - max}`;
}

export const REPORT_REASONS = [
  { value: "Harassment or insults", description: "Name-calling, put-downs or repeated unwanted messages." },
  { value: "Makes me feel unsafe", description: "Anything that worries you about your safety or someone else's." },
  { value: "Sharing personal contact details", description: "Phone numbers, addresses or pushing to chat somewhere unsupervised." },
  { value: "Spam or off-topic", description: "Unwanted promotion or messages that don't belong here." },
  { value: "Something else", description: "Tell the program team what happened." },
] as const;
