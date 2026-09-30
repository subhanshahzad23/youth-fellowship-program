"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, ClipboardCheck, FileText, GraduationCap, Megaphone, MessagesSquare, ShieldAlert, Sparkles } from "lucide-react";
import type { NotificationKind } from "@/lib/domain/types";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/actions/comms";
import { notificationsOf } from "@/lib/domain/selectors";
import { useNow } from "@/lib/hooks";
import { useDb, usePersonaId } from "@/lib/store/store";
import { cn, fmtRelative } from "@/lib/utils";
import { PopoverContent, PopoverRoot, PopoverTrigger } from "@/components/ui/overlay";

const ICON: Record<NotificationKind, typeof Bell> = {
  announcement: Megaphone,
  message: MessagesSquare,
  application: FileText,
  review: FileText,
  feedback: GraduationCap,
  assignment: ClipboardCheck,
  moderation: ShieldAlert,
  enrollment: Sparkles,
  system: Bell,
};

/** Bell with unread count. Each notification opens its actual target. */
export function NotificationsButton() {
  const db = useDb();
  const me = usePersonaId();
  const now = useNow();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const items = useMemo(() => notificationsOf(db, me), [db, me]);
  const unread = items.filter((n) => !n.readAt).length;

  return (
    <PopoverRoot open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative grid size-10 place-items-center rounded-[10px] hover:bg-paper"
          aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        >
          <Bell className="size-[19px]" aria-hidden />
          {unread > 0 && (
            <span className="absolute right-1 top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-jade px-1 text-[11px] font-semibold text-void tabular">{unread > 9 ? "9+" : unread}</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(92vw,400px)] p-0">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <p className="text-[15px] font-semibold">Notifications</p>
          <button
            type="button"
            disabled={!unread}
            onClick={() => markAllNotificationsRead()}
            className="inline-flex items-center gap-1.5 rounded-[8px] px-2 py-1 text-[13px] text-muted hover:bg-fog hover:text-void disabled:opacity-40"
          >
            <CheckCheck className="size-4" aria-hidden /> Mark all read
          </button>
        </div>
        <ul className="max-h-[min(60vh,460px)] overflow-y-auto py-1">
          {items.length === 0 && <li className="px-4 py-8 text-center text-[14px] text-muted">You&apos;re all caught up.</li>}
          {items.slice(0, 25).map((n) => {
            const Icon = ICON[n.kind];
            return (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => {
                    markNotificationRead(n.id);
                    setOpen(false);
                    router.push(n.href);
                  }}
                  className={cn("flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-fog", !n.readAt && "bg-leaf/35")}
                >
                  <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-paper ring-1 ring-line">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-2">
                      <span className={cn("text-[14px] leading-snug", !n.readAt ? "font-semibold" : "font-medium")}>{n.title}</span>
                      {!n.readAt && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-jade" aria-label="Unread" />}
                    </span>
                    <span className="mt-0.5 line-clamp-2 block text-[13px] text-muted">{n.body}</span>
                    <span className="mt-1 block text-[12px] text-muted">{fmtRelative(n.createdAt, now)}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </PopoverRoot>
  );
}
