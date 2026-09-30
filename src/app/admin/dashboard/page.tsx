"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  ClipboardList,
  FileSearch,
  Gavel,
  Inbox,
  Megaphone,
  RotateCcw,
  ShieldAlert,
  UserPlus,
  UsersRound,
} from "lucide-react";
import type { Application, ApplicationStatus } from "@/lib/domain/types";
import { canAnnounce } from "@/lib/domain/permissions";
import {
  applicationsInScope,
  cohortLearningProgress,
  cohortPhaseLabel,
  formForCohort,
  STATUS_LABEL,
  trackProgress,
  windowState,
} from "@/lib/domain/selectors";
import { useNow } from "@/lib/hooks";
import { useDb, useMe } from "@/lib/store/store";
import { cn, fmtDateShort, fmtRelative, plural } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";
import { Badge, EmptyState, PageHeader, Panel, PanelHeader, ProgressBar, Stat, StatusBadge } from "@/components/ui/display";
import { Segmented } from "@/components/ui/overlay";
import { ColumnChart, FunnelChart } from "@/components/admin/charts";
import { CohortContextInline, ScopeNote } from "@/components/admin/cohort-context";
import { useAdminScope } from "@/components/admin/scope";
import { ActorAvatar } from "@/components/admin/actor-avatar";
import { actionLabel, actorName, auditEntityHref, eventsForCohorts, visibleAuditEvents } from "@/components/admin/audit-format";

const DAY = 86400000;

type AttentionItem = { id: string; icon: React.ReactNode; title: string; detail: string; href: string; badge?: { label: string; tone: "red" | "amber" | "blue" | "purple" | "neutral" | "green" } };

