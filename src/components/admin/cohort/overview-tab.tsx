"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowUpRight, FileStack, Pencil, ShieldAlert } from "lucide-react";
import type { ApplicationStatus, Cohort } from "@/lib/domain/types";
import { cohortLearningProgress, cohortPhaseLabel, formForCohort, trackProgress } from "@/lib/domain/selectors";
import { useNow } from "@/lib/hooks";
import { useDb, useMe } from "@/lib/store/store";
import { fmtDate, fmtDateLong, fmtRelative, plural } from "@/lib/utils";
import { Button, ButtonLink } from "@/components/ui/button";
import { Badge, EmptyState, Panel, PanelHeader, ProgressBar, ProgressRing, StatusBadge } from "@/components/ui/display";
import { CohortTimeline } from "@/components/portal/cohort-timeline";
import { COHORT_STATUS_LABEL, WindowBadge, windowSummary } from "../cohort-badges";
import { ActorAvatar } from "../actor-avatar";
import { actionLabel, actorName, auditEntityHref, visibleAuditEvents } from "../audit-format";

export function OverviewTab({ cohort, onEdit }: { cohort: Cohort; onEdit: () => void }) {
  const db = useDb();
  const me = useMe()!;
  const meId = me.id;
  const now = useNow();

  const data = useMemo(() => {
    const form = formForCohort(db, cohort.id);
    const apps = Object.values(db.applications).filter((a) => a.cohortId === cohort.id && a.status !== "draft");
    const counts = {} as Record<ApplicationStatus, number>;
    for (const a of apps) counts[a.status] = (counts[a.status] ?? 0) + 1;
    const version = form?.publishedVersionId ? db.formVersions[form.publishedVersionId] : undefined;
    const progress = cohortLearningProgress(db, cohort.id);
    const fellowMs = Object.values(db.memberships).filter((m) => m.cohortId === cohort.id && m.role === "fellow" && m.status === "active");
    const tracks = cohort.trackIds
      .map((tid) => {
        const ms = fellowMs.filter((m) => m.trackId === tid);
        const pcts = ms.map((m) => trackProgress(db, m.userId, tid).pct);
        return { track: db.tracks[tid], fellows: ms.length, pct: pcts.length ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : 0 };
      })
      .filter((t) => t.track);
    const activity = visibleAuditEvents(db, meId)
      .filter((e) => e.cohortId === cohort.id)
      .slice(0, 6);
    return { form, apps, counts, version, progress, tracks, activity };
  }, [db, cohort, meId]);

  const w = windowSummary(data.form, now);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <div className="flex min-w-0 flex-col gap-4">
        <Panel>
          <PanelHeader title="18-month timeline" description={`${fmtDateLong(cohort.startDate)} – ${fmtDateLong(cohort.endDate)}`} />
          <CohortTimeline cohort={cohort} now={now} />
          <p className="mt-5 text-[15px] leading-relaxed text-ink">{cohort.description}</p>
        </Panel>

        <Panel>
          <PanelHeader
            title="Learning progress"
            description="Average share of published track sessions completed"
            actions={
              <ButtonLink href="/admin/curriculum" size="sm" variant="soft">
                Curriculum
              </ButtonLink>
            }
          />
          {data.progress.fellows === 0 ? (
            <EmptyState title="No fellows enrolled yet" description="Progress appears once approved applicants join this cohort." />
          ) : (
            <div className="grid grid-cols-1 items-center gap-6 sm:grid-cols-[auto_minmax(0,1fr)]">
              <div className="flex items-center gap-4">
                <ProgressRing value={data.progress.avgPct} size={96} stroke={8} label={`${data.progress.avgPct}% average progress`} />
                <div className="text-[13.5px] text-muted sm:hidden">
                  <p>{plural(data.progress.fellows, "fellow")}</p>
                  <p>{plural(data.progress.completedSessions, "session")} completed</p>
                </div>
              </div>
              <div className="min-w-0">
                <p className="hidden text-[13.5px] text-muted sm:block">
                  {plural(data.progress.fellows, "fellow")} · {plural(data.progress.completedSessions, "session")} completed in total
                </p>
                <ul className="mt-3 space-y-3">
                  {data.tracks.map((t) => (
                    <li key={t.track.id}>
                      <div className="flex items-baseline justify-between gap-3 text-[13.5px]">
                        <span className="truncate">
                          {t.track.name} <span className="text-muted">· {plural(t.fellows, "fellow")}</span>
                        </span>
                        <span className="font-semibold tabular">{t.fellows ? `${t.pct}%` : "—"}</span>
                      </div>
                      <ProgressBar value={t.pct} className="mt-1 h-1.5" label={`${t.track.name} average progress`} />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </Panel>

        <Panel>
          <PanelHeader
            title="Recent activity"
            description={`Audit events for ${cohort.name}`}
            actions={
              <ButtonLink href="/admin/audit" size="sm" variant="soft">
                Audit log
              </ButtonLink>
            }
          />
          {data.activity.length === 0 ? (
            <p className="text-[14px] text-muted">Nothing recorded for this cohort yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {data.activity.map((e) => {
                const href = auditEntityHref(db, meId, e);
                const inner = (
                  <>
                    <ActorAvatar db={db} actorId={e.actorId} size={30} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13.5px]">
                        <span className="font-medium">{actorName(db, e.actorId)}</span> <span className="text-muted">· {actionLabel(e.action)} · {fmtRelative(e.at, now)}</span>
                      </span>
                      <span className="block text-[13.5px] text-ink group-hover:underline">{e.summary}</span>
                    </span>
                    {e.outcome === "denied" && (
                      <Badge tone="red" icon={<ShieldAlert className="size-3.5" aria-hidden />}>
                        Denied
                      </Badge>
                    )}
                  </>
                );
                return (
                  <li key={e.id}>
                    {href ? (
                      <Link href={href} className="group -mx-2 flex items-start gap-3 rounded-[10px] px-2 py-2.5 hover:bg-fog">
                        {inner}
                      </Link>
                    ) : (
                      <div className="flex items-start gap-3 py-2.5">{inner}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      <div className="flex min-w-0 flex-col gap-4">
        <Panel>
          <PanelHeader
            title="Details"
            actions={
              <Button size="sm" variant="outline" icon={<Pencil className="size-3.5" />} onClick={onEdit}>
                Edit details
              </Button>
            }
          />
          <dl className="grid grid-cols-1 gap-3 text-[14px]">
            {[
              ["Status", COHORT_STATUS_LABEL[cohort.status]],
              ["Program month", cohortPhaseLabel(cohort, now)],
              ["Starts", fmtDate(cohort.startDate)],
              ["Ends", `${fmtDate(cohort.endDate)} (18 months)`],
              ["Capacity", `${cohort.capacity} fellows`],
              ["Location", cohort.location],
              ["Tracks", cohort.trackIds.map((t) => db.tracks[t]?.shortName).filter(Boolean).join(", ")],
            ].map(([k, v]) => (
              <div key={k} className="grid grid-cols-[120px_1fr] gap-3">
                <dt className="text-muted">{k}</dt>
                <dd className="min-w-0">{v}</dd>
              </div>
            ))}
          </dl>
        </Panel>

        <Panel>
          <PanelHeader title="Application window" description={data.form ? data.form.title : undefined} />
          {data.form ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <WindowBadge form={data.form} now={now} />
                <span className="text-[13.5px] text-muted">{w.detail}</span>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-2 text-[13.5px]">
                <div className="rounded-[10px] bg-fog px-3 py-2">
                  <dt className="text-muted">Opens</dt>
                  <dd className="font-medium">{fmtDate(data.form.opensAt)}</dd>
                </div>
                <div className="rounded-[10px] bg-fog px-3 py-2">
                  <dt className="text-muted">Closes</dt>
                  <dd className="font-medium">{fmtDate(data.form.closesAt)}</dd>
                </div>
              </dl>
              <p className="mt-3 text-[13px] text-muted">
                {data.version ? `Version ${data.version.version} live · ${plural(data.version.questions.length, "custom question")}` : "Not published yet"}
                {data.form.draftQuestions ? " · unpublished edits in progress" : ""}
              </p>
              {data.apps.length > 0 ? (
                <ul className="mt-4 flex flex-wrap gap-2">
                  {(Object.keys(data.counts) as ApplicationStatus[]).map((s) => (
                    <li key={s} className="flex items-center gap-1.5">
                      <StatusBadge status={s} />
                      <span className="text-[13.5px] font-semibold tabular">{data.counts[s]}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-[13.5px] text-muted">No submitted applications yet.</p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <ButtonLink href={`/admin/forms/${data.form.id}`} size="sm" variant="dark" icon={<FileStack className="size-4" />}>
                  Open form
                </ButtonLink>
                {data.apps.length > 0 && (
                  <ButtonLink href="/admin/applications" size="sm" variant="outline" icon={<ArrowUpRight className="size-4" />}>
                    Applications
                  </ButtonLink>
                )}
              </div>
            </>
          ) : (
            <EmptyState
              icon={<FileStack className="size-5" />}
              title="No application form yet"
              description="Create a form and set its window to open intake for this cohort."
              action={
                <ButtonLink href="/admin/forms" size="sm" variant="outline">
                  Go to forms
                </ButtonLink>
              }
            />
          )}
        </Panel>
      </div>
    </div>
  );
}
