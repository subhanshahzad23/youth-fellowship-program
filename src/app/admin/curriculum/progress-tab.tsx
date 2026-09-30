"use client";

import { useMemo, useState } from "react";
import { Activity, Users } from "lucide-react";
import { adminCohortIds, fellowMembership } from "@/lib/domain/permissions";
import { fellowsOfCohort, modulesOfTrack, moduleProgress, sortedCohorts, trackProgress } from "@/lib/domain/selectors";
import { useDb, useMe } from "@/lib/store/store";
import { useUI } from "@/lib/store/ui";
import { cn } from "@/lib/utils";
import { Avatar, EmptyState, Panel, PanelHeader, ProgressBar } from "@/components/ui/display";
import { Select } from "@/components/ui/form";
import { Table, TD, TH, THead, TR } from "@/components/ui/table";

function Heat({ pct, label }: { pct: number; label: string }) {
  return (
    <span
      className={cn("inline-flex h-8 w-[52px] items-center justify-center rounded-[7px] text-[12.5px] font-medium tabular", pct === 0 ? "bg-fog text-muted" : "text-void")}
      style={pct > 0 ? { background: `rgba(0, 194, 122, ${0.12 + (pct / 100) * 0.55})` } : undefined}
      title={label}
      aria-label={label}
    >
      {pct}%
    </span>
  );
}

