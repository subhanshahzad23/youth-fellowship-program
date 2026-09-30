"use client";

import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { History, LayoutDashboard, Lock, MessagesSquare, ShieldCheck } from "lucide-react";
import type { ID, MentorAssignment } from "@/lib/domain/types";
import { activeMentorAssignments, canMessage, directoryVisibleUserIds, fellowMembership, isInstructor, isMentor } from "@/lib/domain/permissions";
import { messagesOf, trackOfFellow, trackProgress, unreadIn } from "@/lib/domain/selectors";
import { useNow } from "@/lib/hooks";
import { useDb, useMe } from "@/lib/store/store";
import { cn, fmtDate } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";
import { Avatar, Badge, EmptyState, Notice, PageHeader, Panel, PanelHeader, ProgressBar } from "@/components/ui/display";
import { findDirectConversation, relTime, SUPERVISION_NOTICE } from "@/components/messaging/lib";

const EASE = [0.23, 1, 0.32, 1] as const;

function FellowCard({ fellowId, since, focused, index }: { fellowId: ID; since?: string; focused: boolean; index: number }) {
  const db = useDb();
  const me = useMe()!;
  const now = useNow();
  const u = db.users[fellowId];
  const fm = fellowMembership(db, fellowId);
  const track = trackOfFellow(db, fellowId);
  const progress = track ? trackProgress(db, fellowId, track.id) : null;
  const conv = findDirectConversation(db, me.id, fellowId);
  const last = conv ? messagesOf(db, conv.id).slice(-1)[0] : undefined;
  const unread = conv ? unreadIn(db, me.id, conv.id) : 0;
  const allowed = canMessage(db, me.id, fellowId);
  if (!u) return null;
  const lastText = last ? (last.hidden ? "Message hidden by the program team" : last.body || "Sent an attachment") : null;

  return (
    <motion.article
      id={`mentee-${fellowId}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, delay: index * 0.04, ease: EASE }}
      className={cn("flex scroll-mt-24 flex-col rounded-[20px] bg-paper p-5 sm:p-6", focused && "ring-2 ring-jade ring-offset-2 ring-offset-fog")}
      aria-labelledby={`mentee-${fellowId}-name`}
    >
      <div className="flex items-start gap-3">
        <Avatar name={u.name} hue={u.avatarHue} size={48} />
        <div className="min-w-0 flex-1">
          <h3 id={`mentee-${fellowId}-name`} className="text-[17px] font-semibold tracking-[-0.01em]">
            {u.name}
            {u.pronouns && <span className="ml-1.5 text-[13px] font-normal text-muted">{u.pronouns}</span>}
          </h3>
          <p className="text-[13.5px] text-muted">
            {[fm ? db.cohorts[fm.cohortId]?.name : undefined, track?.name].filter(Boolean).join(" · ")}
          </p>
        </div>
        {unread > 0 && (
          <Badge tone="green" className="bg-jade text-void">
            {unread} unread
          </Badge>
        )}
      </div>

      {u.ventureName && (
        <div className="mt-4">
          <p className="flex flex-wrap items-center gap-2 text-[15px] font-medium">
            {u.ventureName}
            {u.ventureStage && <Badge>{u.ventureStage}</Badge>}
          </p>
          {u.ventureSummary && <p className="mt-1 line-clamp-2 text-[13.5px] leading-relaxed text-muted">{u.ventureSummary}</p>}
        </div>
      )}

      {progress && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-muted">{track?.shortName} progress</span>
            <span className="tabular">
              {progress.done} of {progress.total} sessions · {progress.pct}%
            </span>
          </div>
          <ProgressBar value={progress.pct} className="mt-1.5 h-1.5" label={`${u.firstName}'s track progress`} />
        </div>
      )}

      <div className="mt-4 flex-1 rounded-[12px] bg-fog px-3 py-2.5">
        {last && lastText ? (
          <>
            <p className="flex items-center justify-between gap-2 text-[12px] text-muted">
              <span>Last message · {last.senderId === me.id ? "you" : db.users[last.senderId]?.firstName}</span>
              <span>{relTime(last.sentAt, now)}</span>
            </p>
            <p className={cn("mt-0.5 line-clamp-2 text-[13.5px]", last.hidden && "italic text-muted", unread && "font-medium")}>{lastText}</p>
          </>
        ) : (
          <p className="text-[13.5px] text-muted">No messages yet — say hello.</p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[12.5px] text-muted">{since ? `Mentoring since ${fmtDate(since)}` : ""}</span>
        {allowed.ok ? (
          <ButtonLink href={conv ? `/staff/messages?c=${conv.id}` : `/staff/messages?to=${fellowId}`} size="sm" variant={unread ? "primary" : "dark"} icon={<MessagesSquare className="size-4" />}>
            {unread ? "Reply" : "Message"}
          </ButtonLink>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-[12.5px] text-muted">
            <Lock className="size-3.5" aria-hidden /> {allowed.reason}
          </span>
        )}
      </div>
    </motion.article>
  );
}

function PastPairing({ a, focused }: { a: MentorAssignment; focused: boolean }) {
  const db = useDb();
  const me = useMe()!;
  const u = db.users[a.fellowId];
  const conv = findDirectConversation(db, me.id, a.fellowId);
  return (
    <li id={`mentee-${a.fellowId}`} className={cn("flex scroll-mt-24 flex-wrap items-center gap-3 rounded-[14px] px-2 py-3", focused && "bg-leaf/50")}>
      <Avatar name={u?.name ?? "?"} hue={u?.avatarHue} size={40} />
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-medium">{u?.name ?? "Former member"}</p>
        <p className="text-[13px] text-muted">
          {[u?.ventureName, db.cohorts[a.cohortId]?.name].filter(Boolean).join(" · ")} · paired {fmtDate(a.startedAt)} – {fmtDate(a.endedAt)}
        </p>
      </div>
      {conv ? (
        <ButtonLink href={`/staff/messages?c=${conv.id}`} size="sm" variant="soft" icon={<History className="size-4" />}>
          Read-only history
        </ButtonLink>
      ) : (
        <span className="text-[13px] text-muted">No messages</span>
      )}
    </li>
  );
}

export function MenteesView() {
  const db = useDb();
  const me = useMe()!;
  const params = useSearchParams();
  const focus = params.get("u");
  const mentor = isMentor(db, me.id);

  const active = useMemo(
    () => activeMentorAssignments(db, me.id).sort((a, b) => (db.users[a.fellowId]?.name ?? "").localeCompare(db.users[b.fellowId]?.name ?? "")),
    [db, me.id],
  );
  const ended = useMemo(
    () =>
      Object.values(db.mentorAssignments)
        .filter((a) => a.mentorId === me.id && a.status === "ended")
        .sort((a, b) => ((a.endedAt ?? "") < (b.endedAt ?? "") ? 1 : -1)),
    [db, me.id],
  );
  const cohorts = [...new Set(active.map((a) => db.cohorts[a.cohortId]?.name).filter(Boolean))];
  const unreadTotal = active.reduce((n, a) => {
    const c = findDirectConversation(db, me.id, a.fellowId);
    return n + (c ? unreadIn(db, me.id, c.id) : 0);
  }, 0);

  const focusIsMentee = !!focus && (active.some((a) => a.fellowId === focus) || ended.some((a) => a.fellowId === focus));

  useEffect(() => {
    if (!focus) return;
    const el = document.getElementById(`mentee-${focus}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [focus]);

  // Someone opened a person link (e.g. from search) who isn't one of this mentor's fellows.
  const focusUser = focus && !focusIsMentee ? db.users[focus] : undefined;
  const focusVisible = !!focusUser && directoryVisibleUserIds(db, me.id).includes(focusUser.id);
  const focusDecision = focusUser ? canMessage(db, me.id, focusUser.id) : null;

  if (!mentor)
    return (
      <>
        <PageHeader eyebrow="Staff" title="Mentees" description="Mentee lists are for volunteer mentors." />
        {focusUser && focusVisible && (
          <div className="mb-4 max-w-xl">
            <FellowCard fellowId={focusUser.id} focused={false} index={0} />
          </div>
        )}
        <Panel>
          <EmptyState
            icon={<LayoutDashboard className="size-5" />}
            title="You don't have assigned mentees"
            description={
              isInstructor(db, me.id)
                ? "As a track instructor you work with fellows through your track's sessions and submissions, and you can message fellows in the cohorts you teach."
                : "Mentees appear here once the program team pairs you with fellows."
            }
            action={
              <>
                <ButtonLink href="/staff/dashboard" variant="dark" arrow>
                  Go to your dashboard
                </ButtonLink>
                <ButtonLink href="/staff/messages" variant="outline" icon={<MessagesSquare className="size-4" />}>
                  Messages
                </ButtonLink>
              </>
            }
          />
        </Panel>
      </>
    );

  return (
    <>
      <PageHeader
        eyebrow={cohorts.length ? `Mentor · ${cohorts.join(", ")}` : "Mentor"}
        title="Your mentees"
        description={
          active.length
            ? `${active.length} fellow${active.length === 1 ? "" : "s"} assigned to you${unreadTotal ? ` · ${unreadTotal} unread message${unreadTotal === 1 ? "" : "s"}` : ""}. You can message the fellows assigned to you, and they can reply.`
            : "The program team hasn't paired you with any fellows yet."
        }
        actions={
          <ButtonLink href="/staff/messages" variant="outline" icon={<MessagesSquare className="size-4" />}>
            All messages
          </ButtonLink>
        }
      />

      {focusUser && !focusIsMentee && (
        <Notice tone="amber" className="mb-4" icon={<Lock className="size-4 text-[#7a4b00]" />} title={`${focusUser.name} isn't assigned to you`}>
          {focusDecision && !focusDecision.ok ? focusDecision.reason : "Only assigned fellows appear here."} Ask the program team if you think this pairing should change.
        </Notice>
      )}

      {active.length ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {active.map((a, i) => (
            <FellowCard key={a.id} fellowId={a.fellowId} since={a.startedAt} focused={focus === a.fellowId} index={i} />
          ))}
        </div>
      ) : (
        <Panel>
          <EmptyState icon={<MessagesSquare className="size-5" />} title="No mentees yet" description="When the program team pairs you with a fellow, they'll appear here with their venture and progress." />
        </Panel>
      )}

      <div className="mt-4 grid grid-cols-1 items-start gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Panel aria-labelledby="past-h">
          <PanelHeader title={<span id="past-h">Past pairings</span>} description="When a pairing ends, the conversation stays as read-only history." />
          {ended.length ? (
            <ul className="-mx-2 divide-y divide-line">
              {ended.map((a) => (
                <PastPairing key={a.id} a={a} focused={focus === a.fellowId} />
              ))}
            </ul>
          ) : (
            <p className="text-[14px] text-muted">No past pairings.</p>
          )}
        </Panel>
        <Panel className="bg-leaf/60">
          <p className="flex items-center gap-2 text-[15px] font-semibold">
            <ShieldCheck className="size-4 text-leaf-ink" aria-hidden /> Mentoring safely
          </p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[14px] leading-relaxed text-ink">
            <li>{SUPERVISION_NOTICE}</li>
            <li>Keep contact on the platform — don&apos;t swap phone numbers or move chats to other apps.</li>
            <li>If a message worries you, open its actions menu and choose Report — it goes straight to the program team for review.</li>
          </ul>
        </Panel>
      </div>
    </>
  );
}
