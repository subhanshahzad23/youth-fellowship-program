import type { Metadata } from "next";
import Link from "next/link";
import { Mail } from "lucide-react";
import { COMPANY, FAQS } from "@/lib/content/site";
import { FAQ_TOPICS, faqsFor } from "@/lib/content/resources";
import { PublicHero, PublicShell } from "@/components/site/public-shell";
import { Reveal } from "@/components/site/reveal";
import { ButtonLink } from "@/components/ui/button";
import { Accordion } from "@/components/ui/overlay";
import { FinalCta } from "@/components/gc/final-cta";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Answers for U.S. immigration attorneys: what Goodcase does (and doesn't), which petitions we draft, flat-fee pricing from $500, confidentiality, AI use and how to get started.",
};

export default function FaqPage() {
  const topics = FAQ_TOPICS.map((t) => ({ ...t, items: faqsFor(t.topic) })).filter((t) => t.items.length > 0);

  return (
    <PublicShell>
      <PublicHero eyebrow="Resources · FAQ" title="Questions, answered." muted="Plainly.">
        <p className="mt-6 max-w-[620px] text-[17px] leading-[1.6] text-paper/90 sm:text-[18px]">
          {FAQS.length} straight answers about who we are, what we draft, what it costs and how we keep your clients&apos; information safe.
        </p>
      </PublicHero>

      <section className="bg-paper py-[var(--space-section)]" aria-label="Frequently asked questions">
        <div className="container-page">
          <nav aria-label="FAQ topics">
            <p className="eyebrow text-muted">Jump to a topic</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {topics.map((t) => (
                <li key={t.id}>
                  <a href={`#${t.id}`} className="inline-flex h-10 items-center gap-2 rounded-[26px] bg-fog px-4 text-[14.5px] font-medium text-void transition-colors hover:bg-ash">
                    {t.topic}
                    <span className="tabular text-[12.5px] text-muted">{t.items.length}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mt-14 space-y-16 sm:mt-16 sm:space-y-20">
            {topics.map((t, ti) => (
              <section key={t.id} id={t.id} className="grid scroll-mt-28 grid-cols-1 gap-6 border-t border-line pt-10 lg:grid-cols-[1fr_1.7fr] lg:gap-16" aria-labelledby={`${t.id}-h`}>
                <Reveal className="min-w-0">
                  <p className="font-display text-[22px] leading-none text-muted tabular">{String(ti + 1).padStart(2, "0")}</p>
                  <h2 id={`${t.id}-h`} className="display-md mt-3">
                    {t.topic}
                  </h2>
                  <p className="mt-3 max-w-[32ch] text-[15.5px] leading-relaxed text-muted">{t.blurb}</p>
                </Reveal>
                <Reveal delay={0.06} className="min-w-0">
                  <Accordion items={t.items.map((f, i) => ({ value: `${t.id}-${i}`, title: f.q, content: f.a }))} defaultValue={ti === 0 ? `${t.id}-0` : undefined} />
                </Reveal>
              </section>
            ))}
          </div>

          <Reveal className="mt-20">
            <div className="grid grid-cols-1 gap-8 rounded-[24px] bg-fog p-6 sm:p-10 lg:grid-cols-[1.4fr_1fr] lg:items-center" data-testid="still-questions">
              <div className="min-w-0">
                <p className="eyebrow text-void">Still have questions?</p>
                <h2 className="display-md mt-4">Ask a person, not a chatbot.</h2>
                <p className="mt-4 max-w-[56ch] text-[16px] leading-relaxed text-ink">
                  Book a 30-minute call and we&apos;ll answer anything about your case types, volume and fees. Or email us — {COMPANY.responseTime.toLowerCase()}
                </p>
              </div>
              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap lg:flex-col lg:items-stretch">
                <ButtonLink href="/book-a-call" size="lg" arrow variant="dark">
                  Book a 30-minute call
                </ButtonLink>
                <a
                  href={`mailto:${COMPANY.email}`}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-[8px] border-[1.5px] border-line bg-paper px-5 text-[16px] font-medium text-void transition-colors hover:border-void"
                >
                  <Mail className="size-4" aria-hidden />
                  {COMPANY.email}
                </a>
                <p className="text-[13px] text-muted lg:text-center">
                  Goodcase is not a law firm. Read our{" "}
                  <Link href="/ai-use-policy" className="underline underline-offset-4">
                    AI Use Policy
                  </Link>
                  .
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <FinalCta />
    </PublicShell>
  );
}
