import { SiteNav } from "@/components/site/site-nav";
import { SiteFooter } from "@/components/site/site-footer";
import { DemoControl } from "@/components/demo/demo-control";

/** Public page chrome: floating nav over a dark header, footer, demo control. */
export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteNav overDark />
      <main id="main">{children}</main>
      <SiteFooter />
      <DemoControl />
    </>
  );
}

export function PublicHero({ eyebrow, title, muted, children }: { eyebrow: string; title: React.ReactNode; muted?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <section data-hero className="dots-dark on-dark relative -mt-[80px] pb-20 pt-[150px] text-paper sm:-mt-[88px] sm:pb-24 sm:pt-[190px]">
      <div className="container-page">
        <p className="eyebrow rise-in text-muted-display">{eyebrow}</p>
        <h1 className="display-xl mt-4 max-w-[22ch]">
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
      </div>
    </section>
  );
}
