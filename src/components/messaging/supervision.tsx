"use client";

import { useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Download, MessagesSquare } from "lucide-react";
import type { ConversationKind, ID } from "@/lib/domain/types";
import { adminCohortIds, conversationAccess } from "@/lib/domain/permissions";
import { visibleConversations } from "@/lib/domain/selectors";
import { useNow } from "@/lib/hooks";
import { useDb, useMe } from "@/lib/store/store";
import { useUI } from "@/lib/store/ui";
import { cn } from "@/lib/utils";
import { Button, ButtonLink } from "@/components/ui/button";
import { Select } from "@/components/ui/form";
import { ThreadNotice } from "./bits";
import { ConversationRows, SearchBox, useConversationRows } from "./conversation-list";
import { ExportDialog } from "./export-dialog";
import { NoThreadSelected, Thread } from "./thread";
import { hrefWith } from "./lib";

/**
 * Admin supervision: every conversation in the admin's cohort scope, read-only,
 * with filters, multi-select and scoped export.
 */
export function SupervisionView() {
  const db = useDb();
  const me = useMe()!;
  const now = useNow();
  const params = useSearchParams();
  const pathname = usePathname();
  const { adminCohortFilter, setAdminCohortFilter } = useUI();
  const scope = adminCohortIds(db, me.id);
  const cohortFilter = adminCohortFilter !== "all" && scope.includes(adminCohortFilter) ? adminCohortFilter : "all";
  const [kind, setKind] = useState<"all" | ConversationKind>("all");
  const [attention, setAttention] = useState(false);
  const [query, setQuery] = useState("");
  const [checked, setChecked] = useState<Set<ID>>(() => new Set());
  const [exportIds, setExportIds] = useState<ID[] | null>(null);

  const all = useMemo(() => visibleConversations(db, me.id, "supervision"), [db, me.id]);
  const filtered = useMemo(() => all.filter((c) => (cohortFilter === "all" || c.cohortId === cohortFilter) && (kind === "all" || c.kind === kind)), [all, cohortFilter, kind]);
  const baseRows = useConversationRows(db, filtered, me.id, "supervisor", query);
  const rows = attention ? baseRows.filter((r) => r.flagged || r.hidden || r.openReports) : baseRows;

  const selectedId = params.get("c");
  const selected = selectedId ? db.conversations[selectedId] : undefined;
  const access = selected ? conversationAccess(db, me.id, selected) : undefined;
  const hrefFor = (id: string) => hrefWith(pathname, params, { c: id, view: "supervision" });
  const listHref = hrefWith(pathname, params, { c: null, view: "supervision" });

  const visibleIds = rows.map((r) => r.conv.id);
  const selectedVisible = visibleIds.filter((id) => checked.has(id));
  const allChecked = visibleIds.length > 0 && selectedVisible.length === visibleIds.length;
  const toggle = (id: ID) =>
    setChecked((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleAll = () =>
    setChecked((cur) => {
      const next = new Set(cur);
      if (allChecked) visibleIds.forEach((id) => next.delete(id));
      else visibleIds.forEach((id) => next.add(id));
      return next;
    });
  const checkedIds = [...checked].filter((id) => db.conversations[id]);

  let thread: React.ReactNode;
  if (!selectedId) thread = <NoThreadSelected supervisor />;
  else if (!selected)
    thread = <ThreadNotice kind="missing" title="We couldn't find that conversation" reason="It may have been removed, or the demo data may have been reset." backHref={listHref} backLabel="Back to supervision" />;
  else if (!access?.view || access.mode === "none")
    thread = <ThreadNotice kind="denied" title="Outside your supervision scope" reason={access?.reason ?? "This conversation is outside your scope."} backHref={listHref} backLabel="Back to supervision" />;
  else
    thread = (
      <Thread
        key={selected.id}
        conv={selected}
        mode="supervisor"
        backHref={listHref}
        headerActions={
          <Button size="sm" variant="outline" icon={<Download className="size-4" />} onClick={() => setExportIds([selected.id])} className="hidden sm:inline-flex">
            Export
          </Button>
        }
        footerExtra={
          access.mode === "participant" ? (
            <ButtonLink href={`/admin/messages?view=mine&c=${selected.id}`} size="sm" variant="outline" icon={<MessagesSquare className="size-4" />}>
              Reply as yourself
            </ButtonLink>
          ) : (
            <Button size="sm" variant="outline" icon={<Download className="size-4" />} onClick={() => setExportIds([selected.id])} className="sm:hidden">
              Export
            </Button>
          )
        }
      />
    );

  return (
    <div className="flex h-full min-h-0 overflow-hidden rounded-[20px] bg-paper">
      <aside className={cn("min-h-0 w-full shrink-0 flex-col border-line md:flex md:w-[340px] md:border-r lg:w-[380px]", selectedId ? "hidden" : "flex")} aria-label="Conversations in your scope">
        <div className="shrink-0 space-y-2.5 border-b border-line px-4 pb-3 pt-4">
          <div className="grid grid-cols-2 gap-2">
            <label className="sr-only" htmlFor="sup-cohort">
              Cohort
            </label>
            <Select id="sup-cohort" value={cohortFilter} onChange={(e) => setAdminCohortFilter(e.target.value)} className="h-10 text-[14px]">
              <option value="all">All cohorts ({scope.length})</option>
              {scope.map((id) => (
                <option key={id} value={id}>
                  {db.cohorts[id]?.name}
                </option>
              ))}
            </Select>
            <label className="sr-only" htmlFor="sup-kind">
              Conversation type
            </label>
            <Select id="sup-kind" value={kind} onChange={(e) => setKind(e.target.value as "all" | ConversationKind)} className="h-10 text-[14px]">
              <option value="all">All types</option>
              <option value="mentor">Mentor</option>
              <option value="direct">Direct</option>
              <option value="group">Group</option>
            </Select>
          </div>
          <SearchBox value={query} onChange={setQuery} label="Search conversations in scope" placeholder="Search names or message text" />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-[8px] px-1.5 text-[13.5px] hover:bg-fog">
                <input
                  type="checkbox"
                  checked={allChecked}
                  disabled={!visibleIds.length}
                  onChange={toggleAll}
                  className="size-4 cursor-pointer accent-void"
                />
                Select all
              </label>
              <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-[8px] px-1.5 text-[13.5px] hover:bg-fog">
                <input type="checkbox" checked={attention} onChange={(e) => setAttention(e.target.checked)} className="size-4 cursor-pointer accent-void" />
                Needs attention
              </label>
            </div>
            <Button size="sm" variant="dark" icon={<Download className="size-4" />} disabled={!checkedIds.length} onClick={() => setExportIds(checkedIds)}>
              Export{checkedIds.length ? ` (${checkedIds.length})` : ""}
            </Button>
          </div>
          <p className="text-[12.5px] text-muted" aria-live="polite">
            {rows.length} of {all.length} conversation{all.length === 1 ? "" : "s"}
            {checkedIds.length ? ` · ${checkedIds.length} selected` : ""}
          </p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <ConversationRows
            db={db}
            rows={rows}
            viewerId={me.id}
            mode="supervisor"
            selectedId={selectedId}
            hrefFor={hrefFor}
            now={now}
            checked={checked}
            onToggle={toggle}
            emptyTitle="No conversations match"
            emptyDescription="Try another cohort, type or search term."
          />
        </div>
      </aside>
      <section className={cn("min-h-0 min-w-0 flex-1 flex-col md:flex", selectedId ? "flex" : "hidden")} aria-label="Supervised conversation">
        {thread}
      </section>
      {exportIds && <ExportDialog open={!!exportIds} onOpenChange={(v) => !v && setExportIds(null)} convIds={exportIds} />}
    </div>
  );
}
