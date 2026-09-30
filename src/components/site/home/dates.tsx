"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CalendarDays } from "lucide-react";
import type { Cohort } from "@/lib/domain/types";
import { cohortMonth, fellowsOfCohort, formForCohort, sortedCohorts, windowState } from "@/lib/domain/selectors";
import { useNow } from "@/lib/hooks";
import { useDb } from "@/lib/store/store";
import { cn, fmtDate, fmtDateShort, fmtMonthYear } from "@/lib/utils";
import { Button, ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/site/reveal";
import { InterestDialog } from "@/components/site/interest-dialog";

/** Application dates and cohort cards — every state is derived from the demo clock and form windows. */
export function Dates() {
  const db = useDb();
  const now = useNow();
  const cohorts = useMemo(() => sortedCohorts(db), [db]);
  const [interest, setInterest] = useState<Cohort | null>(null);
  const openCount = useMemo(() => Object.values(db.forms).filter((f) => windowState(f, now) === "open").length, [db.forms, now]);
  const headline = openCount >= 2 ? `${openCount === 2 ? "Two" : openCount} intakes are open.` : openCount === 1 ? "One intake is open." : "Applications open soon.";

  return (
    <section id="dates" className="scroll-mt-24 bg-paper py-[var(--space-section)]" aria-labelledby="dates-h">
      <div className="container-page">
        <Reveal className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-end">
          <div>
            <p className="eyebrow text-void">Dates & cohorts</p>
            <h2 id="dates-h" className="display-xl mt-4">
              <span>{headline}</span> <span className="text-muted-display">Pick the start that suits you.</span>
            </h2>
          </div>
          <p className="max-w-[460px] text-[16.5px] leading-[1.6] text-ink lg:pb-2">
            Each cohort runs for 18 months and starts together. You can apply to more than one open intake — each application is reviewed on its own.
          </p>
        </Reveal>

        <ul className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cohorts.map((c, i) => {
            const form = formForCohort(db, c.id);
            const ws = windowState(form, now);
            const month = cohortMonth(c, now);
            const enrolled = fellowsOfCohort(db, c.id).length;
            const running = now >= c.startDate;
            const badge = running
              ? { text: month ? `In progress · month ${month} of 18` : "Completed", cls: "bg-fog text-ink" }
              : ws === "open"
                ? { text: "Applications open", cls: "bg-leaf text-leaf-ink" }
                : ws === "upcoming"
                  ? { text: `Opens ${fmtDateShort(form!.opensAt)}`, cls: "bg-[#fff1cc] text-[#7a4b00]" }
                  : { text: "Applications closed", cls: "bg-fog text-ink" };
            return (
              <Reveal as="li" key={c.id} delay={(i % 3) * 0.06} className="h-full">
                <article className={cn("flex h-full flex-col rounded-[24px] p-6 sm:p-7", ws === "open" && !running ? "bg-void text-paper" : "bg-fog")}>
                  <span className={cn("w-fit rounded-[26px] px-3 py-1 text-[12.5px] font-medium", ws === "open" && !running ? "bg-jade text-void" : badge.cls)}>{badge.text}</span>
                  <h3 className="mt-5 font-display text-[40px] font-light leading-none tracking-[-0.04em]">{c.name}</h3>
                  <dl className={cn("mt-5 grid grid-cols-2 gap-4 text-[14px]", ws === "open" && !running ? "text-paper/80" : "text-muted")}>
                    <div>
                      <dt>Program</dt>
                      <dd className={cn("mt-0.5 font-medium", ws === "open" && !running ? "text-paper" : "text-void")}>
                        {fmtMonthYear(c.startDate)} – {fmtMonthYear(c.endDate)}
                      </dd>
                    </div>
                    <div>
                      <dt>{running ? "Fellows" : "Places"}</dt>
                      <dd className={cn("mt-0.5 font-medium", ws === "open" && !running ? "text-paper" : "text-void")}>{running ? enrolled : c.capacity}</dd>
                    </div>
                    {form && !running && (
                      <div className="col-span-2">
                        <dt>Application window</dt>
                        <dd className={cn("mt-0.5 font-medium", ws === "open" ? "text-paper" : "text-void")}>
                          {fmtDate(form.opensAt)} – {fmtDate(form.closesAt)}
                        </dd>
                      </div>
                    )}
                  </dl>
                  <p className={cn("mt-4 flex-1 text-[14.5px] leading-relaxed", ws === "open" && !running ? "text-paper/80" : "text-muted")}>{c.description}</p>
                  <div className="mt-6 flex flex-wrap items-center gap-2">
                    {!running && ws === "open" && (
                      <ButtonLink href={`/apply/${c.slug}`} arrow>
                        Apply for {c.name}
                      </ButtonLink>
                    )}
                    {!running && ws === "upcoming" && (
                      <Button variant="dark" icon={<CalendarDays className="size-4" />} onClick={() => setInterest(c)}>
                        Register interest
                      </Button>
                    )}
                    {!running && (ws === "closed" || ws === "unpublished") && (
                      <Button variant="outline" onClick={() => setInterest(c)}>
                        Hear about the next intake
                      </Button>
                    )}
                    <Link
                      href={`/cohorts/${c.slug}`}
                      className={cn("inline-flex h-10 items-center gap-1 rounded-[8px] px-3 text-[15px] font-medium hover:underline", ws === "open" && !running ? "text-paper" : "text-void")}
                    >
                      Cohort details <ArrowUpRight className="size-4" aria-hidden />
                    </Link>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </ul>
      </div>
      {interest && (
        <InterestDialog
          cohort={interest}
          open={!!interest}
          onOpenChange={(v) => !v && setInterest(null)}
          opensLabel={(() => {
            const f = formForCohort(db, interest.id);
            return f && windowState(f, now) === "upcoming" ? `Applications open ${fmtDate(f.opensAt)}.` : undefined;
          })()}
        />
      )}
    </section>
  );
}
