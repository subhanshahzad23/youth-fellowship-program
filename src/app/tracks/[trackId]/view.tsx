"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, BookOpen, ClipboardCheck, PlayCircle, Sparkles } from "lucide-react";
import type { ContentBlock, SessionKind } from "@/lib/domain/types";
import { modulesOfTrack, publishedSessionsOfModule } from "@/lib/domain/selectors";
import { setPersona, useDb } from "@/lib/store/store";
import { cn } from "@/lib/utils";
import { Button, ButtonLink } from "@/components/ui/button";
import { Avatar } from "@/components/ui/display";
import { Paragraphs } from "@/components/ui/rich-text";
import { PublicHero } from "@/components/site/public-shell";
import { Reveal } from "@/components/site/reveal";

const KIND: Record<SessionKind, { icon: typeof BookOpen; label: string }> = {
  reading: { icon: BookOpen, label: "Reading" },
  video: { icon: PlayCircle, label: "Video" },
  task: { icon: ClipboardCheck, label: "Task" },
};

export function TrackView({ trackKey }: { trackKey: string }) {
  const db = useDb();
  const router = useRouter();
  const track = Object.values(db.tracks).find((t) => t.slug === trackKey || t.id === trackKey);
  const modules = useMemo(() => (track ? modulesOfTrack(db, track.id) : []), [db, track]);
  const [open, setOpen] = useState<string | null>(modules[0]?.id ?? null);
  const instructors = useMemo(() => {
    if (!track) return [];
    const ids = [...new Set(Object.values(db.memberships).filter((m) => m.role === "instructor" && m.trackId === track.id && m.status === "active").map((m) => m.userId))];
    return ids.map((id) => db.users[id]).filter(Boolean);
  }, [db, track]);

  if (!track)
    return (
      <PublicHero eyebrow="Learning tracks" title="Track not found" muted="Try one of these instead.">
        <div className="mt-8 flex flex-wrap gap-3">
          {Object.values(db.tracks).map((t) => (
            <ButtonLink key={t.id} href={`/tracks/${t.slug}`} variant="ghost-dark" size="lg">
              {t.name}
            </ButtonLink>
          ))}
        </div>
      </PublicHero>
    );

  const sessionCount = modules.reduce((n, m) => n + publishedSessionsOfModule(db, m.id).length, 0);
  const others = Object.values(db.tracks).filter((t) => t.id !== track.id);

  return (
    <>
      <PublicHero eyebrow="Learning track" title={track.name} muted={track.tagline}>
        <p className="mt-6 max-w-[680px] text-[17px] leading-[1.6] text-paper/90">{track.description}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/#dates" size="lg" arrow>
            Apply to join
          </ButtonLink>
          {track.id === "t_ff" && (
            <Button
              size="lg"
              variant="ghost-dark"
              onClick={() => {
                setPersona("u_noah");
                router.push("/workspace/learning");
              }}
            >
              See it as a fellow
            </Button>
          )}
        </div>
        <dl className="mt-12 grid max-w-3xl grid-cols-3 gap-6 border-t border-white/15 pt-6">
          {[
            ["6", "modules"],
            [String(sessionCount), "sessions"],
            ["18", "months"],
          ].map(([v, l]) => (
            <div key={l}>
              <dt className="sr-only">{l}</dt>
              <dd className="font-display text-[44px] font-light leading-none tracking-[-0.04em]">{v}</dd>
              <dd className="mt-1 text-[14px] text-muted-display">{l}</dd>
            </div>
          ))}
        </dl>
      </PublicHero>

      <section className="bg-paper py-[var(--space-section)]" aria-labelledby="outcomes-h">
        <div className="container-page grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.4fr]">
          <Reveal>
            <p className="eyebrow">What you&apos;ll be able to do</p>
            <h2 id="outcomes-h" className="display-lg mt-4">
              Outcomes you can <span className="text-muted-display">show, not just say.</span>
            </h2>
          </Reveal>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {track.outcomes.map((o, i) => (
              <Reveal as="li" key={o} delay={i * 0.06} className="rounded-[20px] bg-fog p-6">
                <span className="font-display text-[28px] text-muted tabular">0{i + 1}</span>
                <p className="mt-3 text-[17px] leading-snug">{o}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section className="dots-light bg-paper py-[var(--space-section)]" aria-labelledby="curr-h">
        <div className="container-page">
          <Reveal>
            <p className="eyebrow">Curriculum</p>
            <h2 id="curr-h" className="display-lg mt-4">
              Six modules over 18 months
            </h2>
          </Reveal>
          <ol className="mt-10 grid gap-3">
            {modules.map((m) => {
              const sessions = publishedSessionsOfModule(db, m.id);
              const isOpen = open === m.id;
              const showcase = sessions.find((s) => s.showcase);
              const excerpt = showcase?.published?.blocks.find((b) => b.type === "text") as Extract<ContentBlock, { type: "text" }> | undefined;
              return (
                <li key={m.id} className="overflow-hidden rounded-[20px] bg-paper ring-1 ring-line">
                  <button type="button" onClick={() => setOpen(isOpen ? null : m.id)} aria-expanded={isOpen} className="flex w-full items-center gap-5 px-5 py-5 text-left sm:px-7">
                    <span className="font-display text-[34px] font-light leading-none text-muted tabular">{String(m.order).padStart(2, "0")}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[19px] font-medium tracking-[-0.01em]">{m.title}</span>
                      <span className="text-[14px] text-muted">
                        {m.suggestedMonths} · {sessions.length} sessions
                      </span>
                    </span>
                    <span className={cn("grid size-9 shrink-0 place-items-center rounded-full bg-fog text-[20px] transition-transform duration-300", isOpen && "rotate-45")} aria-hidden>
                      +
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }} className="overflow-hidden">
                        <div className="grid grid-cols-1 gap-6 border-t border-line px-5 py-6 sm:px-7 lg:grid-cols-[1fr_1fr]">
                          <div>
                            <p className="text-[16px] leading-relaxed">{m.summary}</p>
                            {excerpt && showcase && (
                              <div className="mt-5 rounded-[16px] bg-void p-5 text-paper">
                                <p className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.14em] text-jade">
                                  <Sparkles className="size-3.5" aria-hidden /> Showcase session
                                </p>
                                <p className="mt-2 font-display text-[24px] leading-tight tracking-[-0.02em]">{showcase.published?.title}</p>
                                <div className="mt-2 line-clamp-4 text-[14.5px] leading-relaxed text-paper/85">
                                  <Paragraphs text={excerpt.text} className="mb-2" />
                                </div>
                              </div>
                            )}
                          </div>
                          <ul className="grid content-start gap-2">
                            {sessions.map((s) => {
                              const K = KIND[s.kind];
                              return (
                                <li key={s.id} className="flex items-start gap-3 rounded-[12px] bg-fog px-4 py-3">
                                  <K.icon className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
                                  <span className="min-w-0">
                                    <span className="block text-[15px]">{s.published?.title}</span>
                                    <span className="text-[13px] text-muted">
                                      {K.label} · {s.published?.durationMin} min
                                    </span>
                                  </span>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section className="bg-paper py-[var(--space-section)]" aria-labelledby="team-h">
        <div className="container-page grid grid-cols-1 gap-10 lg:grid-cols-2">
          <div>
            <p className="eyebrow">Taught by</p>
            <h2 id="team-h" className="display-md mt-4">
              Your {track.shortName.toLowerCase()} instructors
            </h2>
            <ul className="mt-6 space-y-3">
              {instructors.map((u) => (
                <li key={u.id} className="flex items-start gap-4 rounded-[20px] bg-fog p-5">
                  <Avatar name={u.name} hue={u.avatarHue} size={48} />
                  <div>
                    <p className="text-[17px] font-medium">{u.name}</p>
                    <p className="text-[14px] text-muted">{u.title}</p>
                    <p className="mt-2 text-[15px] leading-relaxed">{u.bio}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[13px] text-muted">All people shown are fictional.</p>
          </div>
          <div>
            <p className="eyebrow">Other tracks</p>
            <ul className="mt-6 grid gap-3">
              {others.map((t) => (
                <li key={t.id}>
                  <Link href={`/tracks/${t.slug}`} className="group flex items-center justify-between gap-4 rounded-[20px] border-[1.5px] border-line p-6 transition-colors hover:border-void">
                    <span>
                      <span className="block font-display text-[30px] font-light leading-tight tracking-[-0.03em]">{t.name}</span>
                      <span className="mt-1 block text-[15px] text-muted">{t.tagline}</span>
                    </span>
                    <ArrowUpRight className="size-5 shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
