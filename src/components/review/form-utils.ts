import type { ApplicationForm, Database, FormQuestion, QuestionKind } from "@/lib/domain/types";
import type { WindowState } from "@/lib/domain/selectors";
import type { Tone } from "@/components/ui/display";
import { uid } from "@/lib/utils";

export const WINDOW_META: Record<WindowState, { label: string; tone: Tone }> = {
  open: { label: "Open now", tone: "green" },
  upcoming: { label: "Upcoming", tone: "blue" },
  closed: { label: "Closed", tone: "neutral" },
  unpublished: { label: "Not published", tone: "amber" },
};

/* ------------------------------------------------------------------ */
/* Normalization and comparison                                        */
/* ------------------------------------------------------------------ */

/** Canonical shape with a fixed key order so drafts compare reliably. */
function canonical(q: FormQuestion) {
  return {
    id: q.id,
    kind: q.kind,
    label: q.label,
    help: q.help || undefined,
    required: q.required,
    options: q.options?.length ? q.options : undefined,
    wordLimit: q.wordLimit ?? undefined,
    maxChoices: q.maxChoices ?? undefined,
    showIf: q.showIf ? { questionId: q.showIf.questionId, equals: q.showIf.equals } : undefined,
  };
}

export function sameQuestion(a: FormQuestion, b: FormQuestion) {
  return JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
}

export function sameQuestions(a: FormQuestion[], b: FormQuestion[]) {
  return a.length === b.length && a.every((q, i) => sameQuestion(q, b[i]));
}

export function publishedQuestions(db: Database, form: ApplicationForm): FormQuestion[] {
  return form.publishedVersionId ? (db.formVersions[form.publishedVersionId]?.questions ?? []) : [];
}

/** A saved draft that actually differs from what applicants receive. */
export function hasDraftChanges(db: Database, form: ApplicationForm) {
  if (!form.draftQuestions) return false;
  if (!form.publishedVersionId) return true;
  return !sameQuestions(form.draftQuestions, publishedQuestions(db, form));
}

export function diffQuestions(draft: FormQuestion[], published: FormQuestion[]) {
  const pub = new Map(published.map((q) => [q.id, q]));
  const dr = new Map(draft.map((q) => [q.id, q]));
  const added = draft.filter((q) => !pub.has(q.id)).length;
  const removed = published.filter((q) => !dr.has(q.id)).length;
  const edited = draft.filter((q) => pub.has(q.id) && !sameQuestion(q, pub.get(q.id)!)).length;
  const common = draft.filter((q) => pub.has(q.id)).map((q) => q.id);
  const pubOrder = published.filter((q) => dr.has(q.id)).map((q) => q.id);
  const reordered = common.some((id, i) => pubOrder[i] !== id);
  return { added, removed, edited, reordered, any: added + removed + edited > 0 || reordered };
}

