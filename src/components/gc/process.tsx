"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CalendarCheck2, CheckCircle2, FileText, FolderUp, PenLine, ShieldCheck } from "lucide-react";
import { PROCESS } from "@/lib/content/site";
import { useMediaQuery, usePrefersReducedMotion } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/site/reveal";

/*
 * Four-step process. Desktop: a row of four tabs sticks below the nav while
 * the steps scroll; the active tab turns jade with a scroll-linked progress
 * bar and a tilted preview swaps on the right. Mobile and reduced motion get
 * a plain stacked list.
 */

const CTAS = [
  { href: "/book-a-call", label: "Book your call" },
  { href: "/sample-work", label: "See the formats we match" },
  { href: "/about#process", label: "How quality review works" },
  { href: "/case-drafting#pricing", label: "See pricing" },
];

function Frame({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="rounded-[20px] bg-paper p-5 shadow-[0_30px_60px_-24px_rgba(0,0,0,0.35),0_0_0_1px_rgba(0,0,0,0.05)]">
      <div className="mb-4 flex items-center gap-1.5" aria-hidden>
        <span className="size-2.5 rounded-full bg-ash" />
        <span className="size-2.5 rounded-full bg-ash" />
        <span className="size-2.5 rounded-full bg-ash" />
        <span className="ml-3 text-[11.5px] text-muted">{label}</span>
      </div>
      {children}
    </div>
  );
}

function CallPreview() {
  return (
    <Frame label="Book a call · 30 minutes">
      <p className="font-display text-[26px] leading-none tracking-[-0.02em]">Tuesday, 10:30 AM ET</p>
      <p className="mt-1 text-[13px] text-muted">Video call with Marta Gronkiewicz, Onboarding Lead</p>
      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[11px]">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <span key={i} className="text-muted">
            {d}
          </span>
        ))}
        {Array.from({ length: 14 }).map((_, i) => (
          <span key={i} className={cn("grid h-8 place-items-center rounded-[8px] tabular", i === 8 ? "bg-void text-paper" : i % 7 > 4 ? "text-[#c3c3c3]" : "bg-fog")}>
            {i + 10}
          </span>
        ))}
      </div>
      <ul className="mt-4 space-y-1.5 text-[13px]">
        {["Your case types and monthly volume", "Where work piles up today", "What your first case would cost"].map((t) => (
          <li key={t} className="flex items-center gap-2">
            <CalendarCheck2 className="size-4 text-leaf-ink" aria-hidden /> {t}
          </li>
        ))}
      </ul>
    </Frame>
  );
}

