"use client";

import { useMemo } from "react";
import { Check, CircleDashed, Lock, MapPin, PencilLine, RotateCcw } from "lucide-react";
import type { Application, ApplicationAnswers, ApplicationSection, ApplicationStatus } from "@/lib/domain/types";
import { questionsForApplication, visibleQuestions } from "@/lib/domain/selectors";
import { ageOn, SECTION_LABEL } from "@/lib/domain/validation";
import { ELIGIBILITY_COPY } from "@/lib/sim/residence";
import { useDb } from "@/lib/store/store";
import { cn, fmtDate, fmtDateLong, fmtDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge, type Tone } from "@/components/ui/display";
import { DocumentRow } from "@/components/ui/files";

/* ------------------------------------------------------------------ */
/* Read-only answers                                                   */
/* ------------------------------------------------------------------ */

function Row({ label, children, requested, empty }: { label: string; children?: React.ReactNode; requested?: boolean; empty?: boolean }) {
  return (
    <div className={cn("grid gap-1 py-3 sm:grid-cols-[200px_1fr] sm:gap-4", requested && "-mx-3 rounded-[10px] bg-[#fff6dd] px-3")}>
      <dt className="flex items-start gap-1.5 text-[13.5px] text-muted">
        {label}
        {requested && <RotateCcw className="mt-[3px] size-3 shrink-0 text-[#7a4b00]" aria-label="Change requested" />}
      </dt>
      <dd className="min-w-0 whitespace-pre-line break-words text-[15px] leading-relaxed text-void">{empty ? <span className="text-muted">Not answered</span> : children}</dd>
    </div>
  );
}

export const CHECK_TONE: Record<string, Tone> = { inside: "green", outside: "amber", ambiguous: "amber", not_found: "red", unchecked: "neutral" };

function SectionBlock({ section, onEdit, children, editLabel }: { section: ApplicationSection; onEdit?: (s: ApplicationSection) => void; children: React.ReactNode; editLabel?: string }) {
  return (
    <section aria-labelledby={`sum-${section}`} className="border-t border-line pt-4 first:border-t-0 first:pt-0">
      <div className="flex items-center justify-between gap-3">
        <h3 id={`sum-${section}`} className="text-[16px] font-semibold tracking-[-0.01em]">
          {SECTION_LABEL[section]}
        </h3>
        {onEdit && (
          <Button size="sm" variant="ghost" icon={<PencilLine className="size-4" />} onClick={() => onEdit(section)} aria-label={`Edit ${SECTION_LABEL[section]}`}>
            {editLabel ?? "Edit"}
          </Button>
        )}
      </div>
      <dl className="mt-1 divide-y divide-line">{children}</dl>
    </section>
  );
}

