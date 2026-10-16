import type { Metadata } from "next";
import { SAMPLE_WORK } from "@/lib/content/site";
import { PublicHero, PublicShell } from "@/components/site/public-shell";
import { Reveal } from "@/components/site/reveal";
import { ButtonLink } from "@/components/ui/button";
import { PlaceholderTag, SectionHeader } from "@/components/gc/section";
import { FinalCta } from "@/components/gc/final-cta";
import { SampleCard } from "@/components/resources/cards";

export const metadata: Metadata = {
  title: "Sample work",
  description:
    "Previews of the documents Goodcase drafts for U.S. immigration law firms: an O-1A exhibit index, an EB-2 NIW business plan, an O-1A recommendation letter and an O-1 petition brief.",
};

export default function SampleWorkPage() {
  return (
    <PublicShell>
      <PublicHero eyebrow="Resources · Sample work" title="The standard is high." muted="See it for yourself.">
        <p className="mt-6 max-w-[620px] text-[17px] leading-[1.6] text-paper/90 sm:text-[18px]">
          Exhibit indexes, briefs, letters and business plans — the documents that carry a petition. Preview the structure and the care that goes into each one.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/book-a-call" size="lg" arrow>
            Ask for a full sample
          </ButtonLink>
          <ButtonLink href="/case-drafting" size="lg" variant="ghost-dark">
            About case drafting
          </ButtonLink>
        </div>
      </PublicHero>

      <section className="bg-paper py-[var(--space-section)]" aria-labelledby="samples-h">
        <div className="container-page">
          <SectionHeader id="samples-h" eyebrow="Examples of our work" title="Four documents." muted="One standard." lede="Each preview is rendered from a fictional sample. Bracketed fields stand in for every name and fact — no client material is ever shown.">
            <p className="mt-5">
              <PlaceholderTag>Fictional samples — no client data</PlaceholderTag>
            </p>
          </SectionHeader>
          <ul className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {SAMPLE_WORK.map((s, i) => (
              <Reveal as="li" key={s.slug} delay={i * 0.06} className="min-w-0">
                <SampleCard item={s} />
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <FinalCta title="Want to see a full package?" body="Book a 30-minute call. We'll walk you through a complete sample for your case type and show how we'd adapt it to your templates." />
    </PublicShell>
  );
}
