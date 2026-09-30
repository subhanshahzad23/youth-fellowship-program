import { SiteNav } from "@/components/site/site-nav";
import { SiteFooter } from "@/components/site/site-footer";
import { Hero } from "@/components/site/home/hero";
import { Facts } from "@/components/site/home/facts";
import { Explainer } from "@/components/site/home/explainer";
import { Journey } from "@/components/site/home/journey";
import { Tracks } from "@/components/site/home/tracks";
import { Safeguarding } from "@/components/site/home/safeguarding";
import { Dates } from "@/components/site/home/dates";
import { Stories } from "@/components/site/home/stories";
import { Faq, FinalCta } from "@/components/site/home/faq-cta";
import { DemoControl } from "@/components/demo/demo-control";

export default function HomePage() {
  return (
    <>
      <SiteNav overDark />
      <main id="main">
        <Hero />
        <Facts />
        <Explainer />
        <Journey />
        <Tracks />
        <Safeguarding />
        <Dates />
        <Stories />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
      <DemoControl />
    </>
  );
}
