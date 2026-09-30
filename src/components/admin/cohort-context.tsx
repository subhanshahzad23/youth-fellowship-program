"use client";

import { useDb } from "@/lib/store/store";
import { useUI } from "@/lib/store/ui";
import { cn } from "@/lib/utils";
import { useAdminScope } from "./scope";

/**
 * The same cohort context as the topbar selector (which only fits on wide
 * screens). Rendered inside pages below `xl` so the filter is reachable on
 * tablets and phones too.
 */
export function CohortContextInline({ className }: { className?: string }) {
  const db = useDb();
  const { scope, filter } = useAdminScope();
  const set = useUI((s) => s.setAdminCohortFilter);
  if (scope.length < 2) return null;
  return (
    <label className={cn("flex items-center gap-2 xl:hidden", className)}>
      <span className="text-[13px] text-muted">Cohort</span>
      <select
        value={filter}
        onChange={(e) => set(e.target.value)}
        className="h-10 min-w-0 max-w-[220px] rounded-[8px] border-[1.5px] border-line bg-paper px-3 text-[14px] focus:border-void focus:outline-none"
        aria-label="Cohort context"
      >
        <option value="all">All in my scope ({scope.length})</option>
        {scope.map((id) => (
          <option key={id} value={id}>
            {db.cohorts[id]?.name}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Small line explaining the active cohort context, with a one-click reset. */
export function ScopeNote({ className }: { className?: string }) {
  const db = useDb();
  const { scope, filter, exec } = useAdminScope();
  const set = useUI((s) => s.setAdminCohortFilter);
  const names = scope.map((id) => db.cohorts[id]?.name).filter(Boolean);
  return (
    <p className={cn("text-[13px] text-muted", className)}>
      {filter === "all" ? (
        exec ? (
          <>Showing all {names.length} cohorts.</>
        ) : (
          <>Showing your cohorts: {names.join(" and ")}.</>
        )
      ) : (
        <>
          Filtered to <span className="font-medium text-void">{db.cohorts[filter]?.name}</span>.{" "}
          <button type="button" onClick={() => set("all")} className="font-medium text-void underline underline-offset-2 hover:no-underline">
            Show all
          </button>
        </>
      )}
    </p>
  );
}
