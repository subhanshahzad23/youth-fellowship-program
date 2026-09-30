"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Check, EyeOff, Lock, MessagesSquare, ScanText, Search, ShieldAlert, X } from "lucide-react";
import type { Conversation, Database, ID, Message } from "@/lib/domain/types";
import { conversationAccess } from "@/lib/domain/permissions";
import { conversationTitle, messagesOf, unreadIn, userName } from "@/lib/domain/selectors";
import { cn } from "@/lib/utils";
import { ConversationAvatar, KindChip } from "./bits";
import type { ViewMode } from "./message-list";
import { previewOf, relTime } from "./lib";

export interface ConversationRowData {
  conv: Conversation;
  title: string;
  last?: Message;
  preview: string;
  unread: number;
  readOnly: boolean;
  typing: boolean;
  flagged: number;
  hidden: number;
  openReports: number;
  match?: string;
}

/** Derive list rows and apply the search (names + message text the viewer is allowed to see). */
export function useConversationRows(db: Database, items: Conversation[], viewerId: ID, mode: ViewMode, query: string): ConversationRowData[] {
  return useMemo(() => {
    const term = query.trim().toLowerCase();
    const rows: ConversationRowData[] = [];
    for (const conv of items) {
      const msgs = messagesOf(db, conv.id);
      const last = msgs[msgs.length - 1];
      const title = conversationTitle(db, conv, mode === "participant" ? viewerId : null);
      let match: string | undefined;
      if (term) {
        const names = conv.participantIds
          .filter((p) => mode === "supervisor" || p !== viewerId)
          .map((p) => userName(db, p).toLowerCase())
          .join(" ");
        const nameHit = names.includes(term) || title.toLowerCase().includes(term);
        const textHit = [...msgs].reverse().find((m) => (mode === "supervisor" || !m.hidden) && (m.body.toLowerCase().includes(term) || m.attachments.some((a) => a.name.toLowerCase().includes(term))));
        if (!nameHit && !textHit) continue;
        if (!nameHit && textHit) match = `${textHit.senderId === viewerId && mode === "participant" ? "You" : db.users[textHit.senderId]?.firstName ?? "Someone"}: ${textHit.body || textHit.attachments.map((a) => a.name).join(", ")}`;
      }
      const access = mode === "participant" ? conversationAccess(db, viewerId, conv) : null;
      rows.push({
        conv,
        title,
        last,
        preview: previewOf(db, last, viewerId, mode, conv),
        unread: mode === "participant" ? unreadIn(db, viewerId, conv.id) : 0,
        readOnly: !!access && !access.send,
        typing: mode === "participant" && Object.values(db.pendingReplies).some((p) => p.conversationId === conv.id),
        flagged: msgs.filter((m) => m.autoFlag).length,
        hidden: msgs.filter((m) => m.hidden).length,
        openReports: Object.values(db.reports).filter((r) => r.conversationId === conv.id && r.status !== "resolved").length,
        match,
      });
    }
    return rows;
  }, [db, items, viewerId, mode, query]);
}

export function SearchBox({ value, onChange, label, placeholder }: { value: string; onChange: (v: string) => void; label: string; placeholder: string }) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="h-10 w-full rounded-[10px] border-[1.5px] border-line bg-paper pl-9 pr-9 text-[14.5px] placeholder:text-[#8a8a8a] hover:border-[#b9c0c6] focus:border-void focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button type="button" onClick={() => onChange("")} className="absolute right-1 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-[8px] text-muted hover:bg-fog hover:text-void" aria-label="Clear search">
          <X className="size-4" aria-hidden />
        </button>
      )}
    </div>
  );
}

