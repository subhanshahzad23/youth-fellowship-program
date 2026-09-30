"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Megaphone } from "lucide-react";
import { markNotificationRead } from "@/lib/actions/comms";
import { useNow } from "@/lib/hooks";
import { useDb, useMe } from "@/lib/store/store";
import { cn, fmtDateTime, fmtRelative } from "@/lib/utils";
import { Avatar, Badge, EmptyState, PageHeader, Panel, RestrictedState } from "@/components/ui/display";
import { Paragraphs } from "@/components/ui/rich-text";

/**
 * Announcements the signed-in person received (fellow workspace and staff
 * portal). `?id=` opens one and marks its bell notification read.
 */
export function AnnouncementInbox({ base, settingsHref }: { base: "/workspace/announcements" | "/staff/announcements"; settingsHref: string }) {
  const db = useDb();
  const me = useMe()!;
  const meId = me.id;
  const now = useNow();
  const params = useSearchParams();
  const openId = params.get("id");

  const items = useMemo(
    () =>
      Object.values(db.announcements)
        .filter((a) => a.status === "delivered" && a.recipientIds.includes(meId))
        .sort((a, b) => ((a.deliveredAt ?? "") < (b.deliveredAt ?? "") ? 1 : -1)),
    [db.announcements, meId],
  );
  const unreadIds = useMemo(() => {
    const set = new Set<string>();
    for (const n of Object.values(db.notifications)) {
      if (n.userId !== meId || n.kind !== "announcement" || n.readAt) continue;
      const m = n.href.match(/[?&]id=([^&]+)/);
      if (m) set.add(m[1]);
    }
    return set;
  }, [db.notifications, meId]);

  const open = openId ? db.announcements[openId] : undefined;
  const received = !!open && open.status === "delivered" && open.recipientIds.includes(meId);

  // Opening an announcement marks its bell notification(s) as read.
  useEffect(() => {
    if (!openId || !received) return;
    for (const n of Object.values(db.notifications)) {
      if (n.userId === meId && n.kind === "announcement" && !n.readAt && n.href.endsWith(`id=${openId}`)) markNotificationRead(n.id);
    }
  }, [openId, received, db.notifications, meId]);

  const list = (
    <ul className="grid grid-cols-1 gap-2">
      {items.map((a) => {
        const sender = db.users[a.senderId];
        const active = a.id === openId;
        const unread = unreadIds.has(a.id);
        return (
          <li key={a.id}>
            <Link
              href={`${base}?id=${a.id}`}
              scroll={false}
              aria-current={active ? "true" : undefined}
              className={cn("flex items-start gap-3 rounded-[14px] p-3.5 transition-colors", active ? "bg-void text-paper" : "bg-paper hover:bg-[#fafafa]")}
            >
              <span className={cn("mt-0.5 grid size-9 shrink-0 place-items-center rounded-full", active ? "bg-white/10" : "bg-fog")}>
                <Megaphone className="size-4" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-start justify-between gap-2">
                  <span className={cn("text-[14.5px]", unread ? "font-semibold" : "font-medium")}>{a.title}</span>
                  {unread && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-jade" aria-label="Unread" />}
                </span>
                <span className={cn("mt-0.5 line-clamp-2 block text-[13px]", active ? "text-paper/70" : "text-muted")}>{a.body.split("\n")[0]}</span>
                <span className={cn("mt-1 block text-[12px]", active ? "text-paper/60" : "text-muted")}>
                  {sender?.name ?? "Program team"} · {fmtRelative(a.deliveredAt, a.deliveredAt && a.deliveredAt > now ? a.deliveredAt : now)}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );

  let reader: React.ReactNode = null;
  if (openId) {
    if (!open)
      reader = (
        <Panel>
          <RestrictedState title="Announcement not found" reason="It may have been removed or the demo data was reset. Your other announcements are listed here." />
        </Panel>
      );
    else if (!received)
      reader = (
        <Panel>
          <RestrictedState title="This announcement wasn't sent to you" reason="Announcements go to specific cohorts and audiences. You can read everything that was sent to you in this list." />
        </Panel>
      );
    else {
      const sender = db.users[open.senderId];
      reader = (
        <Panel as="article" aria-labelledby="an-title">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="neutral">{open.scope === "all" ? "All cohorts" : db.cohorts[open.scope]?.name}</Badge>
            <span className="text-[13px] text-muted">{fmtDateTime(open.deliveredAt)} UTC</span>
          </div>
          <h2 id="an-title" className="mt-3 font-display text-[32px] leading-[1.1] tracking-[-0.03em]">
            {open.title}
          </h2>
          <div className="mt-3 flex items-center gap-2.5 text-[14px]">
            {sender && <Avatar name={sender.name} hue={sender.avatarHue} size={32} />}
            <span>
              <span className="font-medium">{sender?.name ?? "Program team"}</span>
              {sender?.title && <span className="block text-[12.5px] text-muted">{sender.title}</span>}
            </span>
          </div>
          <div className="mt-6 space-y-4 text-[16px] leading-relaxed text-ink">
            <Paragraphs text={open.body} />
          </div>
          <p className="mt-8 border-t border-line pt-4 text-[13px] text-muted">
            {me.notificationPrefs.emailAnnouncements ? "A copy was also sent to your email (simulated)." : "Announcement emails are off, so this arrived in the portal only."}{" "}
            <Link href={settingsHref} className="font-medium text-void underline underline-offset-2">
              Notification settings
            </Link>
          </p>
        </Panel>
      );
    }
  }

  return (
    <>
      <PageHeader title="Announcements" description="Updates from your program team. New ones also appear under the bell." />
      {items.length === 0 && !openId ? (
        <EmptyState icon={<Megaphone className="size-5" />} title="No announcements yet" description="When your program team sends an update to your cohort, it will appear here and under the bell." />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
          <div className={cn(openId && "hidden lg:block")}>{items.length ? list : <p className="text-[14px] text-muted">No announcements yet.</p>}</div>
          <div className={cn(!openId && "hidden lg:block")}>
            {openId && (
              <Link href={base} scroll={false} className="mb-3 inline-flex h-10 items-center gap-1.5 rounded-[8px] pr-2 text-[14px] text-muted hover:text-void lg:hidden">
                <ArrowLeft className="size-4" aria-hidden /> All announcements
              </Link>
            )}
            {reader ?? (
              <div className="grid h-full min-h-[240px] place-items-center rounded-[20px] border-[1.5px] border-dashed border-line p-8 text-center">
                <div>
                  <Megaphone className="mx-auto size-6 text-muted" aria-hidden />
                  <p className="mt-3 text-[15px] font-medium">Choose an announcement to read it</p>
                  <p className="mt-1 text-[13.5px] text-muted">{items.length} in total · newest first</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
