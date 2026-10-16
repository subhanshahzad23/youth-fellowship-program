import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Headphones } from "lucide-react";
import { POSTS_BY_DATE, POST_CATEGORIES } from "@/lib/content/articles";
import { PODCAST } from "@/lib/content/resources";
import { PublicHero, PublicShell } from "@/components/site/public-shell";
import { BlogFilter } from "@/components/resources/blog-filter";
import { FinalCta } from "@/components/gc/final-cta";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Articles for U.S. immigration law firms on pricing, scaling, practice management and the safe use of AI — written by the Goodcase team of immigration paralegals and legal writers.",
};

export default function BlogPage() {
  return (
    <PublicShell>
      <PublicHero eyebrow="Resources · Blog" title="Written by practitioners," muted="for immigration practices.">
        <p className="mt-6 max-w-[620px] text-[17px] leading-[1.6] text-paper/90 sm:text-[18px]">
          Plain-language guides on pricing, capacity, workflow and AI — from the team that drafts and manages cases for U.S. immigration law firms every day.
        </p>
      </PublicHero>

      <section className="bg-paper py-[var(--space-section)]" aria-labelledby="articles-h">
        <div className="container-page">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <h2 id="articles-h" className="display-lg">
              All articles
            </h2>
            <p className="text-[14.5px] text-muted">{POSTS_BY_DATE.length} articles · newest first</p>
          </div>
          <div className="mt-8">
            <BlogFilter posts={POSTS_BY_DATE} categories={POST_CATEGORIES} />
          </div>

          <Link
            href="/podcast"
            className="group mt-12 flex flex-col gap-5 rounded-[24px] bg-void p-6 text-paper sm:flex-row sm:items-center sm:justify-between sm:p-8"
          >
            <span className="flex min-w-0 items-center gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-jade text-void">
                <Headphones className="size-5" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="eyebrow block text-muted-display">Podcast</span>
                <span className="mt-1 block font-display text-[26px] leading-tight tracking-[-0.02em]">{PODCAST.name}</span>
                <span className="mt-1 block text-[14.5px] text-paper/70">{PODCAST.tagline}</span>
              </span>
            </span>
            <span className="inline-flex items-center gap-1 self-start text-[15px] font-medium text-mint sm:self-auto">
              Listen to the episodes
              <ArrowUpRight className="size-4 transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
            </span>
          </Link>
        </div>
      </section>

      <FinalCta />
    </PublicShell>
  );
}
