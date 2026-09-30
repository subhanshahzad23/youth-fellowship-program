"use client";

import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/site/reveal";

/*
 * Observed pattern: a large dotted testimonial card (24px radius) with a jade
 * quote mark, a serif quote and prev/next chevrons outside the card. These are
 * clearly labeled fictional examples — no real testimonials or outcomes.
 */
const STORIES = [
  {
    venture: "Porchlight Repair",
    who: "Noah Williams · Summer 2026",
    track: "Founder Foundations",
    quote: "I thought people just didn't care about fixing things. Five interviews in, I realized they cared — they just didn't have the tools or anywhere to go.",
    learned: ["Interviews beat assumptions", "A pop-up is a cheap experiment", "Track who shows up, not who says yes"],
  },
  {
    venture: "Signbridge",
    who: "Zara Ahmed · Spring 2026",
    track: "Founder Foundations",
    quote: "My price test surprised me. Families didn't want cheaper lessons — they wanted a package they could commit to.",
    learned: ["Test price, don't guess it", "Listen for the real job", "Bundle around commitment"],
  },
  {
    venture: "Loop Refill",
    who: "Ethan Cole · Spring 2026",
    track: "Venture Building",
    quote: "Working out my break-even point turned a vague dream into a number I could actually chase every week.",
    learned: ["Fixed vs. variable costs", "Break-even as a weekly target", "Suppliers need a backup"],
  },
  {
    venture: "Stitch & Mend",
    who: "Imani Clarke · Spring 2026",
    track: "Leadership & Impact",
    quote: "Writing a team charter felt formal at first. It's the reason we still like each other three months later.",
    learned: ["Agree roles early", "Say what happens when someone misses", "Measure the impact you promise"],
  },
];

export function Stories() {
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);
  const touchX = useRef<number | null>(null);
  const go = useCallback((d: number) => {
    setDir(d);
    setI((v) => (v + d + STORIES.length) % STORIES.length);
  }, []);
  const s = STORIES[i];

  return (
    <section id="stories" className="scroll-mt-24 bg-paper py-[var(--space-section)]" aria-labelledby="stories-h" aria-roledescription="carousel">
      <Reveal className="container-page text-center">
        <p className="eyebrow text-void">Fellow stories</p>
        <h2 id="stories-h" className="display-xl mt-4">
          What building feels like
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-[15px] text-muted">Fictional demo examples based on the seeded ventures in this prototype — not real people or real outcomes.</p>
      </Reveal>

      <div className="container-page mt-12">
        <div className="relative mx-auto max-w-[1160px]">
          <button type="button" onClick={() => go(-1)} className="absolute left-2 top-1/2 z-10 hidden size-12 -translate-y-1/2 place-items-center rounded-full bg-paper/80 hover:bg-fog md:grid xl:-left-16 xl:bg-transparent" aria-label="Previous story">
            <ChevronLeft className="size-7" strokeWidth={1.5} />
          </button>
          <button type="button" onClick={() => go(1)} className="absolute right-2 top-1/2 z-10 hidden size-12 -translate-y-1/2 place-items-center rounded-full bg-paper/80 hover:bg-fog md:grid xl:-right-16 xl:bg-transparent" aria-label="Next story">
            <ChevronRight className="size-7" strokeWidth={1.5} />
          </button>

          <div
            className="dots-light relative overflow-hidden rounded-[24px] border-[1.5px] border-line bg-[#fbfbfb]"
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") go(-1);
              if (e.key === "ArrowRight") go(1);
            }}
            onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
            onTouchEnd={(e) => {
              if (touchX.current === null) return;
              const dx = e.changedTouches[0].clientX - touchX.current;
              if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
              touchX.current = null;
            }}
            tabIndex={0}
            aria-label={`Story ${i + 1} of ${STORIES.length}: ${s.venture}`}
          >
            <AnimatePresence mode="wait" custom={dir}>
              <motion.div
                key={i}
                custom={dir}
                initial={{ opacity: 0, x: dir * 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: dir * -40 }}
                transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
                className="grid grid-cols-1 gap-8 p-7 sm:p-12 lg:grid-cols-[1fr_280px] lg:p-14"
                aria-live="polite"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-[26px] font-semibold tracking-[-0.03em]">{s.venture}</p>
                    <span className="rounded-[26px] bg-leaf px-3 py-1 text-[12px] font-medium text-leaf-ink">Fictional example</span>
                  </div>
                  <p className="mt-8 font-display text-[56px] leading-[0.5] text-jade" aria-hidden>
                    “
                  </p>
                  <blockquote className="font-display text-[26px] font-light leading-[1.35] tracking-[-0.01em] sm:text-[32px]">{s.quote}</blockquote>
                  <p className="mt-6 text-[14px] text-muted">
                    {s.who} · {s.track}
                  </p>
                </div>
                <div className="self-end rounded-[16px] bg-paper p-5 ring-1 ring-line">
                  <p className="eyebrow text-muted">What they practiced</p>
                  <ul className="mt-3 space-y-2">
                    {s.learned.map((l) => (
                      <li key={l} className="flex items-start gap-2 text-[14.5px]">
                        <span className="mt-[7px] size-2 shrink-0 rounded-[2px] bg-jade" aria-hidden />
                        {l}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-6 flex items-center justify-center gap-4">
            <button type="button" onClick={() => go(-1)} className="grid size-11 place-items-center rounded-full bg-fog md:hidden" aria-label="Previous story">
              <ChevronLeft className="size-5" />
            </button>
            <div className="flex gap-2" role="tablist" aria-label="Choose a story">
              {STORIES.map((st, j) => (
                <button
                  key={st.venture}
                  type="button"
                  role="tab"
                  aria-selected={i === j}
                  aria-label={st.venture}
                  onClick={() => {
                    setDir(j > i ? 1 : -1);
                    setI(j);
                  }}
                  className="grid size-6 place-items-center"
                >
                  <span className={cn("block h-2 rounded-full transition-all duration-300", i === j ? "w-6 bg-void" : "w-2 bg-[#c6ccd1]")} />
                </button>
              ))}
            </div>
            <button type="button" onClick={() => go(1)} className="grid size-11 place-items-center rounded-full bg-fog md:hidden" aria-label="Next story">
              <ChevronRight className="size-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
