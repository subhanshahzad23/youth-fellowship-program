"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, ChevronDown, ChevronLeft, FilePenLine, Hourglass, RotateCcw, Send } from "lucide-react";
import { toast } from "sonner";
import type { Submission } from "@/lib/domain/types";
import { reviewSubmission } from "@/lib/actions/learning";
import { canEditTrack, canReviewSubmission } from "@/lib/domain/permissions";
import { taskBlockOf } from "@/lib/domain/selectors";
import { useNow } from "@/lib/hooks";
import { useDb, useMe } from "@/lib/store/store";
import { cn, fmtDateTime, fmtRelative, sleep, wordCount } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, Notice, Panel, RestrictedState } from "@/components/ui/display";
import { Field, Textarea } from "@/components/ui/form";
import { ConfirmDialog } from "@/components/ui/overlay";
import { TaskBrief } from "./assignment-panel";
import { latestFeedback } from "./data";
import { SubmissionStatusBadge } from "./meta";
import { AttachmentList, SubmissionHistory } from "./submission-history";

/** Instructor review of one submission: latest version, history, and the decision. */
export function ReviewPanel({ sub, onBack }: { sub: Submission; onBack: () => void }) {
  const db = useDb();
  const me = useMe()!;
  const now = useNow();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [decision, setDecision] = useState<"approved" | "changes_requested" | null>(null);
  const [briefOpen, setBriefOpen] = useState(false);

  const access = canReviewSubmission(db, me.id, sub);
  const fellow = db.users[sub.fellowId];
  const session = db.sessions[sub.sessionId];
  const mod = session ? db.modules[session.moduleId] : undefined;
  const cohort = db.cohorts[sub.cohortId];
  const track = mod ? db.tracks[mod.trackId] : undefined;
  const task = taskBlockOf(session?.published);
  const version = sub.versions[sub.versions.length - 1];
  const lastFb = latestFeedback(sub);
  const first = fellow?.firstName ?? "the fellow";
  const canOpenEditor = mod ? canEditTrack(db, me.id, mod.trackId).ok : false;

  const back = (
    <button type="button" onClick={onBack} className="mb-3 inline-flex h-10 items-center gap-1 rounded-[8px] pr-2 text-[14px] text-muted hover:text-void lg:hidden">
      <ChevronLeft className="size-4" aria-hidden /> All submissions
    </button>
  );

  if (!access.ok)
    return (
      <div>
        {back}
        <Panel>
          <RestrictedState title="You can't review this submission" reason={access.reason} />
        </Panel>
      </div>
    );

  function open(d: "approved" | "changes_requested") {
    if (!text.trim()) {
      setError(d === "approved" ? `Add a short note for ${first} — what worked and what to carry forward.` : `Explain what ${first} should change before they resubmit.`);
      document.getElementById("review-feedback")?.focus();
      return;
    }
    setError(null);
    setDecision(d);
  }

  async function confirm() {
    if (!decision) return true;
    await sleep(600);
    const r = reviewSubmission(sub.id, decision, text);
    if (!r.ok) {
      setError(r.error);
      toast.error(r.error);
      return true;
    }
    toast.success(decision === "approved" ? `Approved ${first}'s submission` : `Changes requested from ${first}`, {
      description: decision === "approved" ? "The session is now complete in their progress." : "They've been notified and can resubmit.",
    });
    setText("");
    return true;
  }

  return (
    <div className="min-w-0">
      {back}
      <Panel className="p-0 sm:p-0">
        {/* Header */}
        <div className="flex flex-wrap items-start gap-4 border-b border-line p-5 sm:p-6">
          <Avatar name={fellow?.name ?? "?"} hue={fellow?.avatarHue} size={48} />
          <div className="min-w-0 flex-1">
            <h2 className="text-[20px] font-semibold leading-snug tracking-[-0.01em]">{fellow?.name ?? "Former fellow"}</h2>
            <p className="text-[13.5px] text-muted">
              {cohort?.name}
              {track && ` · ${track.name}`}
              {fellow?.ventureName && ` · ${fellow.ventureName}`}
            </p>
          </div>
          <div className="basis-full pl-16 sm:basis-auto sm:pl-0">
            <SubmissionStatusBadge sub={sub} />
          </div>
        </div>

        <div className="space-y-6 p-5 sm:p-6">
          {/* Session */}
          <div>
            <p className="eyebrow text-muted">
              Module {mod?.order} · {mod?.title}
            </p>
            <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-[17px] font-semibold">{session?.published?.title ?? "Session removed"}</h3>
              {canOpenEditor && session && (
                <Link href={`/staff/content/${session.moduleId}?s=${session.id}`} className="inline-flex items-center gap-1.5 text-[13.5px] text-muted hover:text-void hover:underline">
                  <FilePenLine className="size-3.5" aria-hidden /> Open in editor
                </Link>
              )}
            </div>
            {task && (
              <div className="mt-3 rounded-[14px] ring-[1.5px] ring-line">
                <button type="button" onClick={() => setBriefOpen((v) => !v)} aria-expanded={briefOpen} className="flex min-h-11 w-full items-center justify-between gap-2 px-4 text-left text-[14px] font-medium">
                  <span>
                    Assignment brief and rubric <span className="font-normal text-muted">· {task.title}</span>
                  </span>
                  <ChevronDown className={cn("size-4 shrink-0 transition-transform duration-200", briefOpen && "rotate-180")} aria-hidden />
                </button>
                {briefOpen && (
                  <div className="border-t border-line p-4">
                    <TaskBrief task={task} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Latest version */}
          {version && (
            <div>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-[15px] font-semibold">
                  Version {sub.versions.length}
                  {sub.versions.length > 1 && <span className="ml-2 font-normal text-muted">(resubmission)</span>}
                </h3>
                <span className="text-[13px] text-muted" title={fmtDateTime(version.submittedAt)}>
                  Submitted {fmtRelative(version.submittedAt, now)} · {wordCount(version.text)} words
                </span>
              </div>
              <div className="mt-2 whitespace-pre-wrap rounded-[14px] bg-fog p-4 text-[15px] leading-relaxed text-ink sm:p-5">{version.text}</div>
              <div className="mt-3">
                <AttachmentList ids={version.attachmentIds} emptyLabel="No attachments with this version." />
              </div>
            </div>
          )}

          {/* Decision */}
          {sub.status === "submitted" ? (
            <div className="rounded-[16px] bg-[#fafafa] p-4 ring-1 ring-line sm:p-5">
              {sub.versions.length > 1 && lastFb?.decision === "changes_requested" && (
                <p className="mb-3 text-[13.5px] text-muted">
                  You asked for changes {fmtRelative(lastFb.at, now)}: <span className="italic text-ink">“{lastFb.text.length > 140 ? `${lastFb.text.slice(0, 140)}…` : lastFb.text}”</span>
                </p>
              )}
              <Field
                label={`Feedback for ${first}`}
                htmlFor="review-feedback"
                hint={`${first} sees this exactly as written. Be specific about what works and what to change.`}
                error={error ?? undefined}
                required
              >
                <Textarea
                  id="review-feedback"
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    if (error) setError(null);
                  }}
                  rows={5}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={`review-feedback-hint${error ? " review-feedback-error" : ""}`}
                  placeholder={`e.g. Strong evidence in your write-ups. Next, lead your synthesis with the pattern about…`}
                />
              </Field>
              <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button variant="outline" icon={<RotateCcw className="size-4" />} onClick={() => open("changes_requested")}>
                  Request changes
                </Button>
                <Button icon={<CheckCircle2 className="size-4" />} onClick={() => open("approved")}>
                  Approve
                </Button>
              </div>
            </div>
          ) : sub.status === "changes_requested" ? (
            <Notice tone="amber" icon={<Hourglass className="size-4" aria-hidden />} title={`Waiting for ${first} to resubmit`}>
              You requested changes {fmtRelative(lastFb?.at, now)}. You&apos;ll get a notification when a new version arrives.
            </Notice>
          ) : sub.status === "reviewed" ? (
            <Notice tone="green" icon={<CheckCircle2 className="size-4 text-leaf-ink" aria-hidden />} title="Approved — session complete">
              {lastFb?.decision === "approved" ? `${db.users[lastFb.authorId]?.name ?? "An instructor"} approved version ${sub.versions.length} ${fmtRelative(lastFb.at, now)}.` : "This assignment didn't need a review."}
            </Notice>
          ) : null}

          <SubmissionHistory sub={sub} className="border-t border-line pt-6" />
        </div>
      </Panel>

      <ConfirmDialog
        open={!!decision}
        onOpenChange={(v) => !v && setDecision(null)}
        title={decision === "approved" ? `Approve ${first}'s submission?` : `Request changes from ${first}?`}
        description={
          decision === "approved"
            ? `${first} will be notified and “${session?.published?.title}” will count as complete in their progress.`
            : `${first} will be notified and can edit and resubmit. Version ${sub.versions.length} stays in the history.`
        }
        confirmLabel={decision === "approved" ? "Approve" : "Request changes"}
        confirmVariant={decision === "approved" ? "primary" : "dark"}
        onConfirm={confirm}
      >
        <div className="rounded-[12px] bg-fog p-3 text-[14px] leading-relaxed">
          <p className="mb-1 flex items-center gap-1.5 text-[12.5px] font-medium text-muted">
            <Send className="size-3.5" aria-hidden /> Your feedback
          </p>
          <p className="whitespace-pre-line text-ink">{text}</p>
        </div>
      </ConfirmDialog>
    </div>
  );
}

