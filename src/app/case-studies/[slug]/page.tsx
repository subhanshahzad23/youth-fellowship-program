import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, Quote } from "lucide-react";
import { CASE_STUDIES } from "@/lib/content/site";
import { CASE_STUDY_DETAILS, getCaseStudy, segmentFor } from "@/lib/content/resources";
import { PublicHero, PublicShell } from "@/components/site/public-shell";
import { Reveal } from "@/components/site/reveal";
import { PlaceholderTag } from "@/components/gc/section";
import { FinalCta } from "@/components/gc/final-cta";
import { IllustrativeTag } from "@/components/resources/cards";

export function generateStaticParams() {
  return CASE_STUDIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/case-studies/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const cs = getCaseStudy(slug);
  if (!cs) return { title: "Case study not found" };
  return {
    title: `${cs.title} — illustrative case study`,
    description: `Illustrative, anonymized scenario (${cs.segment.toLowerCase()}): ${cs.challenge}`,
  };
}

export default async function CaseStudyPage({ params }: PageProps<"/case-studies/[slug]">) {
  const { slug } = await params;
  const cs = getCaseStudy(slug);
  if (!cs) notFound();

  const detail = CASE_STUDY_DETAILS[cs.slug];
  const segment = segmentFor(cs.segment);
  const others = CASE_STUDIES.filter((c) => c.slug !== cs.slug);

  return (
    <PublicShell>
      <PublicHero
        eyebrow={`Case study · ${cs.segment}`}
        title={cs.title}
        aside={
          <div className="rounded-[24px] bg-paper p-6 text-void shadow-panel sm:p-7">
            <p className="eyebrow text-muted">At a glance</p>
            <dl className="mt-5 space-y-4">
              {[
                ["Firm", cs.firm],
                ["Segment", cs.segment],
                ["Support", segment?.recommended ?? "Case drafting"],
              ].map(([k, v]) => (
                <div key={k} className="border-t border-line pt-4">
                  <dt className="text-[12.5px] text-muted">{k}</dt>
                  <dd className="mt-0.5 text-[16px] font-medium leading-snug">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        }
      >
        <p className="mt-6 max-w-[600px] text-[17px] leading-[1.6] text-paper/90 sm:text-[18px]">{cs.challenge}</p>
        <p className="mt-5">
          <IllustrativeTag dark />
        </p>
      </PublicHero>

      {/* Metrics row — same treatment as the home fact strip */}
      <section className="bg-paper pt-[var(--space-section)]" aria-labelledby="metrics-h">
        <div className="container-page">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <h2 id="metrics-h" className="text-center text-[13px] font-light uppercase tracking-[0.25em] text-void">
              The scenario in numbers
            </h2>
            <PlaceholderTag>Illustrative figures</PlaceholderTag>
          </div>
          <ul className="mt-12 grid grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-3">
            {cs.metrics.map((m, i) => (
              <Reveal as="li" key={m.label} delay={i * 0.08} className="min-w-0 border-line px-0 sm:border-l sm:px-8 sm:first:border-l-0 sm:first:pl-0">
                <p className="font-display text-[56px] font-light leading-none tracking-[-0.045em] tabular sm:text-[64px] lg:text-[80px]">{m.value}</p>
                <p className="mt-2 text-[15px] font-medium sm:text-[17px]">{m.label}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* Challenge, approach, result */}
      <section className="bg-paper py-[var(--space-section)]" aria-label="Challenge, approach and result">
        <div className="container-page space-y-4">
          <Reveal className="grid grid-cols-1 gap-6 rounded-[24px] bg-fog p-6 sm:p-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12">
            <h2 className="eyebrow pt-2 text-muted">01 · The challenge</h2>
            <p className="min-w-0 font-display text-[28px] leading-[1.25] tracking-[-0.02em] text-void sm:text-[36px]">{cs.challenge}</p>
          </Reveal>

          {detail && (
            <Reveal className="grid grid-cols-1 gap-6 rounded-[24px] bg-fog p-6 sm:p-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12">
              <h2 className="eyebrow pt-2 text-muted">02 · The approach</h2>
              <ol className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
                {detail.approach.map((a, i) => (
                  <li key={a.title} className="min-w-0 rounded-[16px] bg-paper p-5">
                    <span className="font-display text-[22px] leading-none text-muted tabular">{String(i + 1).padStart(2, "0")}</span>
                    <p className="mt-3 text-[16px] font-medium text-void">{a.title}</p>
                    <p className="mt-1.5 text-[14.5px] leading-relaxed text-muted">{a.body}</p>
                  </li>
                ))}
              </ol>
            </Reveal>
          )}

          <Reveal className="grid grid-cols-1 gap-6 rounded-[24px] bg-leaf p-6 sm:p-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12">
            <h2 className="eyebrow pt-2 text-leaf-ink">03 · The result</h2>
            <p className="min-w-0 font-display text-[28px] leading-[1.25] tracking-[-0.02em] text-void sm:text-[36px]">{cs.result}</p>
          </Reveal>
        </div>
      </section>

      {/* Pull quote placeholder */}
      <section className="bg-paper pb-[var(--space-section)]" aria-label="Client quote">
        <div className="container-page">
          <Reveal>
            <figure className="dots-dark on-dark relative overflow-hidden rounded-[24px] px-6 py-14 text-paper sm:px-14 sm:py-20" data-testid="quote-placeholder">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Quote className="size-9 text-jade" aria-hidden />
                <PlaceholderTag dark>Pull quote placeholder</PlaceholderTag>
              </div>
              <blockquote className="mt-8 max-w-[28ch] font-display text-[34px] leading-[1.15] tracking-[-0.03em] text-paper/45 sm:text-[48px]">
                &ldquo;{detail?.quoteNote ?? "An approved client quote goes here."}&rdquo;
              </blockquote>
              <figcaption className="mt-8 text-[14.5px] text-paper/60">— Attorney name and firm, shared with permission</figcaption>
            </figure>
          </Reveal>
        </div>
      </section>

      {/* Related segment + other scenarios */}
      <section className="bg-paper pb-[var(--space-section)]" aria-label="Related">
        <div className="container-page grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_1fr]">
          {segment && (
            <Link href={`/who-we-serve/${segment.slug}`} className="group flex min-w-0 flex-col rounded-[24px] bg-fog p-6 transition-colors duration-300 hover:bg-ash sm:p-10">
              <p className="eyebrow text-muted">Who we serve</p>
              <h2 className="display-md mt-4 text-void">
                {segment.name}
              </h2>
              <p className="mt-3 max-w-[48ch] text-[16px] leading-relaxed text-ink">{segment.intro}</p>
              <span className="mt-8 inline-flex items-center gap-1 text-[15px] font-medium text-void">
                How we work with {segment.name.toLowerCase()}
                <ArrowUpRight className="size-4 transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
              </span>
            </Link>
          )}
          <div className="min-w-0 rounded-[24px] border border-line p-6 sm:p-10">
            <p className="eyebrow text-muted">More scenarios</p>
            <ul className="mt-4 divide-y divide-line">
              {others.map((o) => (
                <li key={o.slug}>
                  <Link href={`/case-studies/${o.slug}`} className="group flex items-start justify-between gap-4 py-4">
                    <span className="min-w-0">
                      <span className="block font-display text-[22px] leading-tight tracking-[-0.02em] text-void">{o.title}</span>
                      <span className="mt-1 block text-[13.5px] text-muted">{o.segment} · Illustrative</span>
                    </span>
                    <ArrowUpRight className="mt-1 size-4 shrink-0 text-muted transition-colors group-hover:text-void" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/case-studies" className="mt-4 inline-flex text-[14.5px] font-medium text-void underline underline-offset-4">
              All case studies
            </Link>
          </div>
        </div>
      </section>

      <FinalCta />
    </PublicShell>
  );
}
