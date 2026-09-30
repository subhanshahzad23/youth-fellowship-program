"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView } from "motion/react";
import { Check, CheckCircle2, MapPin } from "lucide-react";
import { formForCohort } from "@/lib/domain/selectors";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { useDb } from "@/lib/store/store";
import { cn, fmtDateShort } from "@/lib/utils";
import { Reveal } from "@/components/site/reveal";

/*
 * Two-column explanation (observed layout: dark first statement + muted
 * continuation, supporting paragraph left; bordered dotted panel right).
 * The right panel is a live miniature of the real application and learning
 * UI instead of a video. It only animates while on screen.
 */

const STEPS = ["About you", "Your idea", "Residence", "Questions", "Review"];

function useTicker(active: boolean, ms: number, count: number) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!active) return;
    const t = window.setInterval(() => setI((v) => (v + 1) % count), ms);
    return () => window.clearInterval(t);
  }, [active, ms, count]);
  return i;
}

/** Typewriter effect. Remounted per step (keyed by the parent), so it always starts from zero. */
function Typed({ text, run }: { text: string; run: boolean }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!run) return;
    const t = window.setInterval(() => setN((v) => (v >= text.length ? v : v + 1)), 28);
    return () => window.clearInterval(t);
  }, [text, run]);
  const shown = run ? n : text.length;
  return (
    <>
      {text.slice(0, shown)}
      {shown < text.length && <span className="ml-px inline-block h-[1em] w-[2px] translate-y-[2px] bg-void" />}
    </>
  );
}

