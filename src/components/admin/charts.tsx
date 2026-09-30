"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

const EASE = [0.23, 1, 0.32, 1] as const;

/**
 * Horizontal funnel: one series, bars scaled to the first step, every step
 * labelled with its count and its share of the first step. The last step is
 * the outcome and carries the jade accent; the rest stay monochrome.
 */
export function FunnelChart({ steps, className }: { steps: { label: string; value: number; hint?: string }[]; className?: string }) {
  const top = Math.max(1, steps[0]?.value ?? 0);
  return (
    <ol className={cn("space-y-3", className)} aria-label="Application funnel">
      {steps.map((s, i) => {
        const pct = Math.round((s.value / top) * 100);
        const last = i === steps.length - 1;
        return (
          <li key={s.label} className="grid grid-cols-[minmax(96px,132px)_1fr] items-center gap-3 sm:grid-cols-[150px_minmax(0,1fr)]" title={s.hint}>
            <span className="min-w-0">
              <span className="block truncate text-[13.5px] font-medium">{s.label}</span>
              {s.hint && <span className="block truncate text-[12px] text-muted">{s.hint}</span>}
            </span>
            <span className="flex min-w-0 items-center gap-2.5">
              <span className="relative h-6 min-w-0 flex-1">
                <motion.span
                  className={cn("absolute inset-y-0 left-0 rounded-r-[4px]", last ? "bg-jade" : "bg-void")}
                  initial={{ width: 0 }}
                  animate={{ width: s.value === 0 ? "2px" : `${Math.max(2, (s.value / top) * 100)}%` }}
                  transition={{ duration: 0.6, delay: i * 0.06, ease: EASE }}
                  aria-hidden
                />
              </span>
              <span className="w-[74px] shrink-0 text-right text-[13.5px] tabular">
                <span className="font-semibold">{s.value}</span>
                {i > 0 && <span className="text-muted"> · {pct}%</span>}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Vertical column chart for a short time series (e.g. 8 weeks). Values sit on
 * the column caps; the current period is jade. Hover or focus a column for
 * the full period label.
 */
export function ColumnChart({ data, height = 168, ariaLabel }: { data: { label: string; short?: string; value: number; detail: string; highlight?: boolean }[]; height?: number; ariaLabel: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <figure aria-label={ariaLabel}>
      <div className="flex items-end gap-1.5 border-b border-line sm:gap-3" style={{ height }}>
        {data.map((d, i) => {
          const h = d.value === 0 ? 0 : Math.max(6, (d.value / max) * (height - 28));
          return (
            <div key={d.label + i} className="group relative flex h-full min-w-0 flex-1 flex-col items-center justify-end" tabIndex={0} aria-label={`${d.detail}: ${d.value}`}>
              <span className="mb-1 text-[12.5px] font-semibold tabular">{d.value}</span>
              <motion.span
                className={cn("block w-full max-w-[26px] rounded-t-[4px]", d.highlight ? "bg-jade" : "bg-void", d.value === 0 && "bg-transparent")}
                initial={{ height: 0 }}
                animate={{ height: h }}
                transition={{ duration: 0.5, delay: i * 0.04, ease: EASE }}
                aria-hidden
              />
              <span
                role="tooltip"
                className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-[8px] bg-void px-2.5 py-1.5 text-[12px] text-paper shadow-float group-hover:block group-focus-visible:block"
              >
                {d.detail}: <span className="font-semibold tabular">{d.value}</span>
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-1.5 flex gap-1.5 sm:gap-3">
        {data.map((d, i) => (
          <span key={d.label + i} className={cn("min-w-0 flex-1 truncate text-center text-[11.5px] text-muted", d.highlight && "font-medium text-void")}>
            {d.short ? (
              <>
                <span className="sm:hidden">{d.short}</span>
                <span className="hidden sm:inline">{d.label}</span>
              </>
            ) : (
              d.label
            )}
          </span>
        ))}
      </div>
    </figure>
  );
}

/** Thin labelled meter (value / max) — used for enrollment vs capacity. */
export function Meter({ value, max, className, label }: { value: number; max: number; className?: string; label: string }) {
  const pct = max ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-ash", className)} role="meter" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} aria-label={label}>
      <motion.div className="h-full rounded-full bg-void" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease: EASE }} />
    </div>
  );
}
