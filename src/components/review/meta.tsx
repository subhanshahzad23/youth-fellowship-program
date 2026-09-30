"use client";

import {
  AlignLeft,
  CheckSquare,
  CircleDashed,
  CircleHelp,
  ListChecks,
  MapPin,
  MapPinCheck,
  MapPinOff,
  Paperclip,
  SearchX,
  TextCursorInput,
  ThumbsDown,
  ThumbsUp,
  Clock,
  RotateCcw,
  type LucideIcon,
} from "lucide-react";
import type { Database, EligibilityStatus, FormQuestion, QuestionKind, Recommendation } from "@/lib/domain/types";
import { CHANGEABLE_FIELDS } from "@/lib/domain/validation";
import { Badge, type Tone } from "@/components/ui/display";

/* ------------------------------------------------------------------ */
/* Location eligibility                                                */
/* ------------------------------------------------------------------ */

export const ELIGIBILITY_META: Record<EligibilityStatus, { label: string; short: string; tone: Tone; Icon: LucideIcon; explain: string }> = {
  inside: { label: "Inside service area", short: "Inside", tone: "green", Icon: MapPinCheck, explain: "The address matched a district inside Greater Larkhaven." },
  outside: { label: "Outside service area", short: "Outside", tone: "red", Icon: MapPinOff, explain: "The address matched a district outside Greater Larkhaven." },
  ambiguous: {
    label: "Ambiguous match",
    short: "Ambiguous",
    tone: "amber",
    Icon: MapPin,
    explain: "The street exists in more than one district. Confirm with the proof of residence.",
  },
  not_found: { label: "No match found", short: "No match", tone: "red", Icon: SearchX, explain: "The address couldn't be matched to a known district." },
  unchecked: { label: "Not checked", short: "Not checked", tone: "neutral", Icon: CircleDashed, explain: "No location check was run for this address." },
};

export function EligibilityBadge({ status, short, className }: { status: EligibilityStatus; short?: boolean; className?: string }) {
  const m = ELIGIBILITY_META[status];
  return (
    <Badge tone={m.tone} className={className} icon={<m.Icon className="size-3.5" aria-hidden />}>
      {short ? m.short : m.label}
    </Badge>
  );
}

/* ------------------------------------------------------------------ */
/* Reviewer recommendations                                            */
/* ------------------------------------------------------------------ */

export const RECOMMENDATION_META: Record<Recommendation, { label: string; description: string; tone: Tone; Icon: LucideIcon }> = {
  approve: { label: "Approve", description: "Offer a place in this cohort", tone: "green", Icon: ThumbsUp },
  waitlist: { label: "Waitlist", description: "Strong, but not this round", tone: "amber", Icon: Clock },
  changes: { label: "Request changes", description: "Needs specific fixes before scoring", tone: "blue", Icon: RotateCcw },
  reject: { label: "Not successful", description: "Not the right fit this time", tone: "red", Icon: ThumbsDown },
};

export function RecommendationBadge({ value }: { value?: Recommendation }) {
  if (!value) return <Badge tone="neutral">No recommendation</Badge>;
  const m = RECOMMENDATION_META[value];
  return (
    <Badge tone={m.tone} icon={<m.Icon className="size-3.5" aria-hidden />}>
      {m.label}
    </Badge>
  );
}

/* ------------------------------------------------------------------ */
/* Form question kinds                                                 */
/* ------------------------------------------------------------------ */

export const KIND_META: Record<QuestionKind, { label: string; description: string; Icon: LucideIcon }> = {
  short: { label: "Short answer", description: "One line of text", Icon: TextCursorInput },
  long: { label: "Long answer", description: "Paragraphs, with an optional word limit", Icon: AlignLeft },
  select: { label: "Single choice", description: "Pick one option from a list", Icon: ListChecks },
  multi: { label: "Multiple choice", description: "Pick several options, with an optional maximum", Icon: CheckSquare },
  yesno: { label: "Yes / No", description: "A simple yes or no — useful for conditions", Icon: CircleHelp },
  file: { label: "File upload", description: "One PDF or image up to 8 MB", Icon: Paperclip },
};

/* ------------------------------------------------------------------ */
/* Field labels for change requests                                    */
/* ------------------------------------------------------------------ */

export function changeFieldLabel(key: string, questions: FormQuestion[]) {
  const std = CHANGEABLE_FIELDS.find((f) => f.key === key);
  if (std) return std.label;
  if (key.startsWith("custom.")) {
    const q = questions.find((x) => `custom.${x.id}` === key);
    return q ? q.label : "A form question";
  }
  return key;
}

/** Staff who may be assigned to review (program/exec admins and instructors). */
export function eligibleReviewers(db: Database) {
  // Reviewers work in the admin portal, so only program and executive admins are eligible.
  return Object.values(db.users).filter((u) => u.staffRoles.includes("executive_admin") || u.staffRoles.includes("program_admin"));
}
