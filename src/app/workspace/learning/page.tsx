"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, ChevronRight, ClipboardCheck, Hourglass, MessageSquareQuote, RotateCcw } from "lucide-react";
import { fellowMembership } from "@/lib/domain/permissions";
import { modulesOfTrack, moduleProgress, nextSessionFor, publishedSessionsOfModule, sessionState, trackProgress } from "@/lib/domain/selectors";
import { useNow } from "@/lib/hooks";
import { useDb, useMe } from "@/lib/store/store";
import { fmtRelative } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";
import { Badge, EmptyState, PageHeader, Panel, PanelHeader, ProgressBar, ProgressRing } from "@/components/ui/display";
import { fmtMinutes, latestFeedback } from "@/components/learning/data";
import { KindLabel, SessionStateBadge, STATE_META, StateDot } from "@/components/learning/meta";
import { useHashScroll } from "@/components/learning/session-reader";

export default function LearningPage() {
  const db = useDb();
  const me = useMe()!;
  const now = useNow();
  const fm = fellowMembership(db, me.id)!;
  const cohort = db.cohorts[fm.cohortId];
  const track = fm.trackId ? db.tracks[fm.trackId] : undefined;

  const data = useMemo(() => {
    if (!track) return null;
    const modules = modulesOfTrack(db, track.id).map((m) => ({
      m,
      p: moduleProgress(db, me.id, m.id),
      sessions: publishedSessionsOfModule(db, m.id).map((s) => ({ s, state: sessionState(db, me.id, s) })),
    }));
    const progress = trackProgress(db, me.id, track.id);
    const next = nextSessionFor(db, me.id);
    const trackSessionIds = new Set(modules.flatMap((x) => x.sessions.map((y) => y.s.id)));
    const subs = Object.values(db.submissions).filter((s) => s.fellowId === me.id && trackSessionIds.has(s.sessionId));
    const attention = subs
      .filter((s) => s.status === "changes_requested" || s.status === "draft")
      .sort((a, b) => (a.status === b.status ? (a.updatedAt < b.updatedAt ? 1 : -1) : a.status === "changes_requested" ? -1 : 1));
    const awaiting = subs.filter((s) => s.status === "submitted");
    const tasks = modules.flatMap((x) => x.sessions.filter((y) => y.s.kind === "task"));
    const approved = tasks.filter((t) => t.state === "complete").length;
    const feedback = subs
      .map((s) => ({ s, f: latestFeedback(s) }))
      .filter((x) => x.f)
      .sort((a, b) => (a.f!.at < b.f!.at ? 1 : -1))[0];
    return { modules, progress, next, attention, awaiting, approved, taskTotal: tasks.length, feedback };
  }, [db, me.id, track]);

  useHashScroll(!!data);

  if (!track || !data)
    return (
      <>
        <PageHeader title="Learning" />
        <EmptyState icon={<BookOpen className="size-5" />} title="Your track isn't set yet" description="Your program manager assigns your track when you join a cohort. Check back soon." />
      </>
    );

  const modulesDone = data.modules.filter((x) => x.p.total > 0 && x.p.pct === 100).length;
  const nextHref = data.next ? `/workspace/learning/${data.next.module.id}/${data.next.session.id}` : undefined;

  return (
    <>
      <PageHeader
        eyebrow={`${cohort.name} · ${track.name}`}
        title="Your learning"
        description={track.tagline}
        actions={
          nextHref && (
            <ButtonLink href={nextHref} arrow>
              Continue learning
            </ButtonLink>
          )
        }
      />

      {/* Track overview */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
        <Panel className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <ProgressRing value={data.progress.pct} size={128} stroke={10} label={`${data.progress.pct}% of ${track.name} complete`}>
            <span className="flex flex-col items-center leading-none">
              <span className="font-display text-[34px] tracking-[-0.04em]">{data.progress.pct}%</span>
              <span className="mt-1 text-[11px] font-medium uppercase tracking-[0.14em] text-muted">complete</span>
            </span>
          </ProgressRing>
          <div className="min-w-0 flex-1">
            <p className="eyebrow text-muted">Your track</p>
            <h2 className="mt-1 font-display text-[30px] leading-[1.08] tracking-[-0.03em]">{track.name}</h2>
            <p className="mt-2 text-[14.5px] leading-relaxed text-muted">{track.description}</p>
            <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-line pt-4">
              <div>
                <dt className="text-[12.5px] text-muted">Sessions</dt>
                <dd className="text-[18px] font-semibold tabular">
                  {data.progress.done}
                  <span className="text-[14px] font-normal text-muted">/{data.progress.total}</span>
                </dd>
              </div>
              <div>
                <dt className="text-[12.5px] text-muted">Modules</dt>
                <dd className="text-[18px] font-semibold tabular">
                  {modulesDone}
                  <span className="text-[14px] font-normal text-muted">/{data.modules.length}</span>
                </dd>
              </div>
              <div>
                <dt className="text-[12.5px] text-muted">Assignments</dt>
                <dd className="text-[18px] font-semibold tabular">
                  {data.approved}
                  <span className="text-[14px] font-normal text-muted">/{data.taskTotal}</span>
                </dd>
              </div>
            </dl>
          </div>
        </Panel>

        <section className="dots-dark relative flex flex-col overflow-hidden rounded-[20px] p-6 text-paper" aria-labelledby="next-h">
          <p className="eyebrow text-muted-display">Up next</p>
          {data.next ? (
            <>
              <h2 id="next-h" className="mt-3 font-display text-[28px] leading-[1.08] tracking-[-0.03em]">
                {data.next.session.published?.title}
              </h2>
              <p className="mt-2 flex flex-wrap items-center gap-x-2 text-[14px] text-[#bdbdbd]">
                <KindLabel kind={data.next.session.kind} /> · Module {data.next.module.order} · {fmtMinutes(data.next.session.published?.durationMin ?? 0)}
              </p>
              <div className="mt-auto pt-6">
                <ButtonLink href={nextHref!} arrow>
                  {data.next.session.kind === "task" ? "Open assignment" : data.next.session.kind === "video" ? "Watch session" : "Start reading"}
                </ButtonLink>
              </div>
            </>
          ) : (
            <p id="next-h" className="mt-3 text-[16px]">
              You&apos;ve completed every published session. New sessions appear here when your instructor publishes them.
            </p>
          )}
        </section>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Modules */}
        <div className="flex min-w-0 flex-col gap-4">
          {data.modules.map(({ m, p, sessions }) => (
            <section key={m.id} id={m.id} className="scroll-mt-24 rounded-[20px] bg-paper p-5 sm:p-6" aria-labelledby={`${m.id}-h`}>
              <div className="flex items-start gap-4">
                <span className="hidden font-display text-[44px] leading-[0.9] tracking-[-0.04em] text-muted-display tabular sm:block" aria-hidden>
                  {String(m.order).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="eyebrow text-muted">
                    Module {m.order} · {m.suggestedMonths}
                  </p>
                  <h2 id={`${m.id}-h`} className="mt-1 text-[20px] font-semibold leading-snug tracking-[-0.015em]">
                    {m.title}
                  </h2>
                  <p className="mt-1 text-[14.5px] leading-relaxed text-muted">{m.summary}</p>
                </div>
                {p.total > 0 && p.pct === 100 && (
                  <Badge tone="green" icon={<CheckCircle2 className="size-3.5" aria-hidden />} className="hidden sm:inline-flex">
                    Complete
                  </Badge>
                )}
              </div>
              <div className="mt-4 flex items-center gap-3">
                <ProgressBar value={p.pct} className="h-1.5" label={`${m.title}: ${p.done} of ${p.total} sessions complete`} />
                <span className="shrink-0 text-[13px] text-muted tabular">
                  {p.done} of {p.total}
                </span>
              </div>
              {sessions.length === 0 ? (
                <p className="mt-4 rounded-[12px] bg-fog p-4 text-[14px] text-muted">Sessions for this module will appear here once they&apos;re published.</p>
              ) : (
                <ol className="mt-3 divide-y divide-line">
                  {sessions.map(({ s, state }) => {
                    const isNext = data.next?.session.id === s.id;
                    return (
                      <li key={s.id}>
                        <Link
                          href={`/workspace/learning/${m.id}/${s.id}${s.kind === "task" && state !== "not_started" ? "#assignment" : ""}`}
                          className="group -mx-2 flex items-center gap-3 rounded-[12px] px-2 py-3 transition-colors hover:bg-fog"
                        >
                          <StateDot state={state} />
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2">
                              <span className="text-[15px] font-medium leading-snug text-void">{s.published?.title}</span>
                              {isNext && <span className="hidden shrink-0 rounded-full bg-jade px-2 py-0.5 text-[11px] font-semibold text-void sm:inline">Up next</span>}
                            </span>
                            <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[13px] text-muted">
                              <KindLabel kind={s.kind} className="gap-1 [&_svg]:size-3.5" />
                              <span aria-hidden>·</span>
                              <span>{fmtMinutes(s.published?.durationMin ?? 0)}</span>
                              <span className="sm:hidden">
                                <span aria-hidden>· </span>
                                {isNext ? "Up next" : STATE_META[state].label}
                              </span>
                            </span>
                          </span>
                          {state !== "not_started" && <SessionStateBadge state={state} className="hidden sm:inline-flex" />}
                          <ChevronRight className="size-4 shrink-0 text-muted transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              )}
            </section>
          ))}
        </div>

        {/* Sidebar */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
          <Panel>
            <PanelHeader
              title="Assignments"
              description="What's waiting on you"
              actions={
                <Link href="/workspace/assignments" className="text-[13.5px] underline-offset-2 hover:underline">
                  View all
                </Link>
              }
            />
            {data.attention.length === 0 && data.awaiting.length === 0 ? (
              <p className="text-[14px] text-muted">Nothing due right now. New assignments appear as you reach them.</p>
            ) : (
              <ul className="space-y-2">
                {data.attention.map((sub) => {
                  const sess = db.sessions[sub.sessionId];
                  const changes = sub.status === "changes_requested";
                  return (
                    <li key={sub.id}>
                      <Link href={`/workspace/learning/${sess.moduleId}/${sess.id}#assignment`} className="flex items-start gap-3 rounded-[12px] bg-fog p-3 transition-colors hover:bg-ash">
                        {changes ? <RotateCcw className="mt-0.5 size-4 shrink-0 text-[#7a4b00]" aria-hidden /> : <ClipboardCheck className="mt-0.5 size-4 shrink-0" aria-hidden />}
                        <span className="min-w-0 flex-1">
                          <span className="block text-[14.5px] font-medium leading-snug">{sess.published?.title}</span>
                          <span className="text-[13px] text-muted">{changes ? "Changes requested — resubmit" : `Draft saved ${fmtRelative(sub.draftSavedAt, now)}`}</span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
                {data.awaiting.map((sub) => {
                  const sess = db.sessions[sub.sessionId];
                  return (
                    <li key={sub.id}>
                      <Link href={`/workspace/learning/${sess.moduleId}/${sess.id}#assignment`} className="flex items-start gap-3 rounded-[12px] p-3 ring-1 ring-line transition-colors hover:bg-fog">
                        <Hourglass className="mt-0.5 size-4 shrink-0 text-[#6b21a8]" aria-hidden />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[14.5px] font-medium leading-snug">{sess.published?.title}</span>
                          <span className="text-[13px] text-muted">In review · submitted {fmtRelative(sub.versions[sub.versions.length - 1]?.submittedAt, now)}</span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          {data.feedback && (
            <Panel>
              <PanelHeader title="Latest feedback" />
              <MessageSquareQuote className="size-5 text-muted" aria-hidden />
              <p className="mt-2 line-clamp-5 text-[14.5px] leading-relaxed">“{data.feedback.f!.text}”</p>
              <p className="mt-2 text-[12.5px] text-muted">
                {db.users[data.feedback.f!.authorId]?.name} · {fmtRelative(data.feedback.f!.at, now)}
              </p>
              <Link
                href={`/workspace/learning/${db.sessions[data.feedback.s.sessionId]?.moduleId}/${data.feedback.s.sessionId}#assignment`}
                className="mt-3 inline-flex items-center gap-1 text-[13.5px] font-medium text-leaf-ink underline-offset-2 hover:underline"
              >
                {db.sessions[data.feedback.s.sessionId]?.published?.title}
                <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </Panel>
          )}

          <Panel className="hidden lg:block">
            <PanelHeader title="Modules" />
            <ol className="space-y-2.5">
              {data.modules.map(({ m, p }) => (
                <li key={m.id}>
                  <a href={`#${m.id}`} className="group block">
                    <span className="flex items-center justify-between gap-2 text-[13.5px]">
                      <span className="truncate group-hover:underline">
                        {m.order}. {m.title}
                      </span>
                      <span className="tabular text-muted">{p.pct}%</span>
                    </span>
                    <ProgressBar value={p.pct} className="mt-1 h-1" label={`${m.title} progress`} />
                  </a>
                </li>
              ))}
            </ol>
          </Panel>
        </aside>
      </div>
    </>
  );
}
