"use client";

import { AlertCircle, ArrowDown, ArrowUp, ChevronDown, CornerDownRight, Plus, Trash2, X } from "lucide-react";
import type { FormQuestion, QuestionKind } from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import { Button, IconButton } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Switch } from "@/components/ui/form";
import { Badge } from "@/components/ui/display";
import { KIND_META } from "./meta";
import { changeKind, conditionSources, optionsOf } from "./form-utils";

const KINDS = Object.keys(KIND_META) as QuestionKind[];

function toInt(v: string): number | undefined {
  if (v.trim() === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : undefined;
}

export function QuestionEditor({
  q,
  index,
  all,
  expanded,
  issues,
  onToggle,
  onChange,
  onMove,
  onRemove,
}: {
  q: FormQuestion;
  index: number;
  all: FormQuestion[];
  expanded: boolean;
  issues: string[];
  onToggle: () => void;
  onChange: (q: FormQuestion) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}) {
  const meta = KIND_META[q.kind];
  const sources = conditionSources(all, index);
  const source = q.showIf ? all.find((x) => x.id === q.showIf!.questionId) : undefined;
  const sourceIndex = source ? all.indexOf(source) : -1;
  const dependents = all.filter((x) => x.showIf?.questionId === q.id).length;
  const set = (patch: Partial<FormQuestion>) => onChange({ ...q, ...patch });
  const bodyId = `qe-body-${q.id}`;
  const sourceValid = !!q.showIf && sources.some((s) => s.id === q.showIf?.questionId);

  return (
    <li
      id={`qe-${q.id}`}
      className={cn("scroll-mt-24 rounded-[16px] border-[1.5px] bg-paper transition-colors", expanded ? "border-void" : issues.length ? "border-[#e7a3ae]" : "border-line")}
    >
      {/* Summary row */}
      <div className="flex items-start gap-3 p-3 sm:p-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-fog" aria-hidden>
          <meta.Icon className="size-4" />
        </span>
        <button type="button" onClick={onToggle} aria-expanded={expanded} aria-controls={bodyId} className="min-w-0 flex-1 text-left">
          <span className="block text-[12.5px] text-muted">
            Question {index + 1} · {meta.label}
          </span>
          <span className={cn("mt-0.5 block text-[15px] font-medium leading-snug", !q.label.trim() && "text-muted")}>{q.label.trim() || "Untitled question"}</span>
          <span className="mt-1.5 flex flex-wrap gap-1.5">
            <Badge tone={q.required ? "dark" : "neutral"} className="h-5 text-[11.5px]">
              {q.required ? "Required" : "Optional"}
            </Badge>
            {q.wordLimit ? (
              <Badge tone="neutral" className="h-5 text-[11.5px]">
                {q.wordLimit} words max
              </Badge>
            ) : null}
            {q.kind === "multi" && q.maxChoices ? (
              <Badge tone="neutral" className="h-5 text-[11.5px]">
                Up to {q.maxChoices}
              </Badge>
            ) : null}
            {(q.kind === "select" || q.kind === "multi") && (
              <Badge tone="neutral" className="h-5 text-[11.5px]">
                {optionsOf(q).length} options
              </Badge>
            )}
            {q.showIf && (
              <Badge tone="purple" className="h-5 text-[11.5px]" icon={<CornerDownRight className="size-3" aria-hidden />}>
                {sourceIndex >= 0 ? `Shows if Q${sourceIndex + 1} is “${q.showIf.equals}”` : "Condition needs fixing"}
              </Badge>
            )}
            {dependents > 0 && (
              <Badge tone="blue" className="h-5 text-[11.5px]">
                Controls {dependents === 1 ? "1 question" : `${dependents} questions`}
              </Badge>
            )}
            {issues.length > 0 && (
              <Badge tone="red" className="h-5 text-[11.5px]" icon={<AlertCircle className="size-3" aria-hidden />}>
                Needs attention
              </Badge>
            )}
          </span>
        </button>
        <div className="flex shrink-0 items-center">
          <IconButton label={`Move question ${index + 1} up`} disabled={index === 0} onClick={() => onMove(-1)} className="hidden size-9 sm:inline-grid">
            <ArrowUp className="size-4" />
          </IconButton>
          <IconButton label={`Move question ${index + 1} down`} disabled={index === all.length - 1} onClick={() => onMove(1)} className="hidden size-9 sm:inline-grid">
            <ArrowDown className="size-4" />
          </IconButton>
          <IconButton label={expanded ? "Collapse question" : "Edit question"} onClick={onToggle} className="size-9">
            <ChevronDown className={cn("size-4 transition-transform duration-200", expanded && "rotate-180")} />
          </IconButton>
        </div>
      </div>

      {/* Editor */}
      {expanded && (
        <div id={bodyId} className="space-y-4 border-t border-line p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <Field label="Question type" htmlFor={`qk-${q.id}`}>
              <Select id={`qk-${q.id}`} value={q.kind} onChange={(e) => onChange(changeKind(q, e.target.value as QuestionKind))}>
                {KINDS.map((k) => (
                  <option key={k} value={k}>
                    {KIND_META[k].label} — {KIND_META[k].description}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="rounded-[10px] bg-fog px-3 py-2.5 sm:min-w-[200px]">
              <Switch checked={q.required} onCheckedChange={(v) => set({ required: v })} label="Required" description={q.required ? "Must be answered" : "Can be skipped"} />
            </div>
          </div>

          <Field label="Question" htmlFor={`ql-${q.id}`} required error={issues.includes("Add a question label.") ? "Add a question label." : undefined}>
            <Input
              id={`ql-${q.id}`}
              value={q.label}
              onChange={(e) => set({ label: e.target.value })}
              placeholder="What do you want to ask?"
              aria-invalid={issues.includes("Add a question label.") || undefined}
            />
          </Field>
          <Field label="Help text" htmlFor={`qh-${q.id}`} optional hint="Shown under the question. Examples help people answer well.">
            <Input id={`qh-${q.id}`} value={q.help ?? ""} onChange={(e) => set({ help: e.target.value })} />
          </Field>

          {(q.kind === "long" || q.kind === "short") && (
            <Field label="Word limit" htmlFor={`qw-${q.id}`} optional hint="Applicants see a live word counter.">
              <Input
                id={`qw-${q.id}`}
                type="number"
                inputMode="numeric"
                min={10}
                step={10}
                className="max-w-[160px]"
                value={q.wordLimit ?? ""}
                onChange={(e) => set({ wordLimit: toInt(e.target.value) })}
              />
            </Field>
          )}

          {(q.kind === "select" || q.kind === "multi") && (
            <fieldset>
              <legend className="text-[14.5px] font-medium">
                Options{" "}
                <span className="text-[#c8102e]" aria-hidden>
                  *
                </span>
              </legend>
              <ul className="mt-2 space-y-2">
                {(q.options ?? []).map((o, oi) => (
                  <li key={oi} className="flex items-center gap-2">
                    <span className="w-5 shrink-0 text-right text-[13px] text-muted tabular">{oi + 1}</span>
                    <Input
                      value={o}
                      aria-label={`Option ${oi + 1}`}
                      onChange={(e) => set({ options: (q.options ?? []).map((x, xi) => (xi === oi ? e.target.value : x)) })}
                      className="h-10"
                    />
                    <IconButton
                      label={`Remove option ${oi + 1}`}
                      disabled={(q.options ?? []).length <= 2}
                      onClick={() => set({ options: (q.options ?? []).filter((_, xi) => xi !== oi) })}
                    >
                      <X className="size-4" />
                    </IconButton>
                  </li>
                ))}
              </ul>
              <Button
                size="sm"
                variant="ghost"
                className="mt-2"
                icon={<Plus className="size-4" />}
                onClick={() => set({ options: [...(q.options ?? []), `Option ${(q.options?.length ?? 0) + 1}`] })}
              >
                Add option
              </Button>
              {issues
                .filter((m) => m.startsWith("Add at least two") || m.startsWith("Each option"))
                .map((m) => (
                  <p key={m} className="mt-1 flex items-center gap-1.5 text-[13.5px] text-[#b00d28]" role="alert">
                    <AlertCircle className="size-3.5" aria-hidden /> {m}
                  </p>
                ))}
            </fieldset>
          )}

          {q.kind === "multi" && (
            <Field label="Maximum choices" htmlFor={`qm-${q.id}`} optional hint="Leave blank to allow any number." error={issues.find((m) => m.startsWith("Maximum choices"))}>
              <Input
                id={`qm-${q.id}`}
                type="number"
                inputMode="numeric"
                min={1}
                className="max-w-[160px]"
                value={q.maxChoices ?? ""}
                onChange={(e) => set({ maxChoices: toInt(e.target.value) })}
              />
            </Field>
          )}
          {q.kind === "yesno" && <p className="text-[13.5px] text-muted">Applicants choose Yes or No. Yes/no questions can show or hide later questions.</p>}
          {q.kind === "file" && (
            <p className="text-[13.5px] text-muted">Applicants attach one PDF or image up to 8 MB. Files are restricted to the applicant and assigned reviewers.</p>
          )}

          {issues.find((m) => m.startsWith("Word limit")) && (
            <p className="flex items-center gap-1.5 text-[13.5px] text-[#b00d28]" role="alert">
              <AlertCircle className="size-3.5" aria-hidden /> {issues.find((m) => m.startsWith("Word limit"))}
            </p>
          )}

          {/* Conditional visibility */}
          <div className="rounded-[12px] bg-fog p-3.5">
            <Checkbox
              label="Only show this question after a specific answer"
              description={sources.length ? "Pick an earlier yes/no or single-choice question." : "Add a yes/no or single-choice question above this one to use a condition."}
              checked={!!q.showIf}
              disabled={!sources.length && !q.showIf}
              onChange={(on) => {
                if (!on) {
                  const next = { ...q };
                  delete next.showIf;
                  onChange(next);
                } else if (sources.length) {
                  const s = sources[sources.length - 1];
                  set({ showIf: { questionId: s.id, equals: optionsOf(s)[0] ?? "" } });
                }
              }}
            />
            {q.showIf && (
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] sm:pl-8">
                <Field label="When" htmlFor={`qc-${q.id}`}>
                  <Select
                    id={`qc-${q.id}`}
                    value={sourceValid ? q.showIf.questionId : ""}
                    onChange={(e) => {
                      const s = sources.find((x) => x.id === e.target.value);
                      if (s) set({ showIf: { questionId: s.id, equals: optionsOf(s)[0] ?? "" } });
                    }}
                    aria-invalid={!sourceValid || undefined}
                  >
                    {!sourceValid && <option value="">Choose a question</option>}
                    {sources.map((s) => (
                      <option key={s.id} value={s.id}>
                        Q{all.indexOf(s) + 1}. {s.label.trim() || "Untitled question"}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="is answered" htmlFor={`qv-${q.id}`}>
                  <Select id={`qv-${q.id}`} value={q.showIf.equals} onChange={(e) => set({ showIf: { ...q.showIf!, equals: e.target.value } })}>
                    {!optionsOf(source).includes(q.showIf.equals) && <option value={q.showIf.equals}>Choose an answer</option>}
                    {optionsOf(source).map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </Select>
                </Field>
                {issues
                  .filter((m) => m.startsWith("The condition") || m.startsWith("Choose which answer"))
                  .map((m) => (
                    <p key={m} className="flex items-start gap-1.5 text-[13.5px] text-[#b00d28] sm:col-span-2" role="alert">
                      <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden /> {m}
                    </p>
                  ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
            <div className="flex gap-1 sm:hidden">
              <Button size="sm" variant="soft" icon={<ArrowUp className="size-4" />} disabled={index === 0} onClick={() => onMove(-1)}>
                Up
              </Button>
              <Button size="sm" variant="soft" icon={<ArrowDown className="size-4" />} disabled={index === all.length - 1} onClick={() => onMove(1)}>
                Down
              </Button>
            </div>
            <Button size="sm" variant="ghost" className="text-[#b00d28] hover:bg-[#fff1f2]" icon={<Trash2 className="size-4" />} onClick={onRemove}>
              Remove question
            </Button>
            <Button size="sm" variant="dark" onClick={onToggle}>
              Done
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}
