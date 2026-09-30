"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertCircle, ArrowLeft, Check, CloudOff, Loader2, RotateCcw, Save, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { ApplicationForm, ApplicationSection, Cohort, Application } from "@/lib/domain/types";
import { attachSampleProof, attachSampleToQuestion, runResidenceCheck, submitApplication, type AnswersPatch } from "@/lib/actions/applications";
import { SECTION_LABEL, SECTION_ORDER, validateSection, type Issue } from "@/lib/domain/validation";
import { RESIDENCE_FIXTURES } from "@/lib/sim/residence";
import { useNow } from "@/lib/hooks";
import { useDb, useDemoStore } from "@/lib/store/store";
import { cn, fmtDateLong, fmtDateShort, fmtDateTime, fmtTime, sleep } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/display";
import { ErrorSummary, fieldId } from "@/components/ui/form";
import { ConfirmDialog } from "@/components/ui/overlay";
import { Paragraphs } from "@/components/ui/rich-text";
import { fieldLabel, mergeAnswers, mergePatch, SECTION_COPY } from "./answers";
import { useRegisterSaveExit } from "./apply-frame";
import { useApplicationDraft } from "./use-draft";
import type { StepProps } from "./fields";
import { missingFileQuestions, sampleAnswersFor } from "./samples";
import { AboutStep, IdeaStep, QuestionsStep } from "./steps";
import { ResidenceStep } from "./residence-step";
import { ReviewStep } from "./review-step";
import { daysLeftLabel } from "./window-states";

const EASE = [0.23, 1, 0.32, 1] as const;
const FORM_SECTIONS: ApplicationSection[] = ["about", "idea", "residence", "questions"];

export interface SubmitResult {
  appId: string;
  reference: string;
  resubmitted: boolean;
}

/* ------------------------------------------------------------------ */
/* Save indicator                                                      */
/* ------------------------------------------------------------------ */

function SaveIndicator({ dirty, error, lastSavedAt, onRetry, className }: { dirty: boolean; error: string | null; lastSavedAt?: string; onRetry: () => void; className?: string }) {
  const now = useNow();
  const storageIssue = useDemoStore((s) => s.storageIssue);
  let content: React.ReactNode;
  if (error)
    content = (
      <span className="inline-flex flex-wrap items-center gap-1.5 text-[#b00d28]">
        <AlertCircle className="size-3.5 shrink-0" aria-hidden />
        Couldn&apos;t save —{" "}
        <button type="button" onClick={onRetry} className="font-medium underline underline-offset-2 hover:no-underline">
          retry
        </button>
      </span>
    );
  else if (dirty)
    content = (
      <span className="inline-flex items-center gap-1.5 text-muted">
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
        Saving…
      </span>
    );
  else if (storageIssue && storageIssue.kind !== "corrupt")
    content = (
      <span className="inline-flex items-center gap-1.5 text-[#7a4b00]" title={storageIssue.message}>
        <CloudOff className="size-3.5" aria-hidden />
        Saved for this visit only
      </span>
    );
  else if (lastSavedAt)
    content = (
      <span className="inline-flex items-center gap-1.5 text-muted">
        <Check className="size-3.5 text-leaf-ink" aria-hidden />
        {lastSavedAt.slice(0, 10) === now.slice(0, 10) ? `Saved at ${fmtTime(lastSavedAt)}` : `Last saved ${fmtDateTime(lastSavedAt)}`}
      </span>
    );
  else content = <span className="text-muted">Not saved yet</span>;
  return (
    <p className={cn("text-[13px]", className)} role="status" aria-live="polite">
      {content}
    </p>
  );
}

/* ------------------------------------------------------------------ */
/* Stepper                                                             */
/* ------------------------------------------------------------------ */

interface StepInfo {
  section: ApplicationSection;
  complete: boolean;
  issues: number;
  showIssues: boolean;
  requested: boolean;
}