export function AnswerSummary({
  app,
  answers,
  onEdit,
  requested = [],
  sections = ["about", "idea", "residence", "questions"],
}: {
  app: Application;
  answers?: ApplicationAnswers;
  onEdit?: (s: ApplicationSection) => void;
  requested?: string[];
  sections?: ApplicationSection[];
}) {
  const db = useDb();
  const a = answers ?? app.answers;
  const cohort = db.cohorts[app.cohortId];
  const questions = useMemo(() => visibleQuestions(questionsForApplication(db, app), a.custom), [db, app, a.custom]);
  const req = (k: string) => requested.includes(k);
  const proof = a.residence.proofDocumentId ? db.documents[a.residence.proofDocumentId] : undefined;
  const age = a.about.dateOfBirth && cohort ? ageOn(a.about.dateOfBirth, cohort.startDate) : NaN;
  const check = a.residence.check;

  return (
    <div className="space-y-5">
      {sections.includes("about") && (
        <SectionBlock section="about" onEdit={onEdit}>
          <Row label="Full name" empty={!a.about.fullName}>{a.about.fullName}</Row>
          {a.about.preferredName && <Row label="Preferred name">{a.about.preferredName}</Row>}
          <Row label="Email" empty={!a.about.email}>{a.about.email}</Row>
          {a.about.phone && <Row label="Phone">{a.about.phone}</Row>}
          <Row label="Date of birth" empty={!a.about.dateOfBirth} requested={req("about.dateOfBirth")}>
            {fmtDateLong(a.about.dateOfBirth ? a.about.dateOfBirth + "T00:00:00Z" : undefined)}
            {!Number.isNaN(age) && cohort && <span className="text-muted"> · {age} when {cohort.name} starts</span>}
          </Row>
          {a.about.pronouns && <Row label="Pronouns">{a.about.pronouns}</Row>}
          {a.about.school && <Row label="School, college or workplace">{a.about.school}</Row>}
          {(a.about.guardianName || a.about.guardianEmail) && (
            <Row label="Parent or guardian" requested={req("about.guardianEmail")}>
              {[a.about.guardianName, a.about.guardianEmail].filter(Boolean).join(" · ")}
            </Row>
          )}
        </SectionBlock>
      )}

      {sections.includes("idea") && (
        <SectionBlock section="idea" onEdit={onEdit}>
          <Row label="Working name" empty={!a.idea.ventureName}>{a.idea.ventureName}</Row>
          <Row label="The problem" empty={!a.idea.problem} requested={req("idea.problem")}>{a.idea.problem}</Row>
          <Row label="Who has the problem" empty={!a.idea.customer} requested={req("idea.customer")}>{a.idea.customer}</Row>
          <Row label="How far along" empty={!a.idea.stage}>{a.idea.stage}</Row>
          <Row label="Track preference" empty={!a.idea.trackPreference}>{db.tracks[a.idea.trackPreference ?? ""]?.name}</Row>
          <Row label="Why now" empty={!a.idea.whyNow} requested={req("idea.whyNow")}>{a.idea.whyNow}</Row>
        </SectionBlock>
      )}

      {sections.includes("residence") && (
        <SectionBlock section="residence" onEdit={onEdit}>
          <Row label="Home address" empty={!a.residence.address} requested={req("residence.address")}>
            {a.residence.address}
          </Row>
          <Row label="Location check" requested={req("residence.address")}>
            {check && check.status !== "unchecked" ? (
              <span className="flex flex-col items-start gap-1">
                <Badge tone={CHECK_TONE[check.status]} icon={<MapPin className="size-3.5" aria-hidden />}>
                  {ELIGIBILITY_COPY[check.status].label}
                </Badge>
                {check.normalized && <span className="text-[14px] text-muted">Matched: {check.normalized}</span>}
              </span>
            ) : (
              <span className="text-muted">Not checked yet</span>
            )}
          </Row>
          <Row label="Proof of residence" requested={req("residence.proof")}>
            {proof && !proof.removedAt ? (
              <span className="flex flex-col gap-2">
                {a.residence.proofType && <span className="text-[14px] text-muted">{a.residence.proofType}</span>}
                <DocumentRow doc={proof} />
              </span>
            ) : (
              <span className="text-muted">No document attached</span>
            )}
          </Row>
        </SectionBlock>
      )}

      {sections.includes("questions") && (
        <SectionBlock section="questions" onEdit={onEdit}>
          {questions.map((q) => {
            const v = a.custom[q.id];
            const empty = v === undefined || v === "" || (Array.isArray(v) && v.length === 0);
            if (q.kind === "file") {
              const doc = typeof v === "string" ? db.documents[v] : undefined;
              return (
                <Row key={q.id} label={q.label} requested={req(`custom.${q.id}`)}>
                  {doc && !doc.removedAt ? <DocumentRow doc={doc} /> : <span className="text-muted">{q.required ? "No file attached" : "No file (optional)"}</span>}
                </Row>
              );
            }
            return (
              <Row key={q.id} label={q.label} empty={empty} requested={req(`custom.${q.id}`)}>
                {Array.isArray(v) ? v.join(", ") : v}
              </Row>
            );
          })}
          <Row label="Hours per week" empty={!a.commitment?.hoursPerWeek}>{a.commitment?.hoursPerWeek}</Row>
          <Row label="Usually free" empty={!a.commitment?.availability?.length} requested={req("commitment.availability")}>
            {a.commitment?.availability?.join(", ")}
          </Row>
          <Row label="Community standards">
            {a.commitment?.agreeToCommunityStandards ? (
              <span className="inline-flex items-center gap-1.5">
                <Check className="size-4 text-leaf-ink" aria-hidden /> Agreed
              </span>
            ) : (
              <span className="text-muted">Not yet agreed</span>
            )}
          </Row>
        </SectionBlock>
      )}
    </div>
  );
}

