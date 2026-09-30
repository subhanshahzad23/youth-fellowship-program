"use client";

import { useMemo } from "react";
import Link from "next/link";
import { CalendarCheck2, CalendarClock, Compass, Eye, HeartHandshake, MessagesSquare, Sprout, Target } from "lucide-react";
import { fellowMembership } from "@/lib/domain/permissions";
import { messagesOf } from "@/lib/domain/selectors";
import { useNow } from "@/lib/hooks";
import { useDb, useMe } from "@/lib/store/store";
import { cn, fmtDate, fmtRelative, fmtWeekday, plural } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";
import { Avatar, Badge, EmptyState, Notice, PageHeader, Panel, PanelHeader } from "@/components/ui/display";

const DAY = 86400000;
const RHYTHM_DAYS = 14;

function mentorConversation(db: ReturnType<typeof useDb>, mentorId: string, fellowId: string) {
  return Object.values(db.conversations).find((c) => c.kind === "mentor" && c.participantIds.includes(mentorId) && c.participantIds.includes(fellowId));
}

export default function MentorshipPage() {
  const db = useDb();
  const me = useMe()!;
  const meId = me.id;
  const now = useNow();
  const fm = fellowMembership(db, meId)!;
  const cohort = db.cohorts[fm.cohortId];

  const data = useMemo(() => {
    const nowMs = Date.parse(now);
    const mine = Object.values(db.mentorAssignments).filter((a) => a.fellowId === meId);
    const active = mine
      .filter((a) => a.status === "active")
      .map((a) => {
        const conv = mentorConversation(db, a.mentorId, meId);
        const last = conv ? messagesOf(db, conv.id).slice(-1)[0] : undefined;
        const start = Date.parse(a.startedAt);
        const held = Math.max(0, Math.floor((nowMs - start) / (RHYTHM_DAYS * DAY)));
        const upcoming = Array.from({ length: 3 }).map((_, i) => new Date(start + (held + 1 + i) * RHYTHM_DAYS * DAY).toISOString());
        const previous = held > 0 ? new Date(start + held * RHYTHM_DAYS * DAY).toISOString() : undefined;
        return { a, mentor: db.users[a.mentorId], conv, last, held, upcoming, previous };
      })
      .filter((x) => x.mentor);
    const ended = mine
      .filter((a) => a.status === "ended")
      .sort((x, y) => ((x.endedAt ?? "") < (y.endedAt ?? "") ? 1 : -1))
      .map((a) => ({ a, mentor: db.users[a.mentorId], conv: mentorConversation(db, a.mentorId, meId) }));
    const manager = Object.values(db.memberships).find((m) => m.cohortId === fm.cohortId && m.role === "program_admin" && m.status === "active");
    return { active, ended, manager: manager ? db.users[manager.userId] : undefined };
  }, [db, meId, now, fm.cohortId]);

  const steps = [
    { icon: Compass, title: "Get to know each other", body: "Your first conversation is about you and your venture — what you're building, and what you'd like help with." },
    { icon: Target, title: "Set a focus for each stretch", body: "Pick one or two goals for the next few weeks, like running five customer interviews or testing a price." },
    { icon: CalendarCheck2, title: "Check in every two weeks", body: "Short, regular check-ins beat long, rare ones. Bring one real thing to talk about." },
    { icon: Sprout, title: "Grow over 18 months", body: "Mentors help you reflect, make introductions inside the program and celebrate progress." },
  ];

  return (
    <>
      <PageHeader eyebrow={`${cohort.name} · Mentorship`} title="Mentorship" description="A volunteer mentor from the fellowship community, matched to you by your program manager." />

      {data.active.length === 0 ? (
        <EmptyState
          className="bg-paper"
          icon={<HeartHandshake className="size-5" />}
          title={data.ended.length ? "A new mentor is on the way" : "Your mentor is on the way"}
          description={
            data.ended.length
              ? "Your previous pairing has ended. Your program manager will match you with a new mentor — you'll get a notification the moment it happens."
              : `Your program manager pairs every fellow with a mentor during the first weeks of ${cohort.name}. You'll get a notification the moment it happens.`
          }
          action={
            data.manager ? (
              <ButtonLink href={`/workspace/messages?to=${data.manager.id}`} variant="outline" icon={<MessagesSquare className="size-4" />}>
                Ask {data.manager.firstName}
              </ButtonLink>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          {data.active.map(({ a, mentor, conv, last, held, upcoming, previous }) => (
            <div key={a.id} className="contents">
              <section className="dots-dark relative overflow-hidden rounded-[24px] p-6 text-paper sm:p-8" aria-labelledby={`mentor-${a.id}`}>
                <p className="eyebrow text-muted-display">Your mentor</p>
                <div className="mt-4 flex items-center gap-4">
                  <Avatar name={mentor.name} hue={mentor.avatarHue} size={64} />
                  <div className="min-w-0">
                    <h2 id={`mentor-${a.id}`} className="font-display text-[34px] leading-tight tracking-[-0.03em]">
                      {mentor.name}
                    </h2>
                    <p className="text-[14px] text-paper/70">
                      {mentor.title ?? "Mentor"} · paired since {fmtDate(a.startedAt)}
                    </p>
                  </div>
                </div>
                {mentor.bio && <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-paper/90">{mentor.bio}</p>}
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <ButtonLink href={conv ? `/workspace/messages?c=${conv.id}` : `/workspace/messages?to=${mentor.id}`} arrow size="lg" icon={<MessagesSquare className="size-4" />}>
                    Message {mentor.firstName}
                  </ButtonLink>
                  {last && (
                    <span className="text-[13.5px] text-paper/70">
                      Last message {fmtRelative(last.sentAt, now)} from {last.senderId === meId ? "you" : mentor.firstName}
                    </span>
                  )}
                </div>
              </section>

              <Panel>
                <PanelHeader title="Check-in rhythm" description="A suggested 30-minute check-in every two weeks, counted from your pairing date." />
                <p className="text-[14px]">
                  <span className="font-display text-[40px] leading-none tracking-[-0.04em] tabular">{held}</span>{" "}
                  <span className="text-muted">{held === 1 ? "check-in window" : "check-in windows"} so far</span>
                </p>
                {previous && <p className="mt-1 text-[13px] text-muted">Most recent: {fmtDate(previous)}</p>}
                <ol className="mt-4 grid grid-cols-1 gap-2">
                  {upcoming.map((d, i) => (
                    <li key={d} className={cn("flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-[14px]", i === 0 ? "bg-leaf" : "bg-fog")}>
                      <CalendarClock className="size-4 shrink-0" aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className="font-medium">{fmtWeekday(d)}</span>
                        <span className="block text-[12.5px] text-muted">Check-in {held + 1 + i}</span>
                      </span>
                      {i === 0 && <Badge tone="green">Next · {fmtRelative(d, now)}</Badge>}
                    </li>
                  ))}
                </ol>
                <p className="mt-3 text-[12.5px] text-muted">These dates are a rhythm to aim for, not booked meetings. Agree the details with {mentor.firstName} in your conversation.</p>
              </Panel>
            </div>
          ))}
        </div>
      )}

      <Notice tone="neutral" className="mt-4" icon={<Eye className="size-4" aria-hidden />} title="Conversations are supervised">
        To keep everyone safe, program staff can review mentor conversations. Keep contact inside the fellowship — don&apos;t share phone numbers or social handles — and use “Report” on any message that makes you uncomfortable.
      </Notice>

      <Panel className="mt-4">
        <PanelHeader title="How mentorship works" />
        <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.title} className="rounded-[16px] bg-fog p-4">
              <span className="flex items-center justify-between">
                <s.icon className="size-5" aria-hidden />
                <span className="text-[12px] tabular text-muted">0{i + 1}</span>
              </span>
              <p className="mt-3 text-[15px] font-semibold">{s.title}</p>
              <p className="mt-1 text-[13.5px] leading-relaxed text-muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </Panel>

      {data.ended.length > 0 && (
        <Panel className="mt-4">
          <PanelHeader title="Past mentors" description="Earlier conversations stay readable, but new messages can't be sent in them." />
          <ul className="divide-y divide-line">
            {data.ended.map(({ a, mentor, conv }) => (
              <li key={a.id} className="flex flex-wrap items-center gap-3 py-3">
                {mentor && <Avatar name={mentor.name} hue={mentor.avatarHue} size={36} />}
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{mentor?.name ?? "Former mentor"}</p>
                  <p className="text-[13px] text-muted">
                    {fmtDate(a.startedAt)} – {fmtDate(a.endedAt)}
                  </p>
                </div>
                {conv ? (
                  <Link href={`/workspace/messages?c=${conv.id}`} className="text-[13.5px] font-medium underline underline-offset-2 hover:no-underline">
                    Read conversation
                  </Link>
                ) : (
                  <span className="text-[13px] text-muted">No messages</span>
                )}
              </li>
            ))}
          </ul>
        </Panel>
      )}
      {data.active.length > 0 && (
        <p className="mt-3 text-[12.5px] text-muted">
          {plural(data.active.length, "active pairing")} · Questions about your match? {data.manager ? <Link href={`/workspace/messages?to=${data.manager.id}`} className="underline underline-offset-2">Message {data.manager.name}</Link> : "Ask your program manager"}.
        </p>
      )}
    </>
  );
}
