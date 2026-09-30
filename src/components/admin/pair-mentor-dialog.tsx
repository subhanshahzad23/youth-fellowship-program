"use client";

import { useMemo, useState } from "react";
import { HeartHandshake } from "lucide-react";
import { toast } from "sonner";
import type { ID } from "@/lib/domain/types";
import { assignMentor } from "@/lib/actions/admin";
import { activeMentorAssignments, mentorsOfFellow } from "@/lib/domain/permissions";
import { fellowsOfCohort } from "@/lib/domain/selectors";
import { useDb } from "@/lib/store/store";
import { plural, sleep } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, WarningLine } from "@/components/ui/display";
import { Field, Select } from "@/components/ui/form";
import { DialogClose, DialogContent, DialogRoot } from "@/components/ui/overlay";

/**
 * Pair a fellow with a mentor. A fellow has one active mentor, so pairing
 * ends any previous pairing — that conversation stays visible but becomes
 * read-only (enforced by conversationAccess).
 */
export function PairMentorDialog({ cohortId, fellowId, open, onOpenChange }: { cohortId: ID; fellowId?: ID; open: boolean; onOpenChange: (v: boolean) => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <DialogRoot open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      {open && <Body cohortId={cohortId} presetFellowId={fellowId} busy={busy} setBusy={setBusy} onDone={() => onOpenChange(false)} />}
    </DialogRoot>
  );
}

function Body({ cohortId, presetFellowId, busy, setBusy, onDone }: { cohortId: ID; presetFellowId?: ID; busy: boolean; setBusy: (b: boolean) => void; onDone: () => void }) {
  const db = useDb();
  const cohort = db.cohorts[cohortId];
  const fellows = useMemo(() => fellowsOfCohort(db, cohortId), [db, cohortId]);
  const mentors = useMemo(
    () =>
      Object.values(db.users)
        .filter((u) => u.staffRoles.includes("mentor"))
        .map((u) => ({
          u,
          load: activeMentorAssignments(db, u.id).length,
          inCohort: Object.values(db.memberships).some((m) => m.userId === u.id && m.cohortId === cohortId && m.role === "mentor" && m.status === "active"),
        }))
        .sort((a, b) => Number(b.inCohort) - Number(a.inCohort) || a.u.name.localeCompare(b.u.name)),
    [db, cohortId],
  );
  const [fellowId, setFellowId] = useState<ID>(presetFellowId ?? "");
  const [mentorId, setMentorId] = useState<ID>("");
  const [tried, setTried] = useState(false);

  const current = fellowId ? mentorsOfFellow(db, fellowId) : [];
  const fellow = fellowId ? db.users[fellowId] : undefined;
  const mentor = mentorId ? db.users[mentorId] : undefined;
  const same = !!mentorId && current.includes(mentorId);
  const errors = {
    fellow: !fellowId ? "Choose a fellow." : undefined,
    mentor: !mentorId ? "Choose a mentor." : same ? `${mentor?.name} is already ${fellow?.firstName}'s mentor.` : undefined,
  };

  const submit = async () => {
    setTried(true);
    if (errors.fellow || errors.mentor) return;
    setBusy(true);
    await sleep(450);
    const r = assignMentor(cohortId, mentorId, fellowId);
    setBusy(false);
    if (!r.ok) {
      toast.error(r.error);
      return;
    }
    toast.success(`${mentor?.name} is now mentoring ${fellow?.name}`, {
      description: current.length ? "The previous pairing ended; its conversation is now read-only. Both people were notified." : "Both people were notified.",
    });
    onDone();
  };

  return (
    <DialogContent
      title={presetFellowId && fellow ? `Pair ${fellow.firstName} with a mentor` : "Pair a fellow with a mentor"}
      description={`${cohort?.name ?? "Cohort"} · each fellow has one mentor at a time`}
      footer={
        <>
          <DialogClose asChild>
            <Button variant="ghost" disabled={busy}>
              Cancel
            </Button>
          </DialogClose>
          <Button loading={busy} onClick={submit} icon={<HeartHandshake className="size-4" />}>
            {current.length ? "Change mentor" : "Pair mentor"}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4">
        {presetFellowId && fellow ? (
          <div className="flex items-center gap-3 rounded-[12px] bg-fog p-3">
            <Avatar name={fellow.name} hue={fellow.avatarHue} size={40} />
            <div className="min-w-0">
              <p className="text-[15px] font-medium">{fellow.name}</p>
              <p className="truncate text-[13px] text-muted">{fellow.ventureName ?? "Fellow"}</p>
            </div>
          </div>
        ) : (
          <Field label="Fellow" required htmlFor="pair-fellow" error={tried ? errors.fellow : undefined}>
            <Select id="pair-fellow" value={fellowId} onChange={(e) => setFellowId(e.target.value)} aria-invalid={tried && !!errors.fellow}>
              <option value="">Choose a fellow…</option>
              {fellows.map((f) => {
                const m = mentorsOfFellow(db, f.id)[0];
                return (
                  <option key={f.id} value={f.id}>
                    {f.name} — {m ? `mentor: ${db.users[m]?.name}` : "no mentor yet"}
                  </option>
                );
              })}
            </Select>
          </Field>
        )}
        <Field label="Mentor" required htmlFor="pair-mentor" hint="Mentors not yet in this cohort are added to it automatically." error={tried ? errors.mentor : undefined}>
          <Select id="pair-mentor" value={mentorId} onChange={(e) => setMentorId(e.target.value)} aria-invalid={tried && !!errors.mentor}>
            <option value="">Choose a mentor…</option>
            {mentors.map(({ u, load, inCohort }) => (
              <option key={u.id} value={u.id}>
                {u.name} · {plural(load, "mentee")}
                {inCohort ? "" : " · not yet in this cohort"}
              </option>
            ))}
          </Select>
        </Field>
        {mentor?.bio && <p className="-mt-2 text-[13.5px] text-muted">{mentor.bio}</p>}
        {current.length > 0 && !same && (
          <WarningLine>
            This ends {current.map((id) => db.users[id]?.name).join(" and ")}&apos;s pairing with {fellow?.firstName}. Their conversation stays visible to both of them and to program staff, but becomes read-only.
          </WarningLine>
        )}
      </div>
    </DialogContent>
  );
}
