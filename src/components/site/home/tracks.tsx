"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, BookOpen, ClipboardCheck, PlayCircle } from "lucide-react";
import type { SessionKind } from "@/lib/domain/types";
import { modulesOfTrack, publishedSessionsOfModule } from "@/lib/domain/selectors";
import { useDb } from "@/lib/store/store";
import { cn } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/site/reveal";

/*
 * Adapts the observed "Who we serve" section: dotted background, left-aligned
 * multi-line serif statement with copy + CTA on the right, then large bordered
 * rounded cards with in-canvas sticky notes and cursor tags. Selecting a card
 * drives an interactive curriculum preview built from the real seeded modules.
 */

const KIND_ICON: Record<SessionKind, typeof BookOpen> = { reading: BookOpen, video: PlayCircle, task: ClipboardCheck };
const NOTES: Record<string, [string, string][]> = {
  t_ff: [
    ["#ffe146", "Who has this problem — really?"],
    ["#b4f5c8", "5 interviews by Friday"],
  ],
  t_vb: [
    ["#bed7ff", "Price test: $4 vs $6"],
    ["#ffe146", "Break-even: 310 refills"],
  ],
  t_li: [
    ["#e6bfff", "Team charter v2"],
    ["#ff98b4", "3-minute pitch draft"],
  ],
};
const CURSOR: Record<string, [string, string]> = { t_ff: ["Fellow", "#00a86b"], t_vb: ["Mentor", "#3f6fe8"], t_li: ["Instructor", "#8b3fd9"] };

