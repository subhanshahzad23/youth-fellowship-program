import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, Check } from "lucide-react";
import { SEGMENTS } from "@/lib/content/site";
import { SEGMENT_DETAILS, getSegment, pickFaqs, segmentHref } from "@/lib/content/who-we-serve";
import { PublicHero, PublicShell } from "@/components/site/public-shell";
import { Reveal } from "@/components/site/reveal";
import { ButtonLink } from "@/components/ui/button";
import { PlaceholderTag, SectionHeader } from "@/components/gc/section";
import { RoiCalculator } from "@/components/gc/roi";
import { FeaturedTestimonial } from "@/components/gc/testimonials";
import { PricingBlock } from "@/components/gc/pricing";
import { FaqBlock } from "@/components/gc/faq";
import { FinalCta } from "@/components/gc/final-cta";

export function generateStaticParams() {
  return SEGMENTS.map((s) => ({ segment: s.slug }));
}

export async function generateMetadata({ params }: PageProps<"/who-we-serve/[segment]">): Promise<Metadata> {
  const { segment } = await params;
  const s = getSegment(segment);
  if (!s) notFound();
  return {
    title: `${s.name} — who we serve`,
    description: `${s.intro} Flat fees from $500 per case, first case at half price.`,
  };
}

export default async function SegmentPage({ params }: PageProps<"/who-we-serve/[segment]">) {
  const { segment } = await params;
  const s = getSegment(segment);
  const detail = SEGMENT_DETAILS[segment];
  if (!s || !detail) notFound();
  const others = SEGMENTS.filter((x) => x.slug !== s.slug);

  return (
    <PublicShell>
      <PublicHero eyebrow={`Who we serve · ${s.name}`} title={s.headline} muted={s.muted}>
        <p className="mt-6 max-w-[620px] text-[17px] leading-[1.6] text-paper/80 sm:text-[18px]">{s.intro}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/book-a-call" arrow size="lg">
            Book a 30-minute call
          </ButtonLink>
          <ButtonLink href="#pricing" variant="ghost-dark" size="lg">
            See pricing
          </ButtonLink>
        </div>
      </PublicHero>

      {/* Pains */}
      <section className="bg-paper py-[var(--space-section)]" aria-labelledby="pains-h">
        <div className="container-page">
          <SectionHeader id="pains-h" eyebrow={s.name} title="Sound familiar?" muted="You're not the only one." lede="What we hear most often from firms like yours on a first call." />
          <ul className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
            {s.pains.map((p, i) => (
              <Reveal as="li" key={p.title} delay={i * 0.06} className="min-w-0 rounded-[24px] bg-fog p-7 sm:p-8">
                <span className="font-display text-[44px] font-light leading-none tracking-[-0.04em] text-muted-display tabular">0{i + 1}</span>
                <h3 className="mt-6 text-[20px] font-medium leading-snug tracking-[-0.01em]">{p.title}</h3>
                <p className="mt-2 text-[15.5px] leading-relaxed text-muted">{p.body}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* How we work */}
      <section className="bg-paper pb-[var(--space-section)]" aria-labelledby="how-h">
        <div className="container-page grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.3fr] lg:gap-16">
          <SectionHeader
            id="how-h"
            eyebrow="How we work"
            title="How we work with firms like yours."
            lede="You keep the strategy, the client and the signature. We take the hours in between — in your templates, your tone and your tools."
            className="min-w-0"
          />
          <ol className="min-w-0 divide-y divide-line border-y border-line">
            {s.how.map((h, i) => (
              <Reveal as="li" key={h.title} delay={i * 0.06} className="grid grid-cols-[auto_minmax(0,1fr)] gap-5 py-7 sm:gap-8">
                <span className="grid size-11 place-items-center rounded-full bg-leaf text-leaf-ink">
                  <Check className="size-5" strokeWidth={2.5} aria-hidden />
                </span>
                <div className="min-w-0">
                  <h3 className="font-display text-[28px] font-light leading-[1.1] tracking-[-0.02em] sm:text-[32px]">{h.title}</h3>
                  <p className="mt-2 max-w-[52ch] text-[16px] leading-relaxed text-ink">{h.body}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* Recommended setup */}
      <section className="px-[10px] pb-[var(--space-section)]" aria-labelledby="setup-h">
        <Reveal>
          <div className="dots-dark on-dark mx-auto max-w-[1420px] overflow-hidden rounded-[24px] text-paper">
            <div className="grid grid-cols-1 gap-10 px-6 py-14 sm:px-12 sm:py-16 lg:grid-cols-[1.2fr_1fr] lg:items-end lg:gap-16 lg:py-20">
              <div className="min-w-0">
                <p className="eyebrow text-mint">Recommended setup</p>
                <h2 id="setup-h" className="display-xl mt-4 max-w-[16ch]">
                  {s.recommended}
                </h2>
                <p className="mt-5 max-w-[540px] text-[17px] leading-[1.6] text-paper/80">
                  Our usual starting point for {s.name.toLowerCase()}. We confirm the exact scope and your fee on the first call, and you can adjust it month to month.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  {detail.services.map((svc, i) => (
                    <ButtonLink key={svc.href} href={svc.href} variant={i === 0 ? "primary" : "ghost-dark"} arrow={i === 0}>
                      {svc.label}
                    </ButtonLink>
                  ))}
                </div>
              </div>
              <figure className="min-w-0 rounded-[20px] bg-paper/[0.06] p-6 ring-1 ring-paper/15 sm:p-8">
                <PlaceholderTag dark>Illustrative example</PlaceholderTag>
                <blockquote className="mt-5 font-display text-[26px] font-light leading-[1.3] tracking-[-0.015em] sm:text-[30px]">{s.example}</blockquote>
                <figcaption className="mt-5 text-[13.5px] leading-relaxed text-paper/60">An illustration of the setup, not a client result. Real, approved case studies will replace it.</figcaption>
              </figure>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ROI */}
      <section className="bg-paper pb-[var(--space-section)]" aria-labelledby="roi-h">
        <div className="container-page">
          <SectionHeader id="roi-h" eyebrow="The math" title="Run your own numbers." muted="Illustrative, not a quote." lede="Compare what a petition costs your firm today with a flat Goodcase fee. Adjust the sliders to match your caseload." />
          <div className="mt-12">
            <RoiCalculator compact id="segment-roi" />
          </div>
        </div>
      </section>

      <FeaturedTestimonial id={detail.testimonial} />

      <PricingBlock />

      {/* Other segments */}
      <section className="bg-paper pb-[var(--space-section)]" aria-labelledby="others-h">
        <div className="container-page">
          <SectionHeader id="others-h" eyebrow="Who else we serve" title="A different kind of practice?" />
          <ul className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2">
            {others.map((o, i) => (
              <Reveal as="li" key={o.slug} delay={i * 0.06} className="min-w-0">
                <Link href={segmentHref(o.slug)} className="group flex h-full items-start justify-between gap-6 rounded-[24px] bg-fog p-7 transition-colors duration-300 hover:bg-ash sm:p-9">
                  <div className="min-w-0">
                    <h3 className="display-sm">{o.name}</h3>
                    <p className="mt-2 text-[16px] leading-relaxed text-muted">{o.short}</p>
                    <p className="mt-5 text-[14px] text-muted">
                      Recommended: <span className="font-medium text-void">{o.recommended}</span>
                    </p>
                  </div>
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-paper transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
                    <ArrowUpRight className="size-5" aria-hidden />
                  </span>
                </Link>
              </Reveal>
            ))}
          </ul>
          <p className="mt-6 text-[15px]">
            <Link href="/who-we-serve" className="font-medium underline underline-offset-4">
              Compare all three
            </Link>
          </p>
        </div>
      </section>

      <FaqBlock items={pickFaqs(detail.faqs)} />
      <FinalCta />
    </PublicShell>
  );
}