function stepStatus(s: StepInfo, current: boolean, total: number) {
  if (s.section === "review") return total === 0 ? "Ready to submit" : `${total} left to finish`;
  if (s.requested) return s.showIssues && !s.complete ? `${s.issues} to fix` : "Update requested";
  if (s.complete) return "Complete";
  if (s.showIssues) return `${s.issues} to fix`;
  return current ? "In progress" : "To do";
}

function StepDot({ info, index, current }: { info: StepInfo; index: number; current: boolean }) {
  const done = info.section === "review" ? false : info.complete;
  return (
    <span
      className={cn(
        "grid size-7 shrink-0 place-items-center rounded-full text-[12.5px] font-semibold tabular transition-colors",
        done ? "bg-jade text-void" : current ? "bg-void text-paper" : info.showIssues ? "bg-[#ffe4e6] text-[#9f1239]" : "bg-fog text-void",
      )}
      aria-hidden
    >
      {done ? <Check className="size-3.5" strokeWidth={3} /> : index + 1}
    </span>
  );
}

function StepRail({ steps, section, onGo, totalIssues }: { steps: StepInfo[]; section: ApplicationSection; onGo: (s: ApplicationSection) => void; totalIssues: number }) {
  return (
    <nav aria-label="Application steps">
      <ol className="relative space-y-1">
        {steps.map((s, i) => {
          const current = s.section === section;
          return (
            <li key={s.section} className="relative">
              {i < steps.length - 1 && <span className={cn("absolute left-[25px] top-[42px] h-[calc(100%-30px)] w-px", s.complete ? "bg-jade" : "bg-line")} aria-hidden />}
              <button
                type="button"
                onClick={() => onGo(s.section)}
                aria-current={current ? "step" : undefined}
                className={cn("relative flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5 text-left transition-colors", current ? "bg-fog" : "hover:bg-fog/70")}
              >
                <StepDot info={s} index={i} current={current} />
                <span className="min-w-0 flex-1">
                  <span className={cn("block text-[14.5px] leading-snug", current ? "font-semibold" : "font-medium")}>{SECTION_LABEL[s.section]}</span>
                  <span className={cn("block truncate text-[12.5px]", s.showIssues && !s.complete ? "text-[#b00d28]" : s.requested ? "text-[#7a4b00]" : "text-muted")}>
                    {stepStatus(s, current, totalIssues)}
                  </span>
                </span>
                {s.requested && <RotateCcw className="size-3.5 shrink-0 text-[#7a4b00]" aria-label="Changes requested in this step" />}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function MobileProgress({ steps, section, onGo }: { steps: StepInfo[]; section: ApplicationSection; onGo: (s: ApplicationSection) => void }) {
  const idx = SECTION_ORDER.indexOf(section);
  return (
    <nav aria-label="Application steps" className="mb-5 rounded-[16px] bg-paper p-3 lg:hidden">
      <ol className="grid grid-cols-5 gap-1.5">
        {steps.map((s, i) => {
          const current = s.section === section;
          const done = s.section !== "review" && s.complete;
          return (
            <li key={s.section}>
              <button type="button" onClick={() => onGo(s.section)} aria-current={current ? "step" : undefined} aria-label={`Step ${i + 1}: ${SECTION_LABEL[s.section]}${done ? " (complete)" : ""}`} className="flex h-10 w-full flex-col items-center justify-center gap-1.5 rounded-[8px]">
                <span className={cn("flex h-4 items-center text-[11.5px] font-semibold tabular", current ? "text-void" : done ? "text-leaf-ink" : s.showIssues ? "text-[#b00d28]" : "text-muted")} aria-hidden>
                  {done ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
                </span>
                <span className={cn("h-1.5 w-full rounded-full", current ? "bg-void" : done ? "bg-jade" : s.showIssues ? "bg-[#f4a7b4]" : "bg-ash")} />
              </button>
            </li>
          );
        })}
      </ol>
      <p className="mt-1 px-1 text-[13px] text-muted">
        Step {idx + 1} of {SECTION_ORDER.length} · <span className="font-medium text-void">{SECTION_LABEL[section]}</span>
      </p>
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/* Changes requested banner                                            */
/* ------------------------------------------------------------------ */

function ChangesBanner({ app, onJump }: { app: Application; onJump: (field: string) => void }) {
  const db = useDb();
  const cr = app.changeRequests.find((c) => !c.resolvedAt);
  if (!cr) return null;
  const by = db.users[cr.requestedById];
  return (
    <section aria-labelledby="cr-title" className="mb-6 rounded-[20px] bg-[#fff6dd] p-5 ring-1 ring-[#f5d98a] sm:p-6">
      <div className="flex flex-wrap items-start gap-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#ffe7a3]">
          <RotateCcw className="size-5 text-[#7a4b00]" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="cr-title" className="text-[17px] font-semibold tracking-[-0.01em] text-[#5c3900]">
            {by?.name ?? "Your reviewer"} asked for a few changes
          </h2>
          <p className="text-[13px] text-[#7a4b00]">
            {fmtDateLong(cr.requestedAt)} · {app.reference} · you&apos;ll resubmit under the same reference
          </p>
          <blockquote className="mt-3 border-l-2 border-[#e0b44a] pl-3 text-[15px] leading-relaxed text-ink">
            <Paragraphs text={cr.note} />
          </blockquote>
          <p className="mt-4 text-[13.5px] font-medium text-[#5c3900]">Only these items can be edited — everything else stays locked as you submitted it:</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {cr.fields.map((f) => (
              <li key={f}>
                <button type="button" onClick={() => onJump(f)} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-paper px-3 text-[13.5px] font-medium ring-1 ring-[#e8c56b] transition-colors hover:bg-[#fffdf5]">
                  {fieldLabel(db, app, f)}
                  <span className="text-muted">· {SECTION_LABEL[sectionOf(f)]}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function sectionOf(field: string): ApplicationSection {
  const head = field.split(".")[0];
  return head === "about" || head === "idea" || head === "residence" ? head : "questions";
}

/* ------------------------------------------------------------------ */
/* Wizard                                                              */
/* ------------------------------------------------------------------ */

export function ApplicationWizard({
  app,
  cohort,
  form,
  onSubmitted,
}: {
  app: Application;
  cohort: Cohort;
  form: ApplicationForm | undefined;
  onSubmitted: (r: SubmitResult) => void;
}) {
  const db = useDb();
  const now = useNow();
  const [section, setSection] = useState<ApplicationSection>(app.currentSection);
  const [dir, setDir] = useState(1);
  const [attempted, setAttempted] = useState<Partial<Record<ApplicationSection, boolean>>>(() => (app.status === "changes_requested" ? { about: true, idea: true, residence: true, questions: true } : {}));
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [filling, setFilling] = useState(false);
  const submittingRef = useRef(false);

  const { pending, dirty, error, edit, drop, flush } = useApplicationDraft(app.id, app.currentSection);
  const mode: "draft" | "changes" = app.status === "changes_requested" ? "changes" : "draft";
  const openCR = app.changeRequests.find((c) => !c.resolvedAt);
  const requested = useMemo(() => (mode === "changes" ? (openCR?.fields ?? []) : []), [mode, openCR]);
  const canEdit = useCallback((key: string) => mode === "draft" || requested.includes(key), [mode, requested]);

  const view = useMemo(() => mergeAnswers(app.answers, pending), [app.answers, pending]);
  const virtualApp = useMemo(() => ({ ...app, answers: view }), [app, view]);
  const issuesBy = useMemo(() => {
    const out = {} as Record<ApplicationSection, Issue[]>;
    // When updating requested items, only those items can block (the rest is locked and already accepted).
    for (const s of FORM_SECTIONS) out[s] = validateSection(db, virtualApp, s).filter((i) => mode === "draft" || requested.includes(i.field));
    out.review = [];
    return out;
  }, [db, virtualApp, mode, requested]);
  const allIssues = useMemo(() => FORM_SECTIONS.flatMap((s) => issuesBy[s]), [issuesBy]);

  const requestedSections = useMemo(() => new Set(requested.map(sectionOf)), [requested]);
  const steps: StepInfo[] = SECTION_ORDER.map((s) => ({
    section: s,
    complete: s === "review" ? allIssues.length === 0 : issuesBy[s].length === 0,
    issues: issuesBy[s].length,
    showIssues: !!attempted[s] && issuesBy[s].length > 0,
    requested: requestedSections.has(s),
  }));

  const saveExit = useCallback(() => flush(), [flush]);
  useRegisterSaveExit(saveExit);

  const idx = SECTION_ORDER.indexOf(section);
  const next = SECTION_ORDER[idx + 1];
  const prev = SECTION_ORDER[idx - 1];

  const goTo = (target: ApplicationSection) => {
    if (target === section) return;
    flush({ section: target });
    setDir(SECTION_ORDER.indexOf(target) > idx ? 1 : -1);
    setSection(target);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };

  /** Scroll to and focus a field once its step has rendered (waits out the step transition). */
  const focusField = (field: string, delay: number) => {
    const started = Date.now();
    const attempt = () => {
      const el = document.getElementById(fieldId(field));
      if (!el) {
        if (Date.now() - started < 1500) window.setTimeout(attempt, 60);
        return;
      }
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      (el.querySelector("input:not([disabled]),textarea:not([disabled]),select:not([disabled]),button:not([disabled])") as HTMLElement | null)?.focus({ preventScroll: true });
    };
    window.setTimeout(attempt, delay);
  };

  const jumpToField = (field: string) => {
    const s = sectionOf(field);
    setAttempted((a) => ({ ...a, [s]: true }));
    const moving = s !== section;
    goTo(s);
    focusField(field, moving ? 360 : 0);
  };

  const onContinue = () => {
    flush();
    setAttempted((a) => ({ ...a, [section]: true }));
    if (issuesBy[section].length) {
      window.setTimeout(() => {
        const el = document.querySelector<HTMLElement>("#step-errors [role=alert]");
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
        el?.focus({ preventScroll: true });
      }, 30);
      return;
    }
    if (next) goTo(next);
  };

  const onSubmitClick = () => {
    flush();
    setAttempted({ about: true, idea: true, residence: true, questions: true });
    if (allIssues.length) {
      toast.error(`Finish ${allIssues.length} ${allIssues.length === 1 ? "item" : "items"} before submitting.`);
      const el = document.getElementById("review-issues");
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
      el?.focus({ preventScroll: true });
      return;
    }
    setConfirmOpen(true);
  };

  const doSubmit = async () => {
    if (submittingRef.current) return false;
    submittingRef.current = true;
    if (!flush()) {
      submittingRef.current = false;
      toast.error("We couldn't save your latest changes, so nothing was submitted. Try again.");
      return false;
    }
    await sleep(600);
    const r = submitApplication(app.id);
    submittingRef.current = false;
    if (!r.ok) {
      toast.error(r.error);
      return false;
    }
    toast.success(r.value.resubmitted ? "Changes sent to your reviewer" : "Application submitted", { description: `Reference ${r.value.reference}` });
    onSubmitted({ appId: app.id, reference: r.value.reference ?? "", resubmitted: r.value.resubmitted });
    return true;
  };

  /* ---------------------------- samples ---------------------------- */

  const fillResidence = async () => {
    let did = 0;
    const r = view.residence;
    if (canEdit("residence.address") && !(r.check && (r.check.status === "inside" || r.check.status === "outside"))) {
      const inside = RESIDENCE_FIXTURES.find((f) => f.key === "inside")!;
      await sleep(350);
      const res = runResidenceCheck(app.id, inside.input, inside.key);
      if (!res.ok) toast.error(res.error);
      else {
        drop(["residence.address"]);
        did++;
      }
    }
    const proof = r.proofDocumentId ? db.documents[r.proofDocumentId] : undefined;
    if (canEdit("residence.proof") && (!proof || proof.removedAt)) {
      const res = attachSampleProof(app.id, "utility");
      if (!res.ok) toast.error(res.error);
      else did++;
    }
    return did;
  };

  const fillSection = async (s: ApplicationSection) => {
    if (s === "residence") return fillResidence();
    const { patch, filled } = sampleAnswersFor(db, virtualApp, s, canEdit);
    let did = filled.length;
    if (did) edit(patch);
    if (s === "questions") {
      const probe = { ...virtualApp, answers: mergeAnswers(virtualApp.answers, patch) };
      for (const q of missingFileQuestions(db, probe, canEdit)) {
        const res = attachSampleToQuestion(app.id, q.id);
        if (res.ok) did++;
      }
    }
    return did;
  };

  const onFill = async () => {
    setFilling(true);
    let did = 0;
    if (section === "review") {
      let patch: AnswersPatch = {};
      for (const s of ["about", "idea", "questions"] as ApplicationSection[]) {
        const r = sampleAnswersFor(db, virtualApp, s, canEdit);
        patch = mergePatch(patch, r.patch);
        did += r.filled.length;
      }
      if (did) edit(patch);
      const probe = { ...virtualApp, answers: mergeAnswers(virtualApp.answers, patch) };
      for (const q of missingFileQuestions(db, probe, canEdit)) if (attachSampleToQuestion(app.id, q.id).ok) did++;
      did += await fillResidence();
    } else {
      did = await fillSection(section);
    }
    flush();
    setFilling(false);
    if (did) toast.success(`Filled ${did} ${did === 1 ? "answer" : "answers"} with fictional samples`, { description: mode === "changes" ? "Only the items your reviewer asked about were changed." : "Existing answers were kept." });
    else toast(section === "review" ? "Nothing left to fill — every editable answer is complete." : "Nothing to fill — this step is already complete.");
  };

  /* ----------------------------- render ---------------------------- */

  const stepProps: StepProps = {
    app,
    view,
    virtualApp,
    cohort,
    issues: issuesBy[section],
    showErrors: !!attempted[section],
    edit,
    drop,
    flush: () => flush(),
    canEdit,
    requested,
  };

  const deadline = form ? `Closes ${fmtDateLong(form.closesAt)} · ${daysLeftLabel(form.closesAt, now)}` : undefined;
  const sectionIssues = attempted[section] ? issuesBy[section] : [];

  return (
    <div>
      {mode === "changes" && <ChangesBanner app={app} onJump={jumpToField} />}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[272px_minmax(0,1fr)] lg:gap-10">
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <div className="rounded-[20px] bg-paper p-5">
              <Eyebrow>{mode === "changes" ? "Updating your application" : "Applying to"}</Eyebrow>
              <p className="mt-1.5 font-display text-[28px] leading-none tracking-[-0.03em]">{cohort.name}</p>
              <p className="mt-2 text-[13px] text-muted">{mode === "changes" ? `Reference ${app.reference}` : deadline}</p>
              <div className="mt-5 border-t border-line pt-4">
                <StepRail steps={steps} section={section} onGo={goTo} totalIssues={allIssues.length} />
              </div>
            </div>
            <div className="rounded-[20px] bg-paper p-5">
              <SaveIndicator dirty={dirty} error={error} lastSavedAt={app.lastSavedAt} onRetry={() => flush()} />
              <p className="mt-1 text-[12.5px] leading-snug text-muted">Answers save automatically as you type. Leave any time and pick up where you stopped.</p>
              <Button
                size="sm"
                variant="outline"
                className="mt-3 w-full"
                icon={<Save className="size-4" />}
                onClick={() => {
                  if (flush()) toast.success(dirty ? "Progress saved" : "All changes are saved");
                }}
              >
                Save progress
              </Button>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <MobileProgress steps={steps} section={section} onGo={goTo} />
          <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 lg:hidden">
            <p className="text-[13px] text-muted">{mode === "changes" ? `${cohort.name} · ${app.reference}` : `${cohort.name}${form ? ` · closes ${fmtDateShort(form.closesAt)}` : ""}`}</p>
            <SaveIndicator dirty={dirty} error={error} lastSavedAt={app.lastSavedAt} onRetry={() => flush()} />
          </div>

          <AnimatePresence mode="wait" initial={false} custom={dir}>
            <motion.div
              key={section}
              custom={dir}
              variants={{
                enter: (d: number) => ({ opacity: 0, x: 18 * d }),
                center: { opacity: 1, x: 0 },
                exit: (d: number) => ({ opacity: 0, x: -18 * d }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2, ease: EASE }}
            >
              <header className="mb-5 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0 max-w-2xl">
                  <Eyebrow className="hidden lg:block">
                    Step {idx + 1} of {SECTION_ORDER.length}
                  </Eyebrow>
                  <h1 className="mt-1 font-display text-[32px] leading-[1.05] tracking-[-0.035em] sm:text-[42px]">{SECTION_LABEL[section]}</h1>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted">{SECTION_COPY[section]}</p>
                </div>
                <Button variant="outline" size="sm" icon={<Sparkles className="size-4" />} loading={filling} onClick={() => void onFill()} className="self-start sm:self-end">
                  {section === "review" ? "Fill every gap with samples" : "Fill with sample answers"}
                </Button>
              </header>

              {sectionIssues.length > 0 && section !== "review" && (
                <div id="step-errors" className="mb-4">
                  <ErrorSummary title={`${sectionIssues.length} ${sectionIssues.length === 1 ? "answer needs" : "answers need"} attention`} issues={sectionIssues} />
                </div>
              )}

              {section === "about" && <AboutStep {...stepProps} />}
              {section === "idea" && <IdeaStep {...stepProps} />}
              {section === "residence" && <ResidenceStep {...stepProps} />}
              {section === "questions" && <QuestionsStep {...stepProps} />}
              {section === "review" && <ReviewStep p={stepProps} allIssues={allIssues} onEdit={goTo} onJump={(i) => jumpToField(i.field)} mode={mode} />}
            </motion.div>
          </AnimatePresence>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              {prev && (
                <Button variant="ghost" icon={<ArrowLeft className="size-4" />} onClick={() => goTo(prev)}>
                  Back
                </Button>
              )}
              <Button
                variant="ghost"
                className="lg:hidden"
                icon={<Save className="size-4" />}
                onClick={() => {
                  if (flush()) toast.success(dirty ? "Progress saved" : "All changes are saved");
                }}
              >
                Save progress
              </Button>
            </div>
            {section === "review" ? (
              <Button size="lg" icon={<Send className="size-4" />} onClick={onSubmitClick} className="w-full sm:w-auto">
                {mode === "changes" ? "Resubmit application" : "Submit application"}
              </Button>
            ) : (
              <Button size="lg" arrow onClick={onContinue} className="w-full sm:w-auto">
                Continue to {SECTION_LABEL[next!]}
              </Button>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={mode === "changes" ? "Resubmit your application?" : `Submit your ${cohort.name} application?`}
        description={mode === "changes" ? `Your updates go back to your reviewer under ${app.reference}.` : "You can't edit your answers after submitting unless a reviewer asks for changes."}
        confirmLabel={mode === "changes" ? "Resubmit" : "Submit application"}
        confirmVariant="primary"
        onConfirm={doSubmit}
      >
        <ul className="space-y-2 text-[14.5px] leading-relaxed">
          <li className="flex gap-2">
            <Check className="mt-1 size-4 shrink-0 text-leaf-ink" aria-hidden />
            {mode === "changes" ? "Only the items your reviewer asked about have changed." : "Your answers are complete and saved."}
          </li>
          <li className="flex gap-2">
            <Check className="mt-1 size-4 shrink-0 text-leaf-ink" aria-hidden />
            Your proof of residence stays restricted to you and your assigned reviewers.
          </li>
          <li className="flex gap-2">
            <Check className="mt-1 size-4 shrink-0 text-leaf-ink" aria-hidden />
            You&apos;ll get a (simulated) confirmation email and can follow the status from your dashboard.
          </li>
        </ul>
      </ConfirmDialog>
    </div>
  );
}
