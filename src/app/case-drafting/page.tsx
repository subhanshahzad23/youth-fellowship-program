import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, BookOpenCheck, Check, FileSignature, FileText, Files, LayoutList, PenLine, ScrollText, ShieldCheck } from "lucide-react";
import { FAQS, SAMPLE_WORK, VISAS } from "@/lib/content/site";
import { PublicHero, PublicShell } from "@/components/site/public-shell";
import { Reveal } from "@/components/site/reveal";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeader } from "@/components/gc/section";
import { ProcessRow } from "@/components/gc/process";
import { PricingBlock } from "@/components/gc/pricing";
import { RoiCalculator } from "@/components/gc/roi";
import { FeaturedTestimonial } from "@/components/gc/testimonials";
import { FaqBlock } from "@/components/gc/faq";
import { FinalCta } from "@/components/gc/final-cta";

export const metadata: Metadata = {
  title: "Case drafting",
  description: "Filing-ready O-1, EB-1A, EB-2 NIW, H-1B, L-1 and E-2 petition packages, drafted from your strategy and in your format. Flat fees from $500 per case.",
};

const PACKAGE = [
  { icon: ScrollText, title: "Petition letter or legal brief", body: "The argument, criterion by criterion — written in your voice and structure." },
  { icon: LayoutList, title: "Exhibit index and formatting", body: "Tabbed, numbered and mapped to each criterion, so an officer can follow it in minutes." },
  { icon: PenLine, title: "Recommendation and support letters", body: "Drafts for your client's experts to review, adapt and sign." },
  { icon: Files, title: "Forms prep support", body: "Data gathered and checked for the forms you file, ready for your review." },
  { icon: BookOpenCheck, title: "Business plans where relevant", body: "Five-year plans for EB-2 NIW and E-2, built around the legal standard." },
];

