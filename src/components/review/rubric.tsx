"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, Lock, Save, Send } from "lucide-react";
import type { Application, Database, ID, Recommendation, Review, RubricCriterion } from "@/lib/domain/types";
import { canReviewApplication, isAssignedReviewer } from "@/lib/domain/permissions";
import { partialScore, reviewsOf, weightedScore } from "@/lib/domain/selectors";
import { saveReview, submitReview } from "@/lib/actions/applications";
import { useNow } from "@/lib/hooks";
import { cn, fmtDateTime, fmtRelative, sleep } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, RadioCards, Textarea } from "@/components/ui/form";
import { Badge, Notice, Panel, PanelHeader } from "@/components/ui/display";
import { ConfirmDialog } from "@/components/ui/overlay";
import { LeaveGuard } from "./leave-guard";
import { RECOMMENDATION_META, RecommendationBadge } from "./meta";

type Scores = Record<ID, number | undefined>;

function contribution(c: RubricCriterion, score?: number) {
  return score ? Math.round((score / 5) * c.weight) : 0;
}

/* ------------------------------------------------------------------ */
/* 1–5 segmented scale (radio group with arrow-key support)            */
/* ------------------------------------------------------------------ */

function ScoreScale({ criterion, value, onChange, invalid }: { criterion: RubricCriterion; value?: number; onChange: (n: number) => void; invalid?: boolean }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? value;
  const labelId = `crit-${criterion.id}`;
  const descId = `crit-${criterion.id}-anchor`;

  function move(to: number) {
    const n = Math.min(5, Math.max(1, to));
    onChange(n);
    refs.current[n - 1]?.focus();
  }

  return (
    <div>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        aria-describedby={descId}
        aria-invalid={invalid || undefined}
        className={cn("grid grid-cols-5 gap-1.5 rounded-[10px]", invalid && "outline-2 outline-offset-2 outline-[#c8102e]")}
        onMouseLeave={() => setHover(null)}
      >
        {[1, 2, 3, 4, 5].map((n) => {
          const selected = value === n;
          const below = value !== undefined && n < value;
          return (
            <button
              key={n}
              ref={(el) => {
                refs.current[n - 1] = el;
              }}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`${n} of 5 — ${criterion.anchors[n - 1]}`}
              tabIndex={selected || (value === undefined && n === 1) ? 0 : -1}
              onClick={() => onChange(n)}
              onMouseEnter={() => setHover(n)}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight" || e.key === "ArrowUp") {
                  e.preventDefault();
                  move((value ?? 0) + 1);
                } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
                  e.preventDefault();
                  move((value ?? 2) - 1);
                }
              }}
              className={cn(
                "h-11 rounded-[8px] text-[15px] font-medium tabular transition-colors duration-150",
                selected ? "bg-jade text-void font-semibold" : below ? "bg-leaf text-leaf-ink hover:bg-mint" : "bg-fog text-void hover:bg-ash",
              )}
            >
              {n}
            </button>
          );
        })}
      </div>
      <p id={descId} className="mt-2 min-h-[20px] text-[13.5px] leading-snug" aria-live="polite">
        {shown ? (
          <>
            <span className="font-semibold tabular">{shown}/5</span>{" "}
            <span className={cn(hover && hover !== value ? "text-muted" : "text-ink")}>· {criterion.anchors[shown - 1]}</span>
          </>
        ) : (
          <span className="text-muted">Choose 1 (weakest) to 5 (strongest).</span>
        )}
      </p>
    </div>
  );
}

/** Compact read-only 5-step meter. */
export function ScorePips({ score, className }: { score?: number; className?: string }) {
  return (
    <span className={cn("inline-flex gap-0.5", className)} aria-hidden>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={cn("h-2 w-3.5 rounded-full", score !== undefined && n <= score ? "bg-jade" : "bg-ash")} />
      ))}
    </span>
  );
}

