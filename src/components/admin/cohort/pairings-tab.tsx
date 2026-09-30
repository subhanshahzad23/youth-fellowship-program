"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeftRight, HeartHandshake, MessagesSquare, Unlink } from "lucide-react";
import { toast } from "sonner";
import type { Cohort, ID, MentorAssignment } from "@/lib/domain/types";
import { endMentorAssignment } from "@/lib/actions/admin";
import { mentorsOfFellow } from "@/lib/domain/permissions";
import { fellowsOfCohort } from "@/lib/domain/selectors";
import { useDb } from "@/lib/store/store";
import { fmtDate, plural, sleep } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, Badge, EmptyState, Panel, PanelHeader, ProgressBar } from "@/components/ui/display";
import { ConfirmDialog } from "@/components/ui/overlay";
import { PairMentorDialog } from "../pair-mentor-dialog";
import { mentorConversationId } from "../people-data";

export function PairingsTab({ cohort }: { cohort: Cohort }) {
  const db = useDb();
  const [pair, setPair] = useState<{ fellowId?: ID } | null>(null);
  const [ending, setEnding] = useState<MentorAssignment | null>(null);

  const data = useMemo(() => {
    const all = Object.values(db.mentorAssignments).filter((a) => a.cohortId === cohort.id);
    const active = all.filter((a) => a.status === "active").sort((a, b) => (db.users[a.mentorId]?.name ?? "").localeCompare(db.users[b.mentorId]?.name ?? "") || (db.users[a.fellowId]?.name ?? "").localeCompare(db.users[b.fellowId]?.name ?? ""));
    const ended = all.filter((a) => a.status === "ended").sort((a, b) => ((a.endedAt ?? "") < (b.endedAt ?? "") ? 1 : -1));
    const fellows = fellowsOfCohort(db, cohort.id);
    const unpaired = fellows.filter((f) => mentorsOfFellow(db, f.id).length === 0);
    return { active, ended, fellows, unpaired };
  }, [db, cohort.id]);

  const coverage = data.fellows.length ? Math.round(((data.fellows.length - data.unpaired.length) / data.fellows.length) * 100) : 0;

  return (
    <div className="grid grid-cols-1 gap-4">
      <Panel>
        <PanelHeader
          title="Mentor pairings"
          description={`${data.fellows.length - data.unpaired.length} of ${plural(data.fellows.length, "fellow")} paired · one mentor per fellow`}
          actions={
            <Button icon={<HeartHandshake className="size-4" />} onClick={() => setPair({})} disabled={!data.fellows.length}>
              Pair a fellow
            </Button>
          }
        />
        {data.fellows.length > 0 && <ProgressBar value={coverage} label="Mentor coverage" className="mb-5 h-1.5" />}

        {data.unpaired.length > 0 && (
          <div className="mb-5 rounded-[14px] bg-[#fff6dd] p-4">
            <p className="text-[14px] font-semibold text-[#7a4b00]">{plural(data.unpaired.length, "fellow")} without a mentor</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {data.unpaired.map((f) => (
                <li key={f.id}>
                  <button type="button" onClick={() => setPair({ fellowId: f.id })} className="inline-flex h-9 items-center gap-2 rounded-full bg-paper pl-1 pr-3 text-[13.5px] hover:bg-fog">
                    <Avatar name={f.name} hue={f.avatarHue} size={28} />
                    {f.name}
                    <span className="font-medium text-leaf-ink">Pair</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {data.active.length === 0 ? (
          <EmptyState icon={<HeartHandshake className="size-5" />} title="No active pairings" description={data.fellows.length ? "Pair each fellow with a mentor to open a supervised mentor conversation." : "Pairings open once fellows enroll in this cohort."} />
        ) : (
          <ul className="divide-y divide-line">
            {data.active.map((a) => {
              const f = db.users[a.fellowId];
              const m = db.users[a.mentorId];
              const conv = mentorConversationId(db, a.mentorId, a.fellowId);
              return (
                <li key={a.id} className="flex flex-col gap-3 py-3 md:flex-row md:items-center">
                  <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
                    <Link href={`/admin/people?u=${f?.id}`} className="group flex min-w-0 items-center gap-2.5">
                      <Avatar name={f?.name ?? "?"} hue={f?.avatarHue} size={34} />
                      <span className="min-w-0">
                        <span className="block truncate font-medium group-hover:underline">{f?.name}</span>
                        <span className="block truncate text-[12.5px] text-muted">{f?.ventureName}</span>
                      </span>
                    </Link>
                    <ArrowLeftRight className="size-4 shrink-0 text-muted" aria-label="paired with" />
                    <Link href={`/admin/people?u=${m?.id}`} className="group flex min-w-0 items-center gap-2.5">
                      <Avatar name={m?.name ?? "?"} hue={m?.avatarHue} size={34} />
                      <span className="min-w-0">
                        <span className="block truncate font-medium group-hover:underline">{m?.name}</span>
                        <span className="block truncate text-[12.5px] text-muted">since {fmtDate(a.startedAt)}</span>
                      </span>
                    </Link>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {conv ? (
                      <Link href={`/admin/messages?c=${conv}`} className="inline-flex h-8 items-center gap-1.5 rounded-[8px] px-3 text-[13.5px] hover:bg-fog">
                        <MessagesSquare className="size-3.5" aria-hidden /> Conversation
                      </Link>
                    ) : (
                      <span className="px-3 text-[12.5px] text-muted">No messages yet</span>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => setPair({ fellowId: a.fellowId })}>
                      Change
                    </Button>
                    <Button size="sm" variant="ghost" icon={<Unlink className="size-3.5" />} onClick={() => setEnding(a)}>
                      End
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      {data.ended.length > 0 && (
        <Panel>
          <PanelHeader title="Ended pairings" description="Conversations from ended pairings stay visible but are read-only." />
          <ul className="divide-y divide-line">
            {data.ended.map((a) => {
              const conv = mentorConversationId(db, a.mentorId, a.fellowId);
              return (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-[14px]">
                  <span className="min-w-0">
                    <span className="font-medium">{db.users[a.fellowId]?.name}</span> <span className="text-muted">with</span> <span className="font-medium">{db.users[a.mentorId]?.name}</span>
                    <span className="block text-[12.5px] text-muted">
                      {fmtDate(a.startedAt)} – {fmtDate(a.endedAt)}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <Badge tone="neutral">Ended</Badge>
                    {conv && (
                      <Link href={`/admin/messages?c=${conv}`} className="text-[13px] underline underline-offset-2 hover:no-underline">
                        Read-only conversation
                      </Link>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </Panel>
      )}

      <PairMentorDialog cohortId={cohort.id} fellowId={pair?.fellowId} open={!!pair} onOpenChange={(o) => !o && setPair(null)} />
      <ConfirmDialog
        open={!!ending}
        onOpenChange={(o) => !o && setEnding(null)}
        title={ending ? `End ${db.users[ending.mentorId]?.name}'s pairing with ${db.users[ending.fellowId]?.firstName}?` : "End pairing"}
        description="The fellow will be listed as unpaired until you pair them again."
        confirmLabel="End pairing"
        confirmVariant="danger"
        onConfirm={async () => {
          if (!ending) return;
          await sleep(450);
          const r = endMentorAssignment(ending.id);
          if (r.ok) toast.success("Pairing ended", { description: "Their conversation is kept and is now read-only." });
          else {
            toast.error(r.error);
            return false;
          }
        }}
      >
        <p className="text-[14px] leading-relaxed">Their conversation history is kept and stays visible to both of them and to program staff, but neither can send new messages in it.</p>
      </ConfirmDialog>
    </div>
  );
}