export default function CaseDraftingPage() {
  return (
    <PublicShell>
      <PublicHero
        eyebrow="Service 01 · Case drafting"
        title="Filing-ready petitions,"
        muted="drafted your way."
        aside={
          <div className="rounded-[24px] bg-paper p-6 text-void shadow-panel sm:p-7">
            <div className="flex items-center justify-between">
              <p className="eyebrow text-muted">One package</p>
              <span className="rounded-full bg-leaf px-2.5 py-1 text-[12px] font-medium text-leaf-ink">from $500</span>
            </div>
            <p className="mt-3 font-display text-[30px] leading-tight tracking-[-0.03em]">Everything you need to review, sign and file.</p>
            <ul className="mt-5 space-y-2.5">
              {PACKAGE.map((p) => (
                <li key={p.title} className="flex items-center gap-3 text-[14.5px]">
                  <span className="grid size-8 shrink-0 place-items-center rounded-[8px] bg-fog">
                    <p.icon className="size-4" aria-hidden />
                  </span>
                  {p.title}
                </li>
              ))}
            </ul>
          </div>
        }
      >
        <p className="mt-6 max-w-[620px] text-[17px] leading-[1.6] text-paper/90 sm:text-[18px]">
          Send us the strategy and the evidence. Our immigration-only legal writers draft the full package in your templates and tone — and two people check it before it reaches you.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/book-a-call" size="lg" arrow>
            Book a 30-minute call
          </ButtonLink>
          <ButtonLink href="#pricing" size="lg" variant="ghost-dark">
            See pricing
          </ButtonLink>
        </div>
      </PublicHero>

      <section className="bg-paper py-[var(--space-section)]" aria-labelledby="pkg-h">
        <div className="container-page">
          <SectionHeader id="pkg-h" eyebrow="What's in a filing-ready package" title="The whole package." muted="Not just a first draft." lede="Every package arrives complete, cross-referenced and formatted to your standard — so your time goes to judgment, not assembly." />
          <ul className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {PACKAGE.map((p, i) => (
              <Reveal as="li" key={p.title} delay={i * 0.05} className="min-w-0 rounded-[20px] bg-fog p-6">
                <p.icon className="size-6 text-leaf-ink" aria-hidden />
                <h3 className="mt-5 text-[17px] font-medium leading-snug">{p.title}</h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-muted">{p.body}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section id="visas" className="scroll-mt-24 bg-paper pb-[var(--space-section)]" aria-labelledby="visas-h">
        <div className="container-page">
          <SectionHeader id="visas-h" eyebrow="Six case types" title="Business immigration," muted="and nothing else." lede="Focus is the point. Our writers draft the same six petition types every week, for firms across the U.S." />
          <ul className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {VISAS.map((v, i) => (
              <Reveal as="li" key={v.code} delay={(i % 3) * 0.06} className="min-w-0">
                <article className="flex h-full flex-col rounded-[24px] border-[1.5px] border-line p-7 transition-colors hover:border-void">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-display text-[48px] font-light leading-none tracking-[-0.04em]">{v.code}</p>
                    <span className="mt-1 rounded-full bg-fog px-2.5 py-1 text-[12px] text-muted">{v.turnaround.replace("First draft in ", "")}</span>
                  </div>
                  <h3 className="mt-3 text-[17px] font-medium">{v.name}</h3>
                  <p className="mt-1 text-[14.5px] text-muted">{v.who}</p>
                  <ul className="mt-5 space-y-2 border-t border-line pt-5">
                    {v.package.map((p) => (
                      <li key={p} className="flex items-start gap-2.5 text-[14.5px]">
                        <Check className="mt-0.5 size-4 shrink-0 text-leaf-ink" aria-hidden />
                        {p}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-auto pt-5 text-[12.5px] text-muted">Typical first-draft time once intake is complete. Illustrative — confirmed per case.</p>
                </article>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section className="px-[10px]" aria-labelledby="format-h">
        <div className="dots-dark on-dark mx-auto max-w-[1420px] overflow-hidden rounded-[24px] text-paper">
          <div className="grid grid-cols-1 gap-10 px-6 py-14 sm:px-12 sm:py-16 lg:grid-cols-[1fr_1.05fr] lg:py-20">
            <Reveal className="min-w-0">
              <p className="eyebrow text-mint">Your strategy, your format</p>
              <h2 id="format-h" className="display-xl mt-4 max-w-[14ch]">
                It should read like you wrote it.
              </h2>
              <p className="mt-6 max-w-[540px] text-[17px] leading-[1.6] text-paper/85">
                Before we write a word, we learn your templates, your tone and your citation style. Drafts arrive in your format, ready for your edits — and your clients never need to know we exist.
              </p>
              <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[
                  ["You keep", "The strategy"],
                  ["You keep", "The client"],
                  ["You keep", "The signature"],
                ].map(([a, b]) => (
                  <li key={b} className="rounded-[16px] bg-paper/[0.07] p-4 ring-1 ring-white/10">
                    <p className="text-[12px] uppercase tracking-[0.14em] text-paper/55">{a}</p>
                    <p className="mt-1 font-display text-[24px] leading-tight tracking-[-0.02em]">{b}</p>
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={0.1} className="min-w-0">
              <div className="rounded-[20px] bg-paper p-5 text-void shadow-2xl sm:p-6">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-semibold">House style · learned at onboarding</p>
                  <FileSignature className="size-4 text-muted" aria-hidden />
                </div>
                <dl className="mt-4 divide-y divide-line text-[14px]">
                  {[
                    ["Template", "Your petition letter, v2024"],
                    ["Voice", "Formal, third person, short paragraphs"],
                    ["Citations", "Short form after first cite"],
                    ["Exhibits", "Tabbed A–Z, criterion headers"],
                    ["Headings", "Criterion number + plain-English title"],
                  ].map(([k, v]) => (
                    <div key={k} className="flex flex-wrap justify-between gap-2 py-2.5">
                      <dt className="text-muted">{k}</dt>
                      <dd className="font-medium">{v}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-4 flex items-center gap-2 rounded-[12px] bg-leaf px-3 py-2.5 text-[13.5px] text-leaf-ink">
                  <ShieldCheck className="size-4" aria-hidden /> Applied to every draft, checked in review
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section id="quality" className="scroll-mt-24 bg-paper py-[var(--space-section)]" aria-labelledby="quality-h">
        <div className="container-page">
          <SectionHeader id="quality-h" eyebrow="Process and quality review" title="Four steps." muted="Two sets of eyes on every page." lede="A specialist drafts. A second specialist reviews every criterion, citation and exhibit against the original source. Then it's yours." />
          <div className="mt-12">
            <ProcessRow />
          </div>
        </div>
      </section>

      <section className="bg-paper pb-[var(--space-section)]" aria-labelledby="samples-h">
        <div className="container-page">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeader id="samples-h" eyebrow="Sample work" title="See the standard" muted="before you send a case." />
            <ButtonLink href="/sample-work" variant="outline" arrow className="self-start lg:self-end">
              All sample work
            </ButtonLink>
          </div>
          <ul className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {SAMPLE_WORK.map((s, i) => (
              <Reveal as="li" key={s.slug} delay={i * 0.05} className="min-w-0">
                <Link href={`/sample-work/${s.slug}`} className="group flex h-full flex-col rounded-[20px] bg-fog p-6 transition-colors hover:bg-ash">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-paper px-2.5 py-1 text-[12px] font-medium">{s.visa}</span>
                    <ArrowUpRight className="size-4 text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
                  </div>
                  <FileText className="mt-6 size-6" aria-hidden />
                  <h3 className="mt-3 text-[17px] font-medium leading-snug">{s.title}</h3>
                  <p className="mt-auto pt-4 text-[13px] text-muted">{s.format}</p>
                </Link>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <PricingBlock />

      <section className="bg-paper pb-4" aria-label="ROI calculator">
        <div className="container-page">
          <RoiCalculator compact />
        </div>
      </section>

      <FeaturedTestimonial id="volume" />
      <FaqBlock items={FAQS.filter((f) => f.topic === "Services" || f.topic === "Pricing" || f.topic === "Goodcase")} />
      <FinalCta title="Send us your next petition." />
    </PublicShell>
  );
}