function TotalCard({ total, provisional, scored, count }: { total: number | null; provisional: number; scored: number; count: number }) {
  return (
    <div className="flex items-center gap-4 rounded-[16px] bg-fog p-4">
      <div className="min-w-[92px]">
        <p className="font-display text-[44px] leading-none tracking-[-0.04em] tabular">
          {total ?? (scored ? provisional : "—")}
          <span className="font-sans text-[15px] tracking-normal text-muted">/100</span>
        </p>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-medium">{total !== null ? "Weighted total" : scored ? "Provisional total" : "Weighted total"}</p>
        <p className="text-[13px] text-muted">{total !== null ? "All criteria scored" : `${scored} of ${count} criteria scored`}</p>
        <div className="mt-2 flex gap-1" aria-hidden>
          {Array.from({ length: count }).map((_, i) => (
            <span key={i} className={cn("h-1.5 flex-1 rounded-full transition-colors", i < scored ? "bg-jade" : "bg-ash")} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Editable rubric                                                     */
/* ------------------------------------------------------------------ */

function sameScores(a: Scores, b: Scores, ids: ID[]) {
  return ids.every((id) => (a[id] ?? null) === (b[id] ?? null));
}

function RubricForm({ db, app, review }: { db: Database; app: Application; review?: Review }) {
  const now = useNow();
  const rubric = db.rubric;
  const [scores, setScores] = useState<Scores>(() => ({ ...(review?.scores ?? {}) }));
  const [rec, setRec] = useState<Recommendation | undefined>(review?.recommendation);
  const [notes, setNotes] = useState(review?.notes ?? "");
  const [issues, setIssues] = useState<string[]>([]);
  const [showInvalid, setShowInvalid] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const ids = rubric.map((c) => c.id);
  const dirty = !sameScores(scores, review?.scores ?? {}, ids) || rec !== review?.recommendation || notes !== (review?.notes ?? "");
  const total = weightedScore(db, { scores });
  const { scored, total: count } = partialScore(db, { scores });
  const provisional = rubric.reduce((s, c) => s + contribution(c, scores[c.id]), 0);

  function validate() {
    const out: string[] = [];
    for (const c of rubric) if (scores[c.id] === undefined) out.push(`Score “${c.label}”.`);
    if (!rec) out.push("Choose a recommendation.");
    return out;
  }

  function persist() {
    return saveReview(app.id, { scores, recommendation: rec, notes });
  }

  async function saveDraft() {
    setSaving(true);
    await sleep(350);
    const r = persist();
    setSaving(false);
    if (r.ok) toast.success("Review draft saved", { description: "Only you can change it. Submit when every criterion is scored." });
    else toast.error(r.error);
  }

  function requestSubmit() {
    const found = validate();
    setIssues(found);
    setShowInvalid(found.length > 0);
    if (found.length) {
      document.getElementById("review-issues")?.focus();
      return;
    }
    setConfirmOpen(true);
  }

  async function submit() {
    await sleep(600);
    const s = persist();
    if (!s.ok) {
      toast.error(s.error);
      return false;
    }
    const r = submitReview(app.id);
    if (!r.ok) {
      toast.error(r.error);
      return false;
    }
    toast.success(`Review submitted — ${r.value}/100`, { description: "Your scores now count toward the average and unlock the final decision." });
  }

  return (
    <Panel aria-labelledby="review-h">
      <LeaveGuard dirty={dirty} what="review scores" />
      <PanelHeader
        title={<span id="review-h">Your review</span>}
        description="Score each criterion from 1 to 5. The weighted total updates as you go."
        actions={review ? <Badge tone="neutral">Draft</Badge> : <Badge tone="blue">Not started</Badge>}
      />

      <TotalCard total={total} provisional={provisional} scored={scored} count={count} />

      <ol className="mt-5 space-y-5">
        {rubric.map((c, i) => {
          const s = scores[c.id];
          const invalid = showInvalid && s === undefined;
          return (
            <li key={c.id} className={cn("border-t border-line pt-5 first:border-0 first:pt-0")}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p id={`crit-${c.id}`} className="text-[15px] font-semibold">
                    <span className="mr-1.5 text-muted tabular">{i + 1}.</span>
                    {c.label}
                  </p>
                  <p className="mt-0.5 text-[13.5px] leading-snug text-muted">{c.description}</p>
                </div>
                <div className="shrink-0 text-right">
                  <Badge tone="neutral" className="tabular">
                    {c.weight}%
                  </Badge>
                  <p className="mt-1 text-[12.5px] text-muted tabular">{s ? `${contribution(c, s)} of ${c.weight} pts` : `— of ${c.weight} pts`}</p>
                </div>
              </div>
              <div className="mt-3">
                <ScoreScale
                  criterion={c}
                  value={s}
                  invalid={invalid}
                  onChange={(n) => {
                    setScores((prev) => ({ ...prev, [c.id]: n }));
                    if (showInvalid) setIssues((prev) => prev.filter((m) => m !== `Score “${c.label}”.`));
                  }}
                />
                {invalid && (
                  <p className="mt-1 flex items-center gap-1.5 text-[13px] text-[#b00d28]">
                    <AlertCircle className="size-3.5" aria-hidden /> Score this criterion before submitting.
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <div className="mt-6 border-t border-line pt-5">
        <Field label="Recommendation" required error={showInvalid && !rec ? "Choose a recommendation before submitting." : undefined}>
          <RadioCards
            name={`rec-${app.id}`}
            value={rec}
            invalid={showInvalid && !rec}
            onChange={(v) => {
              setRec(v);
              setIssues((prev) => prev.filter((m) => m !== "Choose a recommendation."));
            }}
            options={(Object.keys(RECOMMENDATION_META) as Recommendation[]).map((k) => ({
              value: k,
              label: RECOMMENDATION_META[k].label,
              description: RECOMMENDATION_META[k].description,
            }))}
          />
        </Field>
      </div>

      <div className="mt-5">
        <Field label="Notes for the panel" htmlFor={`notes-${app.id}`} hint="Visible to other reviewers and admins — never to the applicant." optional>
          <Textarea
            id={`notes-${app.id}`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What stood out? What would you want to check at interview?"
            className="min-h-[110px]"
          />
        </Field>
      </div>

      {issues.length > 0 && (
        <div id="review-issues" tabIndex={-1} role="alert" className="mt-5 rounded-[12px] border-[1.5px] border-[#c8102e] bg-[#fff5f6] p-4 outline-none">
          <p className="flex items-center gap-2 text-[14.5px] font-semibold text-[#8f0b21]">
            <AlertCircle className="size-4" aria-hidden /> Your review isn&apos;t complete yet
          </p>
          <ul className="mt-2 space-y-1 pl-6 text-[14px] text-[#8f0b21]">
            {issues.map((m) => (
              <li key={m} className="list-disc">
                {m}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-5 border-t border-line pt-4">
        <p className="flex items-center gap-2 text-[13px] text-muted" aria-live="polite">
          {dirty ? (
            <>
              <span className="size-2 rounded-full bg-[#e0a100]" aria-hidden /> Unsaved changes
            </>
          ) : review ? (
            <>
              <CheckCircle2 className="size-3.5 text-leaf-ink" aria-hidden /> Draft saved {fmtRelative(review.updatedAt, now)}
            </>
          ) : (
            "Nothing saved yet"
          )}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button variant="outline" icon={<Save className="size-4" />} loading={saving} disabled={!dirty} onClick={saveDraft}>
            Save draft
          </Button>
          <Button variant="primary" icon={<Send className="size-4" />} onClick={requestSubmit}>
            Submit review
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Submit your review?"
        description="Submitted reviews can't be edited."
        confirmLabel="Submit review"
        confirmVariant="primary"
        onConfirm={submit}
      >
        <div className="space-y-3 text-[14.5px]">
          <div className="flex items-center justify-between rounded-[12px] bg-fog px-4 py-3">
            <span className="text-muted">Weighted total</span>
            <span className="font-display text-[28px] leading-none tabular">
              {total ?? "—"}
              <span className="font-sans text-[13px] text-muted">/100</span>
            </span>
          </div>
          <p className="flex flex-wrap items-center gap-2">
            Recommendation: <RecommendationBadge value={rec} />
          </p>
          <p className="text-muted">Other reviewers and the admins deciding on this application will see your scores and notes. The applicant never sees them.</p>
        </div>
      </ConfirmDialog>
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/* Read-only submitted review                                          */
/* ------------------------------------------------------------------ */

export function ReviewBreakdown({ db, review }: { db: Database; review: Review }) {
  return (
    <ul className="space-y-2.5">
      {db.rubric.map((c) => {
        const s = review.scores[c.id];
        return (
          <li key={c.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-0.5 text-[14px]">
            <span className="font-medium">
              {c.label} <span className="font-normal text-muted tabular">· {c.weight}%</span>
            </span>
            <span className="flex items-center gap-2">
              <ScorePips score={s} />
              <span className="w-7 text-right font-semibold tabular">{s ?? "—"}</span>
            </span>
            <span className="col-span-2 text-[13px] text-muted">{s ? c.anchors[s - 1] : "Not scored"}</span>
          </li>
        );
      })}
    </ul>
  );
}

function SubmittedReview({ db, review, note }: { db: Database; review: Review; note?: string }) {
  const total = weightedScore(db, review);
  return (
    <Panel aria-labelledby="review-h">
      <PanelHeader
        title={<span id="review-h">Your review</span>}
        description={`Submitted ${fmtDateTime(review.submittedAt)}`}
        actions={
          <Badge tone="green" icon={<CheckCircle2 className="size-3.5" aria-hidden />}>
            Submitted
          </Badge>
        }
      />
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] bg-fog p-4">
        <p className="font-display text-[44px] leading-none tracking-[-0.04em] tabular">
          {total ?? "—"}
          <span className="font-sans text-[15px] tracking-normal text-muted">/100</span>
        </p>
        <RecommendationBadge value={review.recommendation} />
      </div>
      <div className="mt-5">
        <ReviewBreakdown db={db} review={review} />
      </div>
      {review.notes && <blockquote className="mt-5 border-l-2 border-line pl-3 text-[14.5px] leading-relaxed text-ink">“{review.notes}”</blockquote>}
      <p className="mt-5 flex items-center gap-1.5 text-[12.5px] text-muted">
        <Lock className="size-3.5" aria-hidden /> {note ?? "Submitted reviews are locked so every score on record is final."}
      </p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/* Entry point                                                         */
/* ------------------------------------------------------------------ */

/** The current persona's own review: editable rubric, locked result, or nothing if they don't review this application. */
export function ReviewPanel({ db, app, meId }: { db: Database; app: Application; meId: ID }) {
  const assigned = isAssignedReviewer(db, meId, app.id);
  const mine = reviewsOf(db, app.id).find((r) => r.reviewerId === meId);
  if (mine?.status === "submitted")
    return <SubmittedReview db={db} review={mine} note={assigned ? undefined : "You're no longer assigned, but your submitted review stays on record."} />;
  if (!assigned) return null;
  const can = canReviewApplication(db, meId, app);
  if (!can.ok)
    return (
      <Panel>
        <PanelHeader title="Your review" actions={mine ? <Badge tone="neutral">Draft not submitted</Badge> : undefined} />
        <Notice tone="neutral" icon={<Lock className="size-4" />}>
          {can.reason}
          {mine ? " Your draft scores are kept but can't be submitted while scoring is closed." : ""}
        </Notice>
        {mine && (
          <div className="mt-4">
            <ReviewBreakdown db={db} review={mine} />
          </div>
        )}
      </Panel>
    );
  return <RubricForm key={app.id} db={db} app={app} review={mine} />;
}
