import type { DocPreviewData } from "@/lib/content/resources";
import { cn } from "@/lib/utils";
import { PlaceholderTag } from "@/components/gc/section";

/** Diagonal "SAMPLE" watermark laid over a paper sheet. */
function Watermark({ className }: { className?: string }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 grid select-none place-items-center overflow-hidden">
      <span className={cn("rotate-[-30deg] font-display font-normal uppercase tracking-[0.18em] text-void/[0.07]", className)}>Sample</span>
    </div>
  );
}

/**
 * HTML/CSS rendering of a sample document: a white "paper" sheet with a
 * header, numbered sections and an exhibit-index style table. All content is
 * fictional — names and facts are bracketed placeholders.
 */
export function DocPreview({ doc }: { doc: DocPreviewData }) {
  return (
    <figure className="min-w-0">
      <div className="rounded-[24px] bg-fog p-3 sm:p-6">
        <div className="relative overflow-hidden rounded-[8px] bg-paper shadow-panel">
          <Watermark className="text-[clamp(64px,13vw,150px)]" />
          <div className="relative px-5 py-7 sm:px-10 sm:py-12">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-4 text-[11px] uppercase tracking-[0.16em] text-muted">
              <span>[Law Firm] · Privileged draft</span>
              <span>{doc.docType}</span>
            </div>

            <header className="mt-7 text-center">
              <p className="font-display text-[24px] font-normal leading-tight tracking-[-0.015em] text-void sm:text-[30px]">{doc.title}</p>
              <p className="mx-auto mt-2 max-w-[46ch] text-[13px] leading-relaxed text-muted">{doc.subtitle}</p>
            </header>

            <dl className="mt-7 grid grid-cols-1 gap-x-6 gap-y-2 rounded-[8px] bg-fog/70 px-4 py-3 text-[12.5px] sm:grid-cols-3">
              {doc.meta.map((m) => (
                <div key={m.label} className="min-w-0">
                  <dt className="text-[10.5px] uppercase tracking-[0.14em] text-muted">{m.label}</dt>
                  <dd className="mt-0.5 break-words font-medium text-void">{m.value}</dd>
                </div>
              ))}
            </dl>

            <ol className="mt-8 space-y-5">
              {doc.sections.map((s, i) => (
                <li key={s.title} className="grid grid-cols-[28px_minmax(0,1fr)] gap-2">
                  <span className="font-display text-[17px] font-normal leading-[1.4] text-muted tabular">{i + 1}.</span>
                  <div className="min-w-0">
                    <p className="font-display text-[17px] font-normal leading-[1.4] text-void">{s.title}</p>
                    <p className="mt-1 font-display text-[15px] font-normal leading-[1.65] text-ink">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-9">
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted">{doc.table.caption}</p>
              <div className="mt-3 overflow-x-auto rounded-[8px] ring-1 ring-line">
                <table className="w-full min-w-[460px] border-collapse text-left text-[12.5px]">
                  <thead className="bg-fog">
                    <tr>
                      {doc.table.head.map((h) => (
                        <th key={h} scope="col" className="px-3 py-2 font-medium text-void">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {doc.table.rows.map((row) => (
                      <tr key={row.join("|")} className="border-t border-line align-top">
                        {row.map((cell, j) => (
                          <td key={j} className={cn("px-3 py-2 text-ink", j === 0 && "whitespace-nowrap font-mono text-[12px] text-void", j > 0 && j === row.length - 1 && "whitespace-nowrap")}>
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <p className="mt-9 border-t border-line pt-4 text-[11.5px] leading-relaxed text-muted">
              Fictional sample prepared for illustration. Bracketed fields stand in for every name and fact. Prepared for attorney review; not legal advice.
            </p>
          </div>
        </div>
      </div>
      <figcaption className="mt-3 flex flex-wrap items-center gap-2 text-[13px] text-muted">
        <PlaceholderTag>Fictional sample — no client data</PlaceholderTag>
        HTML preview of an excerpt. Full samples are shared on request.
      </figcaption>
    </figure>
  );
}

/** Miniature paper thumbnail for sample-work cards. Decorative only. */
export function DocThumb({ label }: { label: string }) {
  return (
    <div aria-hidden className="dots-light relative grid h-[200px] place-items-center overflow-hidden rounded-[16px] bg-ash">
      <div className="relative h-[170px] w-[132px] translate-y-6 overflow-hidden rounded-[4px] bg-paper p-3 shadow-panel transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:translate-y-3">
        <Watermark className="text-[30px]" />
        <p className="truncate text-[6.5px] uppercase tracking-[0.14em] text-muted">{label}</p>
        <div className="mx-auto mt-2 h-[5px] w-3/4 rounded-full bg-void/70" />
        <div className="mx-auto mt-1.5 h-[3px] w-1/2 rounded-full bg-void/25" />
        <div className="mt-3 space-y-1">
          {[92, 84, 96, 70].map((w, i) => (
            <div key={i} className="h-[3px] rounded-full bg-void/15" style={{ width: `${w}%` }} />
          ))}
        </div>
        <div className="mt-3 grid grid-cols-[18px_1fr_22px] gap-x-1 gap-y-1">
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} className={cn("h-[3px] rounded-full", i % 3 === 0 ? "bg-jade/60" : "bg-void/15")} />
          ))}
        </div>
      </div>
    </div>
  );
}
