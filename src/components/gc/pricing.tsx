import { Check } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/site/reveal";
import { SectionHeader } from "./section";

/** Open pricing (brief: "prices shown openly"). Only facts from the brief: from $500, half-price first case, money-back guarantee, no minimum volume. */
export function PricingBlock({ id = "pricing" }: { id?: string }) {
  return (
    <section id={id} className="scroll-mt-24 bg-paper py-[var(--space-section)]" aria-labelledby={`${id}-h`}>
      <div className="container-page">
        <SectionHeader id={`${id}-h`} eyebrow="Pricing" title="Flat fees per case." muted="Published, not hidden behind a demo." lede="You know the cost before we start. No retainers, no monthly minimums, no long-term contract — scale up or down with your caseload." />
        <div className="mt-12 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Reveal className="min-w-0 rounded-[24px] bg-fog p-7 sm:p-9">
            <p className="eyebrow text-muted">Case drafting</p>
            <p className="mt-5 flex items-baseline gap-2">
              <span className="text-[15px] text-muted">from</span>
              <span className="font-display text-[64px] font-light leading-none tracking-[-0.045em]">$500</span>
            </p>
            <p className="mt-1 text-[15px] text-muted">per case, flat — fee depends on visa type</p>
            <ul className="mt-6 space-y-2.5 text-[15px]">
              {["O-1, EB-1A, EB-2 NIW, H-1B, L-1, E-2", "Petition letter, exhibits and support letters", "Two-step quality review", "Edits until you're ready to sign"].map((p) => (
                <li key={p} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 size-4 shrink-0 text-leaf-ink" aria-hidden /> {p}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.06} className="min-w-0 rounded-[24px] bg-fog p-7 sm:p-9">
            <p className="eyebrow text-muted">Case management</p>
            <p className="mt-5 font-display text-[44px] font-light leading-[1.05] tracking-[-0.035em]">Flat monthly scope</p>
            <p className="mt-2 text-[15px] text-muted">quoted on your first call, based on active cases</p>
            <ul className="mt-6 space-y-2.5 text-[15px]">
              {["A dedicated, experienced case manager", "Intake, documents, follow-ups, deadlines", "Casey included for your team", "Adjust scope month to month"].map((p) => (
                <li key={p} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 size-4 shrink-0 text-leaf-ink" aria-hidden /> {p}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.12} className="dots-dark on-dark flex min-w-0 flex-col rounded-[24px] p-7 text-paper sm:p-9">
            <p className="eyebrow text-mint">Your first case</p>
            <p className="mt-5 font-display text-[64px] font-light leading-none tracking-[-0.045em]">50% off</p>
            <p className="mt-2 text-[15px] text-paper/75">Try us on a real petition before you commit to anything.</p>
            <ul className="mt-6 space-y-2.5 text-[15px]">
              {["First case at half price", "Money-back guarantee", "No minimum volume, ever"].map((p) => (
                <li key={p} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 size-4 shrink-0 text-jade" aria-hidden /> {p}
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-8">
              <ButtonLink href="/book-a-call" arrow size="lg" className="w-full sm:w-auto">
                Book a 30-minute call
              </ButtonLink>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