export function ConversationRows({
  db,
  rows,
  viewerId,
  mode,
  selectedId,
  hrefFor,
  now,
  checked,
  onToggle,
  emptyTitle,
  emptyDescription,
}: {
  db: Database;
  rows: ConversationRowData[];
  viewerId: ID;
  mode: ViewMode;
  selectedId: string | null;
  hrefFor: (id: ID) => string;
  now: string;
  checked?: Set<ID>;
  onToggle?: (id: ID) => void;
  emptyTitle: string;
  emptyDescription?: string;
}) {
  if (!rows.length)
    return (
      <div className="flex flex-col items-center px-6 py-12 text-center">
        <span className="grid size-11 place-items-center rounded-full bg-fog">
          <MessagesSquare className="size-5" aria-hidden />
        </span>
        <p className="mt-3 text-[15px] font-semibold">{emptyTitle}</p>
        {emptyDescription && <p className="mt-1 max-w-[260px] text-[13.5px] text-muted">{emptyDescription}</p>}
      </div>
    );

  return (
    <ul className="flex flex-col gap-0.5 p-2" aria-label="Conversations">
      {rows.map((r) => {
        const active = r.conv.id === selectedId;
        const isChecked = checked?.has(r.conv.id) ?? false;
        return (
          <li key={r.conv.id} className={cn("relative flex items-center rounded-[14px] transition-colors", active ? "bg-fog" : "hover:bg-[#f7f7f7]", isChecked && !active && "bg-leaf/40")}>
            {active && <span className="absolute bottom-3 left-0 top-3 w-[3px] rounded-full bg-jade" aria-hidden />}
            {onToggle && (
              <label className="relative ml-1 grid size-10 shrink-0 cursor-pointer place-items-center" title="Select for export">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => onToggle(r.conv.id)}
                  aria-label={`Select ${r.title} for export`}
                  className="peer size-[18px] cursor-pointer appearance-none rounded-[5px] border-[1.5px] border-[#9aa3aa] bg-paper transition-colors checked:border-void checked:bg-void focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-void"
                />
                <Check className="pointer-events-none absolute size-3 text-paper opacity-0 peer-checked:opacity-100" strokeWidth={3.5} aria-hidden />
              </label>
            )}
            <Link
              href={hrefFor(r.conv.id)}
              scroll={false}
              aria-current={active ? "true" : undefined}
              className={cn("flex min-w-0 flex-1 items-start gap-3 rounded-[14px] py-3 pr-3", onToggle ? "pl-1" : "pl-3")}
            >
              <span className="relative mt-0.5">
                <ConversationAvatar db={db} conv={r.conv} viewerId={mode === "participant" ? viewerId : null} size={42} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline gap-2">
                  <span className={cn("min-w-0 flex-1 truncate text-[14.5px]", r.unread ? "font-semibold" : "font-medium")}>{r.title}</span>
                  <span className={cn("shrink-0 text-[12px] tabular", r.unread ? "font-medium text-void" : "text-muted")}>{relTime(r.last?.sentAt ?? r.conv.lastMessageAt, now)}</span>
                </span>
                <span className="mt-0.5 flex items-center gap-2">
                  <span className={cn("min-w-0 flex-1 truncate text-[13px]", r.typing ? "font-medium text-leaf-ink" : r.unread ? "text-ink" : "text-muted", r.last?.hidden && mode === "participant" && !r.match && "italic")}>
                    {r.typing ? "typing…" : r.match ?? r.preview}
                  </span>
                  {r.unread > 0 && (
                    <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-jade px-1.5 text-[11px] font-semibold text-void tabular">
                      {r.unread}
                      <span className="sr-only"> unread</span>
                    </span>
                  )}
                </span>
                <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <KindChip kind={r.conv.kind} />
                  {mode === "supervisor" && <span className="text-[11.5px] text-muted">{db.cohorts[r.conv.cohortId]?.name}</span>}
                  {r.readOnly && (
                    <span className="inline-flex items-center gap-1 text-[11.5px] text-muted">
                      <Lock className="size-3" aria-hidden /> Read-only
                    </span>
                  )}
                  {mode === "supervisor" && r.openReports > 0 && (
                    <span className="inline-flex items-center gap-1 text-[11.5px] font-medium text-[#9f1239]">
                      <ShieldAlert className="size-3" aria-hidden /> {r.openReports} open report{r.openReports === 1 ? "" : "s"}
                    </span>
                  )}
                  {mode === "supervisor" && r.flagged > 0 && (
                    <span className="inline-flex items-center gap-1 text-[11.5px] text-[#9f1239]">
                      <ScanText className="size-3" aria-hidden /> {r.flagged} flagged
                    </span>
                  )}
                  {mode === "supervisor" && r.hidden > 0 && (
                    <span className="inline-flex items-center gap-1 text-[11.5px] text-[#7a4b00]">
                      <EyeOff className="size-3" aria-hidden /> {r.hidden} hidden
                    </span>
                  )}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
