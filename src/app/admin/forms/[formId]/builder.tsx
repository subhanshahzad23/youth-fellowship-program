"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AlertCircle, ArrowLeft, CalendarClock, CheckCircle2, Eye, History, Plus, Rocket, Save, Undo2 } from "lucide-react";
import type { FormQuestion, QuestionKind } from "@/lib/domain/types";
import { windowState } from "@/lib/domain/selectors";
import { SECTION_LABEL } from "@/lib/domain/validation";
import { discardFormDraft, publishForm, startFormDraft, updateFormDraft, updateFormWindow } from "@/lib/actions/admin";
import { useNow } from "@/lib/hooks";
import { useDb } from "@/lib/store/store";
import { cn, fmtDate, fmtRelative, plural, sleep } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form";
import { Badge, EmptyState, Notice, PageHeader, Panel, PanelHeader } from "@/components/ui/display";
import { ConfirmDialog, Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/ui/overlay";
import { FormPreviewDialog } from "@/components/review/form-preview";
import {
  applicationsByVersion,
  cleanQuestions,
  diffQuestions,
  fromInputValue,
  hasDraftChanges,
  newQuestion,
  publishedQuestions,
  sameQuestions,
  toInputValue,
  validateQuestions,
  WINDOW_META,
} from "@/components/review/form-utils";
import { LeaveGuard } from "@/components/review/leave-guard";
import { KIND_META } from "@/components/review/meta";
import { QuestionEditor } from "@/components/review/question-editor";

const KINDS = Object.keys(KIND_META) as QuestionKind[];

function Fact({ label, children, detail }: { label: string; children: React.ReactNode; detail?: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[12.5px] text-muted">{label}</dt>
      <dd className="mt-1 text-[15px] font-medium">{children}</dd>
      {detail && <dd className="mt-0.5 text-[12.5px] text-muted">{detail}</dd>}
    </div>
  );
}

export function FormBuilder({ formId }: { formId: string }) {
  const db = useDb();
  const now = useNow();
  const form = db.forms[formId];
  const cohort = db.cohorts[form.cohortId];
  const published = publishedQuestions(db, form);
  const current = form.publishedVersionId ? db.formVersions[form.publishedVersionId] : undefined;
  const baseline = form.draftQuestions ?? published;

  /* ---------------------------- local state ---------------------------- */
  const [questions, setQuestions] = useState<FormQuestion[]>(() => structuredClone(baseline));
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showIssues, setShowIssues] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<{ title: string; intro: string; questions: FormQuestion[]; heading: string; description?: string } | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [removeId, setRemoveId] = useState<string | null>(null);

  const [title, setTitle] = useState(form.title);
  const [intro, setIntro] = useState(form.intro);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [savingDetails, setSavingDetails] = useState(false);

  const [opens, setOpens] = useState(() => toInputValue(form.opensAt));
  const [closes, setCloses] = useState(() => toInputValue(form.closesAt));
  const [windowError, setWindowError] = useState<string | null>(null);
  const [savingWindow, setSavingWindow] = useState(false);

  /* ---------------------------- derived ---------------------------- */
  const questionsDirty = !sameQuestions(questions, baseline);
  const detailsDirty = title !== form.title || intro !== form.intro;
  const windowDirty = opens !== toInputValue(form.opensAt) || closes !== toInputValue(form.closesAt);
  const issues = validateQuestions(questions);
  const issuesFor = (id: string) => (showIssues ? issues.filter((i) => i.questionId === id).map((i) => i.message) : []);
  const diff = diffQuestions(questions, published);
  const storedDraftChanges = hasDraftChanges(db, form);
  const canPublish = questions.length > 0 && (!form.publishedVersionId || diff.any);
  const nextVersion = Object.values(db.formVersions).filter((v) => v.formId === form.id).length + 1;
  const byVersion = applicationsByVersion(db, form.id);
  const totalApps = Object.values(byVersion).reduce((n, v) => n + v.total, 0);
  const state = windowState(form, now);
  const versions = useMemo(
    () =>
      Object.values(db.formVersions)
        .filter((v) => v.formId === form.id)
        .sort((a, b) => b.version - a.version),
    [db.formVersions, form.id],
  );
  const canDiscardStored = !!form.draftQuestions && !!form.publishedVersionId;
  /** Unsaved edits are discarded first; the stored draft only when there's nothing unsaved. */
  const discardMode: "edits" | "draft" | null = questionsDirty ? "edits" : canDiscardStored ? "draft" : null;

  const draftWindow = { o: fromInputValue(opens), c: fromInputValue(closes) };
  const previewState = draftWindow.o && draftWindow.c && draftWindow.c > draftWindow.o ? windowState({ ...form, opensAt: draftWindow.o, closesAt: draftWindow.c }, now) : null;

  /* ---------------------------- question edits ---------------------------- */
  function update(q: FormQuestion) {
    setQuestions((qs) => qs.map((x) => (x.id === q.id ? q : x)));
  }
  function move(index: number, dir: -1 | 1) {
    setQuestions((qs) => {
      const j = index + dir;
      if (j < 0 || j >= qs.length) return qs;
      const next = [...qs];
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });
  }
  function add(kind: QuestionKind) {
    const q = newQuestion(kind);
    setQuestions((qs) => [...qs, q]);
    setExpanded(q.id);
    requestAnimationFrame(() => document.getElementById(`qe-${q.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }));
  }
  function remove(id: string) {
    setQuestions((qs) =>
      qs
        .filter((x) => x.id !== id)
        .map((x) => {
          if (x.showIf?.questionId !== id) return x;
          const copy = { ...x };
          delete copy.showIf;
          return copy;
        }),
    );
    if (expanded === id) setExpanded(null);
  }

  function blockOnIssues() {
    setShowIssues(true);
    if (!issues.length) return false;
    setExpanded(issues[0].questionId);
    requestAnimationFrame(() => document.getElementById(`qe-${issues[0].questionId}`)?.scrollIntoView({ behavior: "smooth", block: "center" }));
    toast.error(`Fix ${plural(issues.length, "problem")} in the questions first`, { description: "Each one is marked on its question." });
    return true;
  }

  /** Writes local questions to the stored draft. Returns the cleaned questions, or null on failure. */
  function persistDraft(): FormQuestion[] | null {
    const cleaned = cleanQuestions(questions);
    if (!db.forms[form.id]?.draftQuestions) {
      const s = startFormDraft(form.id);
      if (!s.ok) {
        toast.error(s.error);
        return null;
      }
    }
    const r = updateFormDraft(form.id, { questions: cleaned });
    if (!r.ok) {
      toast.error(r.error);
      return null;
    }
    return cleaned;
  }

  async function saveDraft() {
    if (blockOnIssues()) return;
    setSaving(true);
    await sleep(350);
    const cleaned = persistDraft();
    setSaving(false);
    if (!cleaned) return;
    setQuestions(cleaned);
    toast.success("Draft saved", {
      description: current ? `Applicants still get version ${current.version} until you publish.` : "Nothing is visible to applicants until you publish.",
    });
  }

  async function publish() {
    await sleep(600);
    let cleaned = questions;
    if (questionsDirty) {
      const c = persistDraft();
      if (!c) return false;
      cleaned = c;
    }
    const r = publishForm(form.id);
    if (!r.ok) {
      toast.error(r.error);
      return false;
    }
    setQuestions(cleanQuestions(cleaned));
    setExpanded(null);
    const kept = totalApps;
    toast.success(`Version ${r.value} published`, {
      description: kept
        ? `New applications get version ${r.value}. ${plural(kept, "existing application")} keep the version they started with.`
        : `Applicants now get version ${r.value}.`,
    });
  }

  async function discard() {
    await sleep(350);
    if (discardMode === "draft") {
      const r = discardFormDraft(form.id);
      if (!r.ok) {
        toast.error(r.error);
        return false;
      }
      setQuestions(structuredClone(published));
      toast.success("Draft discarded", { description: `The form is back to version ${current?.version}.` });
    } else {
      setQuestions(structuredClone(baseline));
      toast.success("Unsaved edits discarded");
    }
    setExpanded(null);
    setShowIssues(false);
  }

  async function saveDetails() {
    if (!title.trim()) {
      setDetailsError("Give the form a title.");
      return;
    }
    setDetailsError(null);
    setSavingDetails(true);
    await sleep(350);
    const r = updateFormDraft(form.id, { title: title.trim(), intro: intro.trim() });
    setSavingDetails(false);
    if (!r.ok) {
      setDetailsError(r.error);
      return;
    }
    setTitle(title.trim());
    setIntro(intro.trim());
    toast.success("Form details saved", { description: "The title and introduction update for applicants straight away." });
  }

  async function saveWindow() {
    const o = fromInputValue(opens);
    const c = fromInputValue(closes);
    if (!o || !c) {
      setWindowError("Enter a full date and time for both opening and closing.");
      return;
    }
    if (c <= o) {
      setWindowError("The closing time must be after the opening time.");
      return;
    }
    setWindowError(null);
    setSavingWindow(true);
    await sleep(400);
    const r = updateFormWindow(form.id, o, c);
    setSavingWindow(false);
    if (!r.ok) {
      setWindowError(r.error);
      return;
    }
    const s = windowState({ ...form, opensAt: o, closesAt: c }, now);
    toast.success("Application window saved", {
      description:
        s === "open"
          ? `Open now — closes ${fmtDate(c)}.`
          : s === "upcoming"
            ? `Opens ${fmtDate(o)}.`
            : s === "closed"
              ? "The window is closed."
              : "It applies once the form is published.",
    });
  }

  const removing = removeId ? questions.find((q) => q.id === removeId) : undefined;
  const removingDependents = removeId ? questions.filter((q) => q.showIf?.questionId === removeId).length : 0;
  const draftsOnForm = Object.values(byVersion).reduce((n, v) => n + v.drafts, 0);

  return (
    <>
      <LeaveGuard dirty={questionsDirty || detailsDirty || windowDirty} what="form changes" />

      <Link href="/admin/forms" className="mb-4 inline-flex h-9 items-center gap-1.5 rounded-[8px] pr-2 text-[13.5px] text-muted hover:text-void">
        <ArrowLeft className="size-4" aria-hidden /> All forms
      </Link>

      <PageHeader
        eyebrow={`${cohort?.name ?? "Cohort"} · Application form`}
        title={form.title}
        description="Edit the draft, preview it as an applicant, then publish a new version. Applicants never see unpublished edits."
        actions={
          <>
            <Button
              variant="outline"
              icon={<Eye className="size-4" />}
              onClick={() =>
                setPreview({
                  title,
                  intro,
                  questions,
                  heading: "Preview as applicant",
                  description: questionsDirty ? "Showing your latest edits, including unsaved ones. Conditional questions react to your answers." : undefined,
                })
              }
            >
              Preview as applicant
            </Button>
            <Button
              variant="primary"
              icon={<Rocket className="size-4" />}
              disabled={!canPublish}
              title={canPublish ? undefined : "No draft changes to publish"}
              onClick={() => {
                if (!blockOnIssues()) setPublishOpen(true);
              }}
            >
              Publish version {nextVersion}
            </Button>
          </>
        }
      />

      <Panel className="mb-4 py-4 sm:py-5">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-4 lg:grid-cols-4">
          <Fact
            label="Application window"
            detail={
              state === "open"
                ? `Closes ${fmtRelative(form.closesAt, now)}`
                : state === "upcoming"
                  ? `Opens ${fmtRelative(form.opensAt, now)}`
                  : state === "closed"
                    ? `Closed ${fmtDate(form.closesAt)}`
                    : "Opens after publishing"
            }
          >
            <Badge tone={WINDOW_META[state].tone} icon={<CalendarClock className="size-3.5" aria-hidden />}>
              {WINDOW_META[state].label}
            </Badge>
          </Fact>
          <Fact label="Live version" detail={current ? `Published ${fmtDate(current.publishedAt)}` : "Applicants can't apply yet"}>
            {current ? `Version ${current.version}` : <span className="text-muted">None</span>}
          </Fact>
          <Fact
            label="Draft"
            detail={questionsDirty ? "Save to keep your edits" : form.draftUpdatedAt ? `Saved ${fmtRelative(form.draftUpdatedAt, now)}` : "Matches the live version"}
          >
            {questionsDirty ? (
              <Badge tone="amber">Unsaved edits</Badge>
            ) : storedDraftChanges ? (
              <Badge tone="amber">Unpublished changes</Badge>
            ) : (
              <Badge tone="neutral">No changes</Badge>
            )}
          </Fact>
          <Fact label="Applications" detail={draftsOnForm ? `${draftsOnForm} still in progress` : "on any version"}>
            <span className="tabular">{totalApps}</span>
          </Fact>
        </dl>
      </Panel>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
        {/* ---------------------------- Questions ---------------------------- */}
        <div className="min-w-0">
          <Panel aria-labelledby="questions-h">
            <PanelHeader
              title={<span id="questions-h">Questions</span>}
              description={`After the standard sections (${SECTION_LABEL.about}, ${SECTION_LABEL.idea}, ${SECTION_LABEL.residence}) that every form shares.`}
              actions={
                <Menu>
                  <MenuTrigger asChild>
                    <Button variant="dark" size="sm" icon={<Plus className="size-4" />}>
                      Add question
                    </Button>
                  </MenuTrigger>
                  <MenuContent className="min-w-[280px]">
                    {KINDS.map((k) => {
                      const m = KIND_META[k];
                      return (
                        <MenuItem key={k} icon={<m.Icon className="size-4" />} onSelect={() => add(k)} className="py-2">
                          <span className="flex flex-col leading-tight">
                            <span>{m.label}</span>
                            <span className="text-[12.5px] text-muted">{m.description}</span>
                          </span>
                        </MenuItem>
                      );
                    })}
                  </MenuContent>
                </Menu>
              }
            />

            {showIssues && issues.length > 0 && (
              <Notice tone="red" icon={<AlertCircle className="size-4 text-[#9f1239]" />} className="mb-4" title={`${plural(issues.length, "problem")} to fix before saving`}>
                Questions that need attention are outlined in red.
              </Notice>
            )}

            {questions.length === 0 ? (
              <EmptyState title="No custom questions yet" description="Add at least one question before publishing. Start with something that shows how the applicant thinks." />
            ) : (
              <ol className="space-y-2.5">
                {questions.map((q, i) => (
                  <QuestionEditor
                    key={q.id}
                    q={q}
                    index={i}
                    all={questions}
                    expanded={expanded === q.id}
                    issues={issuesFor(q.id)}
                    onToggle={() => setExpanded((e) => (e === q.id ? null : q.id))}
                    onChange={update}
                    onMove={(dir) => move(i, dir)}
                    onRemove={() => setRemoveId(q.id)}
                  />
                ))}
              </ol>
            )}

            <div className="mt-5 border-t border-line pt-4">
              <p className="text-[14px] font-medium">Add a question</p>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {KINDS.map((k) => {
                  const m = KIND_META[k];
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => add(k)}
                      className="flex min-h-11 items-center gap-2.5 rounded-[10px] bg-fog px-3 py-2 text-left text-[14px] transition-colors hover:bg-ash"
                    >
                      <m.Icon className="size-4 shrink-0" aria-hidden />
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </Panel>

          {/* Save bar */}
          <div className={cn("z-20 mt-4", questionsDirty && "sticky bottom-[72px] lg:bottom-4")}>
            <div className="flex flex-wrap items-center gap-3 rounded-[16px] bg-void px-4 py-3 text-paper shadow-float">
              <p className="flex min-w-0 flex-1 items-center gap-2 text-[14px]" aria-live="polite">
                {questionsDirty ? (
                  <>
                    <span className="size-2 shrink-0 rounded-full bg-[#ffc233]" aria-hidden /> Unsaved changes to the draft
                  </>
                ) : storedDraftChanges ? (
                  <>
                    <CheckCircle2 className="size-4 shrink-0 text-jade" aria-hidden /> Draft saved {fmtRelative(form.draftUpdatedAt, now)} · not published
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-4 shrink-0 text-jade" aria-hidden /> {current ? `Matches live version ${current.version}` : "All changes saved"}
                  </>
                )}
              </p>
              <div className="flex gap-2">
                <Button variant="ghost-dark" size="sm" icon={<Undo2 className="size-4" />} disabled={!discardMode} onClick={() => setDiscardOpen(true)}>
                  {discardMode === "draft" ? "Discard draft" : "Discard edits"}
                </Button>
                <Button variant="primary" size="sm" icon={<Save className="size-4" />} loading={saving} disabled={!questionsDirty} onClick={saveDraft}>
                  Save draft
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* ---------------------------- Sidebar ---------------------------- */}
        <div className="min-w-0 space-y-4">
          <Panel aria-labelledby="details-h">
            <PanelHeader title={<span id="details-h">Form details</span>} description="Shown at the top of the form. Updates for applicants as soon as you save." />
            <div className="space-y-4">
              <Field label="Title" htmlFor="form-title" required error={detailsError ?? undefined}>
                <Input
                  id="form-title"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setDetailsError(null);
                  }}
                  aria-invalid={!!detailsError || undefined}
                />
              </Field>
              <Field label="Introduction" htmlFor="form-intro" hint="One or two warm sentences: what to expect and how long it takes.">
                <Textarea id="form-intro" value={intro} onChange={(e) => setIntro(e.target.value)} className="min-h-[96px]" />
              </Field>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12.5px] text-muted">{detailsDirty ? "Unsaved" : "Saved"}</span>
                <Button variant="outline" size="sm" loading={savingDetails} disabled={!detailsDirty} onClick={saveDetails}>
                  Save details
                </Button>
              </div>
            </div>
          </Panel>

          <Panel aria-labelledby="window-h">
            <PanelHeader title={<span id="window-h">Application window</span>} description="Each cohort's window is independent. Times are in UTC." />
            <div className="space-y-4">
              <Field label="Opens" htmlFor="win-open" required>
                <Input
                  id="win-open"
                  type="datetime-local"
                  value={opens}
                  onChange={(e) => {
                    setOpens(e.target.value);
                    setWindowError(null);
                  }}
                  aria-invalid={!!windowError || undefined}
                />
              </Field>
              <Field label="Closes" htmlFor="win-close" required error={windowError ?? undefined}>
                <Input
                  id="win-close"
                  type="datetime-local"
                  value={closes}
                  onChange={(e) => {
                    setCloses(e.target.value);
                    setWindowError(null);
                  }}
                  aria-invalid={!!windowError || undefined}
                />
              </Field>
              {windowDirty && previewState && (
                <div className="space-y-1.5 text-[13px]">
                  <p className="flex items-center gap-2">
                    After saving: <Badge tone={WINDOW_META[previewState].tone}>{WINDOW_META[previewState].label}</Badge>
                  </p>
                  {state === "open" && previewState !== "open" && form.publishedVersionId && (
                    <p className="text-[#7a4b00]">
                      This closes the window now{draftsOnForm ? ` — ${plural(draftsOnForm, "applicant")} with a draft won't be able to submit` : ""}.
                    </p>
                  )}
                  {cohort && draftWindow.c && draftWindow.c > cohort.startDate && <p className="text-[#7a4b00]">Closes after the cohort starts ({fmtDate(cohort.startDate)}).</p>}
                </div>
              )}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12.5px] text-muted">{windowDirty ? "Unsaved" : "Saved"}</span>
                <Button variant="outline" size="sm" loading={savingWindow} disabled={!windowDirty} onClick={saveWindow}>
                  Save window
                </Button>
              </div>
            </div>
          </Panel>

          <Panel aria-labelledby="versions-h">
            <PanelHeader title={<span id="versions-h">Version history</span>} description="Every application keeps the version it started with." />
            <ol className="space-y-3">
              {(questionsDirty || storedDraftChanges) && (
                <li className="rounded-[12px] border-[1.5px] border-dashed border-[#e0c26b] bg-[#fffbef] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[14px] font-semibold">Draft · version {nextVersion}</p>
                    <Badge tone="amber">{questionsDirty ? "Unsaved" : "Not published"}</Badge>
                  </div>
                  <p className="mt-1 text-[12.5px] text-muted">
                    {plural(questions.length, "question")}
                    {current &&
                      ` · ${[diff.added && `${diff.added} added`, diff.edited && `${diff.edited} edited`, diff.removed && `${diff.removed} removed`, diff.reordered && "reordered"].filter(Boolean).join(", ") || "no changes"}`}
                  </p>
                </li>
              )}
              {versions.length === 0 && <li className="text-[14px] text-muted">Not published yet.</li>}
              {versions.map((v) => {
                const c = byVersion[v.id];
                const live = v.id === form.publishedVersionId;
                return (
                  <li key={v.id} className={cn("rounded-[12px] p-3", live ? "bg-leaf/60" : "bg-fog")}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="flex items-center gap-2 text-[14px] font-semibold">
                        <History className="size-3.5 text-muted" aria-hidden /> Version {v.version}
                      </p>
                      {live && <Badge tone="green">Live</Badge>}
                    </div>
                    <p className="mt-1 text-[12.5px] text-muted">
                      {fmtDate(v.publishedAt)}
                      {v.publishedById ? ` · ${db.users[v.publishedById]?.name ?? "an admin"}` : ""} · {plural(v.questions.length, "question")}
                    </p>
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <p className="text-[13px]">
                        {c ? plural(c.total, "application") : "No applications"}
                        {c?.drafts ? <span className="text-muted"> · {c.drafts} in progress</span> : null}
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          setPreview({
                            title: form.title,
                            intro: form.intro,
                            questions: v.questions,
                            heading: `Version ${v.version}`,
                            description: `Exactly what applicants on version ${v.version} answered. Interactive, nothing is saved.`,
                          })
                        }
                        className="text-[13px] font-medium underline-offset-2 hover:underline"
                      >
                        Preview
                      </button>
                    </div>
                  </li>
                );
              })}
            </ol>
          </Panel>
        </div>
      </div>

      {/* ---------------------------- Dialogs ---------------------------- */}
      <FormPreviewDialog
        open={!!preview}
        onOpenChange={(v) => !v && setPreview(null)}
        title={preview?.title ?? ""}
        intro={preview?.intro ?? ""}
        questions={preview?.questions ?? []}
        heading={preview?.heading}
        description={preview?.description}
      />

      <ConfirmDialog
        open={publishOpen}
        onOpenChange={setPublishOpen}
        title={`Publish version ${nextVersion}?`}
        description={`A new version of ${form.title} is created from the draft.`}
        confirmLabel={`Publish version ${nextVersion}`}
        confirmVariant="primary"
        onConfirm={publish}
      >
        <div className="space-y-3 text-[14px]">
          {current && (
            <p className="rounded-[12px] bg-fog px-3 py-2.5">
              <span className="font-medium">Changes from version {current.version}:</span>{" "}
              {[diff.added && `${diff.added} added`, diff.edited && `${diff.edited} edited`, diff.removed && `${diff.removed} removed`, diff.reordered && "order changed"]
                .filter(Boolean)
                .join(", ") || "none"}
            </p>
          )}
          <div>
            <p className="font-medium">Existing applications keep their version</p>
            {versions.length === 0 || totalApps === 0 ? (
              <p className="mt-1 text-muted">No applications have been started on this form yet.</p>
            ) : (
              <ul className="mt-1.5 space-y-1">
                {versions
                  .filter((v) => byVersion[v.id])
                  .map((v) => (
                    <li key={v.id} className="flex items-baseline justify-between gap-3 text-[13.5px]">
                      <span>Version {v.version}</span>
                      <span className="text-muted">
                        {byVersion[v.id].submitted} submitted · {byVersion[v.id].drafts} in progress — unchanged
                      </span>
                    </li>
                  ))}
              </ul>
            )}
          </div>
          <p className="text-muted">
            Applications started after publishing get version {nextVersion}.{state === "open" ? " The window is open, so new applicants see it straight away." : ""}
            {questionsDirty ? " Your unsaved edits are saved first." : ""}
          </p>
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={discardOpen}
        onOpenChange={setDiscardOpen}
        title={discardMode === "draft" ? "Discard the draft?" : "Discard unsaved edits?"}
        description={
          discardMode === "draft"
            ? `The questions go back to live version ${current?.version} (${plural(published.length, "question")}). This can't be undone.`
            : "Your edits since the last save will be lost."
        }
        confirmLabel="Discard"
        confirmVariant="danger"
        onConfirm={discard}
      />

      <ConfirmDialog
        open={!!removeId}
        onOpenChange={(v) => !v && setRemoveId(null)}
        title={`Remove “${removing?.label.trim() || "Untitled question"}”?`}
        description="It's removed from the draft only. Published versions and submitted answers are unaffected."
        confirmLabel="Remove question"
        confirmVariant="danger"
        onConfirm={() => {
          if (removeId) remove(removeId);
          setRemoveId(null);
        }}
      >
        {removingDependents > 0 ? (
          <Notice tone="amber" icon={<AlertCircle className="size-4" />}>
            {plural(removingDependents, "question")} {removingDependents === 1 ? "depends" : "depend"} on this one. {removingDependents === 1 ? "Its" : "Their"} condition will be
            removed so {removingDependents === 1 ? "it always shows" : "they always show"}.
          </Notice>
        ) : undefined}
      </ConfirmDialog>
    </>
  );
}
