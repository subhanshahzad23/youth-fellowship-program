"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Megaphone } from "lucide-react";
import { useNow } from "@/lib/hooks";
import { useDb, useMe } from "@/lib/store/store";
import { plural } from "@/lib/utils";
import { EmptyState, Panel, PanelHeader } from "@/components/ui/display";
import { Segmented } from "@/components/ui/overlay";
import { Table, TD, TH, THead, TR } from "@/components/ui/table";
import { useAdminScope } from "../scope";
import { AnnouncementStatusBadge, audienceLabel, canViewAnnouncement, relPast, scopeLabel } from "./shared";

type Filter = "all" | "draft" | "sent" | "received";

export function AnnouncementHistory() {
  const db = useDb();
  const me = useMe()!;
  const meId = me.id;
  const now = useNow();
  const { filter } = useAdminScope();
  const [show, setShow] = useState<Filter>("all");

  const items = useMemo(
    () =>
      Object.values(db.announcements)
        .filter((a) => canViewAnnouncement(db, meId, a))
        .filter((a) => filter === "all" || a.scope === filter || a.scope === "all")
        .sort((a, b) => ((a.sentAt ?? a.createdAt) < (b.sentAt ?? b.createdAt) ? 1 : -1)),
    [db, meId, filter],
  );
  const shown = items.filter((a) => {
    if (show === "draft") return a.status === "draft";
    if (show === "sent") return a.status !== "draft";
    if (show === "received") return a.recipientIds.includes(meId);
    return true;
  });
  const counts = {
    draft: items.filter((a) => a.status === "draft").length,
    sent: items.filter((a) => a.status !== "draft").length,
    received: items.filter((a) => a.recipientIds.includes(meId)).length,
  };

  const readCount = (id: string) => Object.values(db.notifications).filter((n) => n.kind === "announcement" && n.href.endsWith(`id=${id}`) && n.readAt).length;

  return (
    <Panel className="mt-4">
      <PanelHeader
        title="History"
        description={filter === "all" ? "Drafts and sent announcements in your scope" : `Announcements that reached ${db.cohorts[filter]?.name}`}
        actions={
          <Segmented
            label="Show"
            value={show}
            onChange={setShow}
            options={[
              { value: "all", label: `All ${items.length}` },
              { value: "draft", label: `Drafts ${counts.draft}` },
              { value: "sent", label: `Sent ${counts.sent}` },
              ...(counts.received ? [{ value: "received" as const, label: `To me ${counts.received}` }] : []),
            ]}
          />
        }
      />
      {shown.length === 0 ? (
        <EmptyState icon={<Megaphone className="size-5" />} title={show === "draft" ? "No drafts" : "Nothing here yet"} description="Announcements you save or send appear here." />
      ) : (
        <>
          <div className="hidden md:block">
            <Table caption="Announcement history" className="rounded-none">
              <THead>
                <tr>
                  <TH>Announcement</TH>
                  <TH>Scope</TH>
                  <TH>Status</TH>
                  <TH align="right">Recipients</TH>
                  <TH align="right">When</TH>
                </tr>
              </THead>
              <tbody>
                {shown.map((a) => (
                  <TR key={a.id}>
                    <TD>
                      <Link href={`/admin/announcements?id=${a.id}`} className="group block">
                        <span className="block font-medium group-hover:underline">{a.title}</span>
                        <span className="block text-[12.5px] text-muted">
                          {db.users[a.senderId]?.name ?? "Former member"} · {audienceLabel(a.audience)}
                          {a.recipientIds.includes(meId) ? " · sent to you" : ""}
                        </span>
                      </Link>
                    </TD>
                    <TD className="text-[13.5px]">{scopeLabel(db, a.scope)}</TD>
                    <TD>
                      <AnnouncementStatusBadge status={a.status} />
                    </TD>
                    <TD align="right" className="tabular">
                      {a.status === "draft" ? (
                        <span className="text-muted">—</span>
                      ) : (
                        <span>
                          {a.recipientIds.length}
                          {a.status === "delivered" && <span className="block text-[12px] text-muted">{readCount(a.id)} opened</span>}
                        </span>
                      )}
                    </TD>
                    <TD align="right" className="whitespace-nowrap text-[13px] text-muted">
                      {a.status === "draft" ? `Saved ${relPast(a.createdAt, now)}` : relPast(a.sentAt, now)}
                    </TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          </div>
          <ul className="grid grid-cols-1 gap-2 md:hidden">
            {shown.map((a) => (
              <li key={a.id}>
                <Link href={`/admin/announcements?id=${a.id}`} className="block rounded-[14px] bg-fog p-3.5 hover:bg-ash">
                  <span className="flex items-start justify-between gap-2">
                    <span className="font-medium">{a.title}</span>
                    <AnnouncementStatusBadge status={a.status} />
                  </span>
                  <span className="mt-1 block text-[13px] text-muted">
                    {scopeLabel(db, a.scope)} · {a.status === "draft" ? `saved ${relPast(a.createdAt, now)}` : `${plural(a.recipientIds.length, "recipient")} · ${relPast(a.sentAt, now)}`}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </Panel>
  );
}
