"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, ChevronDown, CircleSlash, Eye, FileEdit, Loader2, MailX } from "lucide-react";
import type { Announcement, Database, ID } from "@/lib/domain/types";
import { adminCohortIds, canAnnounce, isExec } from "@/lib/domain/permissions";
import { sortedCohorts } from "@/lib/domain/selectors";
import { useDb, usePersonaId } from "@/lib/store/store";
import { cn, fmtRelative, plural } from "@/lib/utils";
import { Avatar, Badge } from "@/components/ui/display";

/** Relative time that never reads as "in the future" when the display clock lags a just-written timestamp. */
export function relPast(iso: string | undefined, now: string) {
  return fmtRelative(iso, iso && iso > now ? iso : now);
}

export function scopeLabel(db: Database, scope: "all" | ID) {
  return scope === "all" ? "All cohorts" : db.cohorts[scope]?.name ?? "Unknown cohort";
}
export function audienceLabel(a: Announcement["audience"]) {
  return a === "fellows" ? "Fellows" : "Fellows and staff";
}

/** Cohorts an announcement with this scope reaches (mirrors recipientsFor). */
export function targetCohortIds(db: Database, scope: "all" | ID) {
  return scope === "all" ? sortedCohorts(db).filter((c) => c.status === "active" || c.status === "intake").map((c) => c.id) : [scope];
}

export function canViewAnnouncement(db: Database, userId: ID, a: Announcement) {
  if (isExec(db, userId) || a.senderId === userId || a.recipientIds.includes(userId)) return true;
  return a.scope !== "all" && canAnnounce(db, userId, a.scope).ok;
}
export function canEditAnnouncement(db: Database, userId: ID, a: Announcement) {
  return a.status === "draft" && canAnnounce(db, userId, a.scope).ok;
}

/**
 * Recipients the viewer may see by name: everyone for executives, otherwise
 * only people who belong to a cohort the viewer manages.
 */
export function listableRecipients(db: Database, viewerId: ID | null | undefined, ids: ID[]) {
  if (isExec(db, viewerId)) return ids;
  const mine = adminCohortIds(db, viewerId);
  const ok = new Set(Object.values(db.memberships).filter((m) => m.status === "active" && mine.includes(m.cohortId)).map((m) => m.userId));
  return ids.filter((id) => ok.has(id));
}

export function AnnouncementStatusBadge({ status }: { status: Announcement["status"] }) {
  if (status === "draft")
    return (
      <Badge tone="neutral" icon={<FileEdit className="size-3.5" aria-hidden />}>
        Draft
      </Badge>
    );
  if (status === "sending")
    return (
      <Badge tone="amber" icon={<Loader2 className="size-3.5 animate-spin" aria-hidden />}>
        Sending…
      </Badge>
    );
  return (
    <Badge tone="green" icon={<CheckCircle2 className="size-3.5" aria-hidden />}>
      Delivered
    </Badge>
  );
}

const ROLE_WORD = { fellow: "Fellow", program_admin: "Program admin", instructor: "Instructor", mentor: "Mentor" } as const;

/**
 * Recipient breakdown by cohort, the cohorts that are NOT reached, and an
 * expandable list of every recipient.
 */
