"use client";

import { useState } from "react";
import { Play, Quote } from "lucide-react";
import { TESTIMONIALS, type Testimonial } from "@/lib/content/site";
import { cn } from "@/lib/utils";
import { DialogContent, DialogRoot } from "@/components/ui/overlay";
import { Reveal } from "@/components/site/reveal";
import { SectionHeader } from "./section";

/*
 * Video testimonials. The quotes are real (published on goodcase.io, attributed
 * by role and state). The videos are captioned placeholders until Goodcase
 * records the attorneys; each card says so.
 */
export function VideoTestimonials({ heading = true, items = TESTIMONIALS }: { heading?: boolean; items?: readonly Testimonial[] }) {
  const [open, setOpen] = useState<Testimonial | null>(null);
  return (
    <section id="testimonials" className="scroll-mt-24 bg-paper py-[var(--space-section)]" aria-labelledby="t-h">
      <div className="container-page">
        {heading && (
          <SectionHeader
            id="t-h"
            eyebrow="From the attorneys we work with"
            title="Trusted with their clients' files."
            muted="In their words."
            lede="Quotes from immigration attorneys who work with Goodcase today. Video placeholders show where their recorded testimonials will play."
          />
        )}
        <ul className={cn("grid grid-cols-1 gap-4 md:grid-cols-3", heading && "mt-12")}>
          {items.map((t, i) => (
            <Reveal as="li" key={t.id} delay={i * 0.08} className="min-w-0">
              <TestimonialCard t={t} onPlay={() => setOpen(t)} />
            </Reveal>
          ))}
        </ul>
      </div>
      <DialogRoot open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        {open && (
          <DialogContent title={`${open.role}, ${open.place}`} description="Placeholder video with captions — the recorded testimonial will replace it." size="lg">
            <video key={open.id} className="aspect-video w-full rounded-[12px] bg-void" controls autoPlay playsInline poster={open.poster} preload="metadata" data-testid="testimonial-video">
              <source src={open.video} type="video/mp4" />
              <track kind="captions" src={open.captions} srcLang="en" label="English" default />
            </video>
            <blockquote className="mt-5 font-display text-[22px] font-light leading-[1.4] tracking-[-0.01em]">“{open.quote}”</blockquote>
            <p className="mt-3 text-[14px] text-muted">
              {open.role}, {open.place} · quote published on goodcase.io
            </p>
          </DialogContent>
        )}
      </DialogRoot>
    </section>
  );
}

function TestimonialCard({ t, onPlay }: { t: Testimonial; onPlay: () => void }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[24px] bg-fog">
      <button type="button" onClick={onPlay} className="group relative block aspect-video w-full overflow-hidden bg-void text-left" aria-label={`Play testimonial from ${t.role}, ${t.place}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={t.poster} alt="" className="absolute inset-0 size-full object-cover opacity-90 transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.03]" loading="lazy" />
        <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" aria-hidden />
        <span className="absolute bottom-4 left-4 flex items-center gap-3 text-paper">
          <span className="grid size-12 place-items-center rounded-full bg-jade text-void transition-transform duration-300 group-hover:scale-110">
            <Play className="ml-0.5 size-5 fill-current" aria-hidden />
          </span>
          <span className="text-[13px] font-medium tabular">{t.duration} · captions</span>
        </span>
      </button>
      <div className="flex flex-1 flex-col p-6">
        <Quote className="size-6 text-jade" aria-hidden />
        <blockquote className="mt-3 font-display text-[21px] font-light leading-[1.35] tracking-[-0.01em]">“{t.quote}”</blockquote>
        <p className="mt-auto pt-5 text-[14px] font-medium">
          {t.role} <span className="font-normal text-muted">· {t.place}</span>
        </p>
      </div>
    </article>
  );
}

/** One large testimonial — serif quote beside its (placeholder) video. */
export function FeaturedTestimonial({ id }: { id: Testimonial["id"] }) {
  const t = TESTIMONIALS.find((x) => x.id === id) ?? TESTIMONIALS[0];
  const [open, setOpen] = useState(false);
  return (
    <section className="bg-paper py-[var(--space-section)]" aria-label="Testimonial">
      <div className="container-page">
        <Reveal className="grid grid-cols-1 items-center gap-8 overflow-hidden rounded-[24px] bg-fog p-6 sm:p-10 lg:grid-cols-[1.3fr_1fr] lg:gap-14 lg:p-14">
          <div className="min-w-0">
            <Quote className="size-8 text-jade" aria-hidden />
            <blockquote className="mt-4 font-display text-[26px] font-light leading-[1.3] tracking-[-0.015em] sm:text-[34px]">“{t.quote}”</blockquote>
            <p className="mt-6 text-[15px] font-medium">
              {t.role} <span className="font-normal text-muted">· {t.place}</span>
            </p>
          </div>
          <button type="button" onClick={() => setOpen(true)} className="group relative block aspect-video w-full min-w-0 overflow-hidden rounded-[16px] bg-void" aria-label={`Play testimonial from ${t.role}, ${t.place}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={t.poster} alt="" className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" loading="lazy" />
            <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" aria-hidden />
            <span className="absolute bottom-4 left-4 flex items-center gap-3 text-paper">
              <span className="grid size-14 place-items-center rounded-full bg-jade text-void transition-transform duration-300 group-hover:scale-110">
                <Play className="ml-1 size-6 fill-current" aria-hidden />
              </span>
              <span className="text-[13px] font-medium tabular">{t.duration} · captions · placeholder video</span>
            </span>
          </button>
        </Reveal>
      </div>
      <DialogRoot open={open} onOpenChange={setOpen}>
        {open && (
          <DialogContent title={`${t.role}, ${t.place}`} description="Placeholder video with captions — the recorded testimonial will replace it." size="lg">
            <video className="aspect-video w-full rounded-[12px] bg-void" controls autoPlay playsInline poster={t.poster} preload="metadata">
              <source src={t.video} type="video/mp4" />
              <track kind="captions" src={t.captions} srcLang="en" label="English" default />
            </video>
          </DialogContent>
        )}
      </DialogRoot>
    </section>
  );
}
