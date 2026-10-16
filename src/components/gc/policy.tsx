import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { COMPANY } from "@/lib/content/site";
import type { Policy, PolicyBlock, PolicySection, PolicySubsection } from "@/lib/content/policies";
import { PlaceholderTag } from "./section";
import { PolicyToc } from "./policy-toc";

/*
 * Legal page body: a table of contents (sticky on desktop, collapsible on
 * mobile) beside the policy text set in `prose-session` at 17px. The article
 * is capped at 620px, which measures ~70 characters per line in DM Sans
 * (a literal 70ch measured ~91, since `ch` is the wide "0" glyph).
 * Utilities override prose-session's element margins (utilities layer wins).
 */

const LABEL = "text-[11px] font-medium uppercase tracking-[0.16em] text-muted";

/** "Last updated" line for the legal hero; flags a missing date instead of inventing one. */
export function PolicyHeroMeta({ policy }: { policy: Policy }) {
  return (
    <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-[14px] text-paper/65">
      {policy.lastUpdated ? (
        <span>Last updated on {policy.lastUpdated}</span>
      ) : (
        <span className="inline-flex flex-wrap items-center gap-2">
          Last updated: not stated in the live policy
          <PlaceholderTag dark>Date to be confirmed</PlaceholderTag>
        </span>
      )}
      <span aria-hidden className="hidden sm:inline">
        ·
      </span>
      <span>Text as published on goodcase.io</span>
    </div>
  );
}

export function PolicyArticle({ policy }: { policy: Policy }) {
  const toc = policy.sections.map((s, i) => ({ id: s.id, label: s.heading, n: i + 1 }));
  return (
    <section className="bg-paper py-[var(--space-section)]" aria-label={`${policy.title} text`}>
      <div className="container-page grid grid-cols-1 gap-8 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-16 xl:gap-24">
        <aside className="min-w-0">
          <PolicyToc items={toc} />
        </aside>
        <article className="prose-session min-w-0 max-w-[620px]">
          {policy.intro?.map((p) => (
            <p key={p} className="mt-0 text-[19px] leading-[1.6] text-void">
              {p}
            </p>
          ))}
          {policy.sections.map((s, i) => (
            <SectionView key={s.id} section={s} n={i + 1} first={i === 0 && !policy.intro?.length} />
          ))}
          {policy.lastUpdated && <p className="mb-0 mt-14 border-t border-line pt-6 text-[15px] text-muted">Last updated on {policy.lastUpdated}.</p>}
        </article>
      </div>
    </section>
  );
}

function SectionView({ section: s, n, first }: { section: PolicySection; n: number; first: boolean }) {
  return (
    <section id={s.id} aria-labelledby={`${s.id}-h`} className="scroll-mt-28">
      <h2 id={`${s.id}-h`} className={first ? "mt-0" : undefined}>
        <span className="mr-3 text-muted-display tabular">{String(n).padStart(2, "0")}</span>
        {s.heading}
      </h2>
      <Content part={s} />
      {s.subsections?.map((sub) => (
        <div key={sub.id} id={sub.id} className="scroll-mt-28">
          <h3>{sub.heading}</h3>
          <Content part={sub} />
        </div>
      ))}
      {s.note && (
        <div className="mt-6 rounded-[12px] bg-[#fff8e6] p-4 text-[14.5px] leading-relaxed text-[#5c3a00]">
          <PlaceholderTag>Note for Goodcase</PlaceholderTag>
          <p className="mb-0 mt-2">{s.note}</p>
        </div>
      )}
    </section>
  );
}

function Content({ part }: { part: PolicySubsection }) {
  return (
    <>
      {part.paragraphs.map((p) => (
        <p key={p}>{p}</p>
      ))}
      {part.bullets && <Bullets items={part.bullets} />}
      {part.blocks?.map((b, i) => (
        <Block key={i} block={b} />
      ))}
    </>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul>
      {items.map((t) => (
        <li key={t}>{t}</li>
      ))}
    </ul>
  );
}

