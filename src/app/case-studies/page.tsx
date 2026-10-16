import type { Metadata } from "next";
import { CASE_STUDIES } from "@/lib/content/site";
import { PublicHero, PublicShell } from "@/components/site/public-shell";
import { Reveal } from "@/components/site/reveal";
import { ButtonLink } from "@/components/ui/button";
import { PlaceholderTag } from "@/components/gc/section";
import { FinalCta } from "@/components/gc/final-cta";
import { CaseStudyCard } from "@/components/resources/cards";

export const metadata: Metadata = {
  title: "Case studies",
  description:
    "Illustrative, anonymized scenarios showing how solo, growing and high-volume U.S. immigration law firms use Goodcase drafting and case management.",
};

export default function CaseStudiesPage() {
  return (
    <PublicShell>
      <PublicHero eyebrow="Resources · Case studies" title="How firms work" muted="with Goodcase.">
        <p className="mt-6 max-w-[620px] text-[17px] leading-[1.6] text-paper/90 sm:text-[18px]">
          Three scenarios — a solo practice, a growing firm and a high-volume team — showing where drafting and case management support fit, and what stays with the attorney.
        </p>
        <p className="mt-5 flex flex-wrap items-center gap-2 text-[14px] text-paper/70">
          <PlaceholderTag dark>Illustrative case studies — anonymized scenarios</PlaceholderTag>
          Real, client-approved stories will replace these.
        </p>
      </PublicHero>

      <section className="bg-paper py-[var(--space-section)]" aria-labelledby="studies-h">
        <div className="container-page">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="eyebrow text-void">Scenarios by firm size</p>
              <h2 id="studies-h" className="display-lg mt-4">
                One problem each. <span className="text-muted-display">One way through.</span>
              </h2>
            </div>
            <ButtonLink href="/who-we-serve" variant="outline" arrow className="self-start sm:self-auto">
              Who we serve
            </ButtonLink>
          </div>
          <ul className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {CASE_STUDIES.map((c, i) => (
              <Reveal as="li" key={c.slug} delay={i * 0.06} className="min-w-0">
                <CaseStudyCard study={c} />
              </Reveal>
            ))}
          </ul>
          <p className="mt-8 max-w-[70ch] text-[13.5px] leading-relaxed text-muted">
            These scenarios are composites written to show how the service works. They do not describe a specific client, and the figures are illustrative, not results we promise.
          </p>
        </div>
      </section>

      <FinalCta />
    </PublicShell>
  );
}
