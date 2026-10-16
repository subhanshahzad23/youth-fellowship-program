import { ButtonLink } from "@/components/ui/button";
import { FirstCaseOffer } from "@/components/gc/offer";
import { CaseBoard } from "./case-board";

/*
 * Black dotted hero: muted first statement, white emphasized line, plain
 * supporting copy, CTA row, then the first-case offer directly underneath
 * (brief §3). The case workspace overlaps the black→white boundary.
 */
export function HomeHero() {
  return (
    <>
      <section data-hero className="dots-dark on-dark relative -mt-[80px] pt-[150px] text-paper sm:-mt-[88px] sm:pt-[184px]" aria-labelledby="hero-h">
        <div className="container-page">
          <p className="eyebrow rise-in text-muted-display">The back office of U.S. immigration law firms</p>
          <h1 id="hero-h" className="display-hero mt-5 max-w-[15ch] sm:max-w-none">
            <span className="line-mask text-muted-display">
              <span style={{ animationDelay: "120ms" }}>Your strategy. Your signature.</span>
            </span>
            <span className="line-mask">
              <span style={{ animationDelay: "260ms" }}>Our team drafts the rest.</span>
            </span>
          </h1>
          <p className="rise-in mt-6 max-w-[700px] text-[17px] leading-[1.55] text-paper/95 sm:text-[18px]" style={{ animationDelay: "520ms" }}>
            Goodcase prepares filing-ready O-1, EB-1A, EB-2 NIW, H-1B, L-1 and E-2 petitions and runs your cases with an experienced case manager — so your firm takes on more clients without hiring.
          </p>
          <div className="rise-in mt-8 flex flex-wrap items-center gap-3" style={{ animationDelay: "640ms" }}>
            <ButtonLink href="/book-a-call" size="lg" arrow>
              Book a 30-minute call
            </ButtonLink>
            <ButtonLink href="/sample-work" size="lg" variant="ghost-dark">
              See sample work
            </ButtonLink>
          </div>
          <div className="rise-in mt-7" style={{ animationDelay: "720ms" }}>
            <FirstCaseOffer tone="dark" />
          </div>
        </div>
        <div className="h-[110px] sm:h-[210px]" aria-hidden />
      </section>
      <section className="relative bg-paper pb-10" aria-label="A look inside a Goodcase case workspace">
        <div className="dots-dark absolute inset-x-0 top-0 h-[40%] sm:h-[48%]" aria-hidden />
        <div className="container-page relative -mt-[90px] sm:-mt-[150px]">
          <CaseBoard />
        </div>
      </section>
    </>
  );
}
