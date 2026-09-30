"use client";

import type { AuditEvent, ID } from "@/lib/domain/types";
import { adminCohortIds, canViewAuditEvent, isAdmin } from "@/lib/domain/permissions";
import { commit, useDemoStore } from "@/lib/store/store";
import { nowISO } from "@/lib/clock";
import { uid } from "@/lib/utils";

const csvCell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

/**
 * Export audit events as CSV. Re-checks visibility for every event (the
 * caller's filtered list is not trusted) and records the export itself in
 * the audit log.
 */
export function exportAuditCsv(eventIds: ID[], opts: { scopeLabel: string; filterCohortId?: ID; labels: (e: AuditEvent) => { action: string; actor: string; cohort: string } }) {
  const { db, personaId } = useDemoStore.getState();
  if (!personaId || !isAdmin(db, personaId)) return { ok: false as const, error: "Only program and executive admins can export the audit log." };
  const events = eventIds.map((id) => db.audit[id]).filter((e): e is AuditEvent => !!e && canViewAuditEvent(db, personaId, e.cohortId));
  if (!events.length) return { ok: false as const, error: "There are no events in view to export." };
  const header = ["event_id", "timestamp_utc", "actor", "actor_id", "action", "action_key", "entity_type", "entity_id", "cohort", "outcome", "summary"];
  const rows = events.map((e) => {
    const l = opts.labels(e);
    return [e.id, e.at, l.actor, e.actorId, l.action, e.action, e.entityType, e.entityId, l.cohort, e.outcome, e.summary];
  });
  const generated = nowISO();
  const content =
    `# Launchpad Fellowship demo audit export — fictional data\n# Generated ${generated} by ${db.users[personaId]?.name}; scope: ${opts.scopeLabel}; ${events.length} events\n` +
    [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
  // Program admins only see events tied to their cohorts, so file the export under one of them.
  const cohortId = opts.filterCohortId ?? (db.users[personaId]?.staffRoles.includes("executive_admin") ? undefined : adminCohortIds(db, personaId)[0]);
  const r = commit((_d, ctx) =>
    ctx.audit({
      action: "export.audit",
      entityType: "export",
      entityId: uid("exp"),
      cohortId,
      summary: `Exported ${events.length} audit event${events.length === 1 ? "" : "s"} to CSV (${opts.scopeLabel})`,
      meta: { count: events.length, denied: events.filter((e) => e.outcome === "denied").length },
    }),
  );
  if (!r.ok) return { ok: false as const, error: r.error };
  return { ok: true as const, content, fileName: `launchpad-audit-${generated.slice(0, 10)}.csv`, count: events.length };
}
