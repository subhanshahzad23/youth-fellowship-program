import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, BookOpen, CircleHelp, FileText, Headphones, ChartLine } from "lucide-react";
import { CASE_STUDIES, EPISODES, FAQS, SAMPLE_WORK } from "@/lib/content/site";
import { POSTS_BY_DATE, getArticle, personFor } from "@/lib/content/articles";
import { PODCAST } from "@/lib/content/resources";
import { cn, fmtDateLong } from "@/lib/utils";
import { PublicHero, PublicShell } from "@/components/site/public-shell";
import { Reveal } from "@/components/site/reveal";
import { ButtonLink } from "@/components/ui/button";
import { PlaceholderTag, SectionHeader } from "@/components/gc/section";
import { FinalCta } from "@/components/gc/final-cta";
import { Monogram } from "@/components/resources/monogram";
import { PostCard } from "@/components/resources/post-card";

export const metadata: Metadata = {
  title: "Resources",
  description:
    "Guides, a podcast, sample petition documents, case studies and answers for U.S. immigration law firms — from the Goodcase drafting and case management team.",
};

const sampleEpisodes = EPISODES.filter((e) => e.sample).length;

const HUB = [
  {
    href: "/blog",
    icon: BookOpen,
    title: "Blog",
    body: "Practical guides on pricing, capacity, workflow and AI for immigration practices.",
    count: `${POSTS_BY_DATE.length} articles`,
    span: "lg:col-span-3",
  },
  {
    href: "/podcast",
    icon: Headphones,
    title: PODCAST.name,
    body: "Our podcast about the attorneys, paralegals and case managers behind the petitions.",
    count: `${EPISODES.length} episodes`,
    tag: sampleEpisodes ? `${sampleEpisodes} sample episodes` : undefined,
    span: "lg:col-span-3",
  },
  {
    href: "/case-studies",
    icon: ChartLine,
    title: "Case studies",
    body: "How firms of different sizes use drafting and case management support.",
    count: `${CASE_STUDIES.length} scenarios`,
    tag: "Illustrative",
    span: "lg:col-span-2",
  },
  {
    href: "/sample-work",
    icon: FileText,
    title: "Sample work",
    body: "Exhibit indexes, briefs, letters and business plans, previewed with fictional data.",
    count: `${SAMPLE_WORK.length} documents`,
    span: "lg:col-span-2",
  },
  {
    href: "/faq",
    icon: CircleHelp,
    title: "FAQ",
    body: "Straight answers on what we do, what it costs and how we protect client data.",
    count: `${FAQS.length} questions`,
    span: "lg:col-span-2",
  },
];

