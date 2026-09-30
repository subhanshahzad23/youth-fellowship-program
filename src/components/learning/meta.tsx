"use client";

import { BookOpen, CheckCircle2, Circle, ClipboardCheck, FileEdit, Hourglass, PlayCircle, RotateCcw, type LucideIcon } from "lucide-react";
import type { SessionKind, Submission } from "@/lib/domain/types";
import type { SessionState } from "@/lib/domain/selectors";
import { Badge, type Tone } from "@/components/ui/display";
import { cn } from "@/lib/utils";
import { editorStatus, submissionStatusLabel, type EditorStatus } from "./data";
import type { Session } from "@/lib/domain/types";

export const KIND_META: Record<SessionKind, { label: string; Icon: LucideIcon }> = {
  reading: { label: "Reading", Icon: BookOpen },
  video: { label: "Video", Icon: PlayCircle },
  task: { label: "Assignment", Icon: ClipboardCheck },
};

export function KindIcon({ kind, className }: { kind: SessionKind; className?: string }) {
  const { Icon } = KIND_META[kind];
  return <Icon className={cn("size-4", className)} aria-hidden />;
}

export function KindLabel({ kind, className }: { kind: SessionKind; className?: string }) {
  const { Icon, label } = KIND_META[kind];
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <Icon className="size-4" aria-hidden />
      {label}
    </span>
  );
}

export const STATE_META: Record<SessionState, { label: string; tone: Tone; Icon: LucideIcon }> = {
  complete: { label: "Complete", tone: "green", Icon: CheckCircle2 },
  in_progress: { label: "In progress", tone: "blue", Icon: FileEdit },
  awaiting_review: { label: "Awaiting review", tone: "purple", Icon: Hourglass },
  changes_requested: { label: "Changes requested", tone: "amber", Icon: RotateCcw },
  not_started: { label: "Not started", tone: "neutral", Icon: Circle },
};

export function SessionStateBadge({ state, className }: { state: SessionState; className?: string }) {
  const { label, tone, Icon } = STATE_META[state];
  return (
    <Badge tone={tone} className={className} icon={<Icon className="size-3.5" aria-hidden />}>
      {label}
    </Badge>
  );
}

/** Round state marker used in session lists (check when complete). */
export function StateDot({ state, className }: { state: SessionState; className?: string }) {
  const { Icon, label } = STATE_META[state];
  const styles: Record<SessionState, string> = {
    complete: "bg-jade text-void",
    in_progress: "bg-[#e3edff] text-[#1e40af]",
    awaiting_review: "bg-[#f3e8ff] text-[#6b21a8]",
    changes_requested: "bg-[#fff1cc] text-[#7a4b00]",
    not_started: "bg-fog text-[#9a9a9a]",
  };
  return (
    <span className={cn("grid size-8 shrink-0 place-items-center rounded-full", styles[state], className)} title={label}>
      <Icon className="size-4" strokeWidth={state === "complete" ? 2.5 : 2} aria-hidden />
    </span>
  );
}

const SUB_TONE: Record<Submission["status"], { tone: Tone; Icon: LucideIcon }> = {
  draft: { tone: "neutral", Icon: FileEdit },
  submitted: { tone: "purple", Icon: Hourglass },
  changes_requested: { tone: "amber", Icon: RotateCcw },
  reviewed: { tone: "green", Icon: CheckCircle2 },
};

export function SubmissionStatusBadge({ sub, className }: { sub: Submission; className?: string }) {
  const { tone, Icon } = SUB_TONE[sub.status];
  return (
    <Badge tone={tone} className={className} icon={<Icon className="size-3.5" aria-hidden />}>
      {submissionStatusLabel(sub)}
    </Badge>
  );
}

const EDITOR_META: Record<EditorStatus, { label: string; tone: Tone; Icon: LucideIcon }> = {
  published: { label: "Published", tone: "green", Icon: CheckCircle2 },
  draft_changes: { label: "Draft changes", tone: "amber", Icon: FileEdit },
  never_published: { label: "Never published", tone: "neutral", Icon: Circle },
};

export function EditorStatusBadge({ session, className }: { session: Session; className?: string }) {
  const { label, tone, Icon } = EDITOR_META[editorStatus(session)];
  return (
    <Badge tone={tone} className={className} icon={<Icon className="size-3.5" aria-hidden />}>
      {label}
    </Badge>
  );
}