/** Applications on this form grouped by the version they started with. */
export function applicationsByVersion(db: Database, formId: string) {
  const out: Record<string, { total: number; submitted: number; drafts: number }> = {};
  for (const a of Object.values(db.applications)) {
    if (a.formId !== formId) continue;
    const row = (out[a.formVersionId] ??= { total: 0, submitted: 0, drafts: 0 });
    row.total++;
    if (a.status === "draft") row.drafts++;
    else row.submitted++;
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Editing helpers                                                     */
/* ------------------------------------------------------------------ */

export function newQuestion(kind: QuestionKind): FormQuestion {
  const q: FormQuestion = { id: uid("q"), kind, label: "", required: kind !== "file" };
  if (kind === "select" || kind === "multi") q.options = ["Option 1", "Option 2"];
  if (kind === "yesno") q.options = ["Yes", "No"];
  if (kind === "long") q.wordLimit = 150;
  return q;
}

export function changeKind(q: FormQuestion, kind: QuestionKind): FormQuestion {
  const next: FormQuestion = { ...q, kind };
  const hadList = q.kind === "select" || q.kind === "multi";
  if (kind === "select" || kind === "multi") next.options = hadList && q.options?.length ? q.options : ["Option 1", "Option 2"];
  else if (kind === "yesno") next.options = ["Yes", "No"];
  else delete next.options;
  if (kind !== "multi") delete next.maxChoices;
  if (kind !== "long" && kind !== "short") delete next.wordLimit;
  if (kind === "file") next.required = false;
  return next;
}

/** Questions that can control `index`'s visibility: earlier yes/no or single-choice questions. */
export function conditionSources(all: FormQuestion[], index: number) {
  return all.slice(0, index).filter((q) => q.kind === "yesno" || q.kind === "select");
}

export function optionsOf(q?: FormQuestion) {
  if (!q) return [];
  if (q.kind === "yesno") return ["Yes", "No"];
  return (q.options ?? []).map((o) => o.trim()).filter(Boolean);
}

/** Trim text, drop empty options and fields that don't apply to the question type. */
export function cleanQuestions(qs: FormQuestion[]): FormQuestion[] {
  return qs.map((q) => {
    const c: FormQuestion = { id: q.id, kind: q.kind, label: q.label.trim(), required: q.required };
    if (q.help?.trim()) c.help = q.help.trim();
    if (q.kind === "select" || q.kind === "multi") c.options = (q.options ?? []).map((o) => o.trim()).filter(Boolean);
    if (q.kind === "yesno") c.options = ["Yes", "No"];
    if ((q.kind === "long" || q.kind === "short") && q.wordLimit) c.wordLimit = q.wordLimit;
    if (q.kind === "multi" && q.maxChoices) c.maxChoices = q.maxChoices;
    if (q.showIf) c.showIf = { ...q.showIf };
    return c;
  });
}

export interface QuestionIssue {
  questionId: string;
  message: string;
}

export function validateQuestions(qs: FormQuestion[]): QuestionIssue[] {
  const issues: QuestionIssue[] = [];
  qs.forEach((q, i) => {
    const add = (message: string) => issues.push({ questionId: q.id, message });
    if (!q.label.trim()) add("Add a question label.");
    if (q.kind === "select" || q.kind === "multi") {
      const opts = optionsOf(q);
      if (opts.length < 2) add("Add at least two options.");
      else if (new Set(opts.map((o) => o.toLowerCase())).size !== opts.length) add("Each option must be different.");
      if (q.kind === "multi" && q.maxChoices !== undefined && (q.maxChoices < 1 || q.maxChoices > opts.length)) add(`Maximum choices must be between 1 and ${opts.length}.`);
    }
    if (q.wordLimit !== undefined && (!Number.isInteger(q.wordLimit) || q.wordLimit < 10)) add("Word limit must be a whole number of at least 10.");
    if (q.showIf) {
      const src = conditionSources(qs, i).find((s) => s.id === q.showIf!.questionId);
      if (!src) add("The condition points to a question that's missing, changed type, or now comes after this one.");
      else if (!optionsOf(src).includes(q.showIf.equals)) add("Choose which answer shows this question.");
    }
  });
  return issues;
}

/** The same checks the applicant form runs on custom questions, for the preview. */
export function validatePreviewAnswers(questions: FormQuestion[], answers: Record<string, string | string[] | undefined>) {
  const out: { questionId: string; message: string }[] = [];
  for (const q of questions) {
    const v = answers[q.id];
    const empty = v === undefined || v === "" || (Array.isArray(v) && v.length === 0);
    if (q.required && empty) {
      out.push({ questionId: q.id, message: q.kind === "multi" ? "Choose at least one option." : q.kind === "file" ? "Attach a file." : "Answer this question." });
      continue;
    }
    if (typeof v === "string" && q.wordLimit) {
      const n = v.trim() ? v.trim().split(/\s+/).length : 0;
      if (n > q.wordLimit) out.push({ questionId: q.id, message: `Keep it under ${q.wordLimit} words (you have ${n}).` });
    }
    if (Array.isArray(v) && q.maxChoices && v.length > q.maxChoices) out.push({ questionId: q.id, message: `Choose up to ${q.maxChoices} options.` });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Datetime inputs (the demo runs on UTC)                              */
/* ------------------------------------------------------------------ */

export const toInputValue = (iso: string) => iso.slice(0, 16);
export function fromInputValue(v: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)) return null;
  const d = new Date(`${v}:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
