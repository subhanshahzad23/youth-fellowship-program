"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, MapPin, MessagesSquare, Search, Users } from "lucide-react";
import type { ID, User } from "@/lib/domain/types";
import { canMessage, directoryVisibleUserIds, fellowMembership } from "@/lib/domain/permissions";
import { cohortPhaseLabel } from "@/lib/domain/selectors";
import { useNow } from "@/lib/hooks";
import { useDb, useMe } from "@/lib/store/store";
import { cn, fmtDate, plural } from "@/lib/utils";
import { Button, ButtonLink } from "@/components/ui/button";
import { Avatar, Badge, EmptyState, PageHeader, Panel, PanelHeader, RestrictedState } from "@/components/ui/display";
import { Input, Select } from "@/components/ui/form";
import { DialogContent, DialogRoot } from "@/components/ui/overlay";
import { CohortTimeline } from "@/components/portal/cohort-timeline";

export function CohortView() {
  const db = useDb();
  const me = useMe()!;
  const meId = me.id;
  const now = useNow();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const openId = params.get("u");
  const fm = fellowMembership(db, meId)!;
  const cohort = db.cohorts[fm.cohortId];
  const [q, setQ] = useState("");
  const [track, setTrack] = useState("all");

  const directory = useMemo(() => {
    const ids = new Set(directoryVisibleUserIds(db, meId));
    return Object.values(db.memberships)
      .filter((m) => m.role === "fellow" && m.status === "active" && m.cohortId === fm.cohortId && ids.has(m.userId))
      .map((m) => ({ u: db.users[m.userId], trackId: m.trackId }))
      .filter((x): x is { u: User; trackId: ID | undefined } => !!x.u)
      .sort((a, b) => (a.u.id === meId ? -1 : b.u.id === meId ? 1 : a.u.name.localeCompare(b.u.name)));
  }, [db, meId, fm.cohortId]);

  const staff = useMemo(() => {
    const ms = Object.values(db.memberships).filter((m) => m.cohortId === fm.cohortId && m.status === "active");
    const managers = ms.filter((m) => m.role === "program_admin").map((m) => ({ u: db.users[m.userId], label: "Program manager", mine: false }));
    const instructors = cohort.trackIds.flatMap((tid) =>
      ms.filter((m) => m.role === "instructor" && m.trackId === tid).map((m) => ({ u: db.users[m.userId], label: `${db.tracks[tid]?.name} instructor`, mine: tid === fm.trackId })),
    );
    return [...managers, ...instructors].filter((x) => x.u);
  }, [db, fm.cohortId, fm.trackId, cohort.trackIds]);

  const shown = directory.filter(({ u, trackId }) => {
    if (track !== "all" && trackId !== track) return false;
    const needle = q.trim().toLowerCase();
    return !needle || [u.name, u.ventureName ?? "", u.ventureSummary ?? ""].some((s) => s.toLowerCase().includes(needle));
  });

  const setOpen = (id: string | null) => router.replace(id ? `${pathname}?u=${id}` : pathname, { scroll: false });
  const openEntry = openId ? directory.find((d) => d.u.id === openId) : undefined;

  return (
    <>
      <PageHeader
        eyebrow={`${cohort.name} · ${cohortPhaseLabel(cohort, now)}`}
        title="Your cohort"
        description={cohort.description}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Panel>
          <PanelHeader title={`${cohort.name} timeline`} description={`${fmtDate(cohort.startDate)} – ${fmtDate(cohort.endDate)}`} />
          <CohortTimeline cohort={cohort} now={now} />
          <dl className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
            <div className="rounded-[12px] bg-fog px-3 py-2.5">
              <dt className="text-[12.5px] text-muted">Fellows</dt>
              <dd className="text-[18px] font-semibold tabular">{directory.length}</dd>
            </div>
            <div className="rounded-[12px] bg-fog px-3 py-2.5">
              <dt className="text-[12.5px] text-muted">Tracks</dt>
              <dd className="text-[18px] font-semibold tabular">{cohort.trackIds.length}</dd>
            </div>
            <div className="col-span-2 rounded-[12px] bg-fog px-3 py-2.5 sm:col-span-1">
              <dt className="inline-flex items-center gap-1 text-[12.5px] text-muted">
                <MapPin className="size-3.5" aria-hidden /> Where
              </dt>
              <dd className="text-[14px] font-medium">{cohort.location}</dd>
            </div>
          </dl>
        </Panel>

        <Panel>
          <PanelHeader title="Program team" description="The people running your cohort" />
          <ul className="divide-y divide-line">
            {staff.map(({ u, label, mine }) => {
              const can = canMessage(db, meId, u.id);
              return (
                <li key={`${u.id}-${label}`} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <Avatar name={u.name} hue={u.avatarHue} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-1.5 text-[14.5px] font-medium">
                      {u.name}
                      {mine && <Badge tone="green">Your track</Badge>}
                    </p>
                    <p className="truncate text-[13px] text-muted">{label}</p>
                  </div>
                  {can.ok ? (
                    <ButtonLink href={`/workspace/messages?to=${u.id}`} size="sm" variant="soft" icon={<MessagesSquare className="size-3.5" />} aria-label={`Message ${u.name}`}>
                      Message
                    </ButtonLink>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>

      <Panel className="mt-4">
        <PanelHeader title="Fellow directory" description={`${plural(directory.length, "fellow")} in ${cohort.name}. Contact details stay private — say hello through Messages.`} />
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search names or ventures" aria-label="Search the directory" className="h-10 pl-9" />
          </div>
          <div className="w-full sm:w-56">
            <Select value={track} onChange={(e) => setTrack(e.target.value)} aria-label="Filter by track" className="h-10">
              <option value="all">All tracks</option>
              {cohort.trackIds.map((t) => (
                <option key={t} value={t}>
                  {db.tracks[t]?.name}
                </option>
              ))}
            </Select>
          </div>
          <p className="text-[13px] text-muted sm:ml-auto" aria-live="polite">
            {shown.length === directory.length ? "" : `${shown.length} of ${directory.length}`}
          </p>
        </div>
        {shown.length === 0 ? (
          <EmptyState icon={<Users className="size-5" />} title="Nobody matches" description="Try another name or track." action={<Button size="sm" variant="outline" onClick={() => (setQ(""), setTrack("all"))}>Clear filters</Button>} />
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {shown.map(({ u, trackId }) => (
              <li key={u.id}>
                <button
                  type="button"
                  onClick={() => setOpen(u.id)}
                  className={cn("flex h-full w-full flex-col rounded-[16px] p-4 text-left transition-colors", u.id === meId ? "bg-leaf/60 hover:bg-leaf" : "bg-fog hover:bg-ash")}
                >
                  <span className="flex items-center gap-3">
                    <Avatar name={u.name} hue={u.avatarHue} size={42} />
                    <span className="min-w-0">
                      <span className="block truncate text-[15px] font-medium">
                        {u.name}
                        {u.id === meId && <span className="ml-1.5 text-[12.5px] font-normal text-leaf-ink">(you)</span>}
                      </span>
                      <span className="block truncate text-[12.5px] text-muted">{[u.pronouns, trackId ? db.tracks[trackId]?.shortName : undefined].filter(Boolean).join(" · ")}</span>
                    </span>
                  </span>
                  {u.ventureName && (
                    <span className="mt-3 block">
                      <span className="flex flex-wrap items-center gap-1.5 text-[14px] font-semibold">
                        {u.ventureName}
                        {u.ventureStage && <Badge tone="neutral">{u.ventureStage}</Badge>}
                      </span>
                      {u.ventureSummary && <span className="mt-1 line-clamp-2 block text-[13.5px] leading-snug text-ink">{u.ventureSummary}</span>}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <DialogRoot open={!!openId} onOpenChange={(o) => !o && setOpen(null)}>
        {openId && (
          <DialogContent title={openEntry ? openEntry.u.name : "Profile"} description={openEntry ? `${cohort.name} fellow` : undefined} size="sm">
            {openEntry ? (
              <ProfileCard u={openEntry.u} trackId={openEntry.trackId} isMe={openEntry.u.id === meId} canMsg={canMessage(db, meId, openEntry.u.id)} onClose={() => setOpen(null)} />
            ) : (
              <RestrictedState title="Not in your cohort directory" reason="The directory shows fellows in your own cohort. Your program manager can help you connect with someone else." />
            )}
          </DialogContent>
        )}
      </DialogRoot>
    </>
  );
}

function ProfileCard({ u, trackId, isMe, canMsg, onClose }: { u: User; trackId?: ID; isMe: boolean; canMsg: { ok: boolean; reason?: string }; onClose: () => void }) {
  const db = useDb();
  const track = trackId ? db.tracks[trackId] : undefined;
  return (
    <div>
      <div className="flex items-center gap-4">
        <Avatar name={u.name} hue={u.avatarHue} size={64} />
        <div className="min-w-0">
          <p className="font-display text-[26px] leading-tight tracking-[-0.03em]">{u.name}</p>
          <p className="text-[13.5px] text-muted">{[u.pronouns, track?.name].filter(Boolean).join(" · ")}</p>
        </div>
      </div>
      {u.ventureName && (
        <div className="mt-5 rounded-[14px] bg-fog p-4">
          <p className="eyebrow text-muted">Venture</p>
          <p className="mt-1.5 flex flex-wrap items-center gap-2 text-[16px] font-semibold">
            {u.ventureName}
            {u.ventureStage && <Badge tone="neutral">{u.ventureStage}</Badge>}
          </p>
          {u.ventureSummary && <p className="mt-1.5 text-[14.5px] leading-relaxed text-ink">{u.ventureSummary}</p>}
        </div>
      )}
      {u.bio && <p className="mt-4 text-[14.5px] leading-relaxed text-ink">{u.bio}</p>}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        {isMe ? (
          <p className="inline-flex items-center gap-1.5 text-[13.5px] text-muted">
            <CalendarDays className="size-4" aria-hidden /> This is how your cohort-mates see you.
          </p>
        ) : canMsg.ok ? (
          <ButtonLink href={`/workspace/messages?to=${u.id}`} icon={<MessagesSquare className="size-4" />} onClick={onClose}>
            Message {u.firstName}
          </ButtonLink>
        ) : (
          <p className="text-[13.5px] text-muted">{canMsg.reason}</p>
        )}
      </div>
      <p className="mt-4 text-[12px] text-muted">Email, phone and home details are never shown in the directory.</p>
    </div>
  );
}