export function RecipientBreakdown({ ids, scope, delivered, announcementId, defaultOpen = false }: { ids: ID[]; scope: "all" | ID; delivered?: boolean; announcementId?: ID; defaultOpen?: boolean }) {
  const db = useDb();
  const viewerId = usePersonaId();
  const [open, setOpen] = useState(defaultOpen);
  const data = useMemo(() => {
    const targets = targetCohortIds(db, scope);
    const listable = new Set(listableRecipients(db, viewerId, ids));
    const set = new Set(ids);
    const perCohort = targets.map((cid) => {
      const ms = Object.values(db.memberships).filter((m) => m.cohortId === cid && m.status === "active" && set.has(m.userId));
      return { cohort: db.cohorts[cid], fellows: new Set(ms.filter((m) => m.role === "fellow").map((m) => m.userId)).size, staff: new Set(ms.filter((m) => m.role !== "fellow").map((m) => m.userId)).size };
    });
    const others = sortedCohorts(db).filter((c) => !targets.includes(c.id));
    const people = ids
      .filter((id) => listable.has(id))
      .map((id) => {
        const u = db.users[id];
        if (!u) return null;
        const ms = Object.values(db.memberships).filter((m) => m.userId === id && m.status === "active" && targets.includes(m.cohortId));
        const roles = [...new Set(ms.map((m) => ROLE_WORD[m.role]))];
        const cohorts = [...new Set(ms.map((m) => db.cohorts[m.cohortId]?.name))];
        const read = announcementId
          ? Object.values(db.notifications).some((n) => n.userId === id && n.kind === "announcement" && n.href.endsWith(`id=${announcementId}`) && n.readAt)
          : false;
        return { u, roles, cohorts, read, emailOff: !u.notificationPrefs.emailAnnouncements };
      })
      .filter((x): x is NonNullable<typeof x> => !!x)
      .sort((a, b) => a.u.name.localeCompare(b.u.name));
    return { perCohort, others, people, hidden: ids.length - listable.size, emailOff: people.filter((p) => p.emailOff).length, read: people.filter((p) => p.read).length };
  }, [db, ids, scope, announcementId, viewerId]);

  return (
    <div>
      <ul className="grid grid-cols-1 gap-2">
        {data.perCohort.map(({ cohort, fellows, staff }) => (
          <li key={cohort.id} className="flex items-center justify-between gap-3 rounded-[10px] bg-fog px-3 py-2 text-[13.5px]">
            <span className="inline-flex items-center gap-2 font-medium">
              <CheckCircle2 className="size-4 text-leaf-ink" aria-hidden />
              {cohort.name}
            </span>
            <span className="text-muted tabular">
              {plural(fellows, "fellow")}
              {staff ? ` · ${staff} staff` : ""}
            </span>
          </li>
        ))}
        {data.others.map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-3 rounded-[10px] border border-dashed border-line px-3 py-2 text-[13.5px] text-muted">
            <span className="inline-flex items-center gap-2">
              <CircleSlash className="size-4" aria-hidden />
              {c.name}
            </span>
            <span>{delivered ? "Didn't receive it" : "Not included"}</span>
          </li>
        ))}
      </ul>
      {scope === "all" && <p className="mt-2 text-[12.5px] text-muted">“All cohorts” reaches cohorts that are active or taking applications. Announced and completed cohorts are not included.</p>}
      {data.emailOff > 0 && (
        <p className="mt-2 inline-flex items-center gap-1.5 text-[12.5px] text-muted">
          <MailX className="size-3.5" aria-hidden /> {plural(data.emailOff, "person has", "people have")} announcement emails turned off — they get the portal notification only.
        </p>
      )}
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-[8px] px-2 text-[13.5px] font-medium hover:bg-fog">
        <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} aria-hidden />
        {open ? "Hide" : "Show"} {data.hidden ? "" : "all "}
        {plural(data.people.length, "recipient")}
        {data.hidden ? " in your cohorts" : ""}
        {delivered && announcementId ? <span className="font-normal text-muted"> · {data.read} opened in the portal</span> : null}
      </button>
      {open && (
        <ul className="mt-1 max-h-[340px] divide-y divide-line overflow-y-auto rounded-[12px] border border-line">
          {data.people.map(({ u, roles, cohorts, read, emailOff }) => (
            <li key={u.id} className="flex items-center gap-3 px-3 py-2">
              <Avatar name={u.name} hue={u.avatarHue} size={28} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-medium">{u.name}</span>
                <span className="block truncate text-[12px] text-muted">
                  {roles.join(", ")} · {cohorts.join(", ")}
                </span>
              </span>
              {emailOff && <MailX className="size-3.5 shrink-0 text-muted" aria-label="Announcement emails off" />}
              {delivered && announcementId && (
                <span className={cn("inline-flex shrink-0 items-center gap-1 text-[12px]", read ? "text-leaf-ink" : "text-muted")}>
                  <Eye className="size-3.5" aria-hidden />
                  {read ? "Opened" : "Unread"}
                </span>
              )}
            </li>
          ))}
          {data.people.length === 0 && <li className="px-3 py-4 text-center text-[13.5px] text-muted">{data.hidden ? "No recipients in your cohorts." : "Nobody in this audience yet."}</li>}
        </ul>
      )}
      {open && data.hidden > 0 && <p className="mt-2 text-[12.5px] text-muted">{plural(data.hidden, "recipient")} in cohorts outside your scope {data.hidden === 1 ? "isn't" : "aren't"} listed by name.</p>}
    </div>
  );
}
