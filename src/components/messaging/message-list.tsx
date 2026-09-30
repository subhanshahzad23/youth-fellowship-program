"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Check, CheckCheck, EyeOff, Flag, MoreHorizontal, ScanText, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import type { Conversation, Database, ID, Message } from "@/lib/domain/types";
import { toggleReaction } from "@/lib/actions/messaging";
import { roleLabel } from "@/lib/domain/permissions";
import { userName } from "@/lib/domain/selectors";
import { MODERATION_RULES } from "@/lib/sim/moderation";
import { cn, fmtDateTime, fmtTime } from "@/lib/utils";
import { Avatar } from "@/components/ui/display";
import { PopoverContent, PopoverRoot, PopoverTrigger } from "@/components/ui/overlay";
import { AttachmentCard } from "./attachment";
import { ReportDialog } from "./report-dialog";
import { dayKey, dayLabel, REACTIONS } from "./lib";

export type ViewMode = "participant" | "supervisor";

const EASE = [0.23, 1, 0.32, 1] as const;

export type TimelineItem = { type: "day"; key: string; label: string } | { type: "cluster"; key: string; senderId: ID; messages: Message[] };

/** Day separators + clusters of consecutive messages from the same sender (within 10 minutes). */
export function buildTimeline(messages: Message[], now: string): TimelineItem[] {
  const out: TimelineItem[] = [];
  let lastDay = "";
  let cluster: Extract<TimelineItem, { type: "cluster" }> | null = null;
  for (const m of messages) {
    const d = dayKey(m.sentAt);
    if (d !== lastDay) {
      out.push({ type: "day", key: `day-${d}`, label: dayLabel(m.sentAt, now) });
      lastDay = d;
      cluster = null;
    }
    const prev = cluster?.messages[cluster.messages.length - 1];
    if (cluster && prev && cluster.senderId === m.senderId && Date.parse(m.sentAt) - Date.parse(prev.sentAt) < 10 * 60000) {
      cluster.messages.push(m);
    } else {
      cluster = { type: "cluster", key: `cl-${m.id}`, senderId: m.senderId, messages: [m] };
      out.push(cluster);
    }
  }
  return out;
}

export function DaySeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-3" role="separator" aria-label={label}>
      <span className="h-px flex-1 bg-line" />
      <span className="text-[12px] font-medium text-muted">{label}</span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

function readStatus(db: Database, conv: Conversation, m: Message) {
  const others = conv.participantIds.filter((p) => p !== m.senderId);
  const readers = others.filter((p) => m.readBy[p]);
  const names = readers.map((p) => `${userName(db, p)} (${fmtDateTime(m.readBy[p])})`).join(", ");
  if (!others.length) return { read: false, label: "Sent", title: "" };
  if (conv.kind === "group" && others.length > 1) {
    if (readers.length === 0) return { read: false, label: "Sent", title: "Not read yet" };
    if (readers.length === others.length) return { read: true, label: "Read by everyone", title: `Read by ${names}` };
    return { read: true, label: `Read by ${readers.length} of ${others.length}`, title: `Read by ${names}` };
  }
  return readers.length === others.length ? { read: true, label: "Read", title: `Read ${fmtDateTime(m.readBy[others[0]])}` } : { read: false, label: "Sent", title: "Delivered, not read yet" };
}

export function MessageCluster({
  db,
  conv,
  viewerId,
  mode,
  messages,
  highlightId,
}: {
  db: Database;
  conv: Conversation;
  viewerId: ID;
  mode: ViewMode;
  messages: Message[];
  highlightId?: ID;
}) {
  const senderId = messages[0].senderId;
  const sender = db.users[senderId];
  const mine = mode === "participant" && senderId === viewerId;
  // Names/avatars in groups, for supervisors, and whenever the sender isn't a listed participant (e.g. a program admin stepping in).
  const showIdentity = !mine && (mode === "supervisor" || conv.kind === "group" || conv.participantIds.length > 2 || !conv.participantIds.includes(senderId));
  const last = messages[messages.length - 1];
  const status = mine ? readStatus(db, conv, last) : null;
  const staffRole = sender?.staffRoles.length ? roleLabel(db, sender) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: EASE }}
      className={cn("flex gap-2 py-1.5", mine ? "flex-row-reverse" : "flex-row")}
    >
      {showIdentity && (
        <div className="w-8 shrink-0 self-end pb-5">
          <Avatar name={sender?.name ?? "?"} hue={sender?.avatarHue} size={32} />
        </div>
      )}
      <div className={cn("flex min-w-0 max-w-[min(84%,580px)] flex-col gap-1", mine ? "items-end" : "items-start")}>
        {showIdentity && (
          <p className="px-1 text-[12.5px] text-muted">
            <span className="font-medium text-ink">{sender?.name ?? "Former member"}</span>
            {staffRole && <span> · {staffRole}</span>}
          </p>
        )}
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <MessageRow key={m.id} db={db} m={m} viewerId={viewerId} mode={mode} mine={mine} tail={i === messages.length - 1} highlight={m.id === highlightId} />
          ))}
        </AnimatePresence>
        <p className="flex items-center gap-1.5 px-1 text-[11.5px] text-muted">
          <time dateTime={last.sentAt} title={fmtDateTime(last.sentAt)}>
            {fmtTime(last.sentAt)}
          </time>
          {status && (
            <>
              <span aria-hidden>·</span>
              <span className={cn("inline-flex items-center gap-1", status.read && "text-leaf-ink")} title={status.title}>
                {status.read ? <CheckCheck className="size-3.5" aria-hidden /> : <Check className="size-3.5" aria-hidden />}
                {status.label}
              </span>
            </>
          )}
        </p>
      </div>
    </motion.div>
  );
}

