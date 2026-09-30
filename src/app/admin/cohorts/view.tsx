"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowUpRight, CalendarDays, Lock, MapPin, Plus, UsersRound } from "lucide-react";
import { canCreateCohort } from "@/lib/domain/permissions";
import { cohortLearningProgress, cohortPhaseLabel, formForCohort, staffOfCohort } from "@/lib/domain/selectors";
import { useNow } from "@/lib/hooks";
import { useDb, useMe } from "@/lib/store/store";
import { fmtDate, plural } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader, Panel } from "@/components/ui/display";
import { Meter } from "@/components/admin/charts";
import { CohortStatusBadge, WindowBadge, windowSummary } from "@/components/admin/cohort-badges";
import { NewCohortDialog } from "@/components/admin/cohort-forms";
import { CohortContextInline, ScopeNote } from "@/components/admin/cohort-context";
import { useAdminScope } from "@/components/admin/scope";

export function CohortsView() {
  const db = useDb();
  const me = useMe()!;
  const now = useNow();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { cohortIds } = useAdminScope();
  const create = canCreateCohort(db, me.id);
  const dialogOpen = params.get("new") === "1" && create.ok;

  const rows = useMemo(
    () =>
      cohortIds
        .map((id) => db.cohorts[id])
        .filter(Boolean)
        .map((c) => {
          const staff = staffOfCohort(db, c.id);
          const count = (role: string) => new Set(staff.filter((s) => s.membership.role === role).map((s) => s.user.id)).size;
          const form = formForCohort(db, c.id);
          return {
            c,
            form,
            fellows: Object.values(db.memberships).filter((m) => m.cohortId === c.id && m.role === "fellow" && m.status === "active").length,
            admins: count("program_admin"),
            instructors: count("instructor"),
            mentors: count("mentor"),
            progress: cohortLearningProgress(db, c.id),
            applications: Object.values(db.applications).filter((a) => a.cohortId === c.id && a.status !== "draft").length,
          };
        }),
    [db, cohortIds],
  );

  const setDialog = (open: boolean) => router.replace(open ? `${pathname}?new=1` : pathname, { scroll: false });

  return (
    <>
      <PageHeader
        eyebrow="Program admin"
        title="Cohorts"
        description="Each cohort runs for 18 months with its own application window, staff and mentors."
        actions={
          <>
            <CohortContextInline />
            {create.ok ? (
              <Button icon={<Plus className="size-4" />} onClick={() => setDialog(true)}>
                New cohort
              </Button>
            ) : (
              <div className="flex flex-col items-start gap-1 sm:items-end">
                <Button icon={<Lock className="size-4" />} disabled aria-describedby="new-cohort-reason">
                  New cohort
                </Button>
                <p id="new-cohort-reason" className="max-w-[260px] text-[12.5px] text-muted sm:text-right">
                  {create.reason}
                </p>
              </div>
            )}
          </>
        }
      />
      <ScopeNote className="-mt-3 mb-4 sm:-mt-5" />

      {rows.length === 0 ? (
        <EmptyState icon={<UsersRound className="size-5" />} title="No cohorts in your scope" description="Ask an executive admin to assign you to a cohort." />
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {rows.map(({ c, form, fellows, admins, instructors, mentors, progress, applications }) => {
            const w = windowSummary(form, now);
            return (
              <li key={c.id}>
                <Link href={`/admin/cohorts/${c.id}`} className="group flex h-full flex-col rounded-[20px] bg-paper p-5 transition-colors hover:bg-[#fcfcfc] sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="eyebrow text-muted">{cohortPhaseLabel(c, now)}</p>
                      <h2 className="mt-1 font-display text-[30px] leading-tight tracking-[-0.03em] group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4">{c.name}</h2>
                    </div>
                    <CohortStatusBadge status={c.status} />
                  </div>
                  <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13.5px] text-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="size-3.5" aria-hidden />
                      {fmtDate(c.startDate)} – {fmtDate(c.endDate)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="size-3.5" aria-hidden />
                      {c.location}
                    </span>
                  </p>

                  <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <div className="flex items-baseline justify-between text-[13.5px]">
                        <span className="text-muted">Enrollment</span>
                        <span className="tabular">
                          <span className="font-semibold">{fellows}</span> / {c.capacity}
                        </span>
                      </div>
                      <Meter value={fellows} max={c.capacity} className="mt-1.5" label={`${c.name} enrollment`} />
                    </div>
                    <div>
                      <div className="flex items-baseline justify-between text-[13.5px]">
                        <span className="text-muted">Learning progress</span>
                        <span className="font-semibold tabular">{progress.fellows ? `${progress.avgPct}%` : "—"}</span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ash">
                        <div className="h-full rounded-full bg-jade" style={{ width: `${progress.avgPct}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4">
                    <WindowBadge form={form} now={now} />
                    <span className="text-[13px] text-muted">
                      {w.detail}
                      {applications > 0 && ` · ${plural(applications, "application")}`}
                    </span>
                  </div>
                  <dl className="mt-3 grid grid-cols-3 gap-2 text-[13px]">
                    {[
                      ["Program admins", admins],
                      ["Instructors", instructors],
                      ["Mentors", mentors],
                    ].map(([label, n]) => (
                      <div key={label as string} className="rounded-[10px] bg-fog px-3 py-2">
                        <dt className="truncate text-muted">{label}</dt>
                        <dd className="font-semibold tabular">{n}</dd>
                      </div>
                    ))}
                  </dl>
                  <span className="mt-4 inline-flex items-center gap-1 text-[13.5px] font-medium">
                    Manage cohort <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {!create.ok && (
        <Panel className="mt-4 bg-transparent p-0 sm:p-0">
          <p className="text-[13px] text-muted">You can edit details, staff and mentors for the cohorts above. New cohorts are created by the executive team.</p>
        </Panel>
      )}

      <NewCohortDialog open={dialogOpen} onOpenChange={setDialog} onCreated={(id) => router.push(`/admin/cohorts/${id}`)} />
    </>
  );
}
