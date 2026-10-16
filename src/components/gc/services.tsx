import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";
import { SERVICES } from "@/lib/content/site";
import { Reveal } from "@/components/site/reveal";
import { SectionHeader } from "./section";

/** The two service cards, prices shown openly (brief: "show prices openly"). */
export function ServiceCards({ heading = true }: { heading?: boolean }) {
  return (
    <section id="services" className="scroll-mt-24 bg-paper py-[var(--space-section)]" aria-labelledby={heading ? "services-h" : undefined} aria-label={heading ? undefined : "Services"}>
      <div className="container-page">
        {heading && <SectionHeader id="services-h" eyebrow="Two services" title="Drafting and case management." muted="One team behind both." lede="Use one, or both together. Either way you keep the strategy, the client relationship and the signature — we take the hours in between." />}
        <div className="mt-12 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {SERVICES.map((s, i) => (
            <Reveal key={s.slug} delay={i * 0.08} className="min-w-0">
              <Link href={s.href} className="group flex h-full flex-col rounded-[24px] bg-fog p-7 transition-colors duration-300 hover:bg-ash sm:p-10">
                <div className="flex items-start justify-between gap-4">
                  <p className="eyebrow text-muted">{s.eyebrow}</p>
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-paper transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
                    <ArrowUpRight className="size-5" aria-hidden />
                  </span>
                </div>
                <h3 className="display-lg mt-6">{s.title}</h3>
                <p className="mt-3 max-w-[46ch] text-[18px] leading-snug text-void">{s.tagline}</p>
                <p className="mt-4 max-w-[56ch] text-[15.5px] leading-relaxed text-muted">{s.body}</p>
                <ul className="mt-6 space-y-2">
                  {s.points.map((p) => (
                    <li key={p} className="flex items-start gap-2.5 text-[15px]">
                      <Check className="mt-0.5 size-4 shrink-0 text-leaf-ink" aria-hidden />
                      {p}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-8">
                  <span className="rounded-[26px] bg-paper px-3.5 py-1.5 text-[14px] font-medium">{s.price}</span>
                  <span className="text-[15px] font-medium underline-offset-4 group-hover:underline">Explore {s.title.toLowerCase()}</span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
