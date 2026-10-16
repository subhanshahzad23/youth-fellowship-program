import { FACTS } from "@/lib/content/site";
import { Reveal } from "@/components/site/reveal";

/** Fact strip: oversized serif numbers with thin vertical dividers. Facts come from the Goodcase brief. */
export function FactStrip({ title = "Goodcase at a glance" }: { title?: string }) {
  return (
    <section className="bg-paper py-[var(--space-section)]" aria-labelledby="facts-h">
      <div className="container-page">
        <h2 id="facts-h" className="text-center text-[13px] font-light uppercase tracking-[0.25em] text-void">
          {title}
        </h2>
        <ul className="mt-12 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
          {FACTS.map((f, i) => (
            <Reveal as="li" key={f.unit} delay={i * 0.08} className="min-w-0 border-line px-0 sm:px-8 lg:border-l lg:first:border-l-0 lg:first:pl-0">
              <p className="font-display text-[48px] font-light leading-none tracking-[-0.045em] tabular sm:text-[80px]">{f.value}</p>
              <p className="mt-2 text-[15px] font-medium sm:text-[17px]">{f.unit}</p>
              <p className="mt-1 max-w-[260px] text-[13.5px] leading-relaxed text-muted sm:text-[15px]">{f.label}</p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
