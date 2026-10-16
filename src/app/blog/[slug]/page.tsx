import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { COMPANY, POSTS } from "@/lib/content/site";
import { LIVE_PATHS, getArticle, getPost, personFor, relatedPosts, splitTitle, tocFor } from "@/lib/content/articles";
import { fmtDateLong } from "@/lib/utils";
import { PublicHero, PublicShell } from "@/components/site/public-shell";
import { Reveal } from "@/components/site/reveal";
import { ButtonLink } from "@/components/ui/button";
import { PlaceholderTag } from "@/components/gc/section";
import { RoiCalculator } from "@/components/gc/roi";
import { FinalCta } from "@/components/gc/final-cta";
import { ArticleBlockView, AuthorBox, ShareLinks, Toc } from "@/components/resources/article";
import { Monogram } from "@/components/resources/monogram";
import { PostCard } from "@/components/resources/post-card";

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Article not found" };
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: { type: "article", title: post.title, description: post.excerpt, publishedTime: post.date, authors: [post.author] },
  };
}

export default async function ArticlePage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const post = getPost(slug);
  const body = getArticle(slug);
  if (!post || !body) notFound();

  const author = personFor(post.author);
  const toc = tocFor(body);
  const related = relatedPosts(post);
  const [main, sub] = splitTitle(post.title);
  const url = `https://www.goodcase.io/blog/${post.slug}`;
  const live = LIVE_PATHS[post.slug];

  return (
    <PublicShell>
      <PublicHero
        eyebrow={`Blog · ${post.category}`}
        title={<span className="text-[clamp(36px,4.6vw,62px)]">{main}</span>}
        muted={sub ? <span className="text-[clamp(36px,4.6vw,62px)]">{sub}</span> : undefined}
      >
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4 text-[14.5px] text-paper/75">
          <span className="flex min-w-0 items-center gap-3">
            <Monogram name={post.author} size={44} />
            <span className="min-w-0 leading-tight">
              <span className="block font-medium text-paper">{post.author}</span>
              {author && <span className="mt-0.5 block text-[13px] text-paper/60">{author.role}</span>}
            </span>
          </span>
          <span className="hidden h-8 w-px bg-paper/15 sm:block" aria-hidden />
          <time dateTime={post.date}>{fmtDateLong(post.date)}</time>
          <span>{post.readMins} min read</span>
        </div>
      </PublicHero>

      <section className="bg-paper py-[var(--space-section)]" aria-label="Article">
        <div className="container-page">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-16 xl:gap-24">
            <aside className="min-w-0">
              <div className="lg:sticky lg:top-28">
                <Toc items={toc} />
              </div>
            </aside>

            <article className="min-w-0 max-w-[720px]">
              <p className="font-display text-[22px] leading-[1.45] tracking-[-0.015em] text-void sm:text-[25px]">{post.excerpt}</p>

              {body.kind === "full" ? (
                <div className="prose-session mt-4">
                  {body.sections.map((s) => (
                    <section key={s.id} aria-labelledby={s.id}>
                      <h2 id={s.id} className="scroll-mt-28">
                        {s.title}
                      </h2>
                      {s.blocks.map((b, i) => (
                        <ArticleBlockView key={i} block={b} />
                      ))}
                    </section>
                  ))}
                </div>
              ) : (
                <div className="mt-10 rounded-[24px] bg-fog p-6 sm:p-8" data-testid="article-migrates">
                  <PlaceholderTag>Full article migrates from the current site</PlaceholderTag>
                  <p className="mt-4 max-w-[60ch] text-[15.5px] leading-relaxed text-ink">
                    Above is the published excerpt. The complete article moves across from the current goodcase.io blog during the content migration. Here is what it covers.
                  </p>
                  <ol className="mt-6 space-y-3">
                    {body.outline.map((o, i) => (
                      <li key={o.id} className="grid grid-cols-[36px_minmax(0,1fr)] gap-3 rounded-[16px] bg-paper p-5">
                        <span className="font-display text-[22px] leading-none text-muted tabular">{String(i + 1).padStart(2, "0")}</span>
                        <div className="min-w-0">
                          <h2 id={o.id} className="scroll-mt-28 font-display text-[23px] leading-tight tracking-[-0.02em] text-void">
                            {o.title}
                          </h2>
                          <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{o.summary}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                  {live && (
                    <a
                      href={`https://www.goodcase.io${live}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-6 inline-flex items-center gap-1 text-[14.5px] font-medium text-void underline underline-offset-4"
                    >
                      Read the current version on goodcase.io
                      <ArrowUpRight className="size-4" aria-hidden />
                      <span className="sr-only">(opens in a new tab)</span>
                    </a>
                  )}
                </div>
              )}
            </article>
          </div>

          {body.kind === "full" && body.calculator && (
            <div id="run-your-numbers" className="mt-16 scroll-mt-28 sm:mt-20">
              <Reveal className="max-w-[720px] lg:ml-[calc(240px+4rem)] xl:ml-[calc(240px+6rem)]">
                <p className="eyebrow text-void">Run your own numbers</p>
                <h2 className="display-md mt-3">What would the gap be at your firm?</h2>
                <p className="mt-4 text-[16px] leading-relaxed text-ink">Move the sliders to match your caseload and costs. The result is an illustrative estimate, not a quote.</p>
              </Reveal>
              <div className="mt-10">
                <RoiCalculator id="article-roi" />
              </div>
            </div>
          )}

          <div className="mt-14 grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-16 xl:gap-24">
            <div className="hidden lg:block" aria-hidden />
            <div className="min-w-0 max-w-[720px] space-y-8">
              <div className="flex flex-col gap-5 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
                <ul className="flex flex-wrap gap-2" aria-label="Tags">
                  {post.tags.map((t) => (
                    <li key={t} className="rounded-[26px] border border-line px-3 py-1 text-[13px] text-ink">
                      {t}
                    </li>
                  ))}
                </ul>
                <ShareLinks url={url} title={post.title} />
              </div>
              <AuthorBox name={post.author} person={author} />
              <p className="text-[13px] leading-relaxed text-muted">
                {COMPANY.name} is not a law firm and does not provide legal advice. This article is general information for immigration practices, not legal advice.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-paper pb-[var(--space-section)]" aria-labelledby="related-h">
        <div className="container-page">
          <div className="flex flex-col gap-5 border-t border-line pt-12 sm:flex-row sm:items-end sm:justify-between">
            <h2 id="related-h" className="display-lg">
              Keep reading.
            </h2>
            <ButtonLink href="/blog" variant="outline" arrow className="self-start sm:self-auto">
              All articles
            </ButtonLink>
          </div>
          <ul className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
            {related.map((p, i) => (
              <Reveal as="li" key={p.slug} delay={i * 0.06} className="min-w-0">
                <PostCard post={p} />
              </Reveal>
            ))}
          </ul>
          <p className="mt-8 text-[14.5px] text-muted">
            Prefer to listen? Try{" "}
            <Link href="/podcast" className="font-medium text-void underline underline-offset-4">
              Why Immigration Law
            </Link>
            , our podcast.
          </p>
        </div>
      </section>

      <FinalCta />
    </PublicShell>
  );
}
