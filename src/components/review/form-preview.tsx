"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, Eye, RotateCcw, UploadCloud } from "lucide-react";
import type { FormQuestion } from "@/lib/domain/types";
import { visibleQuestions } from "@/lib/domain/selectors";
import { SECTION_LABEL, SECTION_ORDER } from "@/lib/domain/validation";
import { cn, plural } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, RadioCards, Select, Textarea, WordCounter } from "@/components/ui/form";
import { Notice } from "@/components/ui/display";
import { DialogClose, DialogContent, DialogRoot } from "@/components/ui/overlay";
import { optionsOf, validatePreviewAnswers } from "./form-utils";

type Answers = Record<string, string | string[] | undefined>;

/** Interactive renderer for one custom question, as an applicant would see it. */
export function QuestionInput({
  q,
  value,
  onChange,
  error,
  number,
}: {
  q: FormQuestion;
  value: string | string[] | undefined;
  onChange: (v: string | string[] | undefined) => void;
  error?: string;
  number: number;
}) {
  const id = `pv-${q.id}`;
  const label = (
    <>
      <span className="mr-1 text-muted tabular">{number}.</span>
      {q.label || <span className="text-muted">Untitled question</span>}
    </>
  );
  const common = { label, hint: q.help, required: q.required, optional: !q.required, error, htmlFor: id };

  if (q.kind === "short")
    return (
      <Field {...common} counter={q.wordLimit ? <WordCounter text={typeof value === "string" ? value : ""} limit={q.wordLimit} /> : undefined}>
        <Input id={id} value={typeof value === "string" ? value : ""} onChange={(e) => onChange(e.target.value)} aria-invalid={!!error || undefined} />
      </Field>
    );
  if (q.kind === "long")
    return (
      <Field {...common} counter={<WordCounter text={typeof value === "string" ? value : ""} limit={q.wordLimit} />}>
        <Textarea id={id} value={typeof value === "string" ? value : ""} onChange={(e) => onChange(e.target.value)} aria-invalid={!!error || undefined} />
      </Field>
    );
  if (q.kind === "select")
    return (
      <Field {...common}>
        <Select id={id} value={typeof value === "string" ? value : ""} onChange={(e) => onChange(e.target.value || undefined)} aria-invalid={!!error || undefined}>
          <option value="">Choose an option</option>
          {optionsOf(q).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </Select>
      </Field>
    );
  if (q.kind === "yesno")
    return (
      <Field {...common} htmlFor={undefined}>
        <RadioCards
          name={id}
          value={typeof value === "string" ? value : undefined}
          onChange={(v) => onChange(v)}
          invalid={!!error}
          options={optionsOf(q).map((o) => ({ value: o, label: o }))}
        />
      </Field>
    );
  if (q.kind === "multi") {
    const chosen = Array.isArray(value) ? value : [];
    const full = !!q.maxChoices && chosen.length >= q.maxChoices;
    return (
      <Field
        {...common}
        htmlFor={undefined}
        counter={
          q.maxChoices ? (
            <span className="text-[12.5px] text-muted tabular">
              {chosen.length} of up to {q.maxChoices}
            </span>
          ) : undefined
        }
      >
        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          {optionsOf(q).map((o) => (
            <Checkbox
              key={o}
              label={o}
              checked={chosen.includes(o)}
              disabled={full && !chosen.includes(o)}
              invalid={!!error}
              onChange={(on) => onChange(on ? [...chosen, o] : chosen.filter((x) => x !== o))}
            />
          ))}
        </div>
      </Field>
    );
  }
  // file
  return (
    <Field {...common} htmlFor={undefined}>
      <div className="flex items-center gap-3 rounded-[12px] border-[1.5px] border-dashed border-[#c5ccd2] bg-[#fafafa] px-4 py-4 text-[14px] text-muted">
        <UploadCloud className="size-5 shrink-0" aria-hidden />
        <span>Applicants attach one PDF or image (up to 8 MB) here. Uploads are turned off in the preview.</span>
      </div>
    </Field>
  );
}

function PreviewBody({ title, intro, questions }: { title: string; intro: string; questions: FormQuestion[] }) {
  const [answers, setAnswers] = useState<Answers>({});
  const [checked, setChecked] = useState(false);
  const shown = visibleQuestions(questions, answers);
  const hidden = questions.length - shown.length;
  const issues = checked ? validatePreviewAnswers(shown, answers) : [];
  const errorFor = (id: string) => issues.find((i) => i.questionId === id)?.message;

  return (
    <div className="space-y-6">
      <Notice tone="blue" icon={<Eye className="size-4" />}>
        Preview only — nothing you enter here is saved, sent or counted as an application.
      </Notice>

      <div>
        <h3 className="font-display text-[30px] leading-tight tracking-[-0.03em]">{title || "Untitled form"}</h3>
        {intro && <p className="mt-2 max-w-2xl text-[15.5px] leading-relaxed text-muted">{intro}</p>}
        <ol className="mt-4 flex flex-wrap gap-1.5" aria-label="Application steps">
          {SECTION_ORDER.map((s, i) => (
            <li
              key={s}
              className={cn("rounded-full px-3 py-1 text-[12.5px]", s === "questions" ? "bg-void font-medium text-paper" : "bg-fog text-muted")}
              aria-current={s === "questions" ? "step" : undefined}
            >
              {i + 1}. {SECTION_LABEL[s]}
            </li>
          ))}
        </ol>
        <p className="mt-2 text-[13px] text-muted">The first three steps are the same on every form. This step is the part you control.</p>
      </div>

      {questions.length === 0 ? (
        <p className="rounded-[12px] bg-fog px-4 py-6 text-center text-[14.5px] text-muted">This form has no custom questions yet.</p>
      ) : (
        <div className="space-y-6">
          {shown.map((q, i) => (
            <div key={q.id} id={`pv-wrap-${q.id}`}>
              <QuestionInput q={q} number={i + 1} value={answers[q.id]} error={errorFor(q.id)} onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))} />
            </div>
          ))}
          {hidden > 0 && (
            <p className="text-[13px] text-muted">
              {plural(hidden, "more question")} {hidden === 1 ? "appears" : "appear"} only when an earlier answer matches {hidden === 1 ? "its" : "their"} condition. Try changing
              your answers above.
            </p>
          )}
        </div>
      )}

      {checked &&
        (issues.length ? (
          <div role="alert" className="rounded-[12px] border-[1.5px] border-[#c8102e] bg-[#fff5f6] p-4 text-[14px] text-[#8f0b21]">
            <p className="flex items-center gap-2 font-semibold">
              <AlertCircle className="size-4" aria-hidden /> An applicant would see {plural(issues.length, "problem")} here
            </p>
            <p className="mt-1">Each one is shown next to its question above.</p>
          </div>
        ) : (
          <Notice tone="green" icon={<CheckCircle2 className="size-4 text-leaf-ink" />}>
            These answers would pass this step. Nothing was saved.
          </Notice>
        ))}

      <div className="flex flex-wrap gap-2 border-t border-line pt-4">
        <Button variant="dark" icon={<CheckCircle2 className="size-4" />} onClick={() => setChecked(true)}>
          Check answers
        </Button>
        <Button
          variant="ghost"
          icon={<RotateCcw className="size-4" />}
          onClick={() => {
            setAnswers({});
            setChecked(false);
          }}
        >
          Clear answers
        </Button>
      </div>
    </div>
  );
}

export function FormPreviewDialog({
  open,
  onOpenChange,
  title,
  intro,
  questions,
  heading = "Preview as applicant",
  description,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  intro: string;
  questions: FormQuestion[];
  heading?: string;
  description?: string;
}) {
  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      {open && (
        <DialogContent
          size="lg"
          title={heading}
          description={description ?? "Conditional questions appear and disappear as you answer, exactly as they will for applicants."}
          footer={
            <DialogClose asChild>
              <Button variant="outline">Close preview</Button>
            </DialogClose>
          }
        >
          <PreviewBody title={title} intro={intro} questions={questions} />
        </DialogContent>
      )}
    </DialogRoot>
  );
}
