import type { Metadata } from "next";
import { AudioLines } from "lucide-react";
import { EPISODES_BY_NUMBER, PODCAST } from "@/lib/content/resources";
import { personFor } from "@/lib/content/articles";
import { PublicHero, PublicShell } from "@/components/site/public-shell";
import { Reveal } from "@/components/site/reveal";
import { PlaceholderTag, SectionHeader } from "@/components/gc/section";
import { FinalCta } from "@/components/gc/final-cta";
import { EpisodeCard } from "@/components/resources/cards";
import { Monogram } from "@/components/resources/monogram";

export const metadata: Metadata = {
  title: "Why Immigration Law — podcast",
  description:
    "Why Immigration Law is the Goodcase podcast about the attorneys, paralegals and case managers behind U.S. immigration petitions.",
};

const hosts = Array.from(new Set(EPISODES_BY_NUMBER.flatMap((e) => e.hosts)));

export default function PodcastPage() {
  const samples = EPISODES_BY_NUMBER.filter((e) => e.sample).length;
  return (
    <PublicShell>
      <PublicHero
        eyebrow="Resources · Podcast"
        title={PODCAST.name}
        muted={PODCAST.tagline}
        aside={
          <div className="dots-mint flex aspect-square w-full max-w-[400px] flex-col rounded-[24px] p-7 text-void sm:p-9 lg:ml-auto" role="img" aria-label={`${PODCAST.name} cover art`}>
            <div className="flex items-center justify-between">
              <p className="eyebrow">A Goodcase podcast</p>
              <AudioLines className="size-6" aria-hidden />
            </div>
            <p className="mt-auto font-display text-[56px] leading-[0.95] tracking-[-0.05em] sm:text-[68px]">
              Why
              <br />
              Immigration
              <br />
              Law
            </p>
            <p className="mt-4 text-[13px] text-forest">Hosted by the Goodcase team</p>
          </div>
        }
      >
        <p className="mt-6 max-w-[580px] text-[17px] leading-[1.6] text-paper/90 sm:text-[18px]">{PODCAST.description}</p>
      </PublicHero>

      <section className="bg-paper py-[var(--space-section)]" aria-labelledby="episodes-h">
        <div className="container-page">
          <SectionHeader id="episodes-h" eyebrow="Episodes" title="Listen in." muted="Real conversations about real practices.">
            {samples > 0 && (
              <p className="mt-5 flex flex-wrap items-center gap-2 text-[14.5px] text-muted">
                <PlaceholderTag>Sample episode</PlaceholderTag>
                Episodes marked this way are samples that show the format. Episode #01 is published.
              </p>
            )}
          </SectionHeader>
          <ul className="mt-12 grid grid-cols-1 gap-4">
            {EPISODES_BY_NUMBER.map((e, i) => (
              <Reveal as="li" key={e.slug} delay={i * 0.06} className="min-w-0">
                <EpisodeCard episode={e} />
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-paper pb-[var(--space-section)]" aria-labelledby="hosts-h">
        <div className="container-page">
          <div className="rounded-[24px] bg-fog p-6 sm:p-10">
            <h2 id="hosts-h" className="display-sm">
              Your hosts
            </h2>
            <p className="mt-2 max-w-[60ch] text-[15px] leading-relaxed text-muted">People from the Goodcase team who draft, review and manage immigration cases for U.S. law firms.</p>
            <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {hosts.map((h) => (
                <li key={h} className="flex min-w-0 items-center gap-3 rounded-[16px] bg-paper p-4">
                  <Monogram name={h} size={48} />
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-medium text-void">{h}</p>
                    <p className="truncate text-[13px] text-muted">{personFor(h)?.role}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <FinalCta />
    </PublicShell>
  );
}