export function ProgressTab() {
  const db = useDb();
  const me = useMe()!;
  const uiCohort = useUI((s) => s.adminCohortFilter);

  const cohorts = useMemo(() => {
    const scope = new Set(adminCohortIds(db, me.id));
    return sortedCohorts(db)
      .filter((c) => scope.has(c.id))
      .map((c) => ({ c, fellows: fellowsOfCohort(db, c.id).length }));
  }, [db, me.id]);
  const withFellows = cohorts.filter((x) => x.fellows > 0);
  const fallbackCohort = (withFellows.find((x) => x.c.id === uiCohort) ?? withFellows.find((x) => x.c.status === "active") ?? withFellows[0])?.c.id ?? "";
  const [cohortChoice, setCohortChoice] = useState<string | null>(null);
  const cohortId = cohortChoice ?? fallbackCohort;

  const allModules = useMemo(
    () =>
      Object.values(db.tracks)
        .sort((a, b) => a.order - b.order)
        .map((t) => ({ t, modules: modulesOfTrack(db, t.id) })),
    [db],
  );
  const [moduleChoice, setModuleChoice] = useState<string | null>(null);
  const moduleId = moduleChoice ?? allModules[0]?.modules[1]?.id ?? allModules[0]?.modules[0]?.id ?? "";

  const rows = useMemo(() => {
    if (!cohortId) return [];
    return fellowsOfCohort(db, cohortId).map((f) => {
      const trackId = fellowMembership(db, f.id)?.trackId;
      const track = trackId ? db.tracks[trackId] : undefined;
      const mods = trackId ? modulesOfTrack(db, trackId).map((m) => ({ m, p: moduleProgress(db, f.id, m.id) })) : [];
      const overall = trackId ? trackProgress(db, f.id, trackId) : { done: 0, total: 0, pct: 0 };
      return { f, track, mods, overall };
    });
  }, [db, cohortId]);

  const byCohort = useMemo(() => {
    const mod = db.modules[moduleId];
    if (!mod) return [];
    return cohorts
      .map(({ c }) => {
        const fellows = fellowsOfCohort(db, c.id).filter((f) => fellowMembership(db, f.id)?.trackId === mod.trackId);
        const pcts = fellows.map((f) => moduleProgress(db, f.id, mod.id).pct);
        const avg = pcts.length ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : 0;
        return { c, fellows: fellows.length, avg, finished: pcts.filter((p) => p === 100).length };
      })
      .filter((x) => x.fellows > 0);
  }, [db, moduleId, cohorts]);

  if (!withFellows.length)
    return <EmptyState icon={<Users className="size-5" />} title="No fellows in your cohorts yet" description="Progress appears here once fellows join a cohort you manage and start their sessions." />;

  const selectedModule = db.modules[moduleId];

  return (
    <div className="space-y-4">
      <p className="flex items-start gap-2 text-[13.5px] text-muted">
        <Activity className="mt-0.5 size-4 shrink-0" aria-hidden />
        Calculated live from session completions and approved assignments — when a fellow finishes a session or an instructor approves work, it shows up here immediately.
      </p>

      <Panel>
        <PanelHeader
          title="Fellow progress by module"
          description="Each fellow follows one track, so module columns refer to their own track's six modules."
          actions={
            <label className="w-56">
              <span className="sr-only">Cohort</span>
              <Select value={cohortId} onChange={(e) => setCohortChoice(e.target.value)} className="h-10 text-[14px]">
                {cohorts.map(({ c, fellows }) => (
                  <option key={c.id} value={c.id} disabled={!fellows}>
                    {c.name} ({fellows} fellow{fellows === 1 ? "" : "s"})
                  </option>
                ))}
              </Select>
            </label>
          }
        />
        {rows.length === 0 ? (
          <p className="text-[14px] text-muted">No fellows in this cohort yet.</p>
        ) : (
          <>
            <div className="hidden md:block">
              <Table caption="Fellow progress by module" className="rounded-[12px] ring-1 ring-line">
                <THead>
                  <tr>
                    <TH>Fellow</TH>
                    <TH>Track</TH>
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <TH key={n} className="text-center">
                        M{n}
                      </TH>
                    ))}
                    <TH align="right">Overall</TH>
                  </tr>
                </THead>
                <tbody>
                  {rows.map(({ f, track, mods, overall }) => (
                    <TR key={f.id}>
                      <TD>
                        <span className="flex items-center gap-2.5">
                          <Avatar name={f.name} hue={f.avatarHue} size={30} />
                          <span className="font-medium">{f.name}</span>
                        </span>
                      </TD>
                      <TD className="whitespace-nowrap text-muted">
                        <span className="mr-1.5 inline-block size-2 rounded-full align-middle" style={{ background: track?.color }} aria-hidden />
                        {track?.shortName ?? "—"}
                      </TD>
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <TD key={i} className="px-1.5 text-center">
                          {mods[i] ? <Heat pct={mods[i].p.pct} label={`${f.name}, ${mods[i].m.title}: ${mods[i].p.done} of ${mods[i].p.total} sessions (${mods[i].p.pct}%)`} /> : <span className="text-muted">—</span>}
                        </TD>
                      ))}
                      <TD align="right">
                        <span className="inline-flex items-center gap-2">
                          <ProgressBar value={overall.pct} className="h-1.5 w-16" label={`${f.name} overall progress`} />
                          <span className="w-9 text-right text-[13px] font-medium tabular">{overall.pct}%</span>
                        </span>
                      </TD>
                    </TR>
                  ))}
                </tbody>
              </Table>
            </div>
            <ul className="grid gap-2 md:hidden">
              {rows.map(({ f, track, mods, overall }) => (
                <li key={f.id} className="rounded-[12px] bg-fog p-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={f.name} hue={f.avatarHue} size={30} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14.5px] font-medium">{f.name}</span>
                      <span className="text-[12.5px] text-muted">{track?.name}</span>
                    </span>
                    <span className="text-[14px] font-semibold tabular">{overall.pct}%</span>
                  </div>
                  <div className="mt-2 grid grid-cols-6 gap-1">
                    {mods.map(({ m, p }) => (
                      <div key={m.id} className="text-center">
                        <ProgressBar value={p.pct} className="h-1.5" label={`${m.title} ${p.pct}%`} />
                        <span className="mt-0.5 block text-[10.5px] text-muted">M{m.order}</span>
                      </div>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </Panel>

      <Panel>
        <PanelHeader
          title="Module completion by cohort"
          description={selectedModule ? `Average progress through “${selectedModule.title}” for fellows on ${db.tracks[selectedModule.trackId]?.name}.` : undefined}
          actions={
            <label className="w-64">
              <span className="sr-only">Module</span>
              <Select value={moduleId} onChange={(e) => setModuleChoice(e.target.value)} className="h-10 text-[14px]">
                {allModules.map(({ t, modules }) => (
                  <optgroup key={t.id} label={t.name}>
                    {modules.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.order}. {m.title}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </Select>
            </label>
          }
        />
        {byCohort.length === 0 ? (
          <p className="text-[14px] text-muted">None of your cohorts have fellows on this track yet.</p>
        ) : (
          <ul className="space-y-4">
            {byCohort.map(({ c, fellows, avg, finished }) => (
              <li key={c.id}>
                <div className="flex flex-wrap items-baseline justify-between gap-2 text-[14px]">
                  <span className="font-medium">{c.name}</span>
                  <span className="text-[13px] text-muted tabular">
                    {finished} of {fellows} finished · average {avg}%
                  </span>
                </div>
                <ProgressBar value={avg} className="mt-1.5 h-3" label={`${c.name}: average ${avg}% through ${selectedModule?.title}`} />
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
