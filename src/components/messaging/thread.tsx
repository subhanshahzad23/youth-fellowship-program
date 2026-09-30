"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Eye, Info, Lock, ScanText, ShieldAlert, ShieldCheck } from "lucide-react";
import type { Conversation, Database, ID } from "@/lib/domain/types";
import { markConversationRead } from "@/lib/actions/messaging";
import { conversationAccess, roleLabel } from "@/lib/domain/permissions";
import { conversationTitle, messagesOf, userName } from "@/lib/domain/selectors";
import { MODERATION_RULES } from "@/lib/sim/moderation";
import { useNow } from "@/lib/hooks";
import { useDb, useMe } from "@/lib/store/store";
import { cn, fmtDate } from "@/lib/utils";
import { Avatar } from "@/components/ui/display";
import { PopoverContent, PopoverRoot, PopoverTrigger } from "@/components/ui/overlay";
import { ConversationAvatar, KindChip, TypingIndicator } from "./bits";
import { Composer } from "./composer";
import { buildTimeline, DaySeparator, MessageCluster, type ViewMode } from "./message-list";
import { participantSummary, SUPERVISION_NOTICE } from "./lib";

function subtitleFor(db: Database, conv: Conversation, viewerId: ID, mode: ViewMode) {
  const cohort = db.cohorts[conv.cohortId]?.name;
  if (mode === "supervisor") {
    const who = conv.title ? participantSummary(db, conv, null, 3) : conv.participantIds.map((p) => (db.users[p] ? roleLabel(db, db.users[p]).replace(/^Fellow · .*/, "Fellow") : "Former member")).join(" & ");
    return [who, cohort, `started ${fmtDate(conv.createdAt)}`].filter(Boolean).join(" · ");
  }
  if (conv.kind === "group" || conv.participantIds.length > 2) return [`${conv.participantIds.length} people`, cohort].filter(Boolean).join(" · ");
  const other = db.users[conv.participantIds.find((p) => p !== viewerId) ?? ""];
  return [other ? roleLabel(db, other).replace(/^Fellow · .*/, "Fellow") : "Former member", other?.ventureName, cohort].filter(Boolean).join(" · ");
}

function DetailsPopover({ db, conv, viewerId }: { db: Database; conv: Conversation; viewerId: ID }) {
  const cohort = db.cohorts[conv.cohortId];
  return (
    <PopoverRoot>
      <PopoverTrigger asChild>
        <button type="button" className="grid size-10 place-items-center rounded-[10px] text-muted hover:bg-fog hover:text-void data-[state=open]:bg-fog" aria-label="Conversation details">
          <Info className="size-[18px]" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(92vw,320px)] p-4">
        <p className="eyebrow text-muted">In this conversation</p>
        <ul className="mt-2 space-y-2">
          {conv.participantIds.map((p) => {
            const u = db.users[p];
            return (
              <li key={p} className="flex items-center gap-2.5">
                <Avatar name={u?.name ?? "?"} hue={u?.avatarHue} size={30} />
                <span className="min-w-0">
                  <span className="block truncate text-[14px] font-medium">
                    {u?.name ?? "Former member"}
                    {p === viewerId && <span className="font-normal text-muted"> (you)</span>}
                  </span>
                  <span className="block truncate text-[12.5px] text-muted">{u ? roleLabel(db, u) : ""}</span>
                </span>
              </li>
            );
          })}
        </ul>
        <div className="mt-4 space-y-1 border-t border-line pt-3 text-[13px] text-muted">
          <p>
            {cohort?.name} · started {fmtDate(conv.createdAt)} by {userName(db, conv.createdById)}
          </p>
          <p className="flex items-start gap-1.5 text-ink">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            Visible to the people above and to program staff who supervise {cohort?.name ?? "this cohort"}.
          </p>
        </div>
      </PopoverContent>
    </PopoverRoot>
  );
}

