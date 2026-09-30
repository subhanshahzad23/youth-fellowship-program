"use client";

import { Lock, RotateCcw } from "lucide-react";
import type { AnswersPatch } from "@/lib/actions/applications";
import type { Application, ApplicationAnswers, Cohort } from "@/lib/domain/types";
import type { Issue } from "@/lib/domain/validation";
import { cn } from "@/lib/utils";
import { Field, fieldId } from "@/components/ui/form";

/** Everything a wizard step needs. */
export interface StepProps {
  /** stored application (source of truth) */
  app: Application;
  /** stored answers with unsaved edits layered on top */
  view: ApplicationAnswers;
  /** app with `view` answers — what validation runs against */
  virtualApp: Application;
  cohort: Cohort;
  issues: Issue[];
  showErrors: boolean;
  edit: (patch: AnswersPatch) => void;
  drop: (keys: string[]) => void;
  flush: () => boolean;
  canEdit: (key: string) => boolean;
  requested: string[];
}

export function errorFor(p: Pick<StepProps, "issues" | "showErrors">, key: string) {
  if (!p.showErrors) return undefined;
  return p.issues.find((i) => i.field === key)?.message;
}

export function inputId(key: string) {
  return `${fieldId(key)}-input`;
}

/** Props for the control inside a <Q>: id, invalid state, descriptions, lock. */
export function controlProps(p: Pick<StepProps, "issues" | "showErrors" | "canEdit">, key: string, hasHint = false) {
  const id = inputId(key);
  const err = errorFor(p, key);
  const describedBy = [hasHint && `${id}-hint`, err && `${id}-error`].filter(Boolean).join(" ") || undefined;
  return { id, "aria-invalid": err ? true : undefined, "aria-describedby": describedBy, disabled: !p.canEdit(key) };
}

export function LockTag() {
  return (
    <span className="inline-flex h-5 items-center gap-1 rounded-full bg-fog px-2 text-[11.5px] font-medium text-muted">
      <Lock className="size-3" aria-hidden />
      Locked
    </span>
  );
}

export function RequestedTag() {
  return (
    <span className="inline-flex h-5 items-center gap-1 rounded-full bg-[#fff1cc] px-2 text-[11.5px] font-medium text-[#7a4b00]">
      <RotateCcw className="size-3" aria-hidden />
      Update requested
    </span>
  );
}

/** A labelled answer with an anchor id the error summary can jump to. */
export function Q({
  k,
  p,
  label,
  hint,
  required,
  optional,
  counter,
  className,
  children,
  labelFor = true,
}: {
  k: string;
  p: Pick<StepProps, "issues" | "showErrors" | "canEdit" | "requested">;
  label: React.ReactNode;
  hint?: React.ReactNode;
  required?: boolean;
  optional?: boolean;
  counter?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
  /** false for groups (radios/checkboxes) where the label isn't tied to one control */
  labelFor?: boolean;
}) {
  const locked = !p.canEdit(k);
  const requested = p.requested.includes(k);
  return (
    <div id={fieldId(k)} className={cn("scroll-mt-28", requested && "-mx-3 rounded-[14px] bg-[#fffaeb] p-3 ring-1 ring-[#f5d98a]", className)}>
      <Field
        htmlFor={labelFor ? inputId(k) : undefined}
        label={
          <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>{label}</span>
            {locked && <LockTag />}
            {requested && <RequestedTag />}
          </span>
        }
        hint={hint}
        error={errorFor(p, k)}
        required={required && !locked}
        optional={optional && !locked}
        counter={counter}
      >
        {children}
      </Field>
    </div>
  );
}
