import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";
import { SEGMENTS } from "@/lib/content/site";
import { OVERVIEW_FAQS, pickFaqs, segmentHref } from "@/lib/content/who-we-serve";
import { PublicHero, PublicShell } from "@/components/site/public-shell";
import { Reveal } from "@/components/site/reveal";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeader } from "@/components/gc/section";
import { ProcessRow } from "@/components/gc/process";
import { VideoTestimonials } from "@/components/gc/testimonials";
import { FaqBlock } from "@/components/gc/faq";
import { FinalCta } from "@/components/gc/final-cta";

export const metadata: Metadata = {
  title: "Who we serve",
  description:
    "Goodcase supports U.S. immigration law firms of every size — solo and small firms, growing firms, and large, high-volume practices — with petition drafting and case management. Flat fees from $500 per case.",
};

export default function WhoWeServePage() {
  return (
    <PublicShell>
      <PublicHero eyebrow="Who we serve" title="Support sized to your practice." muted="From solo attorneys to high-volume teams.">
        <p className="mt-6 max-w-[620px] text-[17px] leading-[1.6] text-paper/80 sm:text-[18px]">
          Goodcase works with U.S. immigration law firms of every size. The team stays the same — specialist drafters and experienced case managers — but how we work with you follows your caseload.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/book-a-call" arrow size="lg">
            Book a 30-minute call
          </ButtonLink>
          <ButtonLink href="#segments" variant="ghost-dark" size="lg">
            Find your practice
          </ButtonLink>
        </div>
      </PublicHero>

      <section id="segments" className="scroll-mt-24 bg-paper py-[var(--space-section)]" aria-labelledby="segments-h">
        <div className="container-page">
          <SectionHeader
            id="segments-h"
            eyebrow="Three kinds of practice"
            title="Same team, same standards."
            muted="A different setup for each."
            lede="Pick the description closest to your firm. Each page shows the problems we usually hear, how we work together and the setup we'd recommend."
          />
          <ul className="mt-12 grid grid-cols-1 gap-4 lg:grid-cols-3">
            {SEGMENTS.map((s, i) => (
              <Reveal as="li" key={s.slug} delay={i * 0.08} className="min-w-0">
                <Link href={segmentHref(s.slug)} className="group flex h-full flex-col rounded-[24px] bg-fog p-7 transition-colors duration-300 hover:bg-ash sm:p-9">
                  <div className="flex items-start justify-between gap-4">
                    <p className="eyebrow text-muted tabular">0{i + 1}</p>
                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-paper transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
                      <ArrowUpRight className="size-5" aria-hidden />
                    </span>
                  </div>
                  <h3 className="display-md mt-6">{s.name}</h3>
                  <p className="mt-3 text-[18px] leading-snug text-void">{s.short}</p>
                  <p className="mt-3 text-[15px] leading-relaxed text-muted">{s.intro}</p>

                  <div className="mt-7 border-t border-line pt-6">
                    <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">Sounds like you if</p>
                    <ul className="mt-3 space-y-2">
                      {s.pains.map((p) => (
                        <li key={p.title} className="flex items-start gap-2.5 text-[15px]">
                          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-void" aria-hidden />
                          <span className="min-w-0">{p.title}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-6">
                    <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">How we work together</p>
                    <ul className="mt-3 space-y-2">
                      {s.how.map((h) => (
                        <li key={h.title} className="flex items-start gap-2.5 text-[15px]">
                          <Check className="mt-0.5 size-4 shrink-0 text-leaf-ink" aria-hidden />
                          <span className="min-w-0">{h.title}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-auto pt-8">
                    <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">Recommended setup</p>
                    <p className="mt-2 inline-flex max-w-full rounded-[26px] bg-paper px-3.5 py-1.5 text-[14px] font-medium">{s.recommended}</p>
                    <p className="mt-5 text-[15px] font-medium underline-offset-4 group-hover:underline">See how we work with {s.name.toLowerCase()}</p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-paper pb-[var(--space-section)]" aria-labelledby="unsure-h">
        <div className="container-page">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeader
              id="unsure-h"
              eyebrow="Not sure which fits?"
              title="Start with a call."
              muted="We'll size it together."
              lede="Most firms don't sit neatly in one box. Every engagement starts the same way, and you can change the setup as your caseload changes — no minimum volume, no long-term contract."
            />
            <ButtonLink href="/book-a-call" arrow size="lg" className="self-start lg:self-end">
              Book a 30-minute call
            </ButtonLink>
          </div>
          <div className="mt-12">
            <ProcessRow />
          </div>
        </div>
      </section>

      <VideoTestimonials />
      <FaqBlock items={pickFaqs(OVERVIEW_FAQS)} />
      <FinalCta />
    </PublicShell>
  );
}
