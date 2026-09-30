"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowUpRight, UserRound } from "lucide-react";
import { adminCohortIds } from "@/lib/domain/permissions";
import { modulesOfTrack, sortedCohorts } from "@/lib/domain/selectors";
import { useNow } from "@/lib/hooks";
import { useDb, useMe } from "@/lib/store/store";
import { fmtRelative } from "@/lib/utils";
import { Badge, Panel } from "@/components/ui/display";
import { Table, TD, TH, THead, TR } from "@/components/ui/table";
import { moduleCounts } from "@/components/learning/data";

export function TracksTab() {
  const db = useDb();
  const me = useMe()!;
  const now = useNow();
  const scope = useMemo(() => new Set(adminCohortIds(db, me.id)), [db, me.id]);

  const tracks = useMemo(
    () =>
      Object.values(db.tracks)
        .sort((a, b) => a.order - b.order)
        .map((t) => {
          const modules = modulesOfTrack(db, t.id).map((m) => ({ m, c: moduleCounts(db, m.id) }));
          const instructors = sortedCohorts(db)
            .filter((c) => c.trackIds.includes(t.id) && c.status !== "completed")
            .map((c) => ({
              cohort: c,
              people: Object.values(db.memberships)
                .filter((m) => m.role === "instructor" && m.status === "active" && m.cohortId === c.id && m.trackId === t.id)
                .map((m) => db.users[m.userId])
                .filter(Boolean),
            }));
          const totals = modules.reduce((a, x) => ({ sessions: a.sessions + x.c.total, published: a.published + x.c.published, drafts: a.drafts + x.c.drafts + x.c.neverPublished }), { sessions: 0, published: 0, drafts: 0 });
          return { t, modules, instructors, totals };
        }),
    [db],
  );

  return (
    <div className="space-y-4">
      {tracks.map(({ t, modules, instructors, totals }) => (
        <Panel key={t.id} aria-labelledby={`tt-${t.id}`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="eyebrow flex items-center gap-2 text-muted">
                <span className="inline-block size-2.5 rounded-full" style={{ background: t.color }} aria-hidden />
                Track {t.order}
              </p>
              <h2 id={`tt-${t.id}`} className="mt-1 font-display text-[28px] leading-tight tracking-[-0.03em]">
                {t.name}
              </h2>
              <p className="mt-1 max-w-2xl text-[14.5px] text-muted">{t.tagline}</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Badge>{modules.length} modules</Badge>
              <Badge tone="green">{totals.published} published sessions</Badge>
              {totals.drafts > 0 && <Badge tone="amber">{totals.drafts} with drafts</Badge>}
            </div>
          </div>

          {/* Instructors per cohort */}
          <div className="mt-5">
            <h3 className="text-[14px] font-semibold">Instructors by cohort</h3>
            <ul className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {instructors.map(({ cohort, people }) => {
                const manageable = scope.has(cohort.id);
                return (
                  <li key={cohort.id} className="rounded-[12px] bg-fog p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13.5px] font-medium">{cohort.name}</span>
                      {manageable ? (
                        <Link href={`/admin/cohorts/${cohort.id}#staff`} className="inline-flex items-center gap-0.5 text-[12.5px] text-muted hover:text-void hover:underline" aria-label={`Manage ${cohort.name} staff assignments`}>
                          Manage <ArrowUpRight className="size-3.5" aria-hidden />
                        </Link>
                      ) : (
                        <span className="text-[12px] text-muted">Outside your scope</span>
                      )}
                    </div>
                    {people.length ? (
                      <p className="mt-1 flex items-center gap-1.5 text-[13.5px] text-ink">
                        <UserRound className="size-3.5 shrink-0 text-muted" aria-hidden />
                        {people.map((p) => p.name).join(", ")}
                      </p>
                    ) : (
                      <p className="mt-1 text-[13px] text-[#7a4b00]">No instructor assigned</p>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Modules */}
          <div className="mt-5">
            <h3 className="mb-2 text-[14px] font-semibold">Modules</h3>
            <div className="hidden md:block">
              <Table caption={`${t.name} modules`} className="rounded-[12px] ring-1 ring-line">
                <THead>
                  <tr>
                    <TH className="w-12">#</TH>
                    <TH>Module</TH>
                    <TH>Suggested</TH>
                    <TH align="right">Sessions</TH>
                    <TH align="right">Published</TH>
                    <TH align="right">Drafts</TH>
                    <TH align="right">Updated</TH>
                  </tr>
                </THead>
                <tbody>
                  {modules.map(({ m, c }) => (
                    <TR key={m.id}>
                      <TD className="tabular text-muted">{m.order}</TD>
                      <TD>
                        <span className="font-medium">{m.title}</span>
                      </TD>
                      <TD className="whitespace-nowrap text-muted">{m.suggestedMonths}</TD>
                      <TD align="right" className="tabular">
                        {c.total}
                      </TD>
                      <TD align="right" className="tabular">
                        {c.published}
                      </TD>
                      <TD align="right" className="tabular">
                        {c.drafts + c.neverPublished > 0 ? <Badge tone="amber">{c.drafts + c.neverPublished}</Badge> : <span className="text-muted">—</span>}
                      </TD>
                      <TD align="right" className="whitespace-nowrap text-muted">
                        {fmtRelative(m.updatedAt, now)}
                      </TD>
                    </TR>
                  ))}
                </tbody>
              </Table>
            </div>
            <ul className="grid gap-2 md:hidden">
              {modules.map(({ m, c }) => (
                <li key={m.id} className="rounded-[12px] bg-fog p-3">
                  <p className="text-[14.5px] font-medium">
                    {m.order}. {m.title}
                  </p>
                  <p className="mt-0.5 text-[13px] text-muted">
                    {m.suggestedMonths} · {c.published}/{c.total} published
                    {c.drafts + c.neverPublished > 0 && ` · ${c.drafts + c.neverPublished} draft`}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </Panel>
      ))}
    </div>
  );
}
