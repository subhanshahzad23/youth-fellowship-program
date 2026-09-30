"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Accordion } from "@/components/ui/overlay";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/site/reveal";

const FAQS = [
  {
    q: "Who can apply?",
    a: "Anyone aged 16–24 when their cohort starts who lives in Greater Larkhaven (Eastbank, Millbrook, Old Quay or Harborside). You don't need a finished idea — a problem you care about is enough to start.",
  },
  {
    q: "How is residence checked?",
    a: "The application checks whether your address is inside our service area. That's only a location check — you also upload a proof-of-residence document, which only reviewers assigned to your application can open. In this demo, you can use a watermarked sample document instead of your own.",
  },
  {
    q: "How much time does it take?",
    a: "Plan for six to eight hours a week: a weekly session, time on your own venture, and a check-in with your mentor every couple of weeks. The program runs for 18 months with a kickoff weekend and a showcase at the end.",
  },
  {
    q: "Can I apply to more than one intake?",
    a: "Yes. When more than one application window is open, you can apply to each separately. Each application has its own questions, dates and status, and your progress on one never affects the other.",
  },
  {
    q: "Who can message me?",
    a: "Fellows in your cohort, instructors who teach your cohort, your program manager and the mentor assigned to you. Mentors can only message the fellows assigned to them, and program staff can review fellowship conversations to keep everyone safe.",
  },
  {
    q: "What if I'm under 18?",
    a: "You can apply from 16. We ask for a parent or guardian contact on the application. How consent works for 16–17-year-olds will be confirmed with the program before launch.",
  },
  {
    q: "Is this site real?",
    a: "This is a demonstration with fictional people, places and data. Nothing you enter is sent anywhere — it stays in your browser, and you can reset it from the demo controls at any time.",
  },
];

export function Faq() {
  return (
    <section id="faqs" className="scroll-mt-24 bg-paper py-[var(--space-section)]" aria-labelledby="faq-h">
      <div className="container-page grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.5fr] lg:gap-16">
        <Reveal>
          <p className="eyebrow text-void">FAQs</p>
          <h2 id="faq-h" className="display-xl mt-4">
            Questions, <span className="text-muted-display">answered.</span>
          </h2>
          <p className="mt-5 max-w-sm text-[16px] leading-relaxed text-muted">
            Still curious? Open the demo and try the application yourself — it takes a couple of minutes with the sample answers.
          </p>
          <div className="mt-6">
            <ButtonLink href="/demo" variant="outline">
              Explore the demo
            </ButtonLink>
          </div>
        </Reveal>
        <Reveal delay={0.08}>
          <Accordion items={FAQS.map((f, i) => ({ value: `q${i}`, title: f.q, content: f.a }))} defaultValue="q0" />
        </Reveal>
      </div>
    </section>
  );
}

/* Observed: mint dotted rounded panel with floating role cursor tags and two CTAs. */
export function FinalCta() {
  return (
    <section className="bg-paper px-4 pb-[var(--space-section)] sm:px-6 lg:px-10" aria-labelledby="cta-h">
      <Reveal>
        <div className="dots-mint relative mx-auto max-w-[1360px] overflow-hidden rounded-[24px] px-6 py-20 text-center sm:py-28">
          <motion.span
            className="pointer-events-none absolute right-[14%] top-[18%] hidden items-center sm:flex"
            animate={{ y: [0, -8, 0], x: [0, 6, 0] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden
          >
            <svg width="18" height="18" viewBox="0 0 22 22">
              <path d="M3 2 L19 10 L11 12 L8 20 Z" fill="#5887ff" stroke="white" strokeWidth="1.5" />
            </svg>
            <span className="ml-1 rounded-[6px] bg-[#5887ff] px-2 py-0.5 text-[12px] font-semibold text-white">Mentor</span>
          </motion.span>
          <motion.span
            className="pointer-events-none absolute bottom-[20%] left-[12%] hidden items-center sm:flex"
            animate={{ y: [0, 8, 0], x: [0, -6, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden
          >
            <svg width="18" height="18" viewBox="0 0 22 22">
              <path d="M3 2 L19 10 L11 12 L8 20 Z" fill="#be53ff" stroke="white" strokeWidth="1.5" />
            </svg>
            <span className="ml-1 rounded-[6px] bg-[#be53ff] px-2 py-0.5 text-[12px] font-semibold text-white">Fellow</span>
          </motion.span>
          <h2 id="cta-h" className="display-xl mx-auto max-w-[14ch]">
            Ready to build what comes next?
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-[17px] leading-relaxed">Apply in one sitting or save and come back. Or step inside the demo first and see every side of the fellowship.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/#dates" arrow size="lg">
              Apply now
            </ButtonLink>
            <ButtonLink href="/demo" arrow size="lg" variant="dark">
              Explore the demo
            </ButtonLink>
          </div>
          <p className="mt-6 text-[13px] text-forest">
            Demo · fictional data ·{" "}
            <Link href="/demo" className="underline underline-offset-2">
              reset any time
            </Link>
          </p>
        </div>
      </Reveal>
    </section>
  );
}
