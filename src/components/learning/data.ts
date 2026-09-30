import type { ContentBlock, Database, ID, Module, Session, SessionContent, Submission, SubmissionFeedback, User } from "@/lib/domain/types";
import { fellowMembership, isAdmin } from "@/lib/domain/permissions";
import { modulesOfTrack, publishedSessionsOfModule, sessionsOfModule, taskBlockOf } from "@/lib/domain/selectors";

export type TaskBlock = Extract<ContentBlock, { type: "task" }>;
export type VideoBlock = Extract<ContentBlock, { type: "video" }>;
export type FileBlock = Extract<ContentBlock, { type: "file" }>;

/** Published sessions of a track in reading order (module order, then session order). */
export function trackSessionsFlat(db: Database, trackId: ID): { module: Module; session: Session }[] {
  const out: { module: Module; session: Session }[] = [];
  for (const m of modulesOfTrack(db, trackId)) for (const s of publishedSessionsOfModule(db, m.id)) out.push({ module: m, session: s });
  return out;
}

/** Instructors teaching a given cohort + track. */
export function instructorsFor(db: Database, cohortId: ID, trackId: ID): User[] {
  return Object.values(db.memberships)
    .filter((m) => m.role === "instructor" && m.status === "active" && m.cohortId === cohortId && m.trackId === trackId)
    .map((m) => db.users[m.userId])
    .filter(Boolean);
}

export function instructorNameForFellow(db: Database, fellowId: ID) {
  const fm = fellowMembership(db, fellowId);
  if (!fm?.trackId) return "your instructor";
  const list = instructorsFor(db, fm.cohortId, fm.trackId);
  return list[0]?.name ?? "your instructor";
}

export function latestFeedback(sub?: Submission): SubmissionFeedback | undefined {
  if (!sub?.feedback.length) return undefined;
  return [...sub.feedback].sort((a, b) => (a.at < b.at ? 1 : -1))[0];
}

/** Content an editor works on: the draft if one exists, otherwise the published version. */
export function editableContent(s: Session): SessionContent | undefined {
  return s.draft ?? s.published;
}

export type EditorStatus = "published" | "draft_changes" | "never_published";

export function editorStatus(s: Session): EditorStatus {
  if (!s.published) return "never_published";
  if (s.draft) return "draft_changes";
  return "published";
}

export function sessionTitleForStaff(s: Session) {
  return s.draft?.title ?? s.published?.title ?? "Untitled session";
}

export function moduleCounts(db: Database, moduleId: ID) {
  const all = sessionsOfModule(db, moduleId);
  return {
    total: all.length,
    published: all.filter((s) => s.published).length,
    drafts: all.filter((s) => !!s.draft).length,
    neverPublished: all.filter((s) => !s.published).length,
  };
}

/** Summarise how an editor's working copy differs from what fellows see. */
export function diffSummary(published: SessionContent | undefined, working: SessionContent): string[] {
  if (!published) return [];
  const out: string[] = [];
  if (published.title !== working.title) out.push("title");
  if (published.summary !== working.summary) out.push("summary");
  if (published.durationMin !== working.durationMin) out.push("duration");
  const pub = new Map(published.blocks.map((b) => [b.id, JSON.stringify(b)]));
  const cur = new Map(working.blocks.map((b) => [b.id, JSON.stringify(b)]));
  let added = 0;
  let removed = 0;
  let edited = 0;
  for (const [id, json] of cur) {
    if (!pub.has(id)) added++;
    else if (pub.get(id) !== json) edited++;
  }
  for (const id of pub.keys()) if (!cur.has(id)) removed++;
  const sharedPub = published.blocks.map((b) => b.id).filter((id) => cur.has(id));
  const sharedCur = working.blocks.map((b) => b.id).filter((id) => pub.has(id));
  const reordered = sharedPub.join("|") !== sharedCur.join("|");
  const n = (k: number, w: string) => `${k} block${k === 1 ? "" : "s"} ${w}`;
  if (edited) out.push(n(edited, "edited"));
  if (added) out.push(n(added, "added"));
  if (removed) out.push(n(removed, "removed"));
  if (reordered) out.push("blocks reordered");
  return out;
}

export function sameContent(a?: SessionContent, b?: SessionContent) {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

export function taskOf(s: Session) {
  return taskBlockOf(s.published);
}

/** Decision-friendly label for a staff-side submission status. */
export function submissionStatusLabel(sub: Submission) {
  switch (sub.status) {
    case "submitted":
      return sub.versions.length > 1 ? "Resubmitted" : "Awaiting review";
    case "changes_requested":
      return "Changes requested";
    case "reviewed":
      return sub.feedback.some((f) => f.decision === "approved") ? "Approved" : "Complete";
    default:
      return "Draft";
  }
}

export function canSeeAllCurriculum(db: Database, userId: ID) {
  return isAdmin(db, userId);
}

export function fmtClock(sec: number) {
  if (!Number.isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Stable DOM id for a heading/landmark block. */
export function anchorId(blockId: string) {
  return `sec-${blockId.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}

export const MIN_WORDS_HINT = "Write enough for your instructor to follow your thinking.";

/** "12 min", "1 h", "4 h 30 min" */
export function fmtMinutes(min: number) {
  if (!Number.isFinite(min) || min <= 0) return "—";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}
