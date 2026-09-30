"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import type { Application, ApplicationStatus } from "@/lib/domain/types";
import { applicationsOf, openForms } from "@/lib/domain/selectors";
import { useNow } from "@/lib/hooks";
import { useDb, useMe } from "@/lib/store/store";
import { fmtDate, fmtRelative } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui/display";
import { Segmented } from "@/components/ui/overlay";
import { Table, TD, TH, THead, TR } from "@/components/ui/table";
import { applicationAction, SectionTicks } from "@/components/apply/application-card";

type Filter = "all" | "progress" | "review" | "decided";
const GROUPS: Record<Exclude<Filter, "all">, ApplicationStatus[]> = {
  progress: ["draft", "changes_requested"],
  review: ["submitted", "in_review"],
  decided: ["approved", "waitlisted", "rejected"],
};
const FILTER_LABEL: Record<Filter, string> = { all: "All", progress: "In progress", review: "With reviewers", decided: "Decided" };

export default function ApplicantApplications() {
  const db = useDb();
  const me = useMe()!;
  const now = useNow();
  const [filter, setFilter] = useState<Filter>("all");

  const apps = useMemo(() => applicationsOf(db, me.id), [db, me.id]);
  const canStart = useMemo(() => {
    const mine = new Set(apps.map((a) => a.cohortId));
    return openForms(db, now).some((f) => !mine.has(f.cohortId));
  }, [db, apps, now]);
  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: apps.length, progress: 0, review: 0, decided: 0 };
    for (const a of apps) for (const g of ["progress", "review", "decided"] as const) if (GROUPS[g].includes(a.status)) c[g]++;
    return c;
  }, [apps]);
  const shown = filter === "all" ? apps : apps.filter((a) => GROUPS[filter].includes(a.status));

  const detail = (a: Application) => {
    if (a.status === "draft") return a.lastSavedAt ? `Saved ${fmtRelative(a.lastSavedAt, now)}` : "Not saved yet";
    if (a.decision) return `Decided ${fmtDate(a.decision.decidedAt)}`;
    return a.submittedAt ? `Submitted ${fmtDate(a.submittedAt)}` : "—";
  };

  return (
    <>
      <PageHeader
        title="Applications"
        description="Every application you've started, with its status. Drafts are private to you until you submit."
        actions={
          canStart ? (
            <ButtonLink href="/apply" icon={<Plus className="size-4" />}>
              Start a new application
            </ButtonLink>
          ) : undefined
        }
      />

      {apps.length > 0 && (
        <div className="no-scrollbar -mx-4 mb-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <Segmented
            label="Filter by status"
            value={filter}
            onChange={setFilter}
            options={(Object.keys(FILTER_LABEL) as Filter[]).map((f) => ({ value: f, label: `${FILTER_LABEL[f]} (${counts[f]})` }))}
          />
        </div>
      )}

      {apps.length === 0 ? (
        <EmptyState
          className="bg-paper"
          icon={<FileText className="size-5" />}
          title="You haven't started an application"
          description="Applications for open intakes take about 25 minutes and save as you go."
          action={
            <ButtonLink href="/apply" arrow>
              See open intakes
            </ButtonLink>
          }
        />
      ) : shown.length === 0 ? (
        <EmptyState
          className="bg-paper"
          icon={<FileText className="size-5" />}
          title={`No applications ${FILTER_LABEL[filter].toLowerCase()}`}
          description="Try another filter."
          action={
            <button type="button" onClick={() => setFilter("all")} className="h-10 rounded-[8px] px-4 text-[14.5px] font-medium underline-offset-2 hover:underline">
              Show all applications
            </button>
          }
        />
      ) : (
        <>
          <div className="hidden md:block">
            <Table caption="Your applications">
              <THead>
                <tr>
                  <TH>Intake</TH>
                  <TH>Reference</TH>
                  <TH>Status</TH>
                  <TH>Progress</TH>
                  <TH align="right">
                    <span className="sr-only">Action</span>
                  </TH>
                </tr>
              </THead>
              <tbody>
                {shown.map((a) => {
                  const c = db.cohorts[a.cohortId];
                  const act = applicationAction(a, c?.slug ?? a.cohortId);
                  return (
                    <TR key={a.id}>
                      <TD>
                        <Link href={`/applicant/applications/${a.id}`} className="text-[15px] font-medium hover:underline">
                          {c?.name}
                        </Link>
                        <p className="text-[13px] text-muted">Starts {fmtDate(c?.startDate)}</p>
                      </TD>
                      <TD className="font-mono text-[13.5px]">{a.reference ?? <span className="font-sans text-muted">Not submitted</span>}</TD>
                      <TD>
                        <StatusBadge status={a.status} />
                      </TD>
                      <TD className="min-w-[200px]">
                        {a.status === "draft" ? <SectionTicks app={a} /> : <span className="text-[13.5px] text-muted">{detail(a)}</span>}
                      </TD>
                      <TD align="right">
                        <ButtonLink href={act.href} size="sm" variant={a.status === "draft" || a.status === "changes_requested" ? "primary" : "outline"}>
                          {act.label}
                        </ButtonLink>
                      </TD>
                    </TR>
                  );
                })}
              </tbody>
            </Table>
          </div>
          <ul className="flex flex-col gap-3 md:hidden">
            {shown.map((a) => {
              const c = db.cohorts[a.cohortId];
              const act = applicationAction(a, c?.slug ?? a.cohortId);
              return (
                <li key={a.id} className="rounded-[16px] bg-paper p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link href={`/applicant/applications/${a.id}`} className="text-[16px] font-semibold hover:underline">
                        {c?.name}
                      </Link>
                      <p className="font-mono text-[13px] text-muted">{a.reference ?? "Not submitted"}</p>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                  <div className="mt-3">{a.status === "draft" ? <SectionTicks app={a} /> : <p className="text-[13.5px] text-muted">{detail(a)}</p>}</div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <ButtonLink href={act.href} size="sm" variant={a.status === "draft" || a.status === "changes_requested" ? "primary" : "outline"}>
                      {act.label}
                    </ButtonLink>
                    {act.href !== `/applicant/applications/${a.id}` && (
                      <ButtonLink href={`/applicant/applications/${a.id}`} size="sm" variant="ghost">
                        Details
                      </ButtonLink>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </>
  );
}
