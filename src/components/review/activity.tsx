"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Eye, Lock, ShieldAlert } from "lucide-react";
import type { Application, Database, ID } from "@/lib/domain/types";
import { canViewAuditEvent } from "@/lib/domain/permissions";
import { reviewsOf } from "@/lib/domain/selectors";
import { useNow } from "@/lib/hooks";
import { cn, fmtDateTime, fmtRelative } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge, Panel, PanelHeader, StatusBadge } from "@/components/ui/display";
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from "@/components/ui/overlay";

const AUDIT_PAGE = 8;

export function ApplicationActivity({ db, app, meId }: { db: Database; app: Application; meId: ID }) {
  const now = useNow();
  const [showAll, setShowAll] = useState(false);

  const timeline = useMemo(() => [...app.timeline].sort((a, b) => (a.at < b.at ? 1 : -1)), [app.timeline]);

  const audit = useMemo(() => {
    const ids = new Set<string>([app.id, ...reviewsOf(db, app.id).map((r) => r.id), ...app.documentIds]);
    return Object.values(db.audit)
      .filter((e) => ids.has(e.entityId) && canViewAuditEvent(db, meId, e.cohortId))
      .sort((a, b) => (a.at < b.at ? 1 : -1));
  }, [db, app.id, app.documentIds, meId]);

  const shownAudit = showAll ? audit : audit.slice(0, AUDIT_PAGE);
  const denied = audit.filter((e) => e.outcome === "denied").length;

  return (
    <Panel aria-labelledby="activity-h">
      <PanelHeader title={<span id="activity-h">Activity</span>} description="What the applicant sees, internal steps and the audit trail for this application." />
      <TabsRoot defaultValue="timeline">
        <TabsList aria-label="Activity views">
          <TabsTrigger value="timeline">
            Timeline <span className="text-[12.5px] text-muted tabular">{timeline.length}</span>
          </TabsTrigger>
          <TabsTrigger value="audit">
            Audit trail <span className="text-[12.5px] text-muted tabular">{audit.length}</span>
            {denied > 0 && <span className="size-1.5 rounded-full bg-[#c8102e]" aria-label={`${denied} denied attempts`} />}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="pt-5 outline-none">
          <ol className="relative space-y-5 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-px before:bg-line">
            {timeline.map((t) => {
              const actor = t.actorId ? db.users[t.actorId] : undefined;
              const internal = t.visibility === "internal";
              return (
                <li key={t.id} className="relative pl-7">
                  <span className={cn("absolute left-0 top-1 size-[15px] rounded-full border-[3px] border-paper", internal ? "bg-[#9aa3aa]" : "bg-jade")} aria-hidden />
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <p className="text-[14.5px] font-medium">{t.label}</p>
                    {internal ? (
                      <Badge tone="neutral" className="h-5 text-[11.5px]" icon={<Lock className="size-3" aria-hidden />}>
                        Internal
                      </Badge>
                    ) : (
                      <Badge tone="green" className="h-5 text-[11.5px]" icon={<Eye className="size-3" aria-hidden />}>
                        Applicant sees this
                      </Badge>
                    )}
                  </div>
                  <p className="mt-0.5 text-[13px] text-muted">
                    {actor ? `${actor.name} · ` : ""}
                    <time dateTime={t.at} title={fmtDateTime(t.at)}>
                      {fmtDateTime(t.at)}
                    </time>
                  </p>
                  {t.note && <p className="mt-1.5 max-w-xl rounded-[10px] bg-fog px-3 py-2 text-[14px] leading-relaxed">“{t.note}”</p>}
                </li>
              );
            })}
          </ol>
          <div className="mt-5 flex items-center gap-2 border-t border-line pt-3 text-[12.5px] text-muted">
            <span>Current status</span>
            <StatusBadge status={app.status} />
          </div>
        </TabsContent>

        <TabsContent value="audit" className="pt-4 outline-none">
          {audit.length === 0 ? (
            <p className="rounded-[12px] bg-fog px-3 py-3 text-[14px] text-muted">No audit events for this application are in your scope.</p>
          ) : (
            <>
              <ul className="divide-y divide-line">
                {shownAudit.map((e) => {
                  const actor = db.users[e.actorId];
                  return (
                    <li key={e.id} className="flex items-start gap-3 py-3 first:pt-1">
                      <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", e.outcome === "denied" ? "bg-[#c8102e]" : "bg-[#9aa3aa]")} aria-hidden />
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] leading-snug">{e.summary}</p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[12.5px] text-muted">
                          <span>{actor?.name ?? e.actorId}</span>
                          <span aria-hidden>·</span>
                          <time dateTime={e.at} title={fmtDateTime(e.at)}>
                            {fmtRelative(e.at, now)}
                          </time>
                          <span aria-hidden>·</span>
                          <code className="font-mono text-[11.5px]">{e.action}</code>
                        </p>
                      </div>
                      {e.outcome === "denied" && (
                        <Badge tone="red" icon={<ShieldAlert className="size-3.5" aria-hidden />}>
                          Denied
                        </Badge>
                      )}
                    </li>
                  );
                })}
              </ul>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
                {audit.length > AUDIT_PAGE ? (
                  <Button variant="ghost" size="sm" onClick={() => setShowAll((v) => !v)}>
                    {showAll ? "Show fewer" : `Show all ${audit.length} events`}
                  </Button>
                ) : (
                  <span />
                )}
                <Link href="/admin/audit" className="text-[13.5px] underline-offset-2 hover:underline">
                  Open the full audit log
                </Link>
              </div>
            </>
          )}
        </TabsContent>
      </TabsRoot>
    </Panel>
  );
}
