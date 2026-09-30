"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { History, Lock, Plus, UserMinus } from "lucide-react";
import { toast } from "sonner";
import type { Cohort, ID, Membership, MembershipRole, StaffRole } from "@/lib/domain/types";
import { assignStaff, endMembership } from "@/lib/actions/admin";
import { isExec } from "@/lib/domain/permissions";
import { useDb, useMe } from "@/lib/store/store";
import { fmtDate, plural, sleep } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, Notice, Panel, PanelHeader } from "@/components/ui/display";
import { Field, RadioCards, Select } from "@/components/ui/form";
import { ConfirmDialog, DialogClose, DialogContent, DialogRoot } from "@/components/ui/overlay";

type StaffMembershipRole = Exclude<MembershipRole, "fellow">;
const ROLE_LABEL: Record<StaffMembershipRole, string> = { program_admin: "Program admin", instructor: "Track instructor", mentor: "Mentor" };
const EXEC_ONLY = "Only executive admins can change program admin scope.";

export function StaffTab({ cohort }: { cohort: Cohort }) {
  const db = useDb();
  const me = useMe()!;
  const exec = isExec(db, me.id);
  const [adding, setAdding] = useState<{ role: StaffMembershipRole; trackId?: ID } | null>(null);
  const [ending, setEnding] = useState<Membership | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const data = useMemo(() => {
    const ms = Object.values(db.memberships).filter((m) => m.cohortId === cohort.id && m.role !== "fellow");
    const active = ms.filter((m) => m.status === "active");
    return {
      admins: active.filter((m) => m.role === "program_admin"),
      instructors: active.filter((m) => m.role === "instructor"),
      mentors: active.filter((m) => m.role === "mentor"),
      ended: ms.filter((m) => m.status === "ended").sort((a, b) => ((a.endedAt ?? "") < (b.endedAt ?? "") ? 1 : -1)),
      menteeCount: (mentorId: ID) => Object.values(db.mentorAssignments).filter((a) => a.mentorId === mentorId && a.cohortId === cohort.id && a.status === "active").length,
    };
  }, [db, cohort.id]);

  const row = (m: Membership, extra?: React.ReactNode, canEnd = true, reason?: string) => {
    const u = db.users[m.userId];
    if (!u) return null;
    return (
      <li key={m.id} className="flex flex-wrap items-center gap-3 py-3">
        <Link href={`/admin/people?u=${u.id}`} className="group flex min-w-0 flex-1 items-center gap-3">
          <Avatar name={u.name} hue={u.avatarHue} size={36} />
          <span className="min-w-0">
            <span className="block font-medium group-hover:underline">{u.name}</span>
            <span className="block truncate text-[13px] text-muted">
              {m.role === "mentor" ? (u.title ?? "Mentor") : m.role === "instructor" ? "Instructor" : "Program admin"} · since {fmtDate(m.startedAt)}
              {extra}
            </span>
          </span>
        </Link>
        {canEnd ? (
          <Button size="sm" variant="ghost" icon={<UserMinus className="size-3.5" />} onClick={() => setEnding(m)}>
            End role
          </Button>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-[12.5px] text-muted" title={reason}>
            <Lock className="size-3.5" aria-hidden /> Exec only
          </span>
        )}
      </li>
    );
  };

  const endingUser = ending ? db.users[ending.userId] : undefined;
  const endingMentees = ending?.role === "mentor" ? data.menteeCount(ending.userId) : 0;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Panel>
        <PanelHeader
          title="Program admins"
          description="Run day-to-day operations and decide applications for this cohort"
          actions={
            exec ? (
              <Button size="sm" variant="outline" icon={<Plus className="size-3.5" />} onClick={() => setAdding({ role: "program_admin" })}>
                Add
              </Button>
            ) : undefined
          }
        />
        {data.admins.length ? <ul className="-my-3 divide-y divide-line">{data.admins.map((m) => row(m, undefined, exec, EXEC_ONLY))}</ul> : <p className="text-[14px] text-muted">No program admin assigned. Executive admins cover this cohort until one is added.</p>}
        {!exec && <p className="mt-4 text-[12.5px] text-muted">{EXEC_ONLY} Ask Priya Shah or Jordan Okafor to make changes.</p>}
      </Panel>

      <Panel>
        <PanelHeader
          title="Mentors"
          description="Volunteers paired one-to-one with fellows"
          actions={
            <Button size="sm" variant="outline" icon={<Plus className="size-3.5" />} onClick={() => setAdding({ role: "mentor" })}>
              Add
            </Button>
          }
        />
        {data.mentors.length ? (
          <ul className="-my-3 divide-y divide-line">{data.mentors.map((m) => row(m, <> · {plural(data.menteeCount(m.userId), "mentee")}</>))}</ul>
        ) : (
          <p className="text-[14px] text-muted">No mentors yet. Add one, then pair them with fellows under Mentor pairings.</p>
        )}
      </Panel>

      <Panel className="lg:col-span-2">
        <PanelHeader title="Track instructors" description="Each track has its own instructor, who edits sessions and reviews assignments" />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {cohort.trackIds.map((tid) => {
            const t = db.tracks[tid];
            const list = data.instructors.filter((m) => m.trackId === tid);
            return (
              <div key={tid} className="rounded-[14px] bg-fog p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[14.5px] font-semibold">{t?.name}</p>
                  <Button size="sm" variant="light" icon={<Plus className="size-3.5" />} onClick={() => setAdding({ role: "instructor", trackId: tid })} aria-label={`Add instructor to ${t?.name}`}>
                    Add
                  </Button>
                </div>
                {list.length ? (
                  <ul className="mt-1 divide-y divide-line">{list.map((m) => row(m))}</ul>
                ) : (
                  <p className="mt-3 text-[13.5px] text-muted">No instructor assigned yet.</p>
                )}
              </div>
            );
          })}
        </div>
      </Panel>

      {data.ended.length > 0 && (
        <Panel className="lg:col-span-2">
          <PanelHeader
            title="Ended roles"
            description="History is kept: past messages, feedback and audit entries stay on record."
            actions={
              <Button size="sm" variant="soft" icon={<History className="size-3.5" />} onClick={() => setShowHistory((v) => !v)} aria-expanded={showHistory}>
                {showHistory ? "Hide" : `Show ${data.ended.length}`}
              </Button>
            }
          />
          {showHistory && (
            <ul className="divide-y divide-line">
              {data.ended.map((m) => (
                <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-[14px]">
                  <span>
                    <span className="font-medium">{db.users[m.userId]?.name ?? "Former member"}</span> <span className="text-muted">· {ROLE_LABEL[m.role as StaffMembershipRole]}{m.trackId ? ` · ${db.tracks[m.trackId]?.shortName}` : ""}</span>
                  </span>
                  <span className="text-[13px] text-muted">
                    {fmtDate(m.startedAt)} – {fmtDate(m.endedAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )}

      <AddStaffDialog cohort={cohort} preset={adding} onClose={() => setAdding(null)} exec={exec} />
      <ConfirmDialog
        open={!!ending}
        onOpenChange={(o) => !o && setEnding(null)}
        title={ending && endingUser ? `End ${endingUser.name}'s ${ROLE_LABEL[ending.role as StaffMembershipRole].toLowerCase()} role?` : "End role"}
        description={`They'll no longer have access to ${cohort.name} in this role.`}
        confirmLabel="End role"
        confirmVariant="danger"
        onConfirm={async () => {
          if (!ending) return;
          await sleep(450);
          const r = endMembership(ending.id);
          if (r.ok) toast.success(`${endingUser?.name}'s role in ${cohort.name} ended`, { description: "History is kept." });
          else {
            toast.error(r.error);
            return false;
          }
        }}
      >
        <div className="grid grid-cols-1 gap-3 text-[14px] leading-relaxed">
          <p>Existing messages, assignment feedback and audit history are kept and stay visible to program staff. Nothing is deleted.</p>
          {endingMentees > 0 && (
            <Notice tone="amber">
              {endingUser?.firstName} still has {plural(endingMentees, "active pairing")} in this cohort. End or reassign them under Mentor pairings so those fellows aren&apos;t left without a mentor.
            </Notice>
          )}
        </div>
      </ConfirmDialog>
    </div>
  );
}

function AddStaffDialog({ cohort, preset, onClose, exec }: { cohort: Cohort; preset: { role: StaffMembershipRole; trackId?: ID } | null; onClose: () => void; exec: boolean }) {
  const [busy, setBusy] = useState(false);
  return (
    <DialogRoot open={!!preset} onOpenChange={(o) => !o && !busy && onClose()}>
      {preset && <AddStaffBody cohort={cohort} preset={preset} exec={exec} busy={busy} setBusy={setBusy} onDone={onClose} />}
    </DialogRoot>
  );
}

function AddStaffBody({ cohort, preset, exec, busy, setBusy, onDone }: { cohort: Cohort; preset: { role: StaffMembershipRole; trackId?: ID }; exec: boolean; busy: boolean; setBusy: (b: boolean) => void; onDone: () => void }) {
  const db = useDb();
  const [role, setRole] = useState<StaffMembershipRole>(preset.role);
  const [trackId, setTrackId] = useState<ID>(preset.trackId ?? cohort.trackIds[0] ?? "");
  const [userId, setUserId] = useState<ID>("");
  const [tried, setTried] = useState(false);

  const candidates = useMemo(() => {
    const need: StaffRole = role;
    return Object.values(db.users)
      .filter((u) => u.staffRoles.includes(need))
      .map((u) => ({
        u,
        already: Object.values(db.memberships).some((m) => m.userId === u.id && m.cohortId === cohort.id && m.role === role && m.status === "active" && (role !== "instructor" || m.trackId === trackId)),
        teaches: role === "instructor" ? [...new Set(Object.values(db.memberships).filter((m) => m.userId === u.id && m.role === "instructor" && m.status === "active").map((m) => db.tracks[m.trackId ?? ""]?.shortName))].filter(Boolean).join(", ") : "",
      }))
      .sort((a, b) => a.u.name.localeCompare(b.u.name));
  }, [db, role, trackId, cohort.id]);

  const chosen = candidates.find((c) => c.u.id === userId);
  const error = !userId ? "Choose a person." : chosen?.already ? `${chosen.u.name} already has this role here.` : undefined;

  const submit = async () => {
    setTried(true);
    if (error) return;
    setBusy(true);
    await sleep(450);
    const r = assignStaff(cohort.id, userId, role, role === "instructor" ? trackId : undefined);
    setBusy(false);
    if (!r.ok) {
      toast.error(r.error);
      return;
    }
    toast.success(`${chosen?.u.name} added as ${ROLE_LABEL[role].toLowerCase()}`, { description: `${cohort.name}${role === "instructor" ? ` · ${db.tracks[trackId]?.name}` : ""}. They were notified.` });
    onDone();
  };

  const roleOptions: { value: StaffMembershipRole; label: React.ReactNode; description: React.ReactNode }[] = [
    { value: "instructor", label: "Track instructor", description: "Teaches one track" },
    { value: "mentor", label: "Mentor", description: "Paired with fellows" },
    ...(exec ? [{ value: "program_admin" as const, label: "Program admin", description: "Runs the cohort" }] : []),
  ];

  return (
    <DialogContent
      title={`Add staff to ${cohort.name}`}
      description="People must already hold the matching staff role. Adding them sends a notification."
      footer={
        <>
          <DialogClose asChild>
            <Button variant="ghost" disabled={busy}>
              Cancel
            </Button>
          </DialogClose>
          <Button loading={busy} onClick={submit} icon={<Plus className="size-4" />}>
            Add to cohort
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4">
        <div>
          <p className="mb-2 text-[14.5px] font-medium">Role</p>
          <RadioCards
            name="staff-role"
            value={role}
            onChange={(v) => {
              setRole(v);
              setUserId("");
            }}
            columns={exec ? 3 : 2}
            options={roleOptions}
          />
          {!exec && <p className="mt-2 text-[12.5px] text-muted">{EXEC_ONLY}</p>}
        </div>
        {role === "instructor" && (
          <Field label="Track" required htmlFor="staff-track">
            <Select id="staff-track" value={trackId} onChange={(e) => setTrackId(e.target.value)}>
              {cohort.trackIds.map((t) => (
                <option key={t} value={t}>
                  {db.tracks[t]?.name}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Field label="Person" required htmlFor="staff-person" error={tried ? error : undefined}>
          <Select id="staff-person" value={userId} onChange={(e) => setUserId(e.target.value)} aria-invalid={tried && !!error}>
            <option value="">Choose…</option>
            {candidates.map(({ u, already, teaches }) => (
              <option key={u.id} value={u.id} disabled={already}>
                {u.name}
                {teaches ? ` · teaches ${teaches}` : ""}
                {already ? " · already assigned" : ""}
              </option>
            ))}
          </Select>
        </Field>
        {chosen?.u.bio && <p className="-mt-2 text-[13.5px] text-muted">{chosen.u.bio}</p>}
      </div>
    </DialogContent>
  );
}