function SharePreview() {
  const files = [
    ["Case strategy — O-1A.docx", "From you · attorney notes"],
    ["House template — petition letter.docx", "Your format, fonts, headings"],
    ["Evidence package", "148 files · press, awards, letters"],
  ];
  return (
    <Frame label="Secure intake · Casey">
      <p className="font-display text-[26px] leading-none tracking-[-0.02em]">Shared with your team</p>
      <ul className="mt-4 space-y-2">
        {files.map(([n, d]) => (
          <li key={n} className="flex items-center gap-3 rounded-[10px] border-[1.5px] border-line px-3 py-2.5">
            <span className="grid size-9 place-items-center rounded-[8px] bg-fog">
              <FolderUp className="size-4" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13.5px] font-medium">{n}</span>
              <span className="block text-[12px] text-muted">{d}</span>
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {["Tone: formal, first person", "Citations: short form", "Exhibits: tabbed A–Z"].map((c) => (
          <span key={c} className="rounded-full bg-leaf px-2.5 py-1 text-[11.5px] font-medium text-leaf-ink">
            {c}
          </span>
        ))}
      </div>
    </Frame>
  );
}

function DraftPreview() {
  return (
    <Frame label="Draft · Petition letter v2">
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">Criterion 3 · Published material</p>
      <p className="mt-1 font-display text-[24px] leading-tight tracking-[-0.02em]">The beneficiary&apos;s work has been featured in major media.</p>
      <div className="mt-3 space-y-1.5" aria-hidden>
        <span className="block h-2 w-[94%] rounded bg-ash" />
        <span className="block h-2 w-[86%] rounded bg-ash" />
        <span className="block h-2 w-[90%] rounded bg-ash" />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-[12px] bg-fog p-3">
          <p className="flex items-center gap-1.5 text-[12px] font-semibold">
            <PenLine className="size-3.5" aria-hidden /> Drafted
          </p>
          <p className="mt-1 text-[12px] text-muted">Lizy M. Kurian · Senior Legal Writer</p>
        </div>
        <div className="rounded-[12px] bg-leaf p-3 text-leaf-ink">
          <p className="flex items-center gap-1.5 text-[12px] font-semibold">
            <ShieldCheck className="size-3.5" aria-hidden /> Reviewed
          </p>
          <p className="mt-1 text-[12px]">Francesco Cortese · 42 of 42 citations checked</p>
        </div>
      </div>
    </Frame>
  );
}

function SignPreview() {
  return (
    <Frame label="Filing-ready package">
      <div className="flex items-center justify-between">
        <p className="font-display text-[26px] leading-none tracking-[-0.02em]">O-1A · Ready for you</p>
        <span className="rounded-full bg-leaf px-2.5 py-1 text-[11.5px] font-medium text-leaf-ink">312 pages</span>
      </div>
      <ul className="mt-4 space-y-1.5 text-[13px]">
        {["Petition letter", "Exhibit index A–R", "Recommendation letters (5)", "Forms prep checklist"].map((t) => (
          <li key={t} className="flex items-center gap-2">
            <FileText className="size-4 text-muted" aria-hidden /> {t}
            <CheckCircle2 className="ml-auto size-4 text-leaf-ink" aria-hidden />
          </li>
        ))}
      </ul>
      <div className="mt-4 rounded-[12px] border-[1.5px] border-dashed border-line p-3">
        <p className="text-[11px] uppercase tracking-[0.14em] text-muted">Attorney of record</p>
        <p className="mt-1 font-display text-[24px] italic leading-none text-void">Your signature here</p>
      </div>
      <div className="mt-3 flex items-center justify-between rounded-[10px] bg-void px-3 py-2.5 text-[13px] text-paper">
        <span>First case invoice</span>
        <span className="font-medium text-jade">50% off</span>
      </div>
    </Frame>
  );
}

const PREVIEWS = [CallPreview, SharePreview, DraftPreview, SignPreview];

/** Home page: scroll-led sticky version. */
export function ProcessJourney({ id = "process" }: { id?: string }) {
  const desktop = useMediaQuery("(min-width: 1024px)");
  const reduced = usePrefersReducedMotion();
  const [active, setActive] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const barRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const pinned = desktop && !reduced;

  useEffect(() => {
    if (!pinned) return;
    let revert: (() => void) | undefined;
    let cancelled = false;
    (async () => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      const ctx = gsap.context(() => {
        stepRefs.current.forEach((el, i) => {
          if (!el) return;
          ScrollTrigger.create({ trigger: el, start: "top 60%", end: "bottom 60%", onToggle: (self) => self.isActive && setActive(i) });
          const bar = barRefs.current[i];
          if (bar) gsap.fromTo(bar, { scaleX: 0 }, { scaleX: 1, ease: "none", scrollTrigger: { trigger: el, start: "top 60%", end: "bottom 60%", scrub: 0.4 } });
        });
      }, sectionRef);
      revert = () => ctx.revert();
    })();
    return () => {
      cancelled = true;
      revert?.();
    };
  }, [pinned]);

  const goTo = (i: number) => {
    const el = stepRefs.current[i];
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.35;
    window.scrollTo({ top: y, behavior: reduced ? "auto" : "smooth" });
  };

  return (
    <section id={id} ref={sectionRef} className="scroll-mt-24 bg-paper py-[var(--space-section)]" aria-labelledby={`${id}-h`}>
      <Reveal className="container-page text-center">
        <p className="eyebrow text-void">How it works</p>
        <h2 id={`${id}-h`} className="display-xl mx-auto mt-4 max-w-[18ch]">
          Four steps from first call <span className="text-muted-display">to filing-ready.</span>
        </h2>
      </Reveal>

      <div className="hidden lg:motion-safe:block">
        <div className="sticky top-0 z-20 mt-2 bg-paper pb-2 pt-[96px] sm:pt-[104px]">
          <div className="container-page grid grid-cols-4 gap-2" role="tablist" aria-label="Process steps">
            {PROCESS.map((s, i) => (
              <button
                key={s.step}
                role="tab"
                aria-selected={active === i}
                onClick={() => goTo(i)}
                className={cn("relative overflow-hidden rounded-[8px] px-5 py-6 text-center text-[16px] font-light transition-colors duration-300 xl:text-[18px]", active === i ? "bg-jade text-void" : "bg-fog text-void hover:bg-ash")}
              >
                <span className="relative">
                  <span className="mr-2 text-[13px] font-medium tabular opacity-60">{s.step}</span>
                  {s.tab}
                </span>
                <span className="absolute inset-x-0 bottom-0 h-1 bg-mint/70" aria-hidden>
                  <span ref={(el) => void (barRefs.current[i] = el)} className="block h-full origin-left scale-x-0 bg-forest" />
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="container-page grid grid-cols-2 gap-16">
          <div>
            {PROCESS.map((s, i) => (
              <div key={s.step} ref={(el) => void (stepRefs.current[i] = el)} className="flex min-h-[74vh] flex-col justify-center py-10" role="tabpanel" aria-label={s.title}>
                <p className="eyebrow text-muted">Step {s.step}</p>
                <h3 className="mt-3 font-display text-[48px] font-light leading-[1.1] tracking-[-0.02em] xl:text-[54px]">{s.title}</h3>
                <p className="mt-5 max-w-[520px] text-[17px] leading-[1.6] text-ink">{s.body}</p>
                <div className="mt-7">
                  <ButtonLink href={CTAS[i].href} arrow>
                    {CTAS[i].label}
                  </ButtonLink>
                </div>
              </div>
            ))}
          </div>
          <div className="relative">
            <div className="sticky top-[calc(50vh-170px)] h-[440px] [perspective:1600px]">
              <AnimatePresence mode="popLayout">
                {PREVIEWS.map((P, i) =>
                  i === active ? (
                    <motion.div
                      key={i}
                      className="absolute inset-x-0 top-0 mx-auto max-w-[460px]"
                      style={{ rotateY: -10 }}
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -16 }}
                      transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
                    >
                      <P />
                    </motion.div>
                  ) : null,
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
      <div className="lg:motion-safe:hidden">
        <ProcessList className="mt-12" />
      </div>
    </section>
  );
}

/** Stacked version for inner pages, mobile and reduced motion. */
export function ProcessList({ className, previews = true }: { className?: string; previews?: boolean }) {
  return (
    <ol className={cn("container-page grid gap-14 md:gap-20", className)}>
      {PROCESS.map((s, i) => {
        const P = PREVIEWS[i];
        return (
          <Reveal as="li" key={s.step} className={cn("grid grid-cols-1 items-center gap-8", previews && "md:grid-cols-2")}>
            <div className="min-w-0">
              <p className="eyebrow text-muted">Step {s.step}</p>
              <h3 className="mt-3 font-display text-[34px] font-light leading-[1.1] tracking-[-0.02em] sm:text-[44px]">{s.title}</h3>
              <p className="mt-4 max-w-[560px] text-[16.5px] leading-[1.6] text-ink">{s.body}</p>
              <div className="mt-6">
                <ButtonLink href={CTAS[i].href} arrow>
                  {CTAS[i].label}
                </ButtonLink>
              </div>
            </div>
            {previews && (
              <div className="mx-auto w-full min-w-0 max-w-[460px]">
                <P />
              </div>
            )}
          </Reveal>
        );
      })}
    </ol>
  );
}

/** Compact four-up row (cards) for tight spots. */
export function ProcessRow() {
  return (
    <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {PROCESS.map((s, i) => (
        <Reveal as="li" key={s.step} delay={i * 0.06} className="min-w-0 rounded-[20px] bg-fog p-6">
          <span className="grid size-10 place-items-center rounded-full bg-void text-[14px] font-medium text-paper tabular">{s.step}</span>
          <h3 className="mt-5 text-[19px] font-medium leading-snug tracking-[-0.01em]">{s.title}</h3>
          <p className="mt-2 text-[14.5px] leading-relaxed text-muted">{s.body}</p>
        </Reveal>
      ))}
    </ol>
  );
}
