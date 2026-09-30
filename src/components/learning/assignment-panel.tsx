"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, CircleCheck, Hourglass, Loader2, Lock, Package, Paperclip, RotateCcw, Save, Send, TriangleAlert, UserRoundCheck } from "lucide-react";
import { toast } from "sonner";
import type { DocumentRecord, Session } from "@/lib/domain/types";
import { MIN_SUBMISSION_WORDS, attachToSubmission, removeSubmissionAttachment, saveSubmissionDraft, submitAssignment } from "@/lib/actions/learning";
import { submissionFor } from "@/lib/domain/selectors";
import { deleteFileBytes } from "@/lib/files";
import { useNow } from "@/lib/hooks";
import { useDb, useMe } from "@/lib/store/store";
import { cn, fmtDateTime, fmtRelative, sleep, wordCount } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge, Notice } from "@/components/ui/display";
import { DocumentRow, FileDrop } from "@/components/ui/files";
import { ConfirmDialog } from "@/components/ui/overlay";
import { RichText } from "./blocks";
import { instructorNameForFellow, latestFeedback, type TaskBlock } from "./data";
import { AttachmentList, FeedbackItem, SubmissionHistory } from "./submission-history";

export const SAMPLE_NOTES = { name: "sample-interview-notes.pdf", mime: "application/pdf", size: 1736, sampleUrl: "/samples/sample-interview-notes.pdf" };

/* ------------------------------------------------------------------ */
/* Shared pieces (also used by the instructor preview)                 */
/* ------------------------------------------------------------------ */

export function TaskHeader({ task, badge, reviewer }: { task: TaskBlock; badge?: React.ReactNode; reviewer?: string }) {
  return (
    <div className="dots-dark px-5 py-6 text-paper sm:px-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow text-muted-display">Assignment</p>
          <h2 className="mt-2 font-display text-[28px] leading-[1.08] tracking-[-0.03em] sm:text-[32px]">{task.title || "Untitled assignment"}</h2>
        </div>
        {badge}
      </div>
      <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13.5px] text-[#cfcfcf]">
        <span className="inline-flex items-center gap-1.5">
          {task.requiresReview ? <UserRoundCheck className="size-4" aria-hidden /> : <CircleCheck className="size-4" aria-hidden />}
          {task.requiresReview ? `Reviewed by ${reviewer ?? "your track instructor"}` : "Completes when you submit"}
        </span>
        <span>At least {MIN_SUBMISSION_WORDS} words</span>
      </p>
    </div>
  );
}

