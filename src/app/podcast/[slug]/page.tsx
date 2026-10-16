import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EPISODES } from "@/lib/content/site";
import { EPISODES_BY_NUMBER, PODCAST, SHOW_NOTES, episodeLabel, getEpisode } from "@/lib/content/resources";
import { personFor } from "@/lib/content/articles";
import { fmtDateLong } from "@/lib/utils";
import { PublicHero, PublicShell } from "@/components/site/public-shell";
import { Reveal } from "@/components/site/reveal";
import { ButtonLink } from "@/components/ui/button";
import { PlaceholderTag } from "@/components/gc/section";
import { FinalCta } from "@/components/gc/final-cta";
import { AudioPlayerMock } from "@/components/resources/audio-player";
import { EpisodeCard } from "@/components/resources/cards";
import { Monogram } from "@/components/resources/monogram";

export function generateStaticParams() {
  return EPISODES.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: PageProps<"/podcast/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const ep = getEpisode(slug);
  if (!ep) return { title: "Episode not found" };
  return {
    title: `${episodeLabel(ep.number)} ${ep.title} — ${PODCAST.name}`,
    description: ep.summary,
  };
}

export default async function EpisodePage({ params }: PageProps<"/podcast/[slug]">) {
  const { slug } = await params;
  const ep = getEpisode(slug);
  if (!ep) notFound();

  const notes = SHOW_NOTES[ep.slug];
  const others = EPISODES_BY_NUMBER.filter((e) => e.slug !== ep.slug);

  return (
    <PublicShell>
      <PublicHero
        eyebrow={`${PODCAST.name} · Episode ${episodeLabel(ep.number)}`}
        title={ep.title}
        aside={<AudioPlayerMock seed={ep.slug} title={`${episodeLabel(ep.number)} · ${ep.title}`} duration={ep.duration} />}
      >
        {ep.sample && (
          <p className="mt-6 flex flex-wrap items-center gap-2 text-[14px] text-paper/70">
            <PlaceholderTag dark>Sample episode</PlaceholderTag>
            Shows the planned format — not a published episode.
          </p>
        )}
        <p className="mt-6 max-w-[600px] text-[17px] leading-[1.6] text-paper/90 sm:text-[18px]">{ep.summary}</p>
        <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 text-[14px] text-paper/70">
          <span className="flex items-center gap-3">
            <span className="flex -space-x-2">
              {ep.hosts.map((h) => (
                <Monogram key={h} name={h} size={36} className="ring-2 ring-void" />
              ))}
            </span>
            <span className="text-paper">{ep.hosts.join(" & ")}</span>
          </span>
          <span>{ep.duration}</span>
          <time dateTime={ep.date}>{fmtDateLong(ep.date)}</time>
        </div>
      </PublicHero>

      <section className="bg-paper py-[var(--space-section)]" aria-labelledby="notes-h">
        <div className="container-page grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-20">
          <div className="min-w-0 max-w-[760px]">
            <p className="eyebrow text-void">Show notes</p>
            <h2 id="notes-h" className="display-lg mt-4">
              In this episode
            </h2>
            <p className="mt-5 text-[17px] leading-[1.7] text-ink">{ep.summary}</p>

            {notes && (
              <>
                <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
                  <h3 className="text-[15px] font-semibold">Topics and timestamps</h3>
                  <PlaceholderTag>Draft show notes</PlaceholderTag>
                </div>
                <ol className="divide-y divide-line">
                  {notes.topics.map((t) => (
                    <li key={t.time} className="grid grid-cols-[64px_minmax(0,1fr)] gap-4 py-5 sm:grid-cols-[80px_minmax(0,1fr)]">
                      <span className="pt-0.5 font-mono text-[14px] text-leaf-ink tabular">{t.time}</span>
                      <div className="min-w-0">
                        <p className="font-display text-[22px] leading-tight tracking-[-0.02em] text-void">{t.title}</p>
                        <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{t.body}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </>
            )}

            <div className="mt-10 rounded-[24px] bg-fog p-6 sm:p-7" data-testid="transcript-placeholder">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-[16px] font-semibold">Transcript</h3>
                <PlaceholderTag>Transcript placeholder</PlaceholderTag>
              </div>
              <p className="mt-3 max-w-[62ch] text-[15px] leading-relaxed text-ink">
                A full, searchable transcript will be published with the episode audio, so every conversation is accessible and easy to quote.
              </p>
            </div>
          </div>

          <aside className="min-w-0 space-y-4">
            <div className="rounded-[24px] bg-fog p-6">
              <h2 className="eyebrow text-muted">Hosts</h2>
              <ul className="mt-5 space-y-4">
                {ep.hosts.map((h) => {
                  const p = personFor(h);
                  return (
                    <li key={h} className="flex min-w-0 items-center gap-3">
                      <Monogram name={h} size={52} />
                      <div className="min-w-0">
                        <p className="text-[15.5px] font-medium leading-tight text-void">{h}</p>
                        {p && <p className="mt-0.5 text-[13.5px] text-muted">{p.role}, Goodcase</p>}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[24px] bg-line">
              {[
                ["Episode", episodeLabel(ep.number)],
                ["Length", ep.duration],
                ["Published", ep.sample ? "Sample" : fmtDateLong(ep.date)],
                ["Show", PODCAST.name],
              ].map(([k, v]) => (
                <div key={k} className="min-w-0 bg-fog p-5">
                  <dt className="text-[12.5px] text-muted">{k}</dt>
                  <dd className="mt-1 text-[15px] font-medium leading-snug text-void">{v}</dd>
                </div>
              ))}
            </dl>
            <ButtonLink href="/podcast" variant="outline" arrow className="w-full">
              All episodes
            </ButtonLink>
          </aside>
        </div>
      </section>

      {others.length > 0 && (
        <section className="bg-paper pb-[var(--space-section)]" aria-labelledby="more-h">
          <div className="container-page">
            <h2 id="more-h" className="display-lg border-t border-line pt-12">
              More episodes.
            </h2>
            <ul className="mt-10 grid grid-cols-1 gap-4 xl:grid-cols-2">
              {others.map((e, i) => (
                <Reveal as="li" key={e.slug} delay={i * 0.06} className="min-w-0">
                  <EpisodeCard episode={e} />
                </Reveal>
              ))}
            </ul>
          </div>
        </section>
      )}

      <FinalCta />
    </PublicShell>
  );
}
