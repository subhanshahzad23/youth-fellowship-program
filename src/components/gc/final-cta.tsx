"use client";

import { motion } from "motion/react";
import { COMPANY } from "@/lib/content/site";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/site/reveal";
import { FirstCaseOffer } from "./offer";

/** Mint dotted closing CTA. The first-case offer sits directly above the button (brief §3). */
export function FinalCta({
  title = "Hand us your next petition.",
  body = "Book a 30-minute call. We'll look at your case types and volume, and tell you honestly whether we're a fit — and what your first case would cost.",
}: {
  title?: React.ReactNode;
  body?: React.ReactNode;
}) {
  return (
    <section className="bg-paper px-4 pb-[var(--space-section)] sm:px-6 lg:px-10" aria-labelledby="cta-h">
      <Reveal>
        <div className="dots-mint relative mx-auto max-w-[1360px] overflow-hidden rounded-[24px] px-6 py-20 text-center sm:py-28">
          <Tag className="right-[12%] top-[16%]" color="#195ad7" label="Attorney · you sign" dur={9} />
          <Tag className="bottom-[18%] left-[10%]" color="#00843f" label="Goodcase · we draft" dur={10} reverse />
          <h2 id="cta-h" className="display-xl mx-auto max-w-[16ch]">
            {title}
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-[17px] leading-relaxed">{body}</p>
          <FirstCaseOffer tone="mint" className="mt-8 justify-center" />
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/book-a-call" arrow size="lg" variant="dark">
              Book a 30-minute call
            </ButtonLink>
            <ButtonLink href="/sample-work" size="lg" variant="light">
              See sample work
            </ButtonLink>
          </div>
          <p className="mt-6 text-[13px] text-forest">{COMPANY.responseTime} Not a law firm — attorneys keep the strategy and the signature.</p>
        </div>
      </Reveal>
    </section>
  );
}

function Tag({ className, color, label, dur, reverse }: { className: string; color: string; label: string; dur: number; reverse?: boolean }) {
  const d = reverse ? -1 : 1;
  return (
    <motion.span
      className={"pointer-events-none absolute hidden items-center md:flex " + className}
      animate={{ y: [0, -8 * d, 0], x: [0, 6 * d, 0] }}
      transition={{ duration: dur, repeat: Infinity, ease: "easeInOut" }}
      aria-hidden
    >
      <svg width="18" height="18" viewBox="0 0 22 22">
        <path d="M3 2 L19 10 L11 12 L8 20 Z" fill={color} stroke="white" strokeWidth="1.5" />
      </svg>
      <span className="ml-1 rounded-[6px] px-2 py-0.5 text-[12px] font-semibold text-white" style={{ background: color }}>
        {label}
      </span>
    </motion.span>
  );
}
