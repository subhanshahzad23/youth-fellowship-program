"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CalendarDays, MapPin, Users } from "lucide-react";
import { cohortBySlugOrId, cohortMonth, fellowsOfCohort, formForCohort, sortedCohorts, staffOfCohort, windowState } from "@/lib/domain/selectors";
import { fellowMembership } from "@/lib/domain/permissions";
import { useNow } from "@/lib/hooks";
import { useDb } from "@/lib/store/store";
import { addMonthsISO, cn, fmtDate, fmtMonthShortYear, fmtMonthYear } from "@/lib/utils";
import { Button, ButtonLink } from "@/components/ui/button";
import { Avatar } from "@/components/ui/display";
import { CohortTimeline } from "@/components/portal/cohort-timeline";
import { PublicHero } from "@/components/site/public-shell";
import { Reveal } from "@/components/site/reveal";
import { InterestDialog } from "@/components/site/interest-dialog";

export function CohortView({ cohortKey }: { cohortKey: string }) {
  const db = useDb();
  const now = useNow();
  const cohort = cohortBySlugOrId(db, cohortKey);
  const [interestOpen, setInterestOpen] = useState(false);
  const data = useMemo(() => {
    if (!cohort) return null;
    const form = formForCohort(db, cohort.id);
    const ws = windowState(form, now);
    const fellows = fellowsOfCohort(db, cohort.id);
    const staff = staffOfCohort(db, cohort.id).filter((s) => s.membership.role === "program_admin" || s.membership.role === "instructor");
    const uniqueStaff = [...new Map(staff.map((s) => [s.user.id, s])).values()];
    return { form, ws, fellows, staff: uniqueStaff };
  }, [db, cohort, now]);

  if (!cohort || !data)
    return (
      <PublicHero eyebrow="Cohorts" title="Cohort not found" muted="Here are the cohorts we know about.">
        <div className="mt-8 flex flex-wrap gap-3">
          {sortedCohorts(db).map((c) => (
            <ButtonLink key={c.id} href={`/cohorts/${c.slug}`} variant="ghost-dark" size="lg">
              {c.name}
            </ButtonLink>
          ))}
        </div>
      </PublicHero>
    );

  const running = now >= cohort.startDate;
  const month = cohortMonth(cohort, now);
  const { form, ws, fellows, staff } = data;
  const milestones = [
    { at: addMonthsISO(cohort.startDate, 0), title: "Kickoff weekend", body: "Meet your cohort, your track instructor and your program manager." },
    { at: addMonthsISO(cohort.startDate, 1), title: "Mentor pairing", body: "Each fellow is introduced to a volunteer mentor." },
    { at: addMonthsISO(cohort.startDate, 4), title: "First showcase", body: "Two-minute updates on what you've learned so far." },
    { at: addMonthsISO(cohort.startDate, 9), title: "Launch planning", body: "Turn experiments into a plan you can actually run." },
    { at: addMonthsISO(cohort.startDate, 17), title: "Final showcase", body: "Share your venture with the community." },
  ];

  return (
    <>
      <PublicHero eyebrow={running ? `In progress · ${month ? `month ${month} of 18` : "completed"}` : ws === "open" ? "Applications open" : ws === "upcoming" ? "Announced" : "Cohort"} title={cohort.name} muted={`${fmtMonthShortYear(cohort.startDate)} – ${fmtMonthShortYear(cohort.endDate)}`}>
        <p className="mt-6 max-w-[640px] text-[17px] leading-[1.6] text-paper/90">{cohort.description}</p>
        <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[15px] text-paper/80">
          <li className="flex items-center gap-2">
            <MapPin className="size-4" aria-hidden /> {cohort.location}
          </li>
          <li className="flex items-center gap-2">
            <Users className="size-4" aria-hidden /> {running ? `${fellows.length} fellows` : `${cohort.capacity} places`}
          </li>
          {form && (
            <li className="flex items-center gap-2">
              <CalendarDays className="size-4" aria-hidden /> Applications {fmtDate(form.opensAt)} – {fmtDate(form.closesAt)}
            </li>
          )}
        </ul>
        <div className="mt-8 flex flex-wrap gap-3">
          {!running && ws === "open" && (
            <ButtonLink href={`/apply/${cohort.slug}`} size="lg" arrow>
              Apply for {cohort.name}
            </ButtonLink>
          )}
          {!running && ws !== "open" && (
            <Button size="lg" onClick={() => setInterestOpen(true)} icon={<CalendarDays className="size-4" />}>
              {ws === "upcoming" ? "Register interest" : "Hear about the next intake"}
            </Button>
          )}
          <ButtonLink href="/#dates" size="lg" variant="ghost-dark">
            All dates
          </ButtonLink>
        </div>
      </PublicHero>

      <section className="bg-paper py-[var(--space-section)]" aria-labelledby="timeline-h">
        <div className="container-page">
          <Reveal>
            <p className="eyebrow">18-month timeline</p>
            <h2 id="timeline-h" className="display-lg mt-4">
              From kickoff to <span className="text-muted-display">final showcase</span>
            </h2>
          </Reveal>
          <div className="mt-10 rounded-[24px] bg-fog p-6 sm:p-8">
            <CohortTimeline cohort={cohort} now={now} />
          </div>
          <ol className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-5">
            {milestones.map((m, i) => (
              <Reveal as="li" key={m.title} delay={i * 0.05} className={cn("rounded-[20px] p-5", now >= m.at ? "bg-void text-paper" : "bg-fog")}>
                <p className={cn("text-[13px]", now >= m.at ? "text-muted-display" : "text-muted")}>{fmtMonthYear(m.at)}</p>
                <p className="mt-2 text-[17px] font-medium">{m.title}</p>
                <p className={cn("mt-1 text-[14px] leading-relaxed", now >= m.at ? "text-paper/80" : "text-muted")}>{m.body}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="dots-light bg-paper py-[var(--space-section)]" aria-labelledby="tracks-h2">
        <div className="container-page grid grid-cols-1 gap-10 lg:grid-cols-2">
          <div>
            <p className="eyebrow">Tracks in this cohort</p>
            <h2 id="tracks-h2" className="display-md mt-4">
              Three tracks, one cohort
            </h2>
            <ul className="mt-6 grid gap-3">
              {cohort.trackIds.map((tid) => {
                const t = db.tracks[tid];
                const n = fellows.filter((f) => fellowMembership(db, f.id)?.trackId === tid).length;
                return (
                  <li key={tid}>
                    <Link href={`/tracks/${t.slug}`} className="group flex items-center justify-between gap-4 rounded-[20px] bg-paper p-5 ring-1 ring-line transition-colors hover:ring-void">
                      <span>
                        <span className="block font-display text-[26px] font-light tracking-[-0.03em]">{t.name}</span>
                        <span className="text-[14px] text-muted">{running ? `${n} fellows` : t.tagline}</span>
                      </span>
                      <ArrowUpRight className="size-5 shrink-0" aria-hidden />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
          <div>
            <p className="eyebrow">Program team</p>
            <h2 className="display-md mt-4">Who you&apos;ll work with</h2>
            {staff.length ? (
              <ul className="mt-6 grid gap-3">
                {staff.map(({ user }) => (
                  <li key={user.id} className="flex items-center gap-4 rounded-[20px] bg-paper p-5 ring-1 ring-line">
                    <Avatar name={user.name} hue={user.avatarHue} size={44} />
                    <span>
                      <span className="block text-[16px] font-medium">{user.name}</span>
                      <span className="text-[14px] text-muted">{user.title}</span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-6 text-[16px] text-muted">The program team for {cohort.name} will be announced before applications open.</p>
            )}
            <p className="mt-3 text-[13px] text-muted">All people shown are fictional.</p>
          </div>
        </div>
      </section>

      {running && fellows.length > 0 && (
        <section className="bg-paper py-[var(--space-section)]" aria-labelledby="ventures-h">
          <div className="container-page">
            <p className="eyebrow">Ventures in progress</p>
            <h2 id="ventures-h" className="display-md mt-4">
              What {cohort.name} is building
            </h2>
            <p className="mt-2 text-[15px] text-muted">Fictional ventures. Fellows&apos; names and personal details stay inside the fellowship workspace.</p>
            <ul className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {fellows.map((f) => (
                <li key={f.id} className="rounded-[20px] bg-fog p-5">
                  <p className="text-[17px] font-medium">{f.ventureName}</p>
                  <p className="mt-1 line-clamp-3 text-[14.5px] leading-relaxed text-muted">{f.ventureSummary}</p>
                  <p className="mt-3 text-[12.5px] text-muted">
                    {db.tracks[fellowMembership(db, f.id)?.trackId ?? ""]?.name} · {f.ventureStage}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <InterestDialog cohort={cohort} open={interestOpen} onOpenChange={setInterestOpen} opensLabel={form && ws === "upcoming" ? `Applications open ${fmtDate(form.opensAt)}.` : undefined} />
    </>
  );
}
