import Link from "next/link";
import { FAQS, type Faq } from "@/lib/content/site";
import { Accordion } from "@/components/ui/overlay";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/site/reveal";

export function FaqBlock({ items = FAQS.slice(0, 7), title, id = "faq" }: { items?: readonly Faq[]; title?: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="scroll-mt-24 bg-paper py-[var(--space-section)]" aria-labelledby={`${id}-h`}>
      <div className="container-page grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.5fr] lg:gap-16">
        <Reveal className="min-w-0">
          <p className="eyebrow text-void">FAQ</p>
          <h2 id={`${id}-h`} className="display-xl mt-4">
            {title ?? (
              <>
                Questions, <span className="text-muted-display">answered.</span>
              </>
            )}
          </h2>
          <p className="mt-5 max-w-sm text-[16px] leading-relaxed text-muted">
            Can&apos;t find yours? Ask us on a 30-minute call, or email <a className="text-void underline underline-offset-4" href="mailto:info@goodcase.io">info@goodcase.io</a>.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <ButtonLink href="/faq" variant="outline">
              All questions
            </ButtonLink>
            <Link href="/book-a-call" className="inline-flex h-10 items-center px-3 text-[15px] font-medium underline-offset-4 hover:underline">
              Book a call
            </Link>
          </div>
        </Reveal>
        <Reveal delay={0.08} className="min-w-0">
          <Accordion items={items.map((f, i) => ({ value: `q${i}`, title: f.q, content: f.a }))} defaultValue="q0" />
        </Reveal>
      </div>
    </section>
  );
}
