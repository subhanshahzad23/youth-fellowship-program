"use client";

import { useId, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";

/*
 * ROI calculator. Defaults follow Goodcase's own 2026 pricing guide: a senior
 * in-house paralegal in New York costs a firm about $2,920 per O-1 case
 * (≈40 hours at a $73 loaded rate). All results are illustrative.
 */

export type RoiInputs = {
  cases: number;
  hours: number;
  rate: number;
  attorneyNow: number;
  attorneyWith: number;
  attorneyRate: number;
  fee: number;
};

export const ROI_DEFAULTS: RoiInputs = { cases: 4, hours: 40, rate: 73, attorneyNow: 6, attorneyWith: 2, attorneyRate: 300, fee: 500 };

export function computeRoi(i: RoiInputs) {
  const inHousePerCase = i.hours * i.rate;
  const draftingSavedPerCase = inHousePerCase - i.fee;
  const draftingSaved = i.cases * draftingSavedPerCase;
  const attorneyHours = Math.max(0, i.cases * (i.attorneyNow - i.attorneyWith));
  const attorneyValue = attorneyHours * i.attorneyRate;
  const monthly = draftingSaved + attorneyValue;
  return {
    inHousePerCase,
    draftingSavedPerCase,
    draftingSaved,
    attorneyHours,
    attorneyValue,
    monthly,
    annual: monthly * 12,
    firstCaseSaving: i.fee / 2,
  };
}

const usd = (n: number) => (n < 0 ? "−" : "") + "$" + Math.round(Math.abs(n)).toLocaleString("en-US");

function Slider({ label, value, onChange, min, max, step = 1, format, hint }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number; step?: number; format: (v: number) => string; hint?: string }) {
  const id = useId();
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[14.5px] font-medium">
          {label}
        </label>
        <output htmlFor={id} className="tabular text-[15px] font-semibold">
          {format(value)}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="roi-range mt-2.5 w-full"
        style={{ "--pct": `${pct}%` } as React.CSSProperties}
        aria-describedby={hint ? `${id}-h` : undefined}
      />
      {hint && (
        <p id={`${id}-h`} className="mt-1 text-[12.5px] text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}

export function RoiCalculator({ compact = false, id = "roi" }: { compact?: boolean; id?: string }) {
  const [v, setV] = useState<RoiInputs>(ROI_DEFAULTS);
  const [advanced, setAdvanced] = useState(!compact);
  const r = useMemo(() => computeRoi(v), [v]);
  const set = (k: keyof RoiInputs) => (n: number) => setV((s) => ({ ...s, [k]: n }));

  return (
    <div id={id} className="scroll-mt-28 overflow-hidden rounded-[24px] bg-fog" data-testid="roi">
      <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
        <div className="min-w-0 space-y-6 p-6 sm:p-10">
          <div>
            <p className="eyebrow text-muted">ROI calculator</p>
            <h3 className="display-sm mt-2">What would drafting support be worth to your firm?</h3>
          </div>
          <Slider label="Cases per month" value={v.cases} onChange={set("cases")} min={1} max={40} format={(n) => String(n)} />
          <Slider label="In-house drafting hours per case" value={v.hours} onChange={set("hours")} min={8} max={80} format={(n) => `${n} h`} hint="Paralegal time to draft a full package today." />
          <Slider label="Loaded in-house cost per hour" value={v.rate} onChange={set("rate")} min={30} max={150} format={(n) => `$${n}`} hint="Salary, benefits, software, training and management time." />
          <button type="button" onClick={() => setAdvanced((a) => !a)} className="text-[14px] font-medium underline underline-offset-4" aria-expanded={advanced}>
            {advanced ? "Hide attorney time and fee" : "Adjust attorney time and fee"}
          </button>
          <AnimatePresence initial={false}>
            {advanced && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }} className="space-y-6 overflow-hidden">
                <Slider label="Attorney hours per case today" value={v.attorneyNow} onChange={set("attorneyNow")} min={1} max={20} format={(n) => `${n} h`} />
                <Slider label="Attorney review hours with Goodcase" value={v.attorneyWith} onChange={(n) => set("attorneyWith")(Math.min(n, v.attorneyNow))} min={0} max={10} format={(n) => `${n} h`} hint="You keep the strategy, the final review and the signature." />
                <Slider label="Attorney billable rate" value={v.attorneyRate} onChange={set("attorneyRate")} min={150} max={800} step={25} format={(n) => `$${n}`} />
                <Slider label="Goodcase flat fee per case" value={v.fee} onChange={set("fee")} min={500} max={2500} step={50} format={(n) => `$${n.toLocaleString("en-US")}`} hint="From $500. We confirm your exact fee on the first call." />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="dots-dark on-dark flex min-w-0 flex-col p-6 text-paper sm:p-10" aria-live="polite">
          <p className="eyebrow text-muted-display">Estimated value each month</p>
          <p className="mt-3 font-display text-[60px] font-light leading-none tracking-[-0.045em] tabular sm:text-[84px]" data-testid="roi-monthly">
            {usd(r.monthly)}
          </p>
          <p className="mt-2 text-[15px] text-paper/75">
            <span data-testid="roi-annual" className="font-medium text-paper">
              {usd(r.annual)}
            </span>{" "}
            a year
          </p>

          <dl className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Metric label="Drafting cost saved / month" value={usd(r.draftingSaved)} testId="roi-drafting" sub={`${usd(r.inHousePerCase)} in-house vs ${usd(v.fee)} per case`} negative={r.draftingSaved < 0} />
            <Metric label="Attorney hours returned / month" value={`${r.attorneyHours} h`} testId="roi-hours" sub={`worth ${usd(r.attorneyValue)} of billable time`} />
          </dl>
          <div className="mt-6 space-y-2.5" aria-label="Cost per case comparison">
            <p className="text-[12.5px] text-paper/60">Cost per case</p>
            {[
              { label: "In-house", value: r.inHousePerCase, cls: "bg-paper/35" },
              { label: "Goodcase", value: v.fee, cls: "bg-jade" },
            ].map((b) => (
              <div key={b.label} className="flex items-center gap-3 text-[13px]">
                <span className="w-20 shrink-0 text-paper/75">{b.label}</span>
                <span className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-paper/10">
                  <span className={cn("block h-full rounded-full transition-[width] duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]", b.cls)} style={{ width: `${Math.max(4, (b.value / Math.max(r.inHousePerCase, v.fee)) * 100)}%` }} />
                </span>
                <span className="w-16 shrink-0 text-right tabular">{usd(b.value)}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-[14px] bg-jade/15 px-4 py-3 text-[14px] text-mint ring-1 ring-jade/30">
            First case at half price — you save another <span className="font-semibold text-paper" data-testid="roi-first">{usd(r.firstCaseSaving)}</span> on case one, with a money-back guarantee.
          </div>
          <div className="mt-auto pt-8">
            <ButtonLink href="/book-a-call" arrow size="lg">
              Get your exact fee on a call
            </ButtonLink>
            <p className="mt-4 flex items-start gap-2 text-[12.5px] leading-relaxed text-paper/55">
              <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              Illustrative estimate, not a quote. Defaults follow Goodcase&apos;s 2026 pricing guide (≈$2,920 in-house per O-1 case in New York). Your numbers will differ.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, sub, testId, negative }: { label: string; value: string; sub: string; testId: string; negative?: boolean }) {
  return (
    <div className="rounded-[14px] bg-paper/[0.07] p-4 ring-1 ring-white/10">
      <dt className="text-[12.5px] text-paper/60">{label}</dt>
      <dd className={cn("mt-1 font-display text-[32px] leading-none tracking-[-0.03em] tabular", negative && "text-[#ff9b9b]")} data-testid={testId}>
        {value}
      </dd>
      <dd className="mt-1.5 text-[12.5px] text-paper/60">{sub}</dd>
    </div>
  );
}
