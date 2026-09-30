"use client";

import { useMemo } from "react";
import type { ID } from "@/lib/domain/types";
import { adminCohortIds, isExec } from "@/lib/domain/permissions";
import { sortedCohorts } from "@/lib/domain/selectors";
import { useDb, usePersonaId } from "@/lib/store/store";
import { useUI } from "@/lib/store/ui";

export interface AdminScope {
  /** every cohort the viewer may manage */
  scope: ID[];
  /** effective topbar filter ("all" or a cohort id inside scope) */
  filter: "all" | ID;
  /** cohorts to show right now (scope narrowed by the topbar filter), ordered by start date */
  cohortIds: ID[];
  exec: boolean;
}

/**
 * The admin's cohort scope combined with the topbar cohort context selector.
 * A stale filter (e.g. a cohort from another persona) silently falls back to "all".
 */
export function useAdminScope(): AdminScope {
  const db = useDb();
  const me = usePersonaId();
  const rawFilter = useUI((s) => s.adminCohortFilter);
  return useMemo(() => {
    const scope = adminCohortIds(db, me);
    const ordered = sortedCohorts(db)
      .map((c) => c.id)
      .filter((id) => scope.includes(id));
    const filter = rawFilter !== "all" && scope.includes(rawFilter) ? rawFilter : "all";
    return { scope: ordered, filter, cohortIds: filter === "all" ? ordered : [filter], exec: isExec(db, me) };
  }, [db, me, rawFilter]);
}
