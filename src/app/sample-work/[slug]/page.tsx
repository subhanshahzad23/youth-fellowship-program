import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { SAMPLE_WORK } from "@/lib/content/site";
import { SAMPLE_DETAILS, getSample } from "@/lib/content/resources";
import { PublicHero, PublicShell } from "@/components/site/public-shell";
import { Reveal } from "@/components/site/reveal";
import { ButtonLink } from "@/components/ui/button";
import { FinalCta } from "@/components/gc/final-cta";
import { SampleCard } from "@/components/resources/cards";
import { DocPreview } from "@/components/resources/doc-preview";

export function generateStaticParams() {
  return SAMPLE_WORK.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps<"/sample-work/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const item = getSample(slug);
  if (!item) return { title: "Sample not found" };
  return { title: `${item.title} — sample work`, description: item.summary };
}

export default async function SamplePage({ params }: PageProps<"/sample-work/[slug]">) {
  const { slug } = await params;
  const item = getSample(slug);
  const detail = item ? SAMPLE_DETAILS[item.slug] : undefined;
  if (!item || !detail) notFound();

  const others = SAMPLE_WORK.filter((s) => s.slug !== item.slug);

  return (
    <PublicShell>
      <PublicHero eyebrow={`Sample work · ${item.visa}`} title={item.title}>
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="rounded-[26px] bg-paper px-3 py-1 text-[13px] font-medium text-void">{item.visa}</span>
          <span className="rounded-[26px] bg-paper/10 px-3 py-1 text-[13px] font-medium text-paper">{item.format}</span>
        </div>
        <p className="mt-5 max-w-[600px] text-[17px] leading-[1.6] text-paper/90 sm:text-[18px]">
          A fictional {item.format.toLowerCase()} for an {item.visa} petition, previewed in the browser — so you can judge the structure and the care before you send us a case.
        </p>
      </PublicHero>

      <section className="bg-paper py-[var(--space-section)]" aria-labelledby="about-h">
        <div className="container-page grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-16">
          <Reveal className="min-w-0">
            <DocPreview doc={detail.preview} />
          </Reveal>

          <div className="min-w-0">
            <div className="lg:sticky lg:top-28">
              <p className="eyebrow text-void">About this document</p>
              <h2 id="about-h" className="display-md mt-4">
                What it is
              </h2>
              <p className="mt-4 text-[16.5px] leading-[1.65] text-ink">{item.summary}</p>

              <h3 className="mt-8 text-[17px] font-semibold text-void">Why it matters</h3>
              <p className="mt-2 text-[16px] leading-[1.65] text-ink">{detail.whyItMatters}</p>

              <div className="mt-8 rounded-[24px] bg-fog p-6">
                <h3 className="text-[17px] font-semibold text-void">What we deliver</h3>
                <ul className="mt-4 space-y-3">
                  {detail.deliver.map((d) => (
                    <li key={d} className="flex gap-3 text-[15px] leading-snug text-ink">
                      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-leaf text-leaf-ink">
                        <Check className="size-3" strokeWidth={3} aria-hidden />
                      </span>
                      <span className="min-w-0">{d}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <ButtonLink href="/book-a-call" arrow>
                  See a full sample on a call
                </ButtonLink>
                <ButtonLink href="/case-drafting" variant="outline">
                  Case drafting
                </ButtonLink>
              </div>
              <p className="mt-5 text-[13px] leading-relaxed text-muted">
                We draft from your strategy and in your format. Your attorneys review, sign and file. Goodcase is not a law firm and does not provide legal advice.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-paper pb-[var(--space-section)]" aria-labelledby="more-samples-h">
        <div className="container-page">
          <h2 id="more-samples-h" className="display-lg border-t border-line pt-12">
            More sample work.
          </h2>
          <ul className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((s, i) => (
              <Reveal as="li" key={s.slug} delay={i * 0.06} className="min-w-0">
                <SampleCard item={s} />
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <FinalCta />
    </PublicShell>
  );
}