export default function AdminDashboard() {
  const db = useDb();
  const me = useMe()!;
  const meId = me.id;
  const now = useNow();
  const { cohortIds, filter, exec } = useAdminScope();
  const [intakeChoice, setIntakeChoice] = useState<string>("all");

  const data = useMemo(() => {
    const inView = (id?: string) => !!id && cohortIds.includes(id);
    const nowMs = Date.parse(now);

    /* ---------------------------- Fellows ---------------------------- */
    const fellowMemberships = Object.values(db.memberships).filter((m) => m.role === "fellow" && m.status === "active" && inView(m.cohortId));
    const fellowsByCohort = cohortIds.map((id) => ({ cohort: db.cohorts[id], count: fellowMemberships.filter((m) => m.cohortId === id).length })).filter((x) => x.cohort);

    /* -------------------------- Applications ------------------------- */
    const apps = applicationsInScope(db, meId).filter((a) => inView(a.cohortId));
    const reviewed = new Set(Object.values(db.reviews).filter((r) => r.status === "submitted").map((r) => r.applicationId));
    const hasReviewer = new Set(Object.values(db.reviewerAssignments).map((r) => r.applicationId));
    const awaitingReview = apps.filter((a) => a.status === "submitted" || a.status === "in_review");
    const awaitingDecision = awaitingReview.filter((a) => !a.decision && reviewed.has(a.id));
    const unassigned = awaitingReview.filter((a) => !hasReviewer.has(a.id));

    const intakeIds = cohortIds.filter((id) => {
      const c = db.cohorts[id];
      return c && (c.status === "intake" || windowState(formForCohort(db, id), now) === "open");
    });
    const openIntakeIds = intakeIds.filter((id) => windowState(formForCohort(db, id), now) === "open");
    const approvals = apps.filter((a) => a.status === "approved" && intakeIds.includes(a.cohortId));
    const intakeCapacity = intakeIds.reduce((n, id) => n + (db.cohorts[id]?.capacity ?? 0), 0);

    /* ---------------------------- Learning --------------------------- */
    const learning = cohortIds
      .map((id) => {
        const cohort = db.cohorts[id];
        const tracks = (cohort?.trackIds ?? [])
          .map((tid) => {
            const fellows = fellowMemberships.filter((m) => m.cohortId === id && m.trackId === tid);
            const pcts = fellows.map((m) => trackProgress(db, m.userId, tid).pct);
            return { track: db.tracks[tid], fellows: fellows.length, pct: pcts.length ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : 0 };
          })
          .filter((t) => t.track && t.fellows > 0);
        return { cohort, p: cohortLearningProgress(db, id), tracks };
      })
      .filter((x) => x.cohort && x.p.fellows > 0);
    const totalFellows = learning.reduce((n, x) => n + x.p.fellows, 0);
    const avgProgress = totalFellows ? Math.round(learning.reduce((n, x) => n + x.p.avgPct * x.p.fellows, 0) / totalFellows) : 0;
    const completedSessions = learning.reduce((n, x) => n + x.p.completedSessions, 0);

    /* --------------------------- Safeguarding ------------------------ */
    const openReports = Object.values(db.reports)
      .filter((r) => r.status !== "resolved" && inView(r.cohortId))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

    /* ---------------------------- Messages --------------------------- */
    const recentMessages = Object.values(db.messages).filter((m) => {
      const c = db.conversations[m.conversationId];
      const t = Date.parse(m.sentAt);
      return c && inView(c.cohortId) && t >= nowMs - 7 * DAY && t <= nowMs;
    });
    const activeConversations = new Set(recentMessages.map((m) => m.conversationId)).size;

    /* --------------------------- Weekly chart ------------------------ */
    const allApps = Object.values(db.applications).filter((a) => inView(a.cohortId) && a.submittedAt);
    const weeks = Array.from({ length: 8 }).map((_, i) => {
      const end = nowMs - (7 - i) * 7 * DAY;
      const start = end - 7 * DAY;
      const value = allApps.filter((a) => {
        const t = Date.parse(a.submittedAt!);
        return t > start && t <= end;
      }).length;
      const startIso = new Date(start + DAY).toISOString();
      return {
        label: fmtDateShort(startIso),
        short: `${new Date(startIso).getUTCMonth() + 1}/${new Date(startIso).getUTCDate()}`,
        detail: i === 7 ? "Last 7 days" : `Week of ${fmtDateShort(startIso)}`,
        value,
        highlight: i === 7,
      };
    });
    const weeklyTotal = weeks.reduce((n, w) => n + w.value, 0);

    /* ------------------------- Needs attention ----------------------- */
    const attention: AttentionItem[] = [];
    for (const r of openReports)
      attention.push({
        id: `r-${r.id}`,
        icon: <ShieldAlert className="size-4" aria-hidden />,
        title: `${r.source === "keyword_rule" ? "Keyword flag" : "Reported message"} · ${r.reason}`,
        detail: `${db.cohorts[r.cohortId]?.name ?? ""} · ${fmtRelative(r.createdAt, now)}`,
        href: `/admin/safeguarding?r=${r.id}`,
        badge: { label: r.status === "open" ? "Open" : "In review", tone: r.status === "open" ? "red" : "purple" },
      });
    const myReviews = Object.values(db.reviewerAssignments)
      .filter((ra) => ra.reviewerId === meId)
      .map((ra) => db.applications[ra.applicationId])
      .filter((a): a is Application => !!a && inView(a.cohortId) && (a.status === "submitted" || a.status === "in_review"))
      .filter((a) => !Object.values(db.reviews).some((rv) => rv.applicationId === a.id && rv.reviewerId === meId && rv.status === "submitted"));
    for (const a of myReviews) {
      const draft = Object.values(db.reviews).some((rv) => rv.applicationId === a.id && rv.reviewerId === meId && rv.status === "draft");
      attention.push({
        id: `rv-${a.id}`,
        icon: <FileSearch className="size-4" aria-hidden />,
        title: `Review ${db.users[a.applicantId]?.name ?? "application"}`,
        detail: `${a.reference ?? ""} · ${db.cohorts[a.cohortId]?.name} · submitted ${fmtRelative(a.submittedAt, now)}`,
        href: `/admin/applications/${a.id}`,
        badge: draft ? { label: "Draft review", tone: "neutral" } : { label: "Assigned to you", tone: "blue" },
      });
    }
    for (const a of awaitingDecision)
      attention.push({
        id: `d-${a.id}`,
        icon: <Gavel className="size-4" aria-hidden />,
        title: `Decide on ${db.users[a.applicantId]?.name ?? "application"}`,
        detail: `${a.reference ?? ""} · ${plural(Object.values(db.reviews).filter((r) => r.applicationId === a.id && r.status === "submitted").length, "review")} submitted`,
        href: `/admin/applications/${a.id}`,
        badge: { label: "Ready to decide", tone: "green" },
      });
    for (const a of apps.filter((x) => x.resubmissions > 0 && (x.status === "submitted" || x.status === "in_review")))
      attention.push({
        id: `rs-${a.id}`,
        icon: <RotateCcw className="size-4" aria-hidden />,
        title: `${db.users[a.applicantId]?.name ?? "Applicant"} resubmitted`,
        detail: `${a.reference ?? ""} · requested changes are back for review`,
        href: `/admin/applications/${a.id}`,
        badge: { label: "Resubmitted", tone: "amber" },
      });
    for (const a of unassigned)
      attention.push({
        id: `u-${a.id}`,
        icon: <UserPlus className="size-4" aria-hidden />,
        title: `Assign a reviewer to ${db.users[a.applicantId]?.name ?? "application"}`,
        detail: `${a.reference ?? ""} · ${db.cohorts[a.cohortId]?.name} · submitted ${fmtRelative(a.submittedAt, now)}`,
        href: `/admin/applications/${a.id}`,
        badge: { label: "No reviewer", tone: "amber" },
      });
    for (const an of Object.values(db.announcements).filter(
      (x) => x.status === "draft" && canAnnounce(db, meId, x.scope).ok && (x.scope === "all" ? filter === "all" : inView(x.scope)),
    ))
      attention.push({
        id: `an-${an.id}`,
        icon: <Megaphone className="size-4" aria-hidden />,
        title: `Draft announcement: ${an.title}`,
        detail: `${an.scope === "all" ? "All cohorts" : db.cohorts[an.scope]?.name} · not sent yet`,
        href: `/admin/announcements?id=${an.id}`,
        badge: { label: "Draft", tone: "neutral" },
      });

    /* ---------------------------- Activity --------------------------- */
    const activity = eventsForCohorts(db, meId, visibleAuditEvents(db, meId), cohortIds, filter).slice(0, 8);

    return {
      fellowMemberships,
      fellowsByCohort,
      apps,
      awaitingReview,
      awaitingDecision,
      unassigned,
      intakeIds,
      openIntakeIds,
      approvals,
      intakeCapacity,
      learning,
      avgProgress,
      completedSessions,
      openReports,
      recentMessages,
      activeConversations,
      weeks,
      weeklyTotal,
      attention,
      activity,
    };
  }, [db, meId, now, cohortIds, filter]);

  /* Funnel for the chosen open intake(s) */
  const funnelIntakes = data.openIntakeIds.length ? data.openIntakeIds : data.intakeIds;
  const chosen = useMemo(() => (intakeChoice !== "all" && funnelIntakes.includes(intakeChoice) ? [intakeChoice] : funnelIntakes), [intakeChoice, funnelIntakes]);
  const funnel = useMemo(() => {
    const apps = data.apps.filter((a) => chosen.includes(a.cohortId));
    const reviewedIds = new Set(Object.values(db.reviews).filter((r) => r.status === "submitted").map((r) => r.applicationId));
    const counts = {} as Record<ApplicationStatus, number>;
    for (const a of apps) counts[a.status] = (counts[a.status] ?? 0) + 1;
    const drafts = Object.values(db.applications).filter((a) => a.status === "draft" && chosen.includes(a.cohortId)).length;
    return {
      steps: [
        { label: "Received", value: apps.length, hint: "Submitted applications" },
        { label: "Reviewed", value: apps.filter((a) => reviewedIds.has(a.id) || !!a.decision).length, hint: "At least one scored review" },
        { label: "Decided", value: apps.filter((a) => !!a.decision).length, hint: "Approved, waitlisted or declined" },
        { label: "Approved", value: counts.approved ?? 0, hint: "Enrolled as fellows" },
      ],
      counts,
      drafts,
    };
  }, [data.apps, chosen, db.reviews, db.applications]);

  const hour = new Date(now).getUTCHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const scopeLabel = filter === "all" ? (exec ? "All cohorts" : cohortIds.map((id) => db.cohorts[id]?.name).join(" + ")) : db.cohorts[filter]?.name;
  const intakeNames = data.intakeIds.map((id) => db.cohorts[id]?.name).join(", ");

  /* ------------------------------------------------------------------ */

  const kpis = (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Link
        href="/admin/people?role=fellow"
        className="dots-dark group relative flex flex-col justify-between overflow-hidden rounded-[16px] p-5 text-paper sm:col-span-2 lg:col-span-1 lg:row-span-2"
      >
        <div>
          <p className="text-[13.5px] text-muted-display">Active fellows</p>
          <p className="mt-1 font-display text-[64px] leading-none tracking-[-0.04em] tabular">{data.fellowMemberships.length}</p>
        </div>
        <ul className="mt-6 space-y-2">
          {data.fellowsByCohort.map(({ cohort, count }) => (
            <li key={cohort.id} className="flex items-center justify-between gap-3 text-[13.5px]">
              <span className="truncate text-paper/85">{cohort.name}</span>
              <span className="shrink-0 tabular text-paper/70">
                <span className="font-semibold text-paper">{count}</span> / {cohort.capacity}
              </span>
            </li>
          ))}
        </ul>
        <span className="mt-5 inline-flex items-center gap-1 text-[13px] text-jade">
          Open people <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
        </span>
      </Link>
      <Stat
        label="Awaiting review"
        value={data.awaitingReview.length}
        detail={data.unassigned.length ? `${data.unassigned.length} without a reviewer` : "Every application has a reviewer"}
        href="/admin/applications"
      />
      <Stat label="Awaiting decision" value={data.awaitingDecision.length} detail="At least one review submitted, no decision yet" href="/admin/applications" />
      <Stat
        label="Approvals this intake"
        value={data.approvals.length}
        detail={data.intakeIds.length ? `${intakeNames} · ${data.approvals.length} of ${data.intakeCapacity} places` : "No intake open in this view"}
        href="/admin/applications"
      />
      <Stat label="Average learning progress" value={`${data.avgProgress}%`} detail={`${data.completedSessions} sessions completed by fellows`} href="/admin/cohorts" />
      <Stat
        label="Open safeguarding reports"
        value={data.openReports.length}
        detail={data.openReports.length ? `${data.openReports.filter((r) => r.status === "open").length} not yet picked up` : "All clear"}
        href="/admin/safeguarding"
      />
      <Stat label="Messages · last 7 days" value={data.recentMessages.length} detail={`${plural(data.activeConversations, "active conversation")}`} href="/admin/messages" />
    </div>
  );

  const funnelPanel = (
    <Panel>
      <PanelHeader
        title="Application funnel"
        description={funnelIntakes.length ? `${data.openIntakeIds.length ? "Open intakes" : "Intakes"} · ${chosen.map((id) => db.cohorts[id]?.name).join(", ")}` : "Open intakes"}
        actions={
          funnelIntakes.length > 1 ? (
            <Segmented
              label="Choose intake"
              value={chosen.length === 1 ? chosen[0] : "all"}
              onChange={setIntakeChoice}
              options={[{ value: "all", label: "All" }, ...funnelIntakes.map((id) => ({ value: id, label: db.cohorts[id]?.name ?? id }))]}
            />
          ) : undefined
        }
      />
      {funnelIntakes.length === 0 ? (
        <EmptyState
          icon={<Inbox className="size-5" />}
          title="No intake in this view"
          description="Application windows are set per cohort on its form."
          action={<ButtonLink href="/admin/forms" size="sm" variant="outline">Open forms</ButtonLink>}
        />
      ) : (
        <>
          <FunnelChart steps={funnel.steps} />
          <div className="mt-5 border-t border-line pt-4">
            <p className="mb-2 text-[12.5px] text-muted">Where every submitted application is right now</p>
            <ul className="flex flex-wrap gap-2">
              {(["submitted", "in_review", "changes_requested", "waitlisted", "approved", "rejected"] as ApplicationStatus[]).map((s) => (
                <li key={s} className="flex items-center gap-1.5">
                  <StatusBadge status={s} />
                  <span className="text-[13.5px] font-semibold tabular" aria-label={`${funnel.counts[s] ?? 0} ${STATUS_LABEL[s]}`}>
                    {funnel.counts[s] ?? 0}
                  </span>
                </li>
              ))}
            </ul>
            {funnel.drafts > 0 && (
              <p className="mt-3 text-[12.5px] text-muted">
                Plus {plural(funnel.drafts, "draft")} in progress — drafts stay private to applicants until they submit.
              </p>
            )}
          </div>
        </>
      )}
    </Panel>
  );

  const weeklyPanel = (
    <Panel>
      <PanelHeader title="Applications submitted per week" description={`Last 8 weeks · ${plural(data.weeklyTotal, "submission")}`} />
      <ColumnChart data={data.weeks} height={220} ariaLabel="Applications submitted per week, last 8 weeks" />
      <p className="mt-3 text-[12.5px] text-muted">Weeks start on the date shown; the jade column is the last 7 days. Counted from each application&apos;s first submission.</p>
    </Panel>
  );

  const learningPanel = (
    <Panel>
      <PanelHeader
        title="Learning progress by cohort"
        description="Average share of track sessions completed"
        actions={
          <Link href="/admin/cohorts" className="text-[13.5px] underline-offset-2 hover:underline">
            All cohorts
          </Link>
        }
      />
      {data.learning.length === 0 ? (
        <EmptyState icon={<UsersRound className="size-5" />} title="No enrolled fellows in this view" description="Progress appears once fellows join a cohort." />
      ) : (
        <ul className="space-y-3">
          {data.learning.map(({ cohort, p, tracks }) => (
            <li key={cohort.id} className="rounded-[14px] bg-fog/60 p-3.5">
              <Link href={`/admin/cohorts/${cohort.id}`} className="group block">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate text-[14.5px] font-medium group-hover:underline">
                    {cohort.name} <span className="font-normal text-muted">· {cohortPhaseLabel(cohort, now)}</span>
                  </span>
                  <span className="shrink-0 text-[14px] font-semibold tabular">{p.avgPct}%</span>
                </div>
                <ProgressBar value={p.avgPct} className="mt-1.5" label={`${cohort.name} average learning progress`} />
                <p className="mt-1 text-[12.5px] text-muted">
                  {plural(p.fellows, "fellow")} · {plural(p.completedSessions, "session")} completed
                </p>
              </Link>
              {tracks.length > 0 && (
                <ul className="mt-3 grid grid-cols-1 gap-1.5 border-t border-line pt-3" aria-label={`${cohort.name} progress by track`}>
                  {tracks.map((t) => (
                    <li key={t.track.id} className="grid grid-cols-[minmax(0,140px)_1fr_40px] items-center gap-2.5 text-[12.5px]">
                      <span className="truncate text-muted">
                        {t.track.shortName} · {plural(t.fellows, "fellow")}
                      </span>
                      <ProgressBar value={t.pct} tone="dark" className="h-1" label={`${cohort.name} ${t.track.name} progress`} />
                      <span className="text-right font-medium tabular">{t.pct}%</span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );

  const attentionPanel = (
    <Panel>
      <PanelHeader title="Needs attention" description={data.attention.length ? `${plural(data.attention.length, "item")} across ${scopeLabel}` : undefined} />
      {data.attention.length === 0 ? (
        <EmptyState icon={<ClipboardList className="size-5" />} title="Nothing waiting on you" description="Reviews, reports, resubmissions and drafts show up here." />
      ) : (
        <ul className="space-y-1.5">
          {data.attention.slice(0, 8).map((it) => (
            <li key={it.id}>
              <Link href={it.href} className="flex items-start gap-3 rounded-[12px] bg-fog p-3 transition-colors hover:bg-ash">
                <span className="mt-0.5 shrink-0">{it.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14.5px] font-medium">{it.title}</span>
                  <span className="block truncate text-[13px] text-muted">{it.detail}</span>
                </span>
                {it.badge && (
                  <Badge tone={it.badge.tone} className="hidden sm:inline-flex">
                    {it.badge.label}
                  </Badge>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
      {data.attention.length > 8 && (
        <p className="mt-3 text-[13px] text-muted">
          {data.attention.length - 8} more —{" "}
          <Link href="/admin/applications" className="font-medium text-void underline underline-offset-2">
            open the application queue
          </Link>
        </p>
      )}
    </Panel>
  );

  const activityPanel = (
    <Panel>
      <PanelHeader
        title="Recent activity"
        description="From the audit log, within your scope"
        actions={
          <ButtonLink href="/admin/audit" size="sm" variant="soft">
            Open audit log
          </ButtonLink>
        }
      />
      {data.activity.length === 0 ? (
        <EmptyState title="No activity yet" description="Changes people make in this scope are recorded here." />
      ) : (
        <ul className="divide-y divide-line">
          {data.activity.map((e) => {
            const href = auditEntityHref(db, me.id, e);
            const body = (
              <>
                <ActorAvatar db={db} actorId={e.actorId} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px]">
                    <span className="font-medium">{actorName(db, e.actorId)}</span> <span className="text-muted">· {actionLabel(e.action)}</span>
                  </span>
                  <span className={cn("block text-[13.5px] text-ink", href && "group-hover:underline")}>{e.summary}</span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-[12px] text-muted">{fmtRelative(e.at, now)}</span>
                  {e.outcome === "denied" && (
                    <Badge tone="red" icon={<ShieldAlert className="size-3.5" aria-hidden />}>
                      Denied
                    </Badge>
                  )}
                </span>
              </>
            );
            return (
              <li key={e.id}>
                {href ? (
                  <Link href={href} className="group -mx-2 flex items-start gap-3 rounded-[10px] px-2 py-3 hover:bg-fog">
                    {body}
                  </Link>
                ) : (
                  <div className="flex items-start gap-3 py-3">{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );

  return (
    <>
      <PageHeader
        eyebrow={`${exec ? "Executive overview" : "Program operations"} · ${scopeLabel}`}
        title={`${greeting}, ${me.firstName}`}
        description={
          exec
            ? "Every cohort at a glance — intake, learning and safeguarding in one place."
            : "Your cohorts today: what needs a decision, who needs support and what's next."
        }
        actions={
          <>
            <CohortContextInline />
            {exec ? (
              <>
                <ButtonLink href="/admin/cohorts?new=1" variant="outline" icon={<UsersRound className="size-4" />}>
                  New cohort
                </ButtonLink>
                <ButtonLink href="/admin/announcements" icon={<Megaphone className="size-4" />}>
                  Announce
                </ButtonLink>
              </>
            ) : (
              <>
                <ButtonLink href="/admin/announcements" variant="outline" icon={<Megaphone className="size-4" />}>
                  Announce
                </ButtonLink>
                <ButtonLink href="/admin/applications" icon={<Inbox className="size-4" />}>
                  Review queue
                </ButtonLink>
              </>
            )}
          </>
        }
      />
      <ScopeNote className="-mt-3 mb-4 sm:-mt-5" />

      {kpis}

      {exec ? (
        <>
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            {funnelPanel}
            {weeklyPanel}
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {learningPanel}
            {attentionPanel}
          </div>
        </>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            {attentionPanel}
            {learningPanel}
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            {funnelPanel}
            {weeklyPanel}
          </div>
        </>
      )}
      <div className="mt-4">{activityPanel}</div>
    </>
  );
}
