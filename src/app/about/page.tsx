import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Scale } from "lucide-react";
import { COMPANY } from "@/lib/content/site";
import { PublicHero, PublicShell } from "@/components/site/public-shell";
import { Reveal } from "@/components/site/reveal";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeader } from "@/components/gc/section";
import { FactStrip } from "@/components/gc/facts";
import { TeamGrid } from "@/components/gc/team";
import { ProcessList } from "@/components/gc/process";
import { SecurityCard } from "@/components/gc/security";
import { FinalCta } from "@/components/gc/final-cta";

export const metadata: Metadata = {
  title: "About us — our team, process and security",
  description: "Goodcase is the backstage team for U.S. immigration law firms: about 30 business immigration professionals across Europe, Latin America and India. Meet the team, see our process and how we protect your clients' data.",
};

const REGIONS = [
  { name: "Europe", note: "Headquarters in Warsaw, Poland. Leadership, team leads and legal writers.", x: 54, y: 30 },
  { name: "Latin America", note: "Legal writers and case managers working U.S. business hours.", x: 30, y: 66 },
  { name: "India", note: "Legal writers supporting high-volume and overflow work.", x: 71, y: 46 },
];

const AI_POLICY = [
  "Every document is prepared by a person. AI is a research and organization tool, never the author.",
  "No client personal information — names, A-Numbers, passport details, evidence — is ever entered into an AI tool.",
  "AI is used only on public, non-confidential sources such as statutes, the USCIS Policy Manual and AAO decisions.",
  "Every citation and factual reference is verified by a team member against the original source.",
  "Case files stay in our secure case-management system with role-based, logged access.",
];

