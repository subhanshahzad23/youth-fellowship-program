"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { HeartHandshake, Search, UserRound } from "lucide-react";
import { toast } from "sonner";
import type { Cohort, ID, Membership } from "@/lib/domain/types";
import { setFellowTrack } from "@/lib/actions/admin";
import { mentorsOfFellow } from "@/lib/domain/permissions";
import { trackProgress } from "@/lib/domain/selectors";
import { useDb } from "@/lib/store/store";
import { plural, sleep } from "@/lib/utils";
import { Button, ButtonLink } from "@/components/ui/button";
import { Avatar, EmptyState, Panel, ProgressBar } from "@/components/ui/display";
import { Input, Select } from "@/components/ui/form";
import { ConfirmDialog } from "@/components/ui/overlay";
import { Table, TD, TH, THead, TR } from "@/components/ui/table";
import { PairMentorDialog } from "../pair-mentor-dialog";

export function FellowsTab({ cohort }: { cohort: Cohort }) {
  const db = useDb();
  const [q, setQ] = useState("");
  const [track, setTrack] = useState("all");
  const [pairFor, setPairFor] = useState<ID | null>(null);
  const [trackChange, setTrackChange] = useState<{ m: Membership; to: ID } | null>(null);

  const rows = useMemo(() => {
    return Object.values(db.memberships)
      .filter((m) => m.cohortId === cohort.id && m.role === "fellow" && m.status === "active")
      .map((m) => {
        const u = db.users[m.userId];
        const mentorId = mentorsOfFellow(db, m.userId)[0];
        const p = m.trackId ? trackProgress(db, m.userId, m.trackId) : { pct: 0, done: 0, total: 0 };
        return { m, u, mentor: mentorId ? db.users[mentorId] : undefined, p };
      })
      .filter((r) => r.u)
      .sort((a, b) => a.u.name.localeCompare(b.u.name));
  }, [db, cohort.id]);

  const shown = rows.filter((r) => {
    if (track !== "all" && r.m.trackId !== track) return false;
    const needle = q.trim().toLowerCase();
    return !needle || r.u.name.toLowerCase().includes(needle) || (r.u.ventureName ?? "").toLowerCase().includes(needle);
  });

  const trackSelect = (r: (typeof rows)[number], id: string) => (
    <Select
      id={id}
      aria-label={`Track for ${r.u.name}`}
      value={r.m.trackId ?? ""}
      onChange={(e) => e.target.value && e.target.value !== r.m.trackId && setTrackChange({ m: r.m, to: e.target.value })}
      className="h-9 text-[14px]"
    >
      {!r.m.trackId && <option value="">No track</option>}
      {cohort.trackIds.map((t) => (
        <option key={t} value={t}>
          {db.tracks[t]?.name}
        </option>
      ))}
    </Select>
  );

  const mentorCell = (r: (typeof rows)[number]) =>
    r.mentor ? (
      <span className="flex items-center gap-2">
        <Avatar name={r.mentor.name} hue={r.mentor.avatarHue} size={26} />
        <span className="truncate">{r.mentor.name}</span>
      </span>
    ) : (
      <Button size="sm" variant="soft" icon={<HeartHandshake className="size-3.5" />} onClick={() => setPairFor(r.u.id)}>
        Pair mentor
      </Button>
    );

  return (
    <Panel>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search fellows or ventures" aria-label="Search fellows" className="h-10 pl-9" />
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
        <p className="text-[13.5px] text-muted sm:ml-auto">
          {shown.length === rows.length ? plural(rows.length, "fellow") : `${shown.length} of ${rows.length} fellows`} · capacity {cohort.capacity}
        </p>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={<UserRound className="size-5" />} title="No fellows enrolled yet" description="Approving an application enrolls the applicant here on the same identity." action={<ButtonLink href="/admin/applications" size="sm" variant="outline">Review applications</ButtonLink>} />
      ) : shown.length === 0 ? (
        <EmptyState title="No fellows match" description="Try a different name or track." action={<Button size="sm" variant="outline" onClick={() => (setQ(""), setTrack("all"))}>Clear filters</Button>} />
      ) : (
        <>
          <div className="hidden md:block">
            <Table caption={`${cohort.name} fellows`} className="rounded-none">
              <THead>
                <tr>
                  <TH>Fellow</TH>
                  <TH className="w-[210px]">Track</TH>
                  <TH>Mentor</TH>
                  <TH className="w-[170px]">Progress</TH>
                  <TH align="right">
                    <span className="sr-only">Actions</span>
                  </TH>
                </tr>
              </THead>
              <tbody>
                {shown.map((r) => (
                  <TR key={r.m.id}>
                    <TD>
                      <Link href={`/admin/people?u=${r.u.id}`} className="group flex items-center gap-3">
                        <Avatar name={r.u.name} hue={r.u.avatarHue} size={34} />
                        <span className="min-w-0">
                          <span className="block font-medium group-hover:underline">{r.u.name}</span>
                          <span className="block truncate text-[13px] text-muted">{r.u.ventureName ?? "—"}</span>
                        </span>
                      </Link>
                    </TD>
                    <TD>{trackSelect(r, `track-${r.m.id}`)}</TD>
                    <TD>{mentorCell(r)}</TD>
                    <TD>
                      <div className="flex items-center gap-2">
                        <ProgressBar value={r.p.pct} className="h-1.5" label={`${r.u.name} progress`} />
                        <span className="w-10 shrink-0 text-right text-[13px] tabular">{r.p.pct}%</span>
                      </div>
                      <p className="mt-0.5 text-[12px] text-muted">
                        {r.p.done} / {r.p.total} sessions
                      </p>
                    </TD>
                    <TD align="right">
                      <ButtonLink href={`/admin/people?u=${r.u.id}`} size="sm" variant="ghost">
                        Profile
                      </ButtonLink>
                    </TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          </div>
          <ul className="grid grid-cols-1 gap-3 md:hidden">
            {shown.map((r) => (
              <li key={r.m.id} className="rounded-[14px] bg-fog p-4">
                <Link href={`/admin/people?u=${r.u.id}`} className="flex items-center gap-3">
                  <Avatar name={r.u.name} hue={r.u.avatarHue} size={40} />
                  <span className="min-w-0">
                    <span className="block font-medium">{r.u.name}</span>
                    <span className="block truncate text-[13px] text-muted">{r.u.ventureName ?? "—"}</span>
                  </span>
                </Link>
                <div className="mt-3 grid grid-cols-1 gap-2">
                  <label className="text-[12.5px] text-muted" htmlFor={`track-m-${r.m.id}`}>
                    Track
                  </label>
                  {trackSelect(r, `track-m-${r.m.id}`)}
                  <div className="flex items-center justify-between gap-2 text-[13.5px]">
                    <span className="text-muted">Mentor</span>
                    {mentorCell(r)}
                  </div>
                  <div className="flex items-center gap-2">
                    <ProgressBar value={r.p.pct} className="h-1.5" label={`${r.u.name} progress`} />
                    <span className="w-10 shrink-0 text-right text-[13px] tabular">{r.p.pct}%</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <PairMentorDialog cohortId={cohort.id} fellowId={pairFor ?? undefined} open={!!pairFor} onOpenChange={(o) => !o && setPairFor(null)} />
      <ConfirmDialog
        open={!!trackChange}
        onOpenChange={(o) => !o && setTrackChange(null)}
        title={trackChange ? `Move ${db.users[trackChange.m.userId]?.firstName} to ${db.tracks[trackChange.to]?.name}?` : "Change track"}
        description="Their learning path switches to the new track's modules. Completed sessions and submitted work stay on record."
        confirmLabel="Change track"
        onConfirm={async () => {
          if (!trackChange) return;
          await sleep(400);
          const r = setFellowTrack(trackChange.m.id, trackChange.to);
          if (r.ok) toast.success(`${db.users[trackChange.m.userId]?.name} moved to ${db.tracks[trackChange.to]?.name}`);
          else {
            toast.error(r.error);
            return false;
          }
        }}
      />
    </Panel>
  );
}