function ApplyMini({ run }: { run: boolean }) {
  const db = useDb();
  const step = useTicker(run, 2600, STEPS.length);
  const winter = formForCohort(db, "c_winter27");
  const field = "rounded-[8px] border-[1.5px] border-line bg-paper px-3 py-2 text-[13.5px]";
  return (
    <div className="rounded-[16px] bg-paper p-4 shadow-[0_12px_30px_-16px_rgba(0,0,0,0.3)] ring-1 ring-black/5">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold">Winter 2027 application</p>
        <p className="text-[11.5px] text-muted">Closes {winter ? fmtDateShort(winter.closesAt) : "Nov 15"}</p>
      </div>
      <ol className="mt-3 flex gap-1" aria-label="Application steps">
        {STEPS.map((s, i) => (
          <li key={s} className="flex-1">
            <span className={cn("block h-1.5 rounded-full transition-colors duration-300", i < step ? "bg-void" : i === step ? "bg-jade" : "bg-ash")} />
            <span className={cn("mt-1 hidden truncate text-[10.5px] sm:block", i === step ? "font-medium text-void" : "text-muted")}>{s}</span>
          </li>
        ))}
      </ol>
      <div className="relative mt-4 min-h-[150px]">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }} className="space-y-2.5">
            {step === 0 && (
              <>
                <p className="text-[12px] font-medium">Full name</p>
                <p className={field}>
                  <Typed text="Maya Chen" run={run} />
                </p>
                <p className="text-[12px] font-medium">Date of birth</p>
                <p className={field}>2008-06-21</p>
              </>
            )}
            {step === 1 && (
              <>
                <p className="text-[12px] font-medium">What problem do you want to solve?</p>
                <p className={cn(field, "min-h-[88px] leading-relaxed")}>
                  <Typed text="Every September my friends spend hundreds on textbooks they use for one year…" run={run} />
                </p>
                <p className="text-right text-[11px] text-muted">Saved 10:42</p>
              </>
            )}
            {step === 2 && (
              <>
                <p className={cn(field, "flex items-center gap-2")}>
                  <MapPin className="size-4 text-muted" aria-hidden /> 14 Alder Row, Eastbank, Larkhaven 00212
                </p>
                <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="flex items-center gap-2 rounded-[8px] bg-leaf px-3 py-2 text-[13px] text-leaf-ink">
                  <CheckCircle2 className="size-4" aria-hidden /> In service area · Eastbank
                </motion.p>
                <p className="rounded-[8px] bg-fog px-3 py-2 text-[12.5px] text-muted">Proof of residence reviewed separately by an assigned reviewer</p>
              </>
            )}
            {step === 3 && (
              <>
                {["Finding customers", "Money and pricing", "Building a prototype"].map((o, i) => (
                  <motion.p key={o} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.25 }} className="flex items-center gap-2 text-[13.5px]">
                    <span className={cn("grid size-4 place-items-center rounded-[4px]", i < 2 ? "bg-void text-paper" : "ring-1 ring-[#9aa3aa]")}>{i < 2 && <Check className="size-3" strokeWidth={3} />}</span>
                    {o}
                  </motion.p>
                ))}
              </>
            )}
            {step === 4 && (
              <div className="grid place-items-center py-4 text-center">
                <motion.span initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20 }} className="grid size-11 place-items-center rounded-full bg-jade">
                  <Check className="size-5" strokeWidth={3} />
                </motion.span>
                <p className="mt-2 text-[14px] font-semibold">Application submitted</p>
                <p className="text-[12px] text-muted">Reference LP-W27-0153 · answers locked</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function LearnMini({ run }: { run: boolean }) {
  const db = useDb();
  const sessions = (db.modules["ff-2"]?.sessionIds ?? []).map((id) => db.sessions[id]?.published?.title).filter(Boolean) as string[];
  const done = useTicker(run, 1500, sessions.length + 2);
  const n = Math.min(done, sessions.length);
  return (
    <div className="rounded-[16px] bg-paper p-4 shadow-[0_12px_30px_-16px_rgba(0,0,0,0.3)] ring-1 ring-black/5">
      <p className="text-[10.5px] font-medium uppercase tracking-[0.16em] text-muted">Founder Foundations · Module 2</p>
      <p className="mt-1 font-display text-[24px] leading-tight tracking-[-0.02em]">{db.modules["ff-2"]?.title ?? "Customer interviews"}</p>
      <ul className="mt-3 space-y-2">
        {sessions.map((t, i) => (
          <li key={t} className="flex items-center gap-2.5 text-[13.5px]">
            <span className={cn("grid size-5 shrink-0 place-items-center rounded-full border transition-colors duration-300", i < n ? "border-jade bg-jade" : "border-[#b5bcc2]")}>{i < n && <Check className="size-3" strokeWidth={3} />}</span>
            <span className={cn("truncate", i < n && "text-muted line-through decoration-black/20")}>{t}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-ash">
        <motion.div className="h-full rounded-full bg-jade" animate={{ width: `${sessions.length ? (n / sessions.length) * 100 : 0}%` }} transition={{ duration: 0.5 }} />
      </div>
      <AnimatePresence>
        {done >= sessions.length && (
          <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 rounded-[8px] bg-void px-3 py-2 text-[12.5px] text-paper">
            Elena approved your assignment: “Lead with your strongest quote.”
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Explainer() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const reduced = usePrefersReducedMotion();
  const [tab, setTab] = useState<"apply" | "learn">("apply");
  const run = inView && !reduced;

  return (
    <section className="dots-light relative bg-paper py-[var(--space-section)]" aria-labelledby="explainer-h">
      <div className="container-page grid grid-cols-1 items-center gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
        <Reveal>
          <h2 id="explainer-h" className="display-xl">
            <span>Learning by building,</span> <span className="text-muted-display">with people who have your back.</span>
          </h2>
          <p className="mt-6 max-w-[560px] text-[17px] leading-[1.6] text-ink">
            Fellows don&apos;t just study entrepreneurship — they run interviews, test prices and launch small experiments in their own neighborhood. Every step lives in one workspace: your application, your cohort, your curriculum, your assignments and supervised conversations with your mentor.
          </p>
          <ul className="mt-6 grid max-w-[520px] gap-2 text-[15.5px]">
            {["Apply once, track every step of your application", "Weekly sessions with real tasks and real feedback", "An assigned mentor and a cohort in your city"].map((t) => (
              <li key={t} className="flex items-start gap-3">
                <span className="mt-[7px] size-2 shrink-0 rounded-[2px] bg-jade" aria-hidden />
                {t}
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={0.1}>
          <div ref={ref} className="dots-light relative rounded-[24px] border-2 border-line bg-[#fcfcfc] p-5 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.25)] sm:p-8">
            <div className="mb-5 inline-flex rounded-[8px] bg-void p-1" role="tablist" aria-label="Preview">
              {(["apply", "learn"] as const).map((t) => (
                <button
                  key={t}
                  role="tab"
                  aria-selected={tab === t}
                  onClick={() => setTab(t)}
                  className={cn("h-8 rounded-[6px] px-3 text-[13px] font-medium capitalize transition-colors", tab === t ? "bg-paper text-void" : "text-paper/70 hover:text-paper")}
                >
                  {t}
                </button>
              ))}
            </div>
            <p className="mb-3 text-[12px] text-muted">Live preview of the demo — {reduced ? "animation paused (reduced motion)" : run ? "playing" : "paused while off screen"}</p>
            <div className="max-w-[440px]" role="tabpanel">
              {tab === "apply" ? <ApplyMini run={run} /> : <LearnMini run={run} />}
            </div>
            <div className="pointer-events-none absolute -right-2 top-10 hidden rotate-3 rounded-[6px] bg-lemon px-3 py-2 text-[12.5px] font-medium shadow-md md:block">
              Saves as you go
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
