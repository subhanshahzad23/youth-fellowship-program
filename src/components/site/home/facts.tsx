"use client";

import { Reveal } from "@/components/site/reveal";

/*
 * Program facts strip. Adapts two observed patterns: the wide-tracked
 * "TRUSTED BY…" label strip and the oversized-number results row with thin
 * vertical dividers. No sponsor logos or outcome claims.
 */
const FACTS = [
  { value: "18", unit: "months", label: "A full program — long enough to launch something real." },
  { value: "16–24", unit: "years old", label: "For young people in Greater Larkhaven." },
  { value: "3", unit: "learning tracks", label: "Foundations, Venture Building, Leadership & Impact." },
  { value: "1", unit: "connected workspace", label: "Applications, learning and messaging together." },
];

export function Facts() {
  return (
    <section id="program" className="scroll-mt-28 bg-paper py-[var(--space-section)]" aria-labelledby="facts-h">
      <div className="container-page">
        <h2 id="facts-h" className="text-center text-[13px] font-light uppercase tracking-[0.25em] text-void">
          The fellowship at a glance
        </h2>
        <ul className="mt-12 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
          {FACTS.map((f, i) => (
            <Reveal as="li" key={f.unit} delay={i * 0.08} className="border-line px-0 sm:px-8 lg:border-l lg:first:border-l-0 lg:first:pl-0">
              <p className="font-display text-[48px] font-light leading-none tracking-[-0.045em] tabular sm:text-[80px]">{f.value}</p>
              <p className="mt-2 text-[15px] font-medium sm:text-[17px]">{f.unit}</p>
              <p className="mt-1 max-w-[260px] text-[13.5px] leading-relaxed text-muted sm:text-[15px]">{f.label}</p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