function SafetyPopover() {
  return (
    <PopoverRoot>
      <PopoverTrigger asChild>
        <button type="button" className="shrink-0 rounded-[6px] px-1.5 py-1 font-medium text-ink underline underline-offset-2 hover:text-void">
          How this works
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(92vw,360px)] p-4 text-[13.5px] leading-relaxed">
        <p className="text-[15px] font-semibold">Supervised messaging</p>
        <ul className="mt-2 list-disc space-y-1.5 pl-4 text-ink">
          <li>Program staff who supervise your cohort can read fellowship conversations, so treat every message here as visible to them.</li>
          <li>If a message worries you, open its actions menu and choose Report. A person on the program team reviews every report.</li>
          <li>
            A few simple keyword rules flag obvious insults and attempts to move chats off-platform ({MODERATION_RULES.map((r) => r.label.toLowerCase()).join(", ")}). It&apos;s pattern matching, not AI — and a human always decides.
          </li>
        </ul>
      </PopoverContent>
    </PopoverRoot>
  );
}

export function Thread({
  conv,
  mode,
  backHref,
  headerActions,
  footerExtra,
}: {
  conv: Conversation;
  mode: ViewMode;
  backHref: string;
  headerActions?: React.ReactNode;
  footerExtra?: React.ReactNode;
}) {
  const db = useDb();
  const me = useMe()!;
  const now = useNow();
  const access = conversationAccess(db, me.id, conv);
  const messages = useMemo(() => messagesOf(db, conv.id), [db, conv.id]);
  const timeline = useMemo(() => buildTimeline(messages, now), [messages, now]);
  const pending = Object.values(db.pendingReplies).find((p) => p.conversationId === conv.id);
  const title = conversationTitle(db, conv, mode === "participant" ? me.id : null);
  const last = messages[messages.length - 1];
  const lastId = last?.id;
  const lastMine = last?.senderId === me.id;
  const others = conv.participantIds.filter((p) => p !== me.id);
  const recipientName = conv.kind === "group" || others.length > 1 ? conv.title ?? "the group" : db.users[others[0]]?.firstName ?? "them";
  const flagged = mode === "supervisor" ? messages.filter((m) => m.autoFlag || m.hidden).length : 0;
  const openReports = mode === "supervisor" ? Object.values(db.reports).filter((r) => r.conversationId === conv.id && r.status !== "resolved") : [];
  const readOnlyReason =
    mode === "supervisor" && access.mode === "participant"
      ? "You're also a participant in this conversation. The supervisor view is read-only — reply from My conversations."
      : access.readOnlyReason ?? "You can't send messages here.";

  const scrollRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const stick = useRef(true);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
    stick.current = true;
  }, [conv.id]);

  // Keep pinned to the latest message as content grows (new messages, typing, image loads).
  useEffect(() => {
    const el = scrollRef.current;
    const inner = innerRef.current;
    if (!el || !inner || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      if (stick.current) el.scrollTop = el.scrollHeight;
    });
    ro.observe(inner);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!lastMine) return;
    stick.current = true;
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [lastId, lastMine]);

  // Participants mark the thread read while it's on screen; supervisors never change read state.
  useEffect(() => {
    if (mode !== "participant") return;
    const mark = () => {
      if (document.visibilityState === "visible") markConversationRead(conv.id);
    };
    mark();
    document.addEventListener("visibilitychange", mark);
    return () => document.removeEventListener("visibilitychange", mark);
  }, [conv.id, mode, lastId]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex shrink-0 items-center gap-2 border-b border-line px-2 py-2.5 sm:gap-3 sm:px-4">
        <Link href={backHref} scroll={false} className="grid size-10 shrink-0 place-items-center rounded-[10px] hover:bg-fog md:hidden" aria-label="Back to conversations">
          <ArrowLeft className="size-5" aria-hidden />
        </Link>
        <ConversationAvatar db={db} conv={conv} viewerId={mode === "participant" ? me.id : null} size={40} />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <h2 className="truncate text-[16px] font-semibold tracking-[-0.01em]">{title}</h2>
            <KindChip kind={conv.kind} className="hidden sm:inline-flex" />
          </div>
          <p className="truncate text-[13px] text-muted">{subtitleFor(db, conv, me.id, mode)}</p>
        </div>
        {headerActions}
        <DetailsPopover db={db} conv={conv} viewerId={me.id} />
      </header>

      {mode === "participant" ? (
        <div className="flex shrink-0 items-center gap-2 border-b border-line bg-[#fafafa] px-4 py-1.5 text-[12.5px] text-muted">
          <ShieldCheck className="size-3.5 shrink-0 text-leaf-ink" aria-hidden />
          <p className="min-w-0 flex-1 truncate sm:whitespace-normal">{SUPERVISION_NOTICE}</p>
          <SafetyPopover />
        </div>
      ) : (
        <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-b border-line bg-[#fff9ea] px-4 py-2 text-[12.5px] text-[#5c3a00]">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <Eye className="size-3.5" aria-hidden /> Supervisor view · read-only
          </span>
          <span className="text-[#7a5a1f]">Opening it doesn&apos;t change read receipts.</span>
          {flagged > 0 && (
            <span className="inline-flex items-center gap-1 text-[#9f1239]">
              <ScanText className="size-3.5" aria-hidden /> {flagged} flagged or hidden
            </span>
          )}
        </div>
      )}

      <div
        ref={scrollRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
        }}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-4 pt-2 sm:px-5"
        role="log"
        aria-label={`Messages with ${title}`}
        tabIndex={0}
      >
        <div ref={innerRef} className="mx-auto flex max-w-[780px] flex-col">
          <p className="pb-1 pt-3 text-center text-[12px] text-muted">
            Conversation started {fmtDate(conv.createdAt)} · {db.cohorts[conv.cohortId]?.name}
          </p>
          {messages.length === 0 && <p className="py-10 text-center text-[14px] text-muted">No messages yet.</p>}
          <AnimatePresence initial={false}>
            {timeline.map((item) =>
              item.type === "day" ? (
                <DaySeparator key={item.key} label={item.label} />
              ) : (
                <MessageCluster key={item.key} db={db} conv={conv} viewerId={me.id} mode={mode} messages={item.messages} />
              ),
            )}
            {pending && mode === "participant" && <TypingIndicator key="typing" name={db.users[pending.fromId]?.firstName ?? "Someone"} />}
          </AnimatePresence>
        </div>
      </div>

      {mode === "participant" && access.send ? (
        <Composer key={conv.id} conv={conv} recipientName={recipientName} />
      ) : (
        <div className="shrink-0 border-t border-line bg-[#fafafa] px-4 py-3.5">
          <div className="mx-auto flex max-w-[780px] items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ash">
              {mode === "supervisor" ? <Eye className="size-4" aria-hidden /> : <Lock className="size-4" aria-hidden />}
            </span>
            <div className="min-w-0 flex-1 text-[13.5px] leading-relaxed">
              <p className="font-semibold">{mode === "supervisor" ? "You can't post in this conversation" : "Read-only conversation"}</p>
              <p className="text-muted">{readOnlyReason}</p>
              {mode === "supervisor" && openReports.length > 0 && (
                <Link href={`/admin/safeguarding?r=${openReports[0].id}`} className="mt-1 inline-flex items-center gap-1.5 font-medium text-ink underline underline-offset-2">
                  <ShieldAlert className="size-3.5" aria-hidden /> {openReports.length === 1 ? "1 open report" : `${openReports.length} open reports`} — review in Safeguarding
                </Link>
              )}
            </div>
            {footerExtra}
          </div>
        </div>
      )}
    </div>
  );
}

/** Placeholder shown on wide screens when no conversation is selected. */
export function NoThreadSelected({ action, supervisor }: { action?: React.ReactNode; supervisor?: boolean }) {
  return (
    <div className="dots-light grid h-full place-items-center p-8">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }} className="max-w-sm rounded-[20px] bg-paper p-6 text-center">
        <span className={cn("mx-auto grid size-12 place-items-center rounded-full", supervisor ? "bg-[#fff6dd]" : "bg-leaf")}>
          {supervisor ? <Eye className="size-5 text-[#7a4b00]" aria-hidden /> : <ShieldCheck className="size-5 text-leaf-ink" aria-hidden />}
        </span>
        <p className="mt-4 font-display text-[26px] leading-tight tracking-[-0.03em]">{supervisor ? "Pick a conversation to review" : "Choose a conversation"}</p>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">
          {supervisor
            ? "Supervisor views are read-only and never change read receipts. Select conversations with the checkboxes to export a record."
            : SUPERVISION_NOTICE}
        </p>
        {action && <div className="mt-5 flex justify-center">{action}</div>}
      </motion.div>
    </div>
  );
}
