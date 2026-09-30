"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Download, FilterX, History, Search, ShieldAlert, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import type { AuditEvent } from "@/lib/domain/types";
import { exportAuditCsv } from "@/lib/actions/admin-extra";
import { useNow } from "@/lib/hooks";
import { downloadBlob } from "@/lib/files";
import { useDb, useMe } from "@/lib/store/store";
import { cn, fmtDate, fmtDateTime, fmtRelative, plural, sleep } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge, EmptyState, PageHeader, Panel } from "@/components/ui/display";
import { Input, Select } from "@/components/ui/form";
import { Segmented } from "@/components/ui/overlay";
import { Table, TD, TH, THead, TR } from "@/components/ui/table";
import { useAdminScope } from "@/components/admin/scope";
import { ActorAvatar } from "@/components/admin/actor-avatar";
import { ACTION_GROUPS, actionGroup, actionLabel, actorName, auditEntityHref, ENTITY_LABELS, visibleAuditEvents } from "@/components/admin/audit-format";

const PAGE = 40;
const NO_COHORT = "__none";

export default function AuditPage() {
  const db = useDb();
  const me = useMe()!;
  const meId = me.id;
  const now = useNow();
  const { scope, filter: topFilter, exec } = useAdminScope();

  const [q, setQ] = useState("");
  const [actor, setActor] = useState("all");
  const [group, setGroup] = useState("all");
  const [entity, setEntity] = useState("all");
  const [cohort, setCohort] = useState<string>(topFilter);
  const [outcome, setOutcome] = useState<"all" | "success" | "denied">("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [limit, setLimit] = useState(PAGE);
  const [exporting, setExporting] = useState(false);

  const all = useMemo(() => visibleAuditEvents(db, meId), [db, meId]);
  const actors = useMemo(() => [...new Set(all.map((e) => e.actorId))].map((id) => ({ id, name: actorName(db, id) })).sort((a, b) => a.name.localeCompare(b.name)), [all, db]);
  const entities = useMemo(() => [...new Set(all.map((e) => e.entityType))].sort(), [all]);
  const groupsPresent = useMemo(() => new Set(all.map((e) => actionGroup(e.action))), [all]);

  const events = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return all.filter((e) => {
      if (actor !== "all" && e.actorId !== actor) return false;
      if (group !== "all" && actionGroup(e.action) !== group) return false;
      if (entity !== "all" && e.entityType !== entity) return false;
      if (cohort === NO_COHORT ? !!e.cohortId : cohort !== "all" && e.cohortId !== cohort) return false;
      if (outcome !== "all" && e.outcome !== outcome) return false;
      if (from && e.at.slice(0, 10) < from) return false;
      if (to && e.at.slice(0, 10) > to) return false;
      if (needle && ![e.summary, actorName(db, e.actorId), actionLabel(e.action), e.action, e.entityId].some((s) => s.toLowerCase().includes(needle))) return false;
      return true;
    });
  }, [all, q, actor, group, entity, cohort, outcome, from, to, db]);

  const deniedCount = events.filter((e) => e.outcome === "denied").length;
  const filtered = q || actor !== "all" || group !== "all" || entity !== "all" || cohort !== "all" || outcome !== "all" || from || to;
  const clear = () => {
    setQ("");
    setActor("all");
    setGroup("all");
    setEntity("all");
    setCohort("all");
    setOutcome("all");
    setFrom("");
    setTo("");
    setLimit(PAGE);
  };

  const cohortName = (e: AuditEvent) => (e.cohortId ? db.cohorts[e.cohortId]?.name ?? "Removed cohort" : "Organization-wide");
  const scopeLabel = cohort === "all" ? (exec ? "all cohorts" : scope.map((id) => db.cohorts[id]?.name).join(" + ")) : cohort === NO_COHORT ? "organization-wide events" : db.cohorts[cohort]?.name ?? "";

  const doExport = async () => {
    setExporting(true);
    await sleep(450);
    const r = exportAuditCsv(
      events.map((e) => e.id),
      {
        scopeLabel: `${scopeLabel}${filtered ? ", filtered" : ""}`,
        filterCohortId: cohort !== "all" && cohort !== NO_COHORT ? cohort : undefined,
        labels: (e) => ({ action: actionLabel(e.action), actor: actorName(db, e.actorId), cohort: cohortName(e) }),
      },
    );
    setExporting(false);
    if (!r.ok) return void toast.error(r.error);
    downloadBlob(r.content, r.fileName, "text/csv");
    toast.success(`Exported ${plural(r.count, "event")} to CSV`, { description: "The export itself is now recorded in the audit log." });
  };

  const outcomeBadge = (e: AuditEvent) =>
    e.outcome === "denied" ? (
      <Badge tone="red" icon={<ShieldAlert className="size-3.5" aria-hidden />}>
        Denied
      </Badge>
    ) : (
      <Badge tone="neutral" icon={<ShieldCheck className="size-3.5" aria-hidden />}>
        Success
      </Badge>
    );

  const summary = (e: AuditEvent) => {
    const href = auditEntityHref(db, meId, e);
    return href ? (
      <Link href={href} className="underline-offset-2 hover:underline">
        {e.summary}
      </Link>
    ) : (
      <span>{e.summary}</span>
    );
  };

  return (
    <>
      <PageHeader
        eyebrow="Program admin"
        title="Audit log"
        description={
          exec
            ? "Every recorded action across the fellowship, including attempts that were denied."
            : `Recorded actions in ${scope.map((id) => db.cohorts[id]?.name).join(" and ")}, including attempts that were denied.`
        }
        actions={
          <Button variant="dark" icon={<Download className="size-4" />} loading={exporting} onClick={doExport} disabled={!events.length}>
            Export CSV
          </Button>
        }
      />

      <Panel className="p-0 sm:p-0">
        <div className="grid grid-cols-1 gap-2 border-b border-line p-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.35fr)_minmax(0,1fr)]">
          <div className="relative sm:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
            <Input value={q} onChange={(e) => (setQ(e.target.value), setLimit(PAGE))} placeholder="Search summaries, people or actions" aria-label="Search audit log" className="h-10 pl-9" />
          </div>
          <Select value={actor} onChange={(e) => (setActor(e.target.value), setLimit(PAGE))} aria-label="Actor" className="h-10">
            <option value="all">Any actor</option>
            {actors.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
          <Select value={group} onChange={(e) => (setGroup(e.target.value), setLimit(PAGE))} aria-label="Action group" className="h-10">
            <option value="all">Any action</option>
            {ACTION_GROUPS.filter((g) => groupsPresent.has(g.value)).map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </Select>
          <Select value={entity} onChange={(e) => (setEntity(e.target.value), setLimit(PAGE))} aria-label="Record type" className="h-10">
            <option value="all">Any record type</option>
            {entities.map((t) => (
              <option key={t} value={t}>
                {ENTITY_LABELS[t]}
              </option>
            ))}
          </Select>
          <Select value={cohort} onChange={(e) => (setCohort(e.target.value), setLimit(PAGE))} aria-label="Cohort" className="h-10">
            <option value="all">{exec ? "All cohorts" : "All my cohorts"}</option>
            {scope.map((id) => (
              <option key={id} value={id}>
                {db.cohorts[id]?.name}
              </option>
            ))}
            {exec && <option value={NO_COHORT}>Organization-wide</option>}
          </Select>
          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor="audit-from">
              From date
            </label>
            <Input id="audit-from" type="date" value={from} max={to || undefined} onChange={(e) => (setFrom(e.target.value), setLimit(PAGE))} className="h-10 min-w-0 px-2.5 text-[14px]" />
            <span className="text-muted" aria-hidden>
              –
            </span>
            <label className="sr-only" htmlFor="audit-to">
              To date
            </label>
            <Input id="audit-to" type="date" value={to} min={from || undefined} onChange={(e) => (setTo(e.target.value), setLimit(PAGE))} className="h-10 min-w-0 px-2.5 text-[14px]" />
          </div>
          <Segmented
            label="Outcome"
            value={outcome}
            onChange={(v) => (setOutcome(v), setLimit(PAGE))}
            className="w-full [&>button]:flex-1"
            options={[
              { value: "all", label: "All" },
              { value: "success", label: "Success" },
              { value: "denied", label: "Denied" },
            ]}
          />
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 pt-3 text-[13px] text-muted" aria-live="polite">
          <span>
            {plural(events.length, "event")}
            {deniedCount > 0 && (
              <>
                {" "}
                · <span className="font-medium text-[#9f1239]">{deniedCount} denied</span>
              </>
            )}
          </span>
          {filtered && (
            <button type="button" onClick={clear} className="inline-flex items-center gap-1 font-medium text-void underline-offset-2 hover:underline">
              <FilterX className="size-3.5" aria-hidden /> Clear filters
            </button>
          )}
          {!exec && <span className="sm:ml-auto">Events outside your cohorts aren&apos;t shown.</span>}
        </div>

        {events.length === 0 ? (
          <div className="p-4">
            <EmptyState icon={<History className="size-5" />} title="No events match" description="Try widening the date range or clearing filters." action={filtered ? <Button size="sm" variant="outline" onClick={clear}>Clear filters</Button> : undefined} />
          </div>
        ) : (
          <>
            <div className="hidden lg:block">
              <Table caption="Audit events" className="rounded-none">
                <THead>
                  <tr>
                    <TH className="w-[150px]">When</TH>
                    <TH className="w-[190px]">Actor</TH>
                    <TH>Action</TH>
                    <TH className="w-[140px]">Cohort</TH>
                    <TH className="w-[110px]">Outcome</TH>
                  </tr>
                </THead>
                <tbody>
                  {events.slice(0, limit).map((e) => (
                    <TR key={e.id} className={cn(e.outcome === "denied" && "bg-[#fff5f6]")}>
                      <TD className="align-top text-[13px]">
                        <span className="block">{fmtDate(e.at)}</span>
                        <span className="block text-muted">{fmtRelative(e.at, now)}</span>
                      </TD>
                      <TD className="align-top">
                        <span className="flex items-center gap-2">
                          <ActorAvatar db={db} actorId={e.actorId} size={26} />
                          <span className="truncate text-[13.5px] font-medium">{actorName(db, e.actorId)}</span>
                        </span>
                      </TD>
                      <TD className="align-top">
                        <span className="block text-[13.5px] font-medium">
                          {actionLabel(e.action)} <span className="font-mono text-[11.5px] font-normal text-muted">{e.action}</span>
                        </span>
                        <span className="block text-[13.5px] text-ink">{summary(e)}</span>
                      </TD>
                      <TD className="align-top text-[13px]">{cohortName(e)}</TD>
                      <TD className="align-top">{outcomeBadge(e)}</TD>
                    </TR>
                  ))}
                </tbody>
              </Table>
            </div>
            <ul className="grid grid-cols-1 gap-2 p-4 lg:hidden">
              {events.slice(0, limit).map((e) => (
                <li key={e.id} className={cn("rounded-[14px] p-3.5", e.outcome === "denied" ? "bg-[#fff1f2]" : "bg-fog")}>
                  <div className="flex items-start gap-3">
                    <ActorAvatar db={db} actorId={e.actorId} size={30} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px]">
                        <span className="font-medium">{actorName(db, e.actorId)}</span> <span className="text-muted">· {actionLabel(e.action)}</span>
                      </p>
                      <p className="mt-0.5 text-[14px]">{summary(e)}</p>
                      <p className="mt-1 text-[12.5px] text-muted">
                        {fmtDateTime(e.at)} · {cohortName(e)}
                      </p>
                    </div>
                    {e.outcome === "denied" && outcomeBadge(e)}
                  </div>
                </li>
              ))}
            </ul>
            {events.length > limit && (
              <div className="flex justify-center border-t border-line p-4">
                <Button variant="soft" onClick={() => setLimit((l) => l + PAGE)}>
                  Show {Math.min(PAGE, events.length - limit)} more of {events.length - limit}
                </Button>
              </div>
            )}
          </>
        )}
      </Panel>
      <p className="mt-3 text-[12.5px] text-muted">Times are shown in UTC. Audit entries can&apos;t be edited or deleted from the product.</p>
    </>
  );
}
