"use client";

import { forwardRef, useId } from "react";
import { AlertCircle, Check, ChevronDown } from "lucide-react";
import { Switch as RadixSwitch } from "radix-ui";
import { cn, wordCount } from "@/lib/utils";

const control =
  "w-full rounded-[8px] border-[1.5px] border-line bg-paper px-3.5 text-[15px] text-void placeholder:text-[#8a8a8a] transition-colors hover:border-[#b9c0c6] focus:border-void focus:outline-none focus-visible:outline-none aria-[invalid=true]:border-[#c8102e] disabled:bg-fog disabled:text-muted";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...rest }, ref) {
  return <input ref={ref} className={cn(control, "h-11", className)} {...rest} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...rest }, ref) {
  return <textarea ref={ref} className={cn(control, "min-h-[120px] resize-y py-3 leading-relaxed", className)} {...rest} />;
});

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, children, ...rest }, ref) {
  return (
    <div className="relative">
      <select ref={ref} className={cn(control, "h-11 appearance-none pr-10", className)} {...rest}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
    </div>
  );
});

export function Field({
  label,
  hint,
  error,
  required,
  children,
  htmlFor,
  className,
  optional,
  counter,
}: {
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: string;
  required?: boolean;
  optional?: boolean;
  children: React.ReactNode;
  htmlFor?: string;
  className?: string;
  counter?: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className="text-[14.5px] font-medium text-void">
          {label}
          {required && <span className="ml-0.5 text-[#c8102e]" aria-hidden>*</span>}
          {optional && <span className="ml-1.5 text-[13px] font-normal text-muted">(optional)</span>}
        </label>
        {counter}
      </div>
      {hint && (
        <p id={htmlFor ? `${htmlFor}-hint` : undefined} className="-mt-0.5 text-[13.5px] leading-snug text-muted">
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p id={htmlFor ? `${htmlFor}-error` : undefined} className="flex items-start gap-1.5 text-[13.5px] text-[#b00d28]" role="alert">
          <AlertCircle className="mt-[2px] size-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </div>
  );
}

export function WordCounter({ text, limit }: { text?: string; limit?: number }) {
  const n = wordCount(text);
  const over = !!limit && n > limit;
  return (
    <span className={cn("tabular text-[12.5px]", over ? "font-medium text-[#b00d28]" : "text-muted")} aria-live="polite">
      {n}
      {limit ? ` / ${limit} words` : n === 1 ? " word" : " words"}
    </span>
  );
}

export function Checkbox({
  checked,
  onChange,
  label,
  description,
  disabled,
  id,
  invalid,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
  id?: string;
  invalid?: boolean;
}) {
  const auto = useId();
  const cid = id ?? auto;
  return (
    <label htmlFor={cid} className={cn("flex cursor-pointer items-start gap-3 rounded-[8px] py-1", disabled && "cursor-not-allowed opacity-60")}>
      <span className="relative mt-0.5 grid size-5 shrink-0 place-items-center">
        <input
          id={cid}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          onChange={(e) => onChange(e.target.checked)}
          className="peer size-5 appearance-none rounded-[5px] border-[1.5px] border-[#9aa3aa] bg-paper transition-colors checked:border-void checked:bg-void focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-void aria-[invalid=true]:border-[#c8102e]"
        />
        <Check className="pointer-events-none absolute size-3.5 text-paper opacity-0 peer-checked:opacity-100" strokeWidth={3} aria-hidden />
      </span>
      <span className="flex flex-col">
        <span className="text-[15px] leading-snug text-void">{label}</span>
        {description && <span className="text-[13.5px] text-muted">{description}</span>}
      </span>
    </label>
  );
}

export function RadioCards<T extends string>({
  name,
  value,
  onChange,
  options,
  columns = 2,
  invalid,
  disabled,
}: {
  name: string;
  value?: T;
  onChange: (v: T) => void;
  options: { value: T; label: React.ReactNode; description?: React.ReactNode }[];
  columns?: 1 | 2 | 3 | 4;
  invalid?: boolean;
  disabled?: boolean;
}) {
  return (
    <div role="radiogroup" className={cn("grid gap-2", columns === 2 && "sm:grid-cols-2", columns === 3 && "sm:grid-cols-3", columns === 4 && "grid-cols-2 sm:grid-cols-4")}>
      {options.map((o) => {
        const selected = value === o.value;
        return (
          <label
            key={o.value}
            className={cn(
              "relative flex cursor-pointer flex-col gap-0.5 rounded-[10px] border-[1.5px] bg-paper px-4 py-3 transition-colors",
              selected ? "border-void bg-fog" : "border-line hover:border-[#b9c0c6]",
              invalid && !selected && "border-[#e7a3ae]",
              disabled && "cursor-not-allowed opacity-60",
            )}
          >
            <input type="radio" name={name} value={o.value} checked={selected} disabled={disabled} onChange={() => onChange(o.value)} className="peer sr-only" />
            <span className="flex items-center justify-between gap-2 text-[15px] font-medium">
              {o.label}
              <span className={cn("grid size-4 place-items-center rounded-full border-[1.5px]", selected ? "border-void" : "border-[#9aa3aa]")} aria-hidden>
                {selected && <span className="size-2 rounded-full bg-void" />}
              </span>
            </span>
            {o.description && <span className="text-[13.5px] leading-snug text-muted">{o.description}</span>}
            <span className="pointer-events-none absolute inset-0 rounded-[10px] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-void" />
          </label>
        );
      })}
    </div>
  );
}

export function Switch({ checked, onCheckedChange, label, description, id }: { checked: boolean; onCheckedChange: (v: boolean) => void; label: React.ReactNode; description?: React.ReactNode; id?: string }) {
  const auto = useId();
  const sid = id ?? auto;
  return (
    <div className="flex items-start justify-between gap-4">
      <label htmlFor={sid} className="flex flex-col">
        <span className="text-[15px] font-medium">{label}</span>
        {description && <span className="text-[13.5px] text-muted">{description}</span>}
      </label>
      <RadixSwitch.Root
        id={sid}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="relative mt-0.5 h-6 w-11 shrink-0 rounded-full bg-[#c9ced3] transition-colors data-[state=checked]:bg-void focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-void"
      >
        <RadixSwitch.Thumb className="block size-5 translate-x-0.5 rounded-full bg-paper shadow transition-transform duration-200 data-[state=checked]:translate-x-[22px]" />
      </RadixSwitch.Root>
    </div>
  );
}

/** Accessible error summary that lists issues and links to each field. */
export function ErrorSummary({ issues, title = "There's a problem", onJump }: { issues: { field: string; message: string }[]; title?: string; onJump?: (field: string) => void }) {
  if (!issues.length) return null;
  return (
    <div role="alert" tabIndex={-1} className="rounded-[12px] border-[1.5px] border-[#c8102e] bg-[#fff5f6] p-4">
      <p className="flex items-center gap-2 text-[15px] font-semibold text-[#8f0b21]">
        <AlertCircle className="size-4" aria-hidden />
        {title}
      </p>
      <ul className="mt-2 space-y-1 pl-6 text-[14px]">
        {issues.map((i) => (
          <li key={i.field + i.message} className="list-disc text-[#8f0b21]">
            <a
              href={`#f-${i.field.replace(/\./g, "-")}`}
              onClick={(e) => {
                e.preventDefault();
                onJump?.(i.field);
                const el = document.getElementById(`f-${i.field.replace(/\./g, "-")}`);
                el?.scrollIntoView({ behavior: "smooth", block: "center" });
                (el?.querySelector("input,textarea,select,button") as HTMLElement | null)?.focus({ preventScroll: true });
              }}
              className="underline underline-offset-2 hover:no-underline"
            >
              {i.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function fieldId(field: string) {
  return `f-${field.replace(/\./g, "-")}`;
}