export function TaskBrief({ task }: { task: TaskBlock }) {
  return (
    <div className="grid gap-5">
      <div>
        <h3 className="text-[15px] font-semibold text-void">What to do</h3>
        <div className="mt-1.5 text-[15.5px] leading-relaxed text-ink [&_p]:my-0 [&_p+p]:mt-3">
          <RichText text={task.instructions} />
        </div>
      </div>
      {task.deliverable && (
        <div className="flex gap-3 rounded-[14px] bg-fog p-4">
          <Package className="mt-0.5 size-5 shrink-0" aria-hidden />
          <div>
            <p className="text-[14px] font-semibold text-void">What to hand in</p>
            <p className="mt-0.5 text-[14.5px] leading-relaxed text-ink">{task.deliverable}</p>
          </div>
        </div>
      )}
      {!!task.rubric?.filter((r) => r.trim()).length && (
        <div>
          <h3 className="text-[15px] font-semibold text-void">How it&apos;s reviewed</h3>
          <ul className="m-0 mt-2 list-none space-y-2 p-0">
            {task.rubric.filter((r) => r.trim()).map((r, i) => (
              <li key={i} className="m-0 flex gap-2.5 text-[14.5px] leading-relaxed text-ink">
                <CheckCircle2 className="mt-[3px] size-4 shrink-0 text-leaf-ink" aria-hidden />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Instructor preview of an assignment: same brief, inert response area. */
export function TaskPreview({ task }: { task: TaskBlock }) {
  return (
    <section id="assignment" className="scroll-mt-24 overflow-hidden rounded-[20px] ring-[1.5px] ring-line">
      <TaskHeader task={task} reviewer="the track instructor" badge={<Badge tone="neutral">Preview</Badge>} />
      <div className="space-y-6 bg-paper px-5 py-6 sm:px-7">
        <TaskBrief task={task} />
        <div>
          <h3 className="text-[15px] font-semibold text-void">Your response</h3>
          <div className="mt-2 min-h-[120px] rounded-[8px] border-[1.5px] border-dashed border-line bg-[#fafafa] p-3.5 text-[14.5px] text-muted">
            Fellows write their response here, attach files, and submit{task.requiresReview ? " for review" : ""}.
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Fellow panel                                                        */
/* ------------------------------------------------------------------ */

const STATUS_BADGE = {
  none: <Badge tone="neutral">Not started</Badge>,
  draft: <Badge tone="blue">Draft</Badge>,
  submitted: (
    <Badge tone="purple" icon={<Hourglass className="size-3.5" aria-hidden />}>
      Awaiting review
    </Badge>
  ),
  changes_requested: (
    <Badge tone="amber" icon={<RotateCcw className="size-3.5" aria-hidden />}>
      Changes requested
    </Badge>
  ),
  reviewed: (
    <Badge tone="green" icon={<CheckCircle2 className="size-3.5" aria-hidden />}>
      Complete
    </Badge>
  ),
};

export function AssignmentPanel({ session, task }: { session: Session; task: TaskBlock }) {
  const db = useDb();
  const me = useMe()!;
  const now = useNow();
  const sub = useMemo(() => submissionFor(db, me.id, session.id), [db, me.id, session.id]);
  const instructor = useMemo(() => instructorNameForFellow(db, me.id), [db, me.id]);
  const status = sub?.status ?? "none";
  const editable = status === "none" || status === "draft" || status === "changes_requested";
  const savedText = sub?.draftText ?? "";

  const [text, setText] = useState(savedText);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [attaching, setAttaching] = useState(false);
  const [removing, setRemoving] = useState<DocumentRecord | null>(null);

  const textRef = useRef(text);
  const timerRef = useRef<number | null>(null);
  const sessionId = session.id;

  const words = wordCount(text);
  const enough = words >= MIN_SUBMISSION_WORDS;
  const dirty = editable && text !== savedText;

  const attachments = useMemo(
    () => (sub?.draftAttachmentIds ?? []).map((id) => db.documents[id]).filter((d): d is DocumentRecord => !!d && !d.removedAt),
    [sub, db.documents],
  );
  const hasSample = attachments.some((d) => d.sampleUrl === SAMPLE_NOTES.sampleUrl);
  const lastFb = latestFeedback(sub);
  const latestVersion = sub?.versions[sub.versions.length - 1];

  function persist(t: string, explicit = false) {
    const r = saveSubmissionDraft(sessionId, t);
    if (r.ok) {
      setSaveError(null);
      if (explicit) toast.success("Draft saved", { description: "Only you can see drafts until you submit." });
    } else {
      setSaveError(r.error);
      if (explicit) toast.error(r.error);
    }
    return r.ok;
  }

  function clearTimer() {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = null;
  }

  // Flush a pending autosave if the fellow navigates away mid-sentence (in-app or reload/close).
  useEffect(() => {
    const flush = () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
        saveSubmissionDraft(sessionId, textRef.current);
      }
    };
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
        saveSubmissionDraft(sessionId, textRef.current);
      }
    };
  }, [sessionId]);

  function onChange(v: string) {
    setText(v);
    textRef.current = v;
    setSubmitError(null);
    clearTimer();
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      persist(textRef.current);
    }, 1200);
  }

  async function saveNow() {
    clearTimer();
    setSaving(true);
    await sleep(300);
    persist(textRef.current, true);
    setSaving(false);
  }

  function trySubmit() {
    if (!enough) {
      setSubmitError(`Write at least ${MIN_SUBMISSION_WORDS} words before submitting — you have ${words}.`);
      document.getElementById("assignment-response")?.focus();
      return;
    }
    setSubmitError(null);
    setConfirmOpen(true);
  }

  async function doSubmit() {
    clearTimer();
    await sleep(600);
    // Make sure the exact text on screen is what gets submitted.
    if (!persist(textRef.current)) return true;
    const r = submitAssignment(sessionId);
    if (!r.ok) {
      setSubmitError(r.error);
      toast.error(r.error);
      return true;
    }
    toast.success(r.value.completed ? "Submitted — session complete" : status === "changes_requested" ? "Resubmitted for review" : "Submitted for review", {
      description: r.value.completed ? "Nice work. This assignment doesn't need a review." : `${instructor} will get a notification and review it.`,
    });
    window.setTimeout(() => document.getElementById("assignment")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    return true;
  }

  async function attachSample() {
    setAttaching(true);
    await sleep(450);
    const r = attachToSubmission(sessionId, SAMPLE_NOTES);
    setAttaching(false);
    if (r.ok) toast.success("Sample notes attached");
    else toast.error(r.error);
  }

  function onStored(file: { name: string; mime: string; size: number; blobKey: string }) {
    const r = attachToSubmission(sessionId, file);
    if (r.ok) toast.success(`${file.name} attached`);
    else {
      toast.error(r.error);
      void deleteFileBytes(file.blobKey);
    }
  }

  async function doRemove() {
    if (!removing) return true;
    await sleep(250);
    const doc = removing;
    const referenced = sub?.versions.some((v) => v.attachmentIds.includes(doc.id));
    const r = removeSubmissionAttachment(sessionId, doc.id);
    if (!r.ok) {
      toast.error(r.error);
      return true;
    }
    if (doc.blobKey && !referenced) void deleteFileBytes(doc.blobKey);
    toast.success(`${doc.name} removed`);
    setRemoving(null);
    return true;
  }

  const saveLine = saving ? (
    <span className="inline-flex items-center gap-1.5">
      <Loader2 className="size-3.5 animate-spin" aria-hidden /> Saving…
    </span>
  ) : saveError ? (
    <span className="inline-flex items-center gap-1.5 text-[#b00d28]">
      <TriangleAlert className="size-3.5" aria-hidden /> Couldn&apos;t save: {saveError}
    </span>
  ) : dirty ? (
    <span>Unsaved changes · autosaving…</span>
  ) : sub?.draftSavedAt ? (
    <span className="inline-flex items-center gap-1.5">
      <CheckCircle2 className="size-3.5 text-leaf-ink" aria-hidden /> Draft saved {fmtRelative(sub.draftSavedAt, now)}
    </span>
  ) : (
    <span>Drafts save automatically as you type</span>
  );

  return (
    <section id="assignment" className="scroll-mt-24 overflow-hidden rounded-[20px] ring-[1.5px] ring-line" aria-labelledby="assignment-h">
      <span id="assignment-h" className="sr-only">
        Assignment: {task.title}
      </span>
      <TaskHeader task={task} reviewer={instructor} badge={STATUS_BADGE[status]} />

      <div className="space-y-7 bg-paper px-5 py-6 sm:px-7 sm:py-7">
        {status === "changes_requested" && lastFb && (
          <div className="rounded-[14px] bg-[#fff6dd] p-4 sm:p-5">
            <p className="mb-3 flex items-center gap-2 text-[14.5px] font-semibold text-[#7a4b00]">
              <RotateCcw className="size-4" aria-hidden /> Your instructor asked for changes
            </p>
            <FeedbackItem f={lastFb} compact />
            <p className="mt-3 text-[13.5px] text-[#7a4b00]">Update your response below, then resubmit. Your earlier version stays in the history.</p>
          </div>
        )}
        {status === "submitted" && latestVersion && (
          <Notice tone="purple" icon={<Hourglass className="size-4" aria-hidden />} title={`With ${instructor} for review`}>
            You submitted version {sub!.versions.length} {fmtRelative(latestVersion.submittedAt, now)}. Editing is locked while it&apos;s in review — you&apos;ll get a notification when {instructor.split(" ")[0]} responds.
          </Notice>
        )}
        {status === "reviewed" && (
          <Notice tone="green" icon={<CheckCircle2 className="size-4 text-leaf-ink" aria-hidden />} title="Assignment complete">
            {lastFb?.decision === "approved"
              ? `${db.users[lastFb.authorId]?.name ?? "Your instructor"} approved version ${sub!.versions.length} ${fmtRelative(lastFb.at, now)}.`
              : `Submitted ${fmtRelative(latestVersion?.submittedAt, now)} — this assignment doesn't need a review.`}
          </Notice>
        )}

        <TaskBrief task={task} />

        <div className="border-t border-line pt-6">
          {editable ? (
            <>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <label htmlFor="assignment-response" className="text-[15px] font-semibold text-void">
                  Your response
                </label>
                <span className={cn("tabular text-[13px]", enough ? "text-leaf-ink" : "text-muted")} aria-live="polite">
                  {enough && <CheckCircle2 className="mr-1 inline size-3.5 -translate-y-px" aria-hidden />}
                  {words} {words === 1 ? "word" : "words"} · minimum {MIN_SUBMISSION_WORDS}
                </span>
              </div>
              <textarea
                id="assignment-response"
                value={text}
                onChange={(e) => onChange(e.target.value)}
                rows={10}
                placeholder="Write your response here. Paste your interview notes, your synthesis, or a summary of what you attached."
                aria-describedby="assignment-save-status"
                aria-invalid={submitError ? true : undefined}
                className="mt-2 min-h-[220px] w-full resize-y rounded-[10px] border-[1.5px] border-line bg-paper px-3.5 py-3 text-[15.5px] leading-relaxed text-void placeholder:text-[#8a8a8a] transition-colors hover:border-[#b9c0c6] focus:border-void focus:outline-none aria-[invalid=true]:border-[#c8102e]"
              />
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <p id="assignment-save-status" className="text-[13px] text-muted" aria-live="polite">
                  {saveLine}
                </p>
                <Button size="sm" variant="soft" icon={<Save className="size-4" />} onClick={() => void saveNow()} loading={saving}>
                  Save draft
                </Button>
              </div>

              <div className="mt-6">
                <h3 className="flex items-center gap-2 text-[15px] font-semibold text-void">
                  <Paperclip className="size-4" aria-hidden /> Attachments <span className="font-normal text-muted">(optional)</span>
                </h3>
                {attachments.length > 0 && (
                  <ul className="m-0 mt-3 list-none space-y-2 p-0">
                    {attachments.map((d) => (
                      <li key={d.id} className="m-0">
                        <DocumentRow doc={d} removable onRemove={() => setRemoving(d)} />
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-3 grid gap-2">
                  <FileDrop compact onStored={onStored} label="Upload your write-up" hint="PDF, PNG, JPG or WebP · up to 8 MB" />
                  <div className="flex flex-wrap items-center gap-2 text-[13px] text-muted">
                    <Button size="sm" variant="outline" icon={<Paperclip className="size-4" />} onClick={() => void attachSample()} loading={attaching} disabled={hasSample}>
                      {hasSample ? "Sample notes attached" : "Attach sample notes"}
                    </Button>
                    <span>No file handy? Attach a bundled sample PDF instead.</span>
                  </div>
                </div>
              </div>

              {submitError && (
                <p role="alert" className="mt-5 flex items-start gap-2 rounded-[10px] bg-[#fff1f2] px-3.5 py-2.5 text-[14px] text-[#9f1239]">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                  {submitError}
                </p>
              )}

              <div className="mt-6 flex flex-col gap-3 rounded-[14px] bg-fog p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[13.5px] leading-snug text-muted">
                  {task.requiresReview
                    ? `${instructor} reviews your submission. You can't edit while it's in review.`
                    : "This assignment is complete as soon as you submit it."}
                </p>
                <Button arrow icon={<Send className="size-4" />} onClick={trySubmit} className="w-full sm:w-auto">
                  {status === "changes_requested" ? "Resubmit" : task.requiresReview ? "Submit for review" : "Submit"}
                </Button>
              </div>
            </>
          ) : (
            latestVersion && (
              <div>
                <h3 className="flex items-center gap-2 text-[15px] font-semibold text-void">
                  <Lock className="size-4 text-muted" aria-hidden /> Your submission · version {sub!.versions.length}
                </h3>
                <p className="mt-0.5 text-[13px] text-muted">Submitted {fmtDateTime(latestVersion.submittedAt)}</p>
                <div className="mt-3 whitespace-pre-wrap rounded-[12px] bg-fog p-4 text-[15px] leading-relaxed text-ink">{latestVersion.text}</div>
                <div className="mt-3">
                  <AttachmentList ids={latestVersion.attachmentIds} />
                </div>
              </div>
            )
          )}
        </div>

        {sub && (sub.versions.length > 0 || sub.feedback.length > 0) && <SubmissionHistory sub={sub} className="border-t border-line pt-6" />}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={status === "changes_requested" ? "Resubmit your assignment?" : "Submit your assignment?"}
        description={
          task.requiresReview
            ? `${instructor} will be notified and review version ${(sub?.versions.length ?? 0) + 1}. Editing is locked until they respond.`
            : "This assignment doesn't need a review, so the session will be marked complete."
        }
        confirmLabel={status === "changes_requested" ? "Resubmit" : "Submit"}
        confirmVariant="primary"
        onConfirm={doSubmit}
      >
        <ul className="space-y-1.5 text-[14px] text-ink">
          <li className="flex gap-2">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-leaf-ink" aria-hidden /> {words} words written
          </li>
          <li className="flex gap-2">
            <Paperclip className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden /> {attachments.length ? `${attachments.length} attachment${attachments.length === 1 ? "" : "s"}` : "No attachments"}
          </li>
        </ul>
      </ConfirmDialog>
      <ConfirmDialog
        open={!!removing}
        onOpenChange={(v) => !v && setRemoving(null)}
        title="Remove this attachment?"
        description={removing ? `${removing.name} will be removed from your draft.` : undefined}
        confirmLabel="Remove"
        confirmVariant="danger"
        onConfirm={doRemove}
      />
    </section>
  );
}