function MessageRow({ db, m, viewerId, mode, mine, tail, highlight }: { db: Database; m: Message; viewerId: ID; mode: ViewMode; mine: boolean; tail: boolean; highlight: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const hiddenForMe = !!m.hidden && mode === "participant";
  const reports = Object.values(db.reports).filter((r) => r.messageId === m.id);
  const reportedByMe = reports.some((r) => r.status !== "resolved" && (r.reporterId === viewerId || r.history.some((h) => h.byId === viewerId && h.action === "Reported by participant")));
  const canAct = mode === "participant" && !hiddenForMe;
  const reactions = Object.entries(m.reactions ?? {}).filter(([, ids]) => ids.length);

  const react = (emoji: string) => {
    const r = toggleReaction(m.id, emoji);
    if (!r.ok) toast.error(r.error);
    setMenuOpen(false);
  };

  const rule = m.autoFlag ? MODERATION_RULES.find((x) => x.id === m.autoFlag!.rule) : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: EASE }}
      className={cn("group/msg flex max-w-full items-center gap-1", mine ? "flex-row-reverse" : "flex-row")}
    >
      <div className={cn("flex min-w-0 flex-col gap-1.5", mine ? "items-end" : "items-start")}>
        {hiddenForMe ? (
          <div className={cn("max-w-full rounded-[18px] border-[1.5px] border-dashed border-line bg-paper px-4 py-2.5 text-[14px] text-muted", tail && (mine ? "rounded-br-[6px]" : "rounded-bl-[6px]"))}>
            <p className="flex items-center gap-2 font-medium text-ink">
              <EyeOff className="size-4 shrink-0" aria-hidden />
              This message was hidden by the program team
            </p>
            <p className="mt-0.5 text-[13px] leading-snug">It didn&apos;t follow the fellowship&apos;s community guidelines. Questions? Talk to your program manager.</p>
          </div>
        ) : (
          <>
            {(m.body || m.hidden) && (
              <div
                title={fmtDateTime(m.sentAt)}
                className={cn(
                  "max-w-full whitespace-pre-wrap break-words rounded-[18px] px-4 py-2.5 text-[15px] leading-relaxed [overflow-wrap:anywhere]",
                  mine ? "bg-void text-paper" : "bg-fog text-void",
                  m.hidden && "border-[1.5px] border-dashed border-[#d9a441] bg-[#fff6dd] text-void",
                  tail && (mine ? "rounded-br-[6px]" : "rounded-bl-[6px]"),
                  highlight && "ring-2 ring-[#d9a441] ring-offset-2",
                )}
              >
                {m.body || <span className="italic text-muted">(attachment only)</span>}
              </div>
            )}
            {m.attachments.map((a) => (
              <AttachmentCard key={a.id} att={a} className={highlight && !m.body ? "ring-2 ring-[#d9a441] ring-offset-2" : undefined} />
            ))}
          </>
        )}

        {!hiddenForMe && reactions.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {reactions.map(([emoji, ids]) => {
              const meToo = ids.includes(viewerId);
              const label = REACTIONS.find((r) => r.emoji === emoji)?.label ?? "reaction";
              const names = ids.map((id) => userName(db, id)).join(", ");
              return canAct ? (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => react(emoji)}
                  aria-pressed={meToo}
                  aria-label={`${label}, ${ids.length} ${ids.length === 1 ? "person" : "people"}${meToo ? ", including you" : ""}. ${meToo ? "Remove your reaction" : "Add your reaction"}`}
                  title={names}
                  className={cn(
                    "inline-flex h-7 items-center gap-1 rounded-full border px-2 text-[13px] tabular transition-colors",
                    meToo ? "border-jade bg-leaf text-leaf-ink" : "border-line bg-paper hover:border-[#b9c0c6]",
                  )}
                >
                  <span aria-hidden>{emoji}</span>
                  {ids.length}
                </button>
              ) : (
                <span key={emoji} title={names} className="inline-flex h-7 items-center gap-1 rounded-full border border-line bg-paper px-2 text-[13px] tabular">
                  <span aria-hidden>{emoji}</span>
                  <span className="sr-only">{label}:</span>
                  {ids.length}
                </span>
              );
            })}
          </div>
        )}

        {mode === "participant" && reportedByMe && (
          <p className="flex items-center gap-1.5 px-1 text-[12px] text-muted">
            <Flag className="size-3" aria-hidden /> You reported this · the program team is reviewing it
          </p>
        )}

        {mode === "supervisor" && (m.hidden || m.autoFlag || reports.length > 0) && (
          <div className={cn("flex max-w-full flex-col gap-1 px-1 text-[12px]", mine ? "items-end text-right" : "items-start")}>
            {m.hidden && (
              <p className="flex items-start gap-1.5 text-[#7a4b00]">
                <EyeOff className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                <span>
                  <span className="font-semibold">Hidden</span> · {m.hidden.reason} <span className="text-muted">— {userName(db, m.hidden.byId)}, {fmtDateTime(m.hidden.at)}</span>
                </span>
              </p>
            )}
            {m.autoFlag && (
              <p className="flex items-start gap-1.5 text-[#9f1239]">
                <ScanText className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                <span>
                  Keyword rule: {rule?.label ?? m.autoFlag.rule} (matched “{m.autoFlag.matched}”)
                </span>
              </p>
            )}
            {reports.map((r) => (
              <Link key={r.id} href={`/admin/safeguarding?r=${r.id}`} className="flex items-center gap-1.5 text-ink underline-offset-2 hover:underline">
                <ShieldAlert className="size-3.5 shrink-0" aria-hidden />
                Report · {r.status === "in_review" ? "In review" : r.status === "open" ? "Open" : "Resolved"} · {r.reason}
              </Link>
            ))}
          </div>
        )}
      </div>

      {canAct && (
        <PopoverRoot open={menuOpen} onOpenChange={setMenuOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={`Actions for message from ${mine ? "you" : userName(db, m.senderId)}`}
              className={cn(
                "grid size-9 shrink-0 place-items-center rounded-full text-muted transition-[opacity,background-color] hover:bg-fog hover:text-void focus-visible:opacity-100 data-[state=open]:bg-fog data-[state=open]:opacity-100",
                "opacity-0 group-hover/msg:opacity-100 group-focus-within/msg:opacity-100 pointer-coarse:opacity-70",
              )}
            >
              <MoreHorizontal className="size-4" aria-hidden />
            </button>
          </PopoverTrigger>
          <PopoverContent side="top" align={mine ? "end" : "start"} sideOffset={6} className="w-[236px] p-1.5">
            <p className="px-2 pb-1 pt-1 text-[11.5px] font-medium uppercase tracking-[0.14em] text-muted">React</p>
            <div className="flex gap-1 px-1 pb-1">
              {REACTIONS.map((r) => {
                const on = (m.reactions?.[r.emoji] ?? []).includes(viewerId);
                return (
                  <button
                    key={r.emoji}
                    type="button"
                    onClick={() => react(r.emoji)}
                    aria-pressed={on}
                    aria-label={`${on ? "Remove" : "React with"} ${r.label}`}
                    className={cn("grid size-11 place-items-center rounded-[10px] text-[20px] transition-colors hover:bg-fog", on && "bg-leaf")}
                  >
                    <span aria-hidden>{r.emoji}</span>
                  </button>
                );
              })}
            </div>
            {!mine && (
              <>
                <div className="my-1 h-px bg-line" />
                <button
                  type="button"
                  disabled={reportedByMe}
                  onClick={() => {
                    setMenuOpen(false);
                    setReportOpen(true);
                  }}
                  className="flex min-h-10 w-full items-center gap-2.5 rounded-[9px] px-3 text-left text-[14px] text-[#b00d28] hover:bg-fog disabled:cursor-not-allowed disabled:text-muted disabled:hover:bg-transparent"
                >
                  <Flag className="size-4" aria-hidden />
                  {reportedByMe ? "Already reported" : "Report message"}
                </button>
              </>
            )}
          </PopoverContent>
        </PopoverRoot>
      )}
      {reportOpen && <ReportDialog message={m} open={reportOpen} onOpenChange={setReportOpen} />}
    </motion.div>
  );
}