export default function AboutPage() {
  return (
    <PublicShell>
      <PublicHero eyebrow="About Goodcase" title="We're your backstage team." muted="Invisible when things run perfectly.">
        <p className="mt-6 max-w-[640px] text-[17px] leading-[1.6] text-paper/90 sm:text-[18px]">
          Goodcase is the back office of U.S. immigration law firms. We prepare petitions and manage cases — and we&apos;re always there when you need us. Our process is built on collaboration, not outsourcing: you stay in the driver&apos;s seat.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/book-a-call" size="lg" arrow>
            Book a 30-minute call
          </ButtonLink>
          <ButtonLink href="#team" size="lg" variant="ghost-dark">
            Meet the team
          </ButtonLink>
        </div>
      </PublicHero>

      <section className="bg-paper py-[var(--space-section)]" aria-labelledby="mission-h">
        <div className="container-page grid grid-cols-1 gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
          <Reveal className="min-w-0">
            <p className="eyebrow text-void">Why we exist</p>
            <h2 id="mission-h" className="display-xl mt-4">
              Attorneys should spend their time <span className="text-muted-display">on judgment.</span>
            </h2>
            <div className="mt-6 max-w-[620px] space-y-4 text-[17px] leading-[1.65] text-ink">
              <p>Immigration attorneys are some of the most detail-driven professionals we know. Yet most of their week disappears into work that doesn&apos;t need a law license: exhibit lists, formatting, document chasing, deadline spreadsheets.</p>
              <p>We built Goodcase to take that work off their desks — with specialists who do nothing but U.S. business immigration, a quality process with two sets of eyes, and software we wrote for the job. More than 1,000 cases later, the idea hasn&apos;t changed: a specialized team behind every petition.</p>
            </div>
          </Reveal>
          <Reveal delay={0.08} className="min-w-0 self-start">
            <div className="rounded-[24px] border-[1.5px] border-void p-7 sm:p-9" id="not-a-law-firm">
              <Scale className="size-7" aria-hidden />
              <h3 className="mt-5 font-display text-[30px] leading-tight tracking-[-0.03em]">We are not a law firm.</h3>
              <p className="mt-3 text-[16px] leading-relaxed text-ink">
                Goodcase does not give legal advice and does not represent clients. Attorneys keep the strategy, the client relationship and the signature on every filing. We prepare documents and manage cases under their direction.
              </p>
              <p className="mt-4 text-[14px] text-muted">That line is the reason firms trust us with their clients&apos; files.</p>
            </div>
          </Reveal>
        </div>
      </section>

      <FactStrip title="Goodcase in numbers" />

      <section className="bg-paper pb-[var(--space-section)]" aria-labelledby="where-h">
        <div className="container-page">
          <SectionHeader id="where-h" eyebrow="Where we work" title="Three regions," muted="one standard." lede="About 30 business immigration professionals, coordinated from Warsaw and working U.S. business hours." />
          <div className="mt-12 grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr]">
            <Reveal className="dots-light relative min-h-[320px] overflow-hidden rounded-[24px] bg-fog" aria-hidden>
              <svg viewBox="0 0 100 80" className="absolute inset-0 size-full" preserveAspectRatio="xMidYMid meet">
                <path d="M30 66 C 40 44, 46 36, 54 30" stroke="#00c27a" strokeWidth="0.5" strokeDasharray="1.4 1.4" fill="none" />
                <path d="M54 30 C 62 32, 67 38, 71 46" stroke="#00c27a" strokeWidth="0.5" strokeDasharray="1.4 1.4" fill="none" />
                <path d="M18 34 C 30 24, 44 24, 54 30" stroke="#000" strokeWidth="0.35" strokeDasharray="1 1.4" fill="none" />
                <circle cx="18" cy="34" r="1.6" fill="#000" />
                <text x="18" y="29.5" fontSize="2.6" textAnchor="middle" fill="#000">U.S. law firms</text>
                {REGIONS.map((r) => (
                  <g key={r.name}>
                    <circle cx={r.x} cy={r.y} r="4.4" fill="#00c27a" opacity="0.18" />
                    <circle cx={r.x} cy={r.y} r="1.8" fill="#00c27a" />
                    <text x={r.x} y={r.y + 7} fontSize="2.8" textAnchor="middle" fill="#000" fontWeight="600">
                      {r.name}
                    </text>
                  </g>
                ))}
              </svg>
            </Reveal>
            <ul className="grid grid-cols-1 gap-3">
              {REGIONS.map((r, i) => (
                <Reveal as="li" key={r.name} delay={i * 0.06} className="min-w-0 rounded-[20px] border-[1.5px] border-line p-6">
                  <p className="font-display text-[28px] leading-none tracking-[-0.03em]">{r.name}</p>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted">{r.note}</p>
                </Reveal>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="team" className="scroll-mt-24 bg-paper pb-[var(--space-section)]" aria-labelledby="team-h">
        <div className="container-page">
          <SectionHeader id="team-h" eyebrow="Our team" title="The people behind" muted="your petitions." lede="Legal writers, case managers and team leads who do nothing but U.S. business immigration. Portrait photography will replace the monograms." />
          <div className="mt-12">
            <TeamGrid />
          </div>
        </div>
      </section>

      <section id="process" className="scroll-mt-24 bg-[#fafafa] py-[var(--space-section)]" aria-labelledby="process-h">
        <div className="container-page">
          <SectionHeader id="process-h" eyebrow="Our process" title="Collaboration," muted="not outsourcing." lede="Four steps, the same for a single O-1 or a cap season. We learn your templates, tone and preferences first — then two specialists stand behind every page." />
        </div>
        <ProcessList className="mt-14" />
        <div className="container-page mt-16">
          <Reveal className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="min-w-0 rounded-[20px] bg-paper p-7 ring-1 ring-line">
              <p className="eyebrow text-muted">Review step 1</p>
              <p className="mt-3 font-display text-[28px] leading-tight tracking-[-0.02em]">The drafter checks their own work</p>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">Against your strategy memo, your house style and a checklist for the case type.</p>
            </div>
            <div className="min-w-0 rounded-[20px] bg-void p-7 text-paper">
              <p className="eyebrow text-mint">Review step 2</p>
              <p className="mt-3 font-display text-[28px] leading-tight tracking-[-0.02em]">A second specialist verifies everything</p>
              <p className="mt-2 text-[15px] leading-relaxed text-paper/75">Every criterion, citation and exhibit is checked against the original source before the draft reaches you.</p>
            </div>
          </Reveal>
        </div>
      </section>

      <SecurityCard cta={false} />

      <section className="bg-paper py-[var(--space-section)]" aria-labelledby="ai-h">
        <div className="container-page grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.3fr] lg:gap-16">
          <Reveal className="min-w-0">
            <p className="eyebrow text-void">AI Use Policy, in short</p>
            <h2 id="ai-h" className="display-lg mt-4">
              People write. <span className="text-muted-display">Tools help them look things up.</span>
            </h2>
            <div className="mt-6">
              <ButtonLink href="/ai-use-policy" variant="dark" arrow>
                Read the full policy
              </ButtonLink>
            </div>
          </Reveal>
          <Reveal delay={0.08} className="min-w-0">
            <ol className="divide-y divide-line border-y border-line">
              {AI_POLICY.map((p, i) => (
                <li key={p} className="flex gap-5 py-5">
                  <span className="font-display text-[26px] leading-none text-muted-display tabular">{String(i + 1).padStart(2, "0")}</span>
                  <p className="text-[16px] leading-relaxed">{p}</p>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </section>

      <section className="bg-paper pb-[var(--space-section)]" aria-labelledby="company-h">
        <div className="container-page">
          <Reveal className="grid grid-cols-1 gap-6 rounded-[24px] bg-fog p-7 sm:p-10 md:grid-cols-[auto_1fr_auto] md:items-center">
            <Building2 className="size-8" aria-hidden />
            <div className="min-w-0">
              <h2 id="company-h" className="text-[20px] font-medium">
                {COMPANY.legalName}
              </h2>
              <p className="mt-1 text-[15px] text-muted">{COMPANY.address}</p>
              <p className="text-[15px] text-muted">{COMPANY.registry}</p>
            </div>
            <Link href={`mailto:${COMPANY.email}`} className="text-[16px] font-medium underline underline-offset-4">
              {COMPANY.email}
            </Link>
          </Reveal>
        </div>
      </section>

      <FinalCta title="Meet the team on a 30-minute call." />
    </PublicShell>
  );
}
