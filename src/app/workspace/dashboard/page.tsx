"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowUpRight, BookOpen, Check, ClipboardCheck, HeartHandshake, Megaphone, MessagesSquare, PlayCircle } from "lucide-react";
import { fellowMembership, mentorsOfFellow } from "@/lib/domain/permissions";
import {
  cohortPhaseLabel,
  conversationTitle,
  messagesOf,
  modulesOfTrack,
  moduleProgress,
  nextSessionFor,
  trackProgress,
  unreadIn,
  visibleConversations,
} from "@/lib/domain/selectors";
import { useNow } from "@/lib/hooks";
import { useDb, useMe } from "@/lib/store/store";
import { fmtDate, fmtRelative } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";
import { Avatar, Badge, EmptyState, PageHeader, Panel, PanelHeader, ProgressBar, ProgressRing } from "@/components/ui/display";
import { CohortTimeline } from "@/components/portal/cohort-timeline";

export default function FellowDashboard() {
  const db = useDb();
  const me = useMe()!;
  const now = useNow();
  const fm = fellowMembership(db, me.id)!;
  const cohort = db.cohorts[fm.cohortId];
  const track = fm.trackId ? db.tracks[fm.trackId] : undefined;

  const data = useMemo(() => {
    const next = nextSessionFor(db, me.id);
    const progress = track ? trackProgress(db, me.id, track.id) : { done: 0, total: 0, pct: 0 };
    const modules = track ? modulesOfTrack(db, track.id).map((m) => ({ m, p: moduleProgress(db, me.id, m.id) })) : [];
    const subs = Object.values(db.submissions).filter((s) => s.fellowId === me.id);
    const attention = subs.filter((s) => s.status === "draft" || s.status === "changes_requested");
    const awaiting = subs.filter((s) => s.status === "submitted");
    const latestFeedback = subs
      .flatMap((s) => s.feedback.map((f) => ({ f, s })))
      .sort((a, b) => (a.f.at < b.f.at ? 1 : -1))[0];
    const convs = visibleConversations(db, me.id, "inbox")
      .map((c) => ({ c, unread: unreadIn(db, me.id, c.id), last: messagesOf(db, c.id).slice(-1)[0] }))
      .slice(0, 4);
    const announcements = Object.values(db.announcements)
      .filter((a) => a.status === "delivered" && a.recipientIds.includes(me.id))
      .sort((a, b) => ((a.deliveredAt ?? "") < (b.deliveredAt ?? "") ? 1 : -1))
      .slice(0, 2);
    const mentors = mentorsOfFellow(db, me.id).map((id) => db.users[id]);
    return { next, progress, modules, attention, awaiting, latestFeedback, convs, announcements, mentors };
  }, [db, me.id, track]);

  const started = now >= cohort.startDate;
  const hour = new Date(now).getUTCHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <>
      <PageHeader
        eyebrow={`${cohort.name} · ${cohortPhaseLabel(cohort, now)}`}
        title={`${greeting}, ${me.firstName}`}
        description={me.ventureName ? `${me.ventureName} — ${track?.name ?? "Fellowship"} track` : track?.name}
        actions={
          <ButtonLink href="/workspace/messages" variant="outline" icon={<MessagesSquare className="size-4" />}>
            Messages
          </ButtonLink>
        }
      />

      {!started && (
        <Panel className="mb-4 bg-leaf">
          <p className="text-[15px]">
            <span className="font-semibold">Welcome to {cohort.name}.</span> Kickoff is {fmtDate(cohort.startDate)}. Orientation modules are open now so you can start at your own pace.
          </p>
        </Panel>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
        {/* Continue learning — a dark, dotted "workspace" panel echoing the public site */}
        <section className="dots-dark relative overflow-hidden rounded-[24px] p-6 text-paper sm:p-8" aria-labelledby="continue-h">
          <p className="eyebrow text-muted-display">Continue learning</p>
          {data.next ? (
            <>
              <h2 id="continue-h" className="mt-3 max-w-xl font-display text-[32px] leading-[1.05] tracking-[-0.035em] sm:text-[40px]">
                {data.next.session.published?.title}
              </h2>
              <p className="mt-2 text-[15px] text-[#bdbdbd]">
                Module {data.next.module.order} · {data.next.module.title} · {data.next.session.published?.durationMin} min
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <ButtonLink href={`/workspace/learning/${data.next.module.id}/${data.next.session.id}`} arrow size="lg">
                  {data.next.session.kind === "task" ? "Open assignment" : data.next.session.kind === "video" ? "Watch session" : "Continue reading"}
                </ButtonLink>
                <ButtonLink href="/workspace/learning" variant="ghost-dark" size="lg">
                  All modules
                </ButtonLink>
              </div>
            </>
          ) : (
            <p className="mt-3 text-[16px]">You&apos;re all caught up.</p>
          )}
          {data.next && (
            <ul className="mt-8 grid max-w-xl gap-1.5" aria-label={`Sessions in module ${data.next.module.order}`}>
              {data.next.module.sessionIds.map((sid) => {
                const s = db.sessions[sid];
                if (!s?.published) return null;
                const done = Object.values(db.completions).some((c) => c.userId === me.id && c.sessionId === sid);
                const current = sid === data.next!.session.id;
                return (
                  <li key={sid} className={`flex items-center gap-3 text-[14px] ${current ? "text-paper" : "text-[#a3a3a3]"}`}>
                    <span className={`grid size-5 shrink-0 place-items-center rounded-full border ${done ? "border-jade bg-jade text-void" : current ? "border-paper" : "border-[#555]"}`} aria-hidden>
                      {done && <Check className="size-3" strokeWidth={3} />}
                    </span>
                    <span className="truncate">{s.published.title}</span>
                    <span className="sr-only">{done ? "(complete)" : current ? "(up next)" : ""}</span>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="pointer-events-none absolute bottom-6 right-6 hidden rotate-[4deg] rounded-[6px] bg-lemon px-4 py-3 text-[13px] font-medium text-void shadow-lg sm:block">
            {data.progress.done} of {data.progress.total} sessions done
          </div>
        </section>

        <Panel aria-labelledby="progress-h">
          <PanelHeader title={<span id="progress-h">{track?.name ?? "Your track"}</span>} description="Track progress" />
          <div className="flex items-center gap-5">
            <ProgressRing value={data.progress.pct} size={92} stroke={8} label={`${data.progress.pct}% of track complete`} />
            <div className="text-[14px] text-muted">
              <p>
                <span className="font-display text-[28px] text-void tabular">{data.progress.done}</span> / {data.progress.total} sessions
              </p>
              <p>{data.modules.filter((x) => x.p.pct === 100).length} of {data.modules.length} modules complete</p>
            </div>
          </div>
          <ul className="mt-5 space-y-2.5">
            {data.modules.map(({ m, p }) => (
              <li key={m.id}>
                <Link href={`/workspace/learning#${m.id}`} className="group block">
                  <div className="flex items-center justify-between text-[13.5px]">
                    <span className="truncate group-hover:underline">
                      {m.order}. {m.title}
                    </span>
                    <span className="tabular text-muted">{p.pct}%</span>
                  </div>
                  <ProgressBar value={p.pct} className="mt-1 h-1.5" label={`${m.title} progress`} />
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel>
          <PanelHeader title="Needs your attention" actions={<Link href="/workspace/assignments" className="text-[13.5px] underline-offset-2 hover:underline">Assignments</Link>} />
          {data.attention.length === 0 && data.awaiting.length === 0 ? (
            <EmptyState icon={<ClipboardCheck className="size-5" />} title="Nothing waiting on you" description="New assignments appear here as you reach them." />
          ) : (
            <ul className="space-y-2">
              {data.attention.map((s) => {
                const sess = db.sessions[s.sessionId];
                return (
                  <li key={s.id}>
                    <Link href={`/workspace/learning/${sess.moduleId}/${sess.id}#assignment`} className="flex items-start gap-3 rounded-[12px] bg-fog p-3 transition-colors hover:bg-ash">
                      <ClipboardCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[14.5px] font-medium">{sess.published?.title}</span>
                        <span className="text-[13px] text-muted">{s.status === "draft" ? `Draft saved ${fmtRelative(s.draftSavedAt, now)}` : "Changes requested — resubmit when ready"}</span>
                      </span>
                      <Badge tone={s.status === "draft" ? "neutral" : "amber"}>{s.status === "draft" ? "Draft" : "Changes requested"}</Badge>
                    </Link>
                  </li>
                );
              })}
              {data.awaiting.map((s) => (
                <li key={s.id} className="flex items-start gap-3 rounded-[12px] p-3 ring-1 ring-line">
                  <ClipboardCheck className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14.5px] font-medium">{db.sessions[s.sessionId]?.published?.title}</span>
                    <span className="text-[13px] text-muted">With your instructor for review</span>
                  </span>
                  <Badge tone="purple">In review</Badge>
                </li>
              ))}
            </ul>
          )}
          {data.latestFeedback && (
            <div className="mt-4 border-t border-line pt-4">
              <p className="eyebrow text-muted">Latest feedback</p>
              <p className="mt-2 line-clamp-3 text-[14px] leading-relaxed">“{data.latestFeedback.f.text}”</p>
              <p className="mt-1 text-[12.5px] text-muted">
                {db.users[data.latestFeedback.f.authorId]?.name} · {fmtRelative(data.latestFeedback.f.at, now)}
              </p>
            </div>
          )}
        </Panel>

        <Panel>
          <PanelHeader title="Messages" actions={<Link href="/workspace/messages" className="text-[13.5px] underline-offset-2 hover:underline">Open inbox</Link>} />
          {data.convs.length === 0 ? (
            <EmptyState icon={<MessagesSquare className="size-5" />} title="No conversations yet" action={<ButtonLink href="/workspace/messages" size="sm" variant="outline">Start one</ButtonLink>} />
          ) : (
            <ul className="-mx-2">
              {data.convs.map(({ c, unread, last }) => {
                const other = db.users[c.participantIds.find((p) => p !== me.id) ?? ""];
                return (
                  <li key={c.id}>
                    <Link href={`/workspace/messages?c=${c.id}`} className="flex items-center gap-3 rounded-[12px] px-2 py-2.5 hover:bg-fog">
                      <Avatar name={c.title ?? other?.name ?? "?"} hue={other?.avatarHue} size={36} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className={unread ? "truncate text-[14.5px] font-semibold" : "truncate text-[14.5px] font-medium"}>{conversationTitle(db, c, me.id)}</span>
                          <span className="shrink-0 text-[12px] text-muted">{fmtRelative(last?.sentAt, now)}</span>
                        </span>
                        <span className="block truncate text-[13px] text-muted">{last?.hidden ? "Message hidden by the program team" : last?.body}</span>
                      </span>
                      {unread > 0 && <span className="grid size-5 shrink-0 place-items-center rounded-full bg-jade text-[11px] font-semibold tabular">{unread}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="mt-3 text-[12.5px] text-muted">Program staff can review fellowship conversations to keep everyone safe.</p>
        </Panel>

        <div className="flex flex-col gap-4">
          <Panel>
            <PanelHeader title="Your mentor" />
            {data.mentors.length ? (
              data.mentors.map((m) => (
                <div key={m.id} className="flex items-center gap-3">
                  <Avatar name={m.name} hue={m.avatarHue} size={44} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-medium">{m.name}</p>
                    <p className="truncate text-[13px] text-muted">{m.bio}</p>
                  </div>
                  <ButtonLink href="/workspace/mentorship" size="sm" variant="soft" icon={<HeartHandshake className="size-4" />}>
                    View
                  </ButtonLink>
                </div>
              ))
            ) : (
              <p className="text-[14px] text-muted">Your program manager will introduce your mentor soon.</p>
            )}
          </Panel>
          <Panel>
            <PanelHeader title="Announcements" actions={<Link href="/workspace/announcements" className="text-[13.5px] underline-offset-2 hover:underline">All</Link>} />
            {data.announcements.length === 0 ? (
              <p className="text-[14px] text-muted">No announcements yet.</p>
            ) : (
              <ul className="space-y-3">
                {data.announcements.map((a) => (
                  <li key={a.id}>
                    <Link href={`/workspace/announcements?id=${a.id}`} className="group flex items-start gap-3">
                      <Megaphone className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
                      <span className="min-w-0">
                        <span className="block text-[14.5px] font-medium group-hover:underline">{a.title}</span>
                        <span className="text-[12.5px] text-muted">
                          {db.users[a.senderId]?.name} · {fmtRelative(a.deliveredAt, now)}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>

      <Panel className="mt-4">
        <PanelHeader
          title={`${cohort.name} timeline`}
          description={`${fmtDate(cohort.startDate)} – ${fmtDate(cohort.endDate)} · ${cohort.location}`}
          actions={
            <ButtonLink href="/workspace/cohort" size="sm" variant="soft" icon={<ArrowUpRight className="size-4" />}>
              Meet your cohort
            </ButtonLink>
          }
        />
        <CohortTimeline cohort={cohort} now={now} />
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Link href="/workspace/learning" className="flex items-center gap-3 rounded-[12px] bg-fog p-3 hover:bg-ash">
            <BookOpen className="size-4" aria-hidden /> <span className="text-[14px]">Browse all modules</span>
          </Link>
          <Link href="/workspace/assignments" className="flex items-center gap-3 rounded-[12px] bg-fog p-3 hover:bg-ash">
            <ClipboardCheck className="size-4" aria-hidden /> <span className="text-[14px]">Assignment history</span>
          </Link>
          {data.next?.session.kind === "video" ? (
            <Link href={`/workspace/learning/${data.next.module.id}/${data.next.session.id}`} className="flex items-center gap-3 rounded-[12px] bg-fog p-3 hover:bg-ash">
              <PlayCircle className="size-4" aria-hidden /> <span className="text-[14px]">Watch next video</span>
            </Link>
          ) : (
            <Link href="/workspace/settings" className="flex items-center gap-3 rounded-[12px] bg-fog p-3 hover:bg-ash">
              <Megaphone className="size-4" aria-hidden /> <span className="text-[14px]">Notification settings</span>
            </Link>
          )}
        </div>
      </Panel>
    </>
  );
}
