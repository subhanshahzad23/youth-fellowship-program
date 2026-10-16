import { PublicShell } from "@/components/site/public-shell";
import { HomeHero } from "@/components/gc/home/hero";
import { PetitionStack } from "@/components/gc/home/petition-stack";
import { FactStrip } from "@/components/gc/facts";
import { ClientLogoRow } from "@/components/gc/logos";
import { ServiceCards } from "@/components/gc/services";
import { ProcessJourney } from "@/components/gc/process";
import { RoiCalculator } from "@/components/gc/roi";
import { VideoTestimonials } from "@/components/gc/testimonials";
import { TeamPreview } from "@/components/gc/team";
import { SecurityCard } from "@/components/gc/security";
import { FaqBlock } from "@/components/gc/faq";
import { FinalCta } from "@/components/gc/final-cta";
import { SectionHeader } from "@/components/gc/section";
import { ButtonLink } from "@/components/ui/button";

export default function Home() {
  return (
    <PublicShell>
      <HomeHero />
      <FactStrip />
      <ClientLogoRow />
      <ServiceCards />
      <PetitionStack />
      <ProcessJourney />

      <section id="roi" className="scroll-mt-24 bg-paper pb-[var(--space-section)]" aria-labelledby="roi-h">
        <div className="container-page">
          <SectionHeader id="roi-h" eyebrow="The math" title="Cheaper than hiring." muted="Faster than overtime." lede="A senior in-house paralegal costs a New York firm about $2,920 per O-1 case. Drafting with Goodcase starts at $500. Move the sliders to see what that means for your firm." />
          <div className="mt-12">
            <RoiCalculator />
          </div>
        </div>
      </section>

      <VideoTestimonials />

      <section id="team" className="scroll-mt-24 bg-paper pb-[var(--space-section)]" aria-labelledby="team-h">
        <div className="container-page">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeader id="team-h" eyebrow="Human behind every process" title="A specialized team behind every petition." lede="About 30 business immigration professionals across Europe, Latin America and India — legal writers, case managers and team leads who have worked more than 1,000 cases for U.S. firms." />
            <ButtonLink href="/about#team" variant="outline" arrow className="self-start lg:self-end">
              Meet the whole team
            </ButtonLink>
          </div>
          <div className="mt-12">
            <TeamPreview />
          </div>
        </div>
      </section>

      <SecurityCard />
      <FaqBlock />
      <FinalCta />
    </PublicShell>
  );
}
