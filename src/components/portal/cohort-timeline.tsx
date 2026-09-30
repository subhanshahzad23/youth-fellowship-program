"use client";

import { motion } from "motion/react";
import type { Cohort } from "@/lib/domain/types";
import { cohortMonth } from "@/lib/domain/selectors";
import { cn, fmtMonthShortYear } from "@/lib/utils";

const PHASES = [
  { from: 1, to: 3, label: "Discover" },
  { from: 4, to: 6, label: "Test" },
  { from: 7, to: 9, label: "Build" },
  { from: 10, to: 12, label: "Launch" },
  { from: 13, to: 15, label: "Grow" },
  { from: 16, to: 18, label: "Lead" },
];

/** 18-month cohort timeline with the current month marked. */
export function CohortTimeline({ cohort, now, compact }: { cohort: Cohort; now: string; compact?: boolean }) {
  const month = cohortMonth(cohort, now);
  const started = now >= cohort.startDate;
  return (
    <div>
      <div className="flex items-center justify-between text-[12.5px] text-muted">
        <span>{fmtMonthShortYear(cohort.startDate)}</span>
        <span>{started ? (month ? `Month ${month} of 18` : "Completed") : "Not started yet"}</span>
        <span>{fmtMonthShortYear(cohort.endDate)}</span>
      </div>
      <div className="mt-2 grid grid-cols-18 gap-[3px]" style={{ gridTemplateColumns: "repeat(18, minmax(0, 1fr))" }} role="img" aria-label={`18-month timeline${month ? `, currently month ${month}` : ""}`}>
        {Array.from({ length: 18 }).map((_, i) => {
          const m = i + 1;
          const past = month ? m < month : false;
          const current = month === m;
          return (
            <motion.span
              key={m}
              initial={{ scaleY: 0.4, opacity: 0 }}
              animate={{ scaleY: 1, opacity: 1 }}
              transition={{ delay: i * 0.02, duration: 0.3 }}
              className={cn("h-3 rounded-[3px]", current ? "bg-jade" : past ? "bg-void" : "bg-ash")}
            />
          );
        })}
      </div>
      {!compact && (
        <div className="mt-2 grid grid-cols-6 gap-[3px] text-[11.5px] text-muted">
          {PHASES.map((p) => (
            <span key={p.label} className={cn("truncate", month && month >= p.from && month <= p.to && "font-medium text-void")}>
              {p.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
