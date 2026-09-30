"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, ClipboardCheck, FilePenLine, HeartHandshake, Library, Megaphone, MessagesSquare, Settings, Sparkles } from "lucide-react";
import { fellowMembership, instructorScopes, instructorTrackIds, isInstructor, isMentor } from "@/lib/domain/permissions";
import { fellowsOfCohort, mentorFellowsOf, modulesOfTrack, moduleProgress, submissionsForInstructor, trackProgress, unreadIn } from "@/lib/domain/selectors";
import { useNow } from "@/lib/hooks";
import { useDb, useMe } from "@/lib/store/store";
import { cn, fmtDate, fmtRelative, plural } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";
import { Avatar, Badge, EmptyState, PageHeader, Panel, PanelHeader, ProgressBar, Stat } from "@/components/ui/display";
import { editorStatus, sessionTitleForStaff } from "@/components/learning/data";
import { EditorStatusBadge } from "@/components/learning/meta";

export default function StaffDashboard() {
  const db = useDb();
  const me = useMe()!;
  const now = useNow();
  const instructor = isInstructor(db, me.id);
  const mentor = isMentor(db, me.id);

  const teach = useMemo(() => {
    if (!instructor) return null;
    const scopes = instructorScopes(db, me.id);
    const queue = submissionsForInstructor(db, me.id);
    const lastAt = (s: (typeof queue)[number]) => s.versions[s.versions.length - 1]?.submittedAt ?? s.updatedAt;
    const awaiting = queue.filter((s) => s.status === "submitted").sort((a, b) => (lastAt(a) < lastAt(b) ? -1 : 1));
    const changes = queue.filter((s) => s.status === "changes_requested");
    const trackIds = instructorTrackIds(db, me.id);
    const drafts = Object.values(db.sessions)
      .filter((s) => (s.draft || !s.published) && trackIds.includes(db.modules[s.moduleId]?.trackId))
      .sort((a, b) => ((a.draftUpdatedAt ?? "") < (b.draftUpdatedAt ?? "") ? 1 : -1));
    const scopeRows = scopes
      .map((sc) => {
        const cohort = db.cohorts[sc.cohortId];
        const track = db.tracks[sc.trackId];
        const fellows = fellowsOfCohort(db, sc.cohortId).filter((f) => fellowMembership(db, f.id)?.trackId === sc.trackId);
        const avg = fellows.length ? Math.round(fellows.reduce((n, f) => n + trackProgress(db, f.id, sc.trackId).pct, 0) / fellows.length) : 0;
        const waiting = awaiting.filter((s) => s.cohortId === sc.cohortId).length;
        return { cohort, track, fellows: fellows.length, avg, waiting };
      })
      .filter((r) => r.cohort && r.track)
      .sort((a, b) => (a.cohort.startDate < b.cohort.startDate ? -1 : 1));
    const fellowsTaught = scopeRows.reduce((n, r) => n + r.fellows, 0);
    return { awaiting, changes, drafts, scopeRows, fellowsTaught, trackNames: trackIds.map((t) => db.tracks[t]?.name).filter(Boolean) };
  }, [db, me.id, instructor]);

  const mentees = useMemo(() => {
    if (!mentor) return null;
    return mentorFellowsOf(db, me.id).map((f) => {
      const fm = fellowMembership(db, f.id);
      const track = fm?.trackId ? db.tracks[fm.trackId] : undefined;
      const progress = track ? trackProgress(db, f.id, track.id) : { done: 0, total: 0, pct: 0 };
      const currentModule = track ? modulesOfTrack(db, track.id).find((m) => moduleProgress(db, f.id, m.id).pct < 100) : undefined;
      const conv = Object.values(db.conversations).find((c) => c.kind !== "group" && c.participantIds.includes(me.id) && c.participantIds.includes(f.id));
      const unread = conv ? unreadIn(db, me.id, conv.id) : 0;
      const subs = Object.values(db.submissions).filter((s) => s.fellowId === f.id);
      const changes = subs.filter((s) => s.status === "changes_requested").length;
      const inReview = subs.filter((s) => s.status === "submitted").length;
      return { f, cohort: fm ? db.cohorts[fm.cohortId] : undefined, track, progress, currentModule, conv, unread, changes, inReview };
    });
  }, [db, me.id, mentor]);

  const hour = new Date(now).getUTCHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const roleLine = [instructor && teach?.trackNames.length ? `Track instructor · ${teach.trackNames.join(", ")}` : null, mentor ? `Mentor · ${plural(mentees?.length ?? 0, "fellow")}` : null]
    .filter(Boolean)
    .join("  ·  ");
  const unreadTotal = mentees?.reduce((n, m) => n + m.unread, 0) ?? 0;

  const stats: { label: string; value: number; detail: string; href: string }[] = [];
  if (teach) {
    stats.push({ label: "Awaiting your review", value: teach.awaiting.length, detail: teach.awaiting[0] ? `Oldest from ${fmtRelative(teach.awaiting[0].versions.slice(-1)[0]?.submittedAt, now)}` : "You're all caught up", href: "/staff/submissions" });
    stats.push({ label: "Waiting on fellows", value: teach.changes.length, detail: "Revising after your feedback", href: "/staff/submissions" });
    stats.push({ label: "Draft sessions", value: teach.drafts.length, detail: "Unpublished edits in your tracks", href: "/staff/content" });
  }
  if (mentees) {
    stats.push({ label: "Mentees", value: mentees.length, detail: mentees.map((m) => m.f.firstName).join(", ") || "None assigned yet", href: "/staff/mentees" });
    stats.push({ label: "Unread messages", value: unreadTotal, detail: "From your mentees", href: "/staff/messages" });
  }
  if (teach && !mentees) stats.push({ label: "Fellows you teach", value: teach.fellowsTaught, detail: `Across ${plural(teach.scopeRows.length, "cohort")}`, href: "/staff/submissions" });

  return (
    <>
      <PageHeader
        eyebrow={roleLine || "Staff"}
        title={`${greeting}, ${me.firstName}`}
        description={
          teach && mentees
            ? "Your review queue, the cohorts you teach and your mentees, in one place."
            : teach
              ? "Review submissions, keep your sessions current and see how your cohorts are progressing."
              : "Keep up with your mentees: how they're progressing and what they've sent you."
        }
        actions={
          teach ? (
            <ButtonLink href="/staff/submissions" arrow>
              Review submissions
            </ButtonLink>
          ) : (
            <ButtonLink href="/staff/messages" variant="outline" icon={<MessagesSquare className="size-4" />}>
              Messages
            </ButtonLink>
          )
        }
      />

      <div className={cn("grid grid-cols-2 gap-3", stats.length >= 4 ? "lg:grid-cols-4" : stats.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2")}>
        {stats.slice(0, 4).map((s) => (
          <Stat key={s.label} label={s.label} value={s.value} detail={<span className="line-clamp-1">{s.detail}</span>} href={s.href} />
        ))}
      </div>

      {teach && (
        <>
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <Panel>
              <PanelHeader
                title="Waiting for your review"
                description={teach.awaiting.length ? `${plural(teach.awaiting.length, "submission")}, oldest first` : undefined}
                actions={
                  <Link href="/staff/submissions" className="text-[13.5px] underline-offset-2 hover:underline">
                    Open queue
                  </Link>
                }
              />
              {teach.awaiting.length === 0 ? (
                <EmptyState icon={<ClipboardCheck className="size-5" />} title="Nothing to review" description="New submissions from your cohorts appear here." />
              ) : (
                <ul className="-mx-2">
                  {teach.awaiting.slice(0, 6).map((sub) => {
                    const f = db.users[sub.fellowId];
                    const sess = db.sessions[sub.sessionId];
                    const v = sub.versions[sub.versions.length - 1];
                    return (
                      <li key={sub.id}>
                        <Link href={`/staff/submissions?s=${sub.id}`} className="group flex items-center gap-3 rounded-[12px] px-2 py-2.5 transition-colors hover:bg-fog">
                          <Avatar name={f?.name ?? "?"} hue={f?.avatarHue} size={38} />
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-center gap-x-2">
                              <span className="text-[14.5px] font-medium">{f?.name}</span>
                              {sub.versions.length > 1 && <Badge tone="blue">Resubmission</Badge>}
                            </span>
                            <span className="block truncate text-[13px] text-muted">
                              {sess?.published?.title} · {db.cohorts[sub.cohortId]?.name}
                            </span>
                          </span>
                          <span className="shrink-0 text-[12.5px] text-muted">{fmtRelative(v?.submittedAt, now)}</span>
                          <ArrowRight className="size-4 shrink-0 text-muted transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
              {teach.awaiting.length > 6 && (
                <Link href="/staff/submissions" className="mt-2 inline-flex text-[13.5px] font-medium underline-offset-2 hover:underline">
                  View all {teach.awaiting.length}
                </Link>
              )}
            </Panel>

            <Panel>
              <PanelHeader title="Tracks and cohorts you teach" />
              {teach.scopeRows.length === 0 ? (
                <p className="text-[14px] text-muted">You aren&apos;t assigned to a cohort yet. Your program manager assigns instructors from the cohort settings.</p>
              ) : (
                <ul className="space-y-3">
                  {teach.scopeRows.map((r) => (
                    <li key={r.cohort.id + r.track.id} className="rounded-[14px] bg-fog p-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="min-w-0 truncate text-[14.5px] font-medium">
                          <span className="mr-2 inline-block size-2.5 rounded-full align-middle" style={{ background: r.track.color }} aria-hidden />
                          {r.cohort.name}
                          <span className="font-normal text-muted"> · {r.track.shortName}</span>
                        </p>
                        {r.waiting > 0 ? <Badge tone="purple">{r.waiting} to review</Badge> : <span className="text-[12.5px] text-muted">{r.cohort.status === "active" ? "Active" : `Starts ${fmtDate(r.cohort.startDate)}`}</span>}
                      </div>
                      {r.fellows > 0 ? (
                        <div className="mt-2 flex items-center gap-3">
                          <ProgressBar value={r.avg} className="h-1.5" label={`${r.cohort.name} average progress`} />
                          <span className="shrink-0 text-[12.5px] text-muted tabular">
                            {plural(r.fellows, "fellow")} · avg {r.avg}%
                          </span>
                        </div>
                      ) : (
                        <p className="mt-1 text-[13px] text-muted">No fellows on this track yet.</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <Panel>
              <PanelHeader
                title="Draft sessions in progress"
                description="Fellows keep seeing the published version until you publish."
                actions={
                  <Link href="/staff/content" className="text-[13.5px] underline-offset-2 hover:underline">
                    All content
                  </Link>
                }
              />
              {teach.drafts.length === 0 ? (
                <EmptyState
                  icon={<FilePenLine className="size-5" />}
                  title="No drafts in progress"
                  description="Open a module to edit a session or create a new one. Edits stay private until you publish."
                  action={
                    <ButtonLink href="/staff/content" size="sm" variant="outline" icon={<Library className="size-4" />}>
                      Open content
                    </ButtonLink>
                  }
                />
              ) : (
                <ul className="-mx-2">
                  {teach.drafts.slice(0, 6).map((s) => {
                    const mod = db.modules[s.moduleId];
                    return (
                      <li key={s.id}>
                        <Link href={`/staff/content/${s.moduleId}?s=${s.id}`} className="group flex items-center gap-3 rounded-[12px] px-2 py-2.5 hover:bg-fog">
                          <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-fog group-hover:bg-paper">
                            <FilePenLine className="size-4" aria-hidden />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[14.5px] font-medium">{sessionTitleForStaff(s)}</span>
                            <span className="block truncate text-[13px] text-muted">
                              {mod?.title}
                              {s.draftUpdatedAt && ` · edited ${fmtRelative(s.draftUpdatedAt, now)}`}
                              {s.draftUpdatedById && s.draftUpdatedById !== me.id && ` by ${db.users[s.draftUpdatedById]?.firstName}`}
                            </span>
                          </span>
                          <EditorStatusBadge session={s} className={editorStatus(s) === "published" ? "hidden" : undefined} />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>
            <QuickLinks instructor mentor={mentor} />
          </div>
        </>
      )}

      {mentees && (
        <Panel className="mt-4">
          <PanelHeader
            title="Your mentees"
            description="Progress and messages at a glance. Program staff can review mentoring conversations to keep everyone safe."
            actions={
              <ButtonLink href="/staff/mentees" size="sm" variant="soft" icon={<HeartHandshake className="size-4" />}>
                All mentees
              </ButtonLink>
            }
          />
          {mentees.length === 0 ? (
            <EmptyState icon={<HeartHandshake className="size-5" />} title="No mentees assigned yet" description="Your program manager will introduce you to fellows when a pairing is confirmed." />
          ) : (
            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {mentees.map(({ f, cohort, track, progress, currentModule, conv, unread, changes, inReview }) => (
                <li key={f.id} className="flex flex-col rounded-[16px] bg-fog p-4">
                  <div className="flex items-start gap-3">
                    <Avatar name={f.name} hue={f.avatarHue} size={44} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[15.5px] font-semibold leading-snug">{f.name}</p>
                      <p className="truncate text-[13px] text-muted">
                        {f.ventureName ?? "Venture in progress"}
                        {f.ventureStage && ` · ${f.ventureStage}`}
                      </p>
                    </div>
                    {unread > 0 && (
                      <span className="inline-flex h-6 shrink-0 items-center gap-1 rounded-full bg-jade px-2 text-[12px] font-semibold text-void tabular" aria-label={`${unread} unread`}>
                        <MessagesSquare className="size-3.5" aria-hidden />
                        {unread}
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-[12.5px] text-muted">
                    {cohort?.name}
                    {track && ` · ${track.name}`}
                  </p>
                  <div className="mt-1.5 flex items-center gap-3">
                    <ProgressBar value={progress.pct} className="h-1.5" label={`${f.name} track progress`} />
                    <span className="shrink-0 text-[12.5px] tabular text-muted">{progress.pct}%</span>
                  </div>
                  <p className="mt-2 text-[13px] text-ink">
                    {currentModule ? (
                      <>
                        Working on <span className="font-medium">Module {currentModule.order}: {currentModule.title}</span>
                      </>
                    ) : (
                      "All published modules complete"
                    )}
                  </p>
                  {(changes > 0 || inReview > 0) && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {changes > 0 && <Badge tone="amber">{plural(changes, "revision")} requested</Badge>}
                      {inReview > 0 && <Badge tone="purple">{inReview} in review</Badge>}
                    </div>
                  )}
                  <div className="mt-auto flex flex-wrap gap-2 pt-4">
                    <ButtonLink href={conv ? `/staff/messages?c=${conv.id}` : "/staff/messages"} size="sm" variant={unread ? "primary" : "outline"} icon={<MessagesSquare className="size-4" />}>
                      {unread ? "Reply" : conv ? "Message" : "Start a conversation"}
                    </ButtonLink>
                    <ButtonLink href="/staff/mentees" size="sm" variant="ghost">
                      Details
                    </ButtonLink>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )}

      {!teach && <QuickLinks mentor={mentor} className="mt-4" />}
    </>
  );
}

function QuickLinks({ instructor, mentor, className }: { instructor?: boolean; mentor?: boolean; className?: string }) {
  const links = [
    instructor && { href: "/staff/submissions", label: "Review submissions", icon: ClipboardCheck },
    instructor && { href: "/staff/content", label: "Edit sessions", icon: Library },
    mentor && { href: "/staff/mentees", label: "Mentees", icon: HeartHandshake },
    { href: "/staff/messages", label: "Messages", icon: MessagesSquare },
    { href: "/staff/announcements", label: "Announcements", icon: Megaphone },
    { href: "/staff/settings", label: "Notification settings", icon: Settings },
  ].filter(Boolean) as { href: string; label: string; icon: typeof Library }[];
  return (
    <Panel className={className}>
      <PanelHeader title="Quick links" />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="flex min-h-11 items-center gap-3 rounded-[12px] bg-fog px-3 py-2.5 text-[14px] transition-colors hover:bg-ash">
            <l.icon className="size-4 shrink-0" aria-hidden />
            {l.label}
          </Link>
        ))}
      </div>
      {instructor && (
        <p className="mt-4 flex items-start gap-2 text-[12.5px] text-muted">
          <Sparkles className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          Tip: use “Preview as learner” in the editor to see a draft exactly as fellows will.
        </p>
      )}
    </Panel>
  );
}
