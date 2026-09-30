"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, FileText, Lock, ShieldCheck, Sparkles } from "lucide-react";
import { useMediaQuery, usePrefersReducedMotion } from "@/lib/hooks";
import { useDb } from "@/lib/store/store";
import { cn, initials } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/site/reveal";

/*
 * Scroll-led journey. Observed on mural.co: a row of four large fog tabs sticks
 * below the nav while stacked content scrolls; the active tab turns jade with a
 * scroll-linked progress bar, and the product visual on the right swaps by
 * opacity with a fixed 3D tilt (rotateY −10°). Here the tabs are the four
 * fellowship stages and the visuals are miniature product screens.
 * Desktop only (≥1024px): mobile and reduced motion get a plain stacked list.
 */

const STEPS = [
  {
    key: "apply",
    tab: "Apply",
    title: "Apply in one sitting — or five",
    body: "A friendly multistep application that saves as you go. Check whether your address is in our service area, add proof of residence, and track your application from submitted to decided.",
    cta: { href: "/#dates", label: "See open intakes" },
  },
  {
    key: "cohort",
    tab: "Join a cohort",
    title: "Join a cohort that starts together",
    body: "Approved applicants join a cohort of up to 16 fellows for 18 months. Same login, new workspace: your cohort, your track, your program team and a clear timeline from kickoff to showcase.",
    cta: { href: "/cohorts/winter-2027", label: "Meet Winter 2027" },
  },
  {
    key: "learn",
    tab: "Learn by doing",
    title: "Learn by doing, with real feedback",
    body: "Six modules per track, each with readings, short videos and real tasks. Submit your work, get specific feedback from your instructor, and resubmit until it's right.",
    cta: { href: "/tracks/founder-foundations", label: "Browse the curriculum" },
  },
  {
    key: "mentors",
    tab: "Build with mentors",
    title: "Build with a mentor in your corner",
    body: "Every fellow is paired with a volunteer mentor. Conversations happen on the platform, where program staff can review them — so support stays safe, visible and accountable.",
    cta: { href: "/#safeguarding", label: "How we keep it safe" },
  },
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

function ApplyPreview() {
  return (
    <Frame label="Applicant · Winter 2027">
      <div className="flex items-center justify-between">
        <p className="font-display text-[26px] leading-none tracking-[-0.02em]">Residence eligibility</p>
        <span className="rounded-full bg-fog px-2.5 py-1 text-[11.5px] text-muted">Saved 10:42</span>
      </div>
      <div className="mt-4 grid grid-cols-5 gap-1">
        {[1, 1, 2, 0, 0].map((s, i) => (
          <span key={i} className={cn("h-1.5 rounded-full", s === 1 ? "bg-void" : s === 2 ? "bg-jade" : "bg-ash")} />
        ))}
      </div>
      <div className="mt-5 space-y-3">
        <div className="rounded-[10px] border-[1.5px] border-line px-3 py-2.5 text-[14px]">14 Alder Row, Eastbank, Larkhaven 00212</div>
        <div className="flex items-center gap-2 rounded-[10px] bg-leaf px-3 py-2.5 text-[13.5px] text-leaf-ink">
          <CheckCircle2 className="size-4" /> Location check: in service area
        </div>
        <div className="flex items-center gap-3 rounded-[10px] border-[1.5px] border-line px-3 py-2.5">
          <span className="grid size-9 place-items-center rounded-[8px] bg-fog">
            <FileText className="size-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13.5px] font-medium">sample-utility-bill.pdf</span>
            <span className="block text-[12px] text-muted">Proof of residence · restricted to assigned reviewers</span>
          </span>
          <Lock className="size-4 text-muted" />
        </div>
      </div>
    </Frame>
  );
}

function CohortPreview() {
  const db = useDb();
  const fellows = Object.values(db.memberships)
    .filter((m) => m.cohortId === "c_summer26" && m.role === "fellow")
    .slice(0, 12)
    .map((m) => db.users[m.userId]);
  return (
    <Frame label="Fellow workspace · My cohort">
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">Summer 2026 · Month 4 of 18</p>
      <p className="mt-1 font-display text-[26px] leading-none tracking-[-0.02em]">Your cohort</p>
      <div className="mt-4 grid gap-[3px]" style={{ gridTemplateColumns: "repeat(18,1fr)" }}>
        {Array.from({ length: 18 }).map((_, i) => (
          <span key={i} className={cn("h-2.5 rounded-[2px]", i < 3 ? "bg-void" : i === 3 ? "bg-jade" : "bg-ash")} />
        ))}
      </div>
      <div className="mt-5 grid grid-cols-6 gap-2">
        {fellows.map((u) => (
          <span key={u.id} className="grid aspect-square place-items-center rounded-[10px] text-[12px] font-semibold" style={{ background: `hsl(${u.avatarHue} 70% 86%)` }} title={u.name}>
            {initials(u.name)}
          </span>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-[10px] bg-void px-3 py-2.5 text-[13px] text-paper">
        <Sparkles className="size-4 text-jade" /> Welcome email sent · same login, new workspace
      </div>
    </Frame>
  );
}

function LearnPreview() {
  const db = useDb();
  const s = db.sessions["ff-2-3"]?.published;
  return (
    <Frame label="Session reader">
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">Module 2 · Task</p>
      <p className="mt-1 font-display text-[26px] leading-tight tracking-[-0.02em]">{s?.title ?? "Run five customer interviews"}</p>
      <div className="mt-3 space-y-1.5" aria-hidden>
        <span className="block h-2 w-[92%] rounded bg-ash" />
        <span className="block h-2 w-[84%] rounded bg-ash" />
        <span className="block h-2 w-[88%] rounded bg-ash" />
      </div>
      <div className="mt-5 rounded-[12px] bg-fog p-4">
        <div className="flex items-center justify-between">
          <p className="text-[13.5px] font-semibold">Your submission · version 2</p>
          <span className="rounded-full bg-leaf px-2.5 py-0.5 text-[11.5px] font-medium text-leaf-ink">Approved</span>
        </div>
        <p className="mt-2 text-[13px] text-ink">“Great evidence. Lead with your strongest quote, then show the pattern across all five.”</p>
        <p className="mt-1 text-[12px] text-muted">Elena Ruiz · Track instructor</p>
      </div>
    </Frame>
  );
}

function MentorPreview() {
  return (
    <Frame label="Messages · Mentor">
      <div className="flex items-center justify-between">
        <p className="text-[15px] font-semibold">Daniel Brooks</p>
        <span className="flex items-center gap-1 text-[11.5px] text-muted">
          <ShieldCheck className="size-3.5" /> Program staff can review
        </span>
      </div>
      <div className="mt-4 space-y-2.5 text-[13.5px]">
        <p className="max-w-[80%] rounded-[12px] bg-fog px-3 py-2">Nine strangers is a real signal. Did anyone ask when the next one is?</p>
        <p className="ml-auto max-w-[80%] rounded-[12px] bg-void px-3 py-2 text-paper">Four people asked. One offered to lend us a soldering station.</p>
        <p className="max-w-[80%] rounded-[12px] bg-fog px-3 py-2">Before Tuesday, write down what it cost to run — even rough numbers.</p>
        <p className="flex items-center gap-1 pl-1 text-muted" aria-label="Noah is typing">
          <span className="typing-dot size-1.5 rounded-full bg-muted" />
          <span className="typing-dot size-1.5 rounded-full bg-muted [animation-delay:150ms]" />
          <span className="typing-dot size-1.5 rounded-full bg-muted [animation-delay:300ms]" />
        </p>
      </div>
    </Frame>
  );
}

const PREVIEWS = [ApplyPreview, CohortPreview, LearnPreview, MentorPreview];

export function Journey() {
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
    <section id="journey" ref={sectionRef} className="scroll-mt-24 bg-paper py-[var(--space-section)]" aria-labelledby="journey-h">
      <Reveal className="container-page text-center">
        <p className="eyebrow text-void">How it works</p>
        <h2 id="journey-h" className="display-xl mx-auto mt-4 max-w-[18ch]">
          From first idea to a venture you run
        </h2>
      </Reveal>

      <div className="hidden lg:motion-safe:block">
          <div className="sticky top-0 z-20 mt-2 bg-paper pb-2 pt-[96px] sm:pt-[104px]">
            <div className="container-page grid grid-cols-4 gap-2" role="tablist" aria-label="Fellowship stages">
              {STEPS.map((s, i) => (
                <button
                  key={s.key}
                  role="tab"
                  aria-selected={active === i}
                  onClick={() => goTo(i)}
                  className={cn(
                    "relative overflow-hidden rounded-[8px] px-6 py-6 text-center text-[17px] font-light transition-colors duration-300 xl:text-[19px]",
                    active === i ? "bg-jade text-void" : "bg-fog text-void hover:bg-ash",
                  )}
                >
                  <span className="relative">
                    <span className="mr-2 text-[13px] font-medium tabular opacity-60">0{i + 1}</span>
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
              {STEPS.map((s, i) => (
                <div key={s.key} ref={(el) => void (stepRefs.current[i] = el)} className="flex min-h-[78vh] flex-col justify-center py-10" role="tabpanel" aria-label={s.tab}>
                  <h3 className="font-display text-[48px] font-light leading-[1.12] tracking-[-0.02em] xl:text-[54px]">{s.title}</h3>
                  <p className="mt-5 max-w-[520px] text-[17px] leading-[1.6] text-ink">{s.body}</p>
                  <div className="mt-7">
                    <ButtonLink href={s.cta.href} arrow>
                      {s.cta.label}
                    </ButtonLink>
                  </div>
                </div>
              ))}
            </div>
            <div className="relative">
              <div className="sticky top-[calc(50vh-190px)] h-[440px] [perspective:1600px]">
                <AnimatePresence mode="popLayout">
                  {PREVIEWS.map((P, i) =>
                    i === active ? (
                      <motion.div
                        key={i}
                        className="absolute inset-x-0 top-0 mx-auto max-w-[480px]"
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
        <ol className="container-page mt-12 grid gap-14 md:gap-20">
          {STEPS.map((s, i) => {
            const P = PREVIEWS[i];
            return (
              <Reveal as="li" key={s.key} className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
                <div>
                  <p className="eyebrow text-muted">
                    Step {i + 1} · {s.tab}
                  </p>
                  <h3 className="mt-3 font-display text-[36px] font-light leading-[1.1] tracking-[-0.02em] sm:text-[44px]">{s.title}</h3>
                  <p className="mt-4 text-[16.5px] leading-[1.6] text-ink">{s.body}</p>
                  <div className="mt-6">
                    <ButtonLink href={s.cta.href} arrow>
                      {s.cta.label}
                    </ButtonLink>
                  </div>
                </div>
                <div className="mx-auto w-full max-w-[480px]">
                  <P />
                </div>
              </Reveal>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