function Block({ block }: { block: PolicyBlock }) {
  switch (block.kind) {
    case "p":
      return <p>{block.text}</p>;
    case "ul":
      return <Bullets items={block.items} />;
    case "terms":
      return (
        <dl className="my-6 divide-y divide-line border-y border-line">
          {block.items.map((t) => (
            <div key={t.term} className="py-4">
              <dt className="font-semibold text-void">{t.term}</dt>
              <dd className="mt-1">{t.text}</dd>
            </div>
          ))}
        </dl>
      );
    case "links":
      return (
        <ul className="list-none pl-0">
          {block.items.map((l) => (
            <li key={l.href}>
              <a href={l.href} target="_blank" rel="noopener noreferrer" className="[overflow-wrap:anywhere]">
                {l.label}
                <ExternalLink className="ml-1 inline size-3.5 align-[-2px]" aria-hidden />
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </li>
          ))}
        </ul>
      );
    case "processing":
      return (
        <>
          <p className="text-[15px] text-muted">Each purpose of processing, with its legal basis, data recipients and duration of processing.</p>
          <ol className="mb-0 mt-5 grid list-none grid-cols-1 gap-3 pl-0">
            {block.rows.map((r) => (
              <li key={r.purpose} className="m-0 min-w-0 rounded-[16px] bg-fog p-5 sm:p-6">
                <h3 className="mb-0 mt-0 text-[17px] leading-snug">{r.purpose}</h3>
                <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-1.5 text-[15px] leading-relaxed sm:grid-cols-[136px_minmax(0,1fr)] sm:gap-y-3">
                  <dt className={`${LABEL} sm:pt-1`}>Legal basis</dt>
                  <dd className="mb-2 min-w-0 sm:mb-0">{r.basis}</dd>
                  <dt className={`${LABEL} sm:pt-1`}>Data recipients</dt>
                  <dd className="mb-2 min-w-0 sm:mb-0">
                    <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
                      {r.recipients.map((x) => (
                        <li key={x} className="m-0 rounded-full bg-paper px-2.5 py-0.5 text-[13.5px]">
                          {x}
                        </li>
                      ))}
                    </ul>
                  </dd>
                  <dt className={`${LABEL} sm:pt-1`}>Duration of processing</dt>
                  <dd className="min-w-0">{r.duration}</dd>
                </dl>
              </li>
            ))}
          </ol>
        </>
      );
  }
}

/** Small contact block that closes each legal page (no FinalCta on legal pages). */
export function PolicyContact({ other }: { other: { href: string; title: string } }) {
  return (
    <section className="bg-paper pb-[var(--space-section)]" aria-labelledby="policy-contact-h">
      <div className="container-page">
        <div className="grid grid-cols-1 gap-8 rounded-[24px] bg-fog p-7 sm:p-10 lg:grid-cols-[1.3fr_1fr_1fr] lg:gap-12">
          <div className="min-w-0">
            <p className="eyebrow text-muted">Questions?</p>
            <h2 id="policy-contact-h" className="display-md mt-3">
              Ask us about this policy.
            </h2>
            <p className="mt-3 text-[15.5px] leading-relaxed text-muted">{COMPANY.responseTime}</p>
          </div>
          <div className="min-w-0">
            <p className={LABEL}>Email</p>
            <a href={`mailto:${COMPANY.email}`} className="mt-2 inline-block text-[18px] font-medium underline underline-offset-4">
              {COMPANY.email}
            </a>
            <p className={`${LABEL} mt-6`}>Also read</p>
            <Link href={other.href} className="mt-2 inline-block text-[16px] font-medium underline-offset-4 hover:underline">
              {other.title}
            </Link>
          </div>
          <div className="min-w-0">
            <p className={LABEL}>Company</p>
            <address className="mt-2 text-[15px] not-italic leading-relaxed">
              {COMPANY.legalName}
              <br />
              {COMPANY.address}
              <br />
              <span className="text-muted">{COMPANY.registry}</span>
            </address>
          </div>
        </div>
        <p className="mt-5 max-w-[80ch] text-[13px] leading-relaxed text-muted">{COMPANY.disclaimer}</p>
      </div>
    </section>
  );
}
