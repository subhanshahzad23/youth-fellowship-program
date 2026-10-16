import { SiteNav } from "@/components/site/site-nav";
import { SiteFooter } from "@/components/site/site-footer";
import { ConceptPill } from "@/components/site/concept-pill";
import { FirstCaseOffer } from "@/components/gc/offer";

/** Public page chrome: floating nav over a dark hero, footer, concept pill. */
export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteNav overDark />
      <main id="main">{children}</main>
      <SiteFooter />
      <ConceptPill />
    </>
  );
}

/**
 * Black dotted hero used by every inner page. The first-case offer sits
 * directly under the hero content, as the brief requires.
 */
export function PublicHero({
  eyebrow,
  title,
  muted,
  children,
  aside,
  offer = true,
}: {
  eyebrow: string;
  title: React.ReactNode;
  muted?: React.ReactNode;
  children?: React.ReactNode;
  aside?: React.ReactNode;
  offer?: boolean;
}) {
  return (
    <section data-hero className="dots-dark on-dark relative -mt-[80px] pb-16 pt-[140px] text-paper sm:-mt-[88px] sm:pb-20 sm:pt-[180px]">
      <div className={aside ? "container-page grid grid-cols-1 gap-12 lg:grid-cols-[1.25fr_1fr] lg:items-end" : "container-page"}>
        <div className="min-w-0">
          <p className="eyebrow rise-in text-muted-display">{eyebrow}</p>
          <h1 className="display-xl mt-4 max-w-[20ch]">
            <span className="line-mask">
              <span style={{ animationDelay: "80ms" }}>{title}</span>
            </span>
            {muted && (
              <span className="line-mask text-muted-display">
                <span style={{ animationDelay: "200ms" }}>{muted}</span>
              </span>
            )}
          </h1>
          <div className="rise-in" style={{ animationDelay: "420ms" }}>
            {children}
          </div>
          {offer && (
            <div className="rise-in mt-8" style={{ animationDelay: "560ms" }}>
              <FirstCaseOffer tone="dark" />
            </div>
          )}
        </div>
        {aside && (
          <div className="rise-in min-w-0" style={{ animationDelay: "500ms" }}>
            {aside}
          </div>
        )}
      </div>
    </section>
  );
}
