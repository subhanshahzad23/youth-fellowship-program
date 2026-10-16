import Link from "next/link";
import { ArrowUpRight, Clock } from "lucide-react";
import type { CaseStudy, Episode, SampleWork } from "@/lib/content/site";
import { episodeLabel } from "@/lib/content/resources";
import { cn, fmtDate } from "@/lib/utils";
import { PlaceholderTag } from "@/components/gc/section";
import { Monogram } from "./monogram";
import { DocThumb } from "./doc-preview";

/** Required label on every illustrative case study (brief: never present invented clients as real). */
export function IllustrativeTag({ dark, className }: { dark?: boolean; className?: string }) {
  return (
    <PlaceholderTag dark={dark} className={className}>
      Illustrative case study — anonymized scenario
    </PlaceholderTag>
  );
}

/** Podcast episode row: number, title, summary, hosts, duration and date. */
export function EpisodeCard({ episode, className }: { episode: Episode; className?: string }) {
  return (
    <Link
      href={`/podcast/${episode.slug}`}
      className={cn("group grid h-full min-w-0 grid-cols-1 gap-5 rounded-[24px] bg-fog p-6 transition-colors duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-ash sm:grid-cols-[96px_minmax(0,1fr)] sm:p-7", className)}
    >
      <p className="font-display text-[56px] leading-none tracking-[-0.05em] text-void tabular sm:text-[64px]">{episodeLabel(episode.number)}</p>
      <div className="flex min-w-0 flex-col">
        <div className="flex flex-wrap items-center gap-2">
          <p className="eyebrow text-muted">Why Immigration Law</p>
          {episode.sample && <PlaceholderTag>Sample episode</PlaceholderTag>}
        </div>
        <h3 className="mt-3 font-display text-[26px] leading-[1.15] tracking-[-0.025em] text-void">{episode.title}</h3>
        <p className="mt-2 line-clamp-3 text-[15px] leading-relaxed text-muted">{episode.summary}</p>
        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-3 pt-6">
          <span className="flex -space-x-2">
            {episode.hosts.map((h) => (
              <Monogram key={h} name={h} size={30} ring />
            ))}
          </span>
          <span className="min-w-0 text-[13px] text-ink">{episode.hosts.join(" & ")}</span>
          <span className="inline-flex items-center gap-1.5 text-[13px] text-muted">
            <Clock className="size-3.5" aria-hidden />
            {episode.duration} · <time dateTime={episode.date}>{fmtDate(episode.date)}</time>
          </span>
        </div>
      </div>
    </Link>
  );
}

/** Sample-work card with a miniature paper thumbnail. */
export function SampleCard({ item, className }: { item: SampleWork; className?: string }) {
  return (
    <Link href={`/sample-work/${item.slug}`} className={cn("group flex h-full min-w-0 flex-col rounded-[24px] bg-fog p-3 transition-colors duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-ash", className)}>
      <DocThumb label={item.format} />
      <div className="flex flex-1 flex-col px-3 pb-4 pt-5 sm:px-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-[26px] bg-paper px-2.5 py-0.5 text-[12px] font-medium text-void">{item.visa}</span>
          <span className="eyebrow text-muted">{item.format}</span>
        </div>
        <h3 className="mt-3 font-display text-[24px] leading-[1.15] tracking-[-0.025em] text-void">{item.title}</h3>
        <p className="mt-2 line-clamp-3 text-[14.5px] leading-relaxed text-muted">{item.summary}</p>
        <span className="mt-auto inline-flex items-center gap-1 pt-5 text-[14.5px] font-medium text-void">
          Preview the sample
          <ArrowUpRight className="size-4 transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
        </span>
      </div>
    </Link>
  );
}

/** Case-study card. Every card carries the illustrative label. */
export function CaseStudyCard({ study, className }: { study: CaseStudy; className?: string }) {
  return (
    <Link href={`/case-studies/${study.slug}`} className={cn("group flex h-full min-w-0 flex-col rounded-[24px] bg-fog p-6 transition-colors duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-ash sm:p-7", className)}>
      <IllustrativeTag className="self-start" />
      <p className="eyebrow mt-5 text-muted">
        {study.segment} · {study.firm}
      </p>
      <h3 className="mt-3 font-display text-[27px] leading-[1.12] tracking-[-0.025em] text-void">{study.title}</h3>
      <p className="mt-3 text-[15px] leading-relaxed text-muted">{study.challenge}</p>
      <div className="mt-auto pt-7">
        <ul className="grid grid-cols-3 gap-3 border-t border-line pt-5">
          {study.metrics.map((m) => (
            <li key={m.label} className="min-w-0">
              <p className="break-words font-display text-[22px] leading-none tracking-[-0.04em] text-void tabular sm:text-[28px]">{m.value}</p>
              <p className="mt-1.5 text-[12.5px] leading-snug text-muted">{m.label}</p>
            </li>
          ))}
        </ul>
      </div>
    </Link>
  );
}