export function Tracks() {
  const db = useDb();
  const tracks = useMemo(() => Object.values(db.tracks).sort((a, b) => a.order - b.order), [db.tracks]);
  const [sel, setSel] = useState(tracks[0]?.id ?? "t_ff");
  const [openMod, setOpenMod] = useState<string | null>(null);
  const track = db.tracks[sel];
  const modules = useMemo(() => modulesOfTrack(db, sel), [db, sel]);

  return (
    <section id="tracks" className="dots-light scroll-mt-24 bg-paper py-[var(--space-section)]" aria-labelledby="tracks-h">
      <div className="container-page">
        <Reveal className="grid grid-cols-1 gap-8 lg:grid-cols-[1.5fr_1fr] lg:items-end">
          <div>
            <p className="eyebrow text-void">Learning tracks</p>
            <h2 id="tracks-h" className="display-xl mt-4">
              Find the problem.
              <br />
              Build the venture.
              <br />
              Lead the people.
            </h2>
          </div>
          <div className="lg:pb-3">
            <p className="max-w-[440px] text-[17px] leading-[1.6] text-ink">
              Three tracks, six modules each, spread across 18 months. Fellows follow one track with their cohort — and every session ends in something real you can test.
            </p>
            <div className="mt-6">
              <ButtonLink href={`/tracks/${track?.slug ?? "founder-foundations"}`} arrow>
                See the full curriculum
              </ButtonLink>
            </div>
          </div>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-3" role="radiogroup" aria-label="Choose a track to preview">
          {tracks.map((t, i) => {
            const active = t.id === sel;
            const [who, color] = CURSOR[t.id] ?? ["Fellow", "#00a86b"];
            return (
              <Reveal key={t.id} delay={i * 0.08}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => {
                    setSel(t.id);
                    setOpenMod(null);
                  }}
                  className={cn(
                    "group relative flex h-full w-full flex-col overflow-hidden rounded-[24px] border-[1.5px] bg-paper text-left transition-[border-color,transform] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-1",
                    active ? "border-void" : "border-line",
                  )}
                >
                  <div className="dots-light relative h-[170px] bg-fog">
                    {(NOTES[t.id] ?? []).map(([bg, txt], j) => (
                      <span
                        key={txt}
                        className="absolute w-[150px] p-3 text-[13px] font-medium leading-snug shadow-[0_10px_18px_-10px_rgba(0,0,0,0.3)] transition-transform duration-500 group-hover:rotate-0"
                        style={{ background: bg, left: 24 + j * 130, top: 28 + j * 26, rotate: `${j ? 3 : -3}deg` }}
                      >
                        {txt}
                      </span>
                    ))}
                    <span className="absolute bottom-5 right-6 flex items-center" aria-hidden>
                      <svg width="18" height="18" viewBox="0 0 22 22">
                        <path d="M3 2 L19 10 L11 12 L8 20 Z" fill={color} stroke="white" strokeWidth="1.5" />
                      </svg>
                      <span className="ml-1 rounded-[6px] px-2 py-0.5 text-[11.5px] font-semibold text-white" style={{ background: color }}>
                        {who}
                      </span>
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-6 sm:p-7">
                    <p className="font-display text-[34px] font-light leading-[1.05] tracking-[-0.035em]">{t.name}</p>
                    <p className="mt-3 flex-1 text-[15.5px] leading-relaxed text-ink">{t.tagline}</p>
                    <span className={cn("mt-5 inline-flex h-10 w-fit items-center rounded-[8px] border-[1.5px] px-4 text-[15px] font-medium transition-colors", active ? "border-void bg-void text-paper" : "border-line")}>
                      {active ? "Previewing curriculum" : "Preview curriculum"}
                    </span>
                  </div>
                </button>
              </Reveal>
            );
          })}
        </div>

        <div className="mt-6 rounded-[24px] bg-paper p-5 ring-1 ring-line sm:p-8" aria-live="polite">
          <AnimatePresence mode="wait">
            <motion.div key={sel} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="eyebrow text-muted">Curriculum preview</p>
                  <p className="mt-2 font-display text-[30px] font-light tracking-[-0.03em]">{track?.name}</p>
                </div>
                <Link href={`/tracks/${track?.slug}`} className="inline-flex items-center gap-1 text-[15px] font-medium underline-offset-4 hover:underline">
                  Open the {track?.shortName} track page <ArrowUpRight className="size-4" aria-hidden />
                </Link>
              </div>
              <ol className="mt-6 divide-y divide-line border-y border-line">
                {modules.map((m) => {
                  const sessions = publishedSessionsOfModule(db, m.id);
                  const open = openMod === m.id;
                  return (
                    <li key={m.id}>
                      <button type="button" onClick={() => setOpenMod(open ? null : m.id)} aria-expanded={open} className="flex w-full items-center gap-4 py-4 text-left">
                        <span className="w-8 font-display text-[22px] text-muted tabular">{String(m.order).padStart(2, "0")}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[17px] font-medium">{m.title}</span>
                          <span className="block text-[13.5px] text-muted">
                            {m.suggestedMonths} · {sessions.length} sessions
                          </span>
                        </span>
                        <span className={cn("grid size-8 place-items-center rounded-full bg-fog text-[18px] transition-transform duration-300", open && "rotate-45")} aria-hidden>
                          +
                        </span>
                      </button>
                      <AnimatePresence initial={false}>
                        {open && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.26, ease: [0.23, 1, 0.32, 1] }} className="overflow-hidden">
                            <p className="max-w-3xl pb-3 pl-12 text-[15px] text-ink">{m.summary}</p>
                            <ul className="grid grid-cols-1 gap-2 pb-5 pl-12 sm:grid-cols-2">
                              {sessions.map((s) => {
                                const Icon = KIND_ICON[s.kind];
                                return (
                                  <li key={s.id} className="flex items-start gap-2.5 rounded-[12px] bg-fog px-3 py-2.5 text-[14px]">
                                    <Icon className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
                                    <span>
                                      {s.published?.title}
                                      <span className="block text-[12.5px] capitalize text-muted">
                                        {s.kind} · {s.published?.durationMin} min{s.showcase ? " · showcase session" : ""}
                                      </span>
                                    </span>
                                  </li>
                                );
                              })}
                            </ul>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </li>
                  );
                })}
              </ol>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