export function LockNotice({ className, children }: { className?: string; children?: React.ReactNode }) {
  return (
    <div className={cn("flex items-start gap-3 rounded-[12px] bg-fog px-4 py-3 text-[14px]", className)}>
      <Lock className="mt-0.5 size-4 shrink-0" aria-hidden />
      <p className="leading-relaxed">
        {children ?? "Your answers are locked because this application has been submitted. If a reviewer needs something changed, they'll ask — and only those items will open for editing."}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Status progress + timeline                                          */
/* ------------------------------------------------------------------ */

const STAGES = ["Draft", "Submitted", "In review", "Decision"] as const;

function stageIndex(status: ApplicationStatus) {
  if (status === "draft") return 0;
  if (status === "submitted") return 1;
  if (status === "in_review" || status === "changes_requested") return 2;
  return 3;
}

/** Four-stage tracker: Draft → Submitted → In review → Decision. */
export function StatusProgress({ status, className }: { status: ApplicationStatus; className?: string }) {
  const idx = stageIndex(status);
  const decisionLabel = status === "approved" ? "Approved" : status === "waitlisted" ? "Waitlisted" : status === "rejected" ? "Decided" : "Decision";
  return (
    <ol className={cn("grid grid-cols-4 gap-1.5", className)} aria-label="Application progress">
      {STAGES.map((label, i) => {
        const done = i < idx || (i === idx && i === 3);
        const current = i === idx && i !== 3;
        const amber = current && status === "changes_requested";
        return (
          <li key={label} className="min-w-0">
            <span className={cn("block h-1.5 rounded-full", done ? "bg-void" : current ? (amber ? "bg-amber" : "bg-jade") : "bg-ash")} />
            <span className={cn("mt-2 block truncate text-[12.5px]", done || current ? "font-medium text-void" : "text-muted")}>
              {i === 3 ? decisionLabel : i === 2 && status === "changes_requested" ? "Changes requested" : label}
            </span>
            <span className="sr-only">{done ? "(done)" : current ? "(current)" : "(upcoming)"}</span>
          </li>
        );
      })}
    </ol>
  );
}

/** Applicant-visible history; internal staff entries are never shown. */
export function ApplicantTimeline({ app, showUpcoming = true }: { app: Application; showUpcoming?: boolean }) {
  const db = useDb();
  const entries = useMemo(() => app.timeline.filter((t) => t.visibility === "applicant").sort((x, y) => (x.at < y.at ? -1 : 1)), [app.timeline]);
  const upcoming: string[] = [];
  if (showUpcoming) {
    if (app.status === "draft") upcoming.push("Submit your application", "Review by an assigned reviewer", "Decision");
    if (app.status === "submitted") upcoming.push("Review by an assigned reviewer", "Decision");
    if (app.status === "in_review") upcoming.push("Decision");
    if (app.status === "changes_requested") upcoming.push("Resubmit the requested items", "Decision");
    if (app.status === "waitlisted") upcoming.push("We'll contact you if a place opens");
  }
  return (
    <ol className="relative">
      {entries.map((t, i) => {
        const last = i === entries.length - 1;
        return (
          <li key={t.id} className="relative flex gap-3 pb-5 last:pb-0">
            {(!last || upcoming.length > 0) && <span className="absolute left-[9px] top-6 h-[calc(100%-18px)] w-px bg-line" aria-hidden />}
            <span className={cn("relative z-[1] mt-0.5 grid size-[19px] shrink-0 place-items-center rounded-full", last ? "bg-jade" : "bg-void")} aria-hidden>
              <Check className="size-3 text-paper" strokeWidth={3} />
            </span>
            <div className="min-w-0">
              <p className="text-[14.5px] font-medium leading-snug">{t.label}</p>
              <p className="text-[12.5px] text-muted">
                {fmtDateTime(t.at)}
                {t.actorId && t.actorId !== app.applicantId && db.users[t.actorId] ? ` · ${db.users[t.actorId].name}` : ""}
              </p>
              {t.note && <p className="mt-1.5 rounded-[10px] bg-fog px-3 py-2 text-[13.5px] leading-relaxed">{t.note}</p>}
            </div>
          </li>
        );
      })}
      {upcoming.map((label, i) => (
        <li key={label} className="relative flex gap-3 pb-5 last:pb-0">
          {i < upcoming.length - 1 && <span className="absolute left-[9px] top-6 h-[calc(100%-18px)] w-px border-l border-dashed border-line" aria-hidden />}
          <CircleDashed className="relative z-[1] mt-0.5 size-[19px] shrink-0 text-muted" aria-hidden />
          <p className="text-[14.5px] text-muted">{label}</p>
        </li>
      ))}
    </ol>
  );
}

export function submittedLine(app: Application) {
  if (app.submittedAt) return `Submitted ${fmtDate(app.submittedAt)}`;
  return `Started ${fmtDate(app.createdAt)}`;
}