export default function ResourcesPage() {
  const [featured, ...rest] = POSTS_BY_DATE;
  const latest = rest.slice(0, 3);
  const article = getArticle(featured.slug);
  const keyFigure = article?.kind === "full" ? article.keyFigure : undefined;
  const author = personFor(featured.author);

  return (
    <PublicShell>
      <PublicHero eyebrow="Resources" title="Notes from the back office" muted="of immigration practice.">
        <p className="mt-6 max-w-[620px] text-[17px] leading-[1.6] text-paper/90 sm:text-[18px]">
          What we&apos;ve learned from more than 1,000 cases worked for U.S. immigration law firms — in articles, a podcast, sample documents and plain answers.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/blog" size="lg" arrow>
            Read the blog
          </ButtonLink>
          <ButtonLink href="/sample-work" size="lg" variant="ghost-dark">
            See sample work
          </ButtonLink>
        </div>
      </PublicHero>

      {/* Featured article */}
      <section className="bg-paper pt-[var(--space-section)]" aria-labelledby="featured-h">
        <div className="container-page">
          <p className="eyebrow text-void">Featured article</p>
          <Reveal className="mt-6">
            <Link href={`/blog/${featured.slug}`} className="group grid grid-cols-1 overflow-hidden rounded-[24px] bg-fog transition-colors duration-300 hover:bg-ash lg:grid-cols-[1.35fr_1fr]">
              <div className="flex min-w-0 flex-col p-6 sm:p-10">
                <p className="eyebrow text-muted">{featured.category}</p>
                <h2 id="featured-h" className="display-md mt-4 max-w-[24ch] text-void">
                  {featured.title}
                </h2>
                <p className="mt-5 max-w-[60ch] text-[16px] leading-relaxed text-ink">{featured.excerpt}</p>
                <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
                  <span className="flex min-w-0 items-center gap-3">
                    <Monogram name={featured.author} size={40} />
                    <span className="min-w-0 text-[13.5px] leading-tight">
                      <span className="block font-medium text-void">{featured.author}</span>
                      <span className="mt-0.5 block text-muted">
                        {author ? `${author.role} · ` : ""}
                        <time dateTime={featured.date}>{fmtDateLong(featured.date)}</time> · {featured.readMins} min read
                      </span>
                    </span>
                  </span>
                </div>
                <span className="mt-8 inline-flex items-center gap-1 self-start text-[15px] font-medium text-void">
                  Read the article
                  <ArrowUpRight className="size-4 transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
                </span>
              </div>
              <div className="dots-mint flex min-h-[240px] min-w-0 flex-col justify-end p-6 sm:p-10">
                {keyFigure ? (
                  <>
                    <p className="font-display text-[72px] leading-none tracking-[-0.05em] text-void tabular sm:text-[112px]">{keyFigure.value}</p>
                    <p className="mt-3 max-w-[34ch] text-[15px] leading-relaxed text-forest">{keyFigure.label}</p>
                  </>
                ) : (
                  <p className="font-display text-[44px] leading-none tracking-[-0.04em] text-void">{featured.readMins} min read</p>
                )}
              </div>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* Formats */}
      <section className="bg-paper py-[var(--space-section)]" aria-labelledby="formats-h">
        <div className="container-page">
          <SectionHeader id="formats-h" eyebrow="Browse by format" title="Read, listen," muted="or see the work." />
          <ul className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
            {HUB.map((h, i) => (
              <Reveal as="li" key={h.href} delay={i * 0.05} className={cn("min-w-0", h.span, i === 4 && "sm:col-span-2")}>
                <Link href={h.href} className="group flex h-full min-h-[240px] flex-col rounded-[24px] bg-fog p-6 transition-colors duration-300 hover:bg-ash sm:p-7">
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-[12px] bg-paper">
                      <h.icon className="size-5 text-leaf-ink" aria-hidden />
                    </span>
                    <ArrowUpRight className="size-5 text-muted transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-void" aria-hidden />
                  </div>
                  <h3 className="mt-8 font-display text-[30px] leading-tight tracking-[-0.03em] text-void">{h.title}</h3>
                  <p className="mt-2 max-w-[44ch] text-[15px] leading-relaxed text-muted">{h.body}</p>
                  <div className="mt-auto flex flex-wrap items-center gap-2 pt-6">
                    <span className="rounded-[26px] bg-paper px-3 py-1 text-[13px] font-medium text-void tabular">{h.count}</span>
                    {h.tag && <PlaceholderTag>{h.tag}</PlaceholderTag>}
                  </div>
                </Link>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* Latest posts */}
      <section className="bg-paper pb-[var(--space-section)]" aria-labelledby="latest-h">
        <div className="container-page">
          <div className="flex flex-col gap-5 border-t border-line pt-12 sm:flex-row sm:items-end sm:justify-between">
            <h2 id="latest-h" className="display-lg">
              Latest from the blog.
            </h2>
            <ButtonLink href="/blog" variant="outline" arrow className="self-start sm:self-auto">
              All articles
            </ButtonLink>
          </div>
          <ul className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
            {latest.map((p, i) => (
              <Reveal as="li" key={p.slug} delay={i * 0.06} className="min-w-0">
                <PostCard post={p} />
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <FinalCta />
    </PublicShell>
  );
}
