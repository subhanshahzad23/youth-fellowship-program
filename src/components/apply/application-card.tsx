"use client";

import Link from "next/link";
import { Check, Clock, RotateCcw } from "lucide-react";
import type { Application, ApplicationSection, Database } from "@/lib/domain/types";
import { formForCohort, windowState } from "@/lib/domain/selectors";
import { SECTION_LABEL, sectionComplete } from "@/lib/domain/validation";
import { useNow } from "@/lib/hooks";
import { useDb } from "@/lib/store/store";
import { cn, fmtDate, fmtRelative } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/display";
import { daysLeftLabel } from "./window-states";

const FORM_SECTIONS: ApplicationSection[] = ["about", "idea", "residence", "questions"];

export function sectionProgress(db: Database, app: Application) {
  const done = FORM_SECTIONS.map((s) => ({ s, ok: sectionComplete(db, app, s) }));
  return { done, count: done.filter((d) => d.ok).length, total: FORM_SECTIONS.length };
}

/** Four small ticks, one per form section. */
export function SectionTicks({ app, className }: { app: Application; className?: string }) {
  const db = useDb();
  const p = sectionProgress(db, app);
  return (
    <div className={className}>
      <div className="flex items-center justify-between text-[12.5px] text-muted">
        <span>
          {p.count} of {p.total} sections complete
        </span>
      </div>
      <ol className="mt-1.5 grid grid-cols-4 gap-1" aria-label="Section progress">
        {p.done.map(({ s, ok }) => (
          <li key={s} title={`${SECTION_LABEL[s]}${ok ? " — complete" : ""}`}>
            <span className={cn("block h-1.5 rounded-full", ok ? "bg-jade" : "bg-ash")} />
            <span className="sr-only">
              {SECTION_LABEL[s]}: {ok ? "complete" : "not complete"}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function applicationAction(app: Application, slug: string) {
  if (app.status === "draft") return { href: `/apply/${slug}`, label: "Continue application" };
  if (app.status === "changes_requested") return { href: `/apply/${slug}`, label: "Update requested items" };
  return { href: `/applicant/applications/${app.id}`, label: "View application" };
}

export function ApplicationCard({ app }: { app: Application }) {
  const db = useDb();
  const now = useNow();
  const cohort = db.cohorts[app.cohortId];
  const form = formForCohort(db, app.cohortId);
  const ws = windowState(form, now);
  const action = applicationAction(app, cohort?.slug ?? app.cohortId);
  const cr = app.changeRequests.find((c) => !c.resolvedAt);
  const draftClosed = app.status === "draft" && ws !== "open";

  return (
    <article className="rounded-[20px] bg-paper p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow text-muted">{app.reference ?? "Not submitted yet"}</p>
          <h3 className="mt-1 text-[19px] font-semibold tracking-[-0.015em]">
            <Link href={`/applicant/applications/${app.id}`} className="hover:underline">
              {cohort?.name} application
            </Link>
          </h3>
        </div>
        <StatusBadge status={app.status} />
      </div>

      {app.status === "draft" && (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <SectionTicks app={app} />
          <p className={cn("flex items-center gap-1.5 text-[13px]", draftClosed ? "text-[#9f1239]" : "text-muted")}>
            <Clock className="size-3.5" aria-hidden />
            {form ? (draftClosed ? `Window closed ${fmtDate(form.closesAt)}` : `Closes ${fmtDate(form.closesAt)} · ${daysLeftLabel(form.closesAt, now)}`) : "No deadline set"}
          </p>
        </div>
      )}

      {cr && (
        <div className="mt-4 flex items-start gap-3 rounded-[12px] bg-[#fff6dd] p-3 text-[14px]">
          <RotateCcw className="mt-0.5 size-4 shrink-0 text-[#7a4b00]" aria-hidden />
          <p className="min-w-0 leading-relaxed">
            <span className="font-medium">{db.users[cr.requestedById]?.name ?? "Your reviewer"} asked for {cr.fields.length} {cr.fields.length === 1 ? "change" : "changes"}.</span> Only those items reopen — the rest stays as you submitted it.
          </p>
        </div>
      )}

      {app.status !== "draft" && !cr && (
        <p className="mt-3 flex items-center gap-1.5 text-[13.5px] text-muted">
          <Check className="size-3.5" aria-hidden />
          {app.submittedAt ? `Submitted ${fmtDate(app.submittedAt)}` : "Submitted"}
          {app.decision ? ` · decided ${fmtDate(app.decision.decidedAt)}` : app.updatedAt !== app.submittedAt ? ` · updated ${fmtRelative(app.updatedAt, now)}` : ""}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {draftClosed ? (
          <ButtonLink href={`/applicant/applications/${app.id}`} variant="outline" size="sm">
            View draft
          </ButtonLink>
        ) : (
          <ButtonLink href={action.href} size="sm" arrow variant={app.status === "draft" || cr ? "primary" : "outline"}>
            {action.label}
          </ButtonLink>
        )}
        {(app.status === "draft" || cr) && !draftClosed && (
          <ButtonLink href={`/applicant/applications/${app.id}`} size="sm" variant="ghost">
            Details
          </ButtonLink>
        )}
        {app.status === "draft" && !draftClosed && (
          <span className="text-[12.5px] text-muted">
            Resumes at {SECTION_LABEL[app.currentSection]}
            {app.lastSavedAt ? ` · saved ${fmtRelative(app.lastSavedAt, now)}` : ""}
          </span>
        )}
      </div>
    </article>
  );
}
