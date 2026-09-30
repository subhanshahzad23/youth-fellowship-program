"use client";

import { useMemo } from "react";
import { formForCohort, windowState } from "@/lib/domain/selectors";
import { useNow } from "@/lib/hooks";
import { useDb } from "@/lib/store/store";
import { fmtDateShort } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";
import { WorkspaceShowcase } from "./workspace-showcase";

/*
 * Black dotted hero (observed): oversized light serif headline with a muted
 * first statement and a white emphasized line, 18px supporting copy, then a
 * CTA row. The workspace overlaps the black→white boundary.
 * Line reveals are our addition (CSS, so text is visible even without JS).
 */
export function Hero() {
  const db = useDb();
  const now = useNow();
  const open = useMemo(
    () =>
      Object.values(db.forms)
        .filter((f) => windowState(f, now) === "open")
        .map((f) => ({ f, c: db.cohorts[f.cohortId] }))
        .sort((a, b) => (a.f.closesAt < b.f.closesAt ? -1 : 1)),
    [db, now],
  );
  const primary = open[0];
  const winter = formForCohort(db, "c_winter27");

  return (
    <>
      <section data-hero className="dots-dark on-dark relative -mt-[80px] pt-[160px] text-paper sm:-mt-[88px] sm:pt-[190px]" aria-labelledby="hero-h">
        <div className="container-page">
          <h1 id="hero-h" className="display-hero max-w-[15ch] sm:max-w-none">
            <span className="line-mask text-muted-display">
              <span style={{ animationDelay: "120ms" }}>Start with an idea.</span>
            </span>
            <span className="line-mask">
              <span style={{ animationDelay: "260ms" }}>Build what comes next.</span>
            </span>
          </h1>
          <p className="rise-in mt-6 max-w-[720px] text-[17px] leading-[1.55] text-paper/95 sm:text-[18px]" style={{ animationDelay: "520ms" }}>
            Launchpad is an 18-month entrepreneurship fellowship for young people aged 16–24 in Greater Larkhaven. Learn by building a real venture with a cohort, a mentor, and one connected workspace that keeps it all together.
          </p>
          <div className="rise-in mt-8 flex flex-wrap items-center gap-3" style={{ animationDelay: "640ms" }}>
            <ButtonLink href={primary ? `/apply/${primary.c.slug}` : "/#dates"} size="lg" arrow>
              {primary ? `Apply for ${primary.c.name}` : "See upcoming dates"}
            </ButtonLink>
            <ButtonLink href="/demo" size="lg" variant="ghost-dark">
              Explore the demo
            </ButtonLink>
          </div>
          <p className="rise-in mt-3 text-[12.5px] text-[#9a9a9a]" style={{ animationDelay: "720ms" }}>
            {primary
              ? `${primary.c.name} applications close ${fmtDateShort(primary.f.closesAt)}${open[1] ? ` · ${open[1].c.name} early window open until ${fmtDateShort(open[1].f.closesAt)}` : ""}`
              : winter
                ? `Winter 2027 applications ${windowState(winter, now) === "upcoming" ? `open ${fmtDateShort(winter.opensAt)}` : "are closed"}`
                : ""}{" "}
            · No email needed to explore
          </p>
        </div>
        <div className="h-[120px] sm:h-[210px]" aria-hidden />
      </section>
      {/* Workspace overlaps the cut from black to white */}
      <section className="relative bg-paper pb-10" aria-label="A look inside the fellowship workspace">
        <div className="dots-dark absolute inset-x-0 top-0 h-[40%] sm:h-[48%]" aria-hidden />
        <div className="container-page relative -mt-[90px] sm:-mt-[150px]">
          <WorkspaceShowcase />
        </div>
      </section>
    </>
  );
}
