"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Bell, CalendarDays, ClipboardList, FileText, GraduationCap, Megaphone, MessagesSquare, PartyPopper, ShieldAlert, Sparkles } from "lucide-react";
import type { NotificationKind } from "@/lib/domain/types";
import { markNotificationRead } from "@/lib/actions/comms";
import { fellowMembership } from "@/lib/domain/permissions";
import { applicationsOf, formForCohort, notificationsOf, sortedCohorts, windowState } from "@/lib/domain/selectors";
import { useNow } from "@/lib/hooks";
import { useDb, useMe } from "@/lib/store/store";
import { cn, fmtDateLong, fmtRelative } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";
import { Badge, EmptyState, PageHeader, Panel, PanelHeader } from "@/components/ui/display";
import { ApplicationCard } from "@/components/apply/application-card";
import { daysLeftLabel, InterestForm } from "@/components/apply/window-states";

const ICON: Record<NotificationKind, typeof Bell> = {
  announcement: Megaphone,
  message: MessagesSquare,
  application: FileText,
  review: FileText,
  feedback: GraduationCap,
  assignment: ClipboardList,
  moderation: ShieldAlert,
  enrollment: PartyPopper,
  system: Bell,
};

export default function ApplicantDashboard() {
  const db = useDb();
  const me = useMe()!;
  const now = useNow();

  const data = useMemo(() => {
    const apps = applicationsOf(db, me.id);
    const mine = new Set(apps.map((a) => a.cohortId));
    const cohorts = sortedCohorts(db).map((c) => ({ c, form: formForCohort(db, c.id) })).map((x) => ({ ...x, ws: windowState(x.form, now) }));
    const open = cohorts.filter((x) => x.ws === "open" && !mine.has(x.c.id));
    const upcoming = cohorts.filter((x) => x.ws === "upcoming");
    const registered = new Set(Object.values(db.interest).filter((i) => i.email.toLowerCase() === me.email.toLowerCase()).map((i) => i.cohortId));
    const notifications = notificationsOf(db, me.id).slice(0, 5);
    const fm = fellowMembership(db, me.id);
    return { apps, open, upcoming, registered, notifications, fm };
  }, [db, me.id, me.email, now]);

  const hour = new Date(now).getUTCHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const active = data.apps.filter((a) => a.status === "draft" || a.status === "changes_requested").length;
  const withReviewers = data.apps.some((a) => a.status === "submitted" || a.status === "in_review");
  const fellowCohort = data.fm ? db.cohorts[data.fm.cohortId] : undefined;
  const fellowTrack = data.fm?.trackId ? db.tracks[data.fm.trackId] : undefined;

  return (
    <>
      <PageHeader
        eyebrow="Applicant portal"
        title={`${greeting}, ${me.firstName}`}
        description={
          !data.apps.length
            ? "Start an application for an open intake — it takes about 25 minutes and saves as you go."
            : active
              ? `You have ${active} application${active === 1 ? "" : "s"} waiting on you. Everything saves as you go.`
              : withReviewers
                ? "Your application is with the program team. We'll update you here and by email."
                : "Here's where your applications stand."
        }
        actions={
          <ButtonLink href="/applicant/applications" variant="outline" icon={<FileText className="size-4" />}>
            All applications
          </ButtonLink>
        }
      />

      {data.fm && fellowCohort && (
        <section aria-labelledby="fellow-h" className="dots-dark relative mb-4 overflow-hidden rounded-[24px] p-6 text-paper sm:p-8">
          <p className="eyebrow text-jade">You&apos;re a fellow now</p>
          <h2 id="fellow-h" className="mt-3 max-w-2xl font-display text-[32px] leading-[1.05] tracking-[-0.035em] sm:text-[40px]">
            Welcome to {fellowCohort.name}
            {fellowTrack ? ` · ${fellowTrack.name}` : ""}
          </h2>
          <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-[#bdbdbd]">
            Same account, new home. Your fellow workspace has your cohort, curriculum, mentor and messages. Your application history stays here.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href="/workspace/dashboard" size="lg" arrow>
              Enter your workspace
            </ButtonLink>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.55fr_1fr]">
        <div className="flex min-w-0 flex-col gap-4">
          <section aria-labelledby="apps-h">
            <h2 id="apps-h" className="sr-only">
              Your applications
            </h2>
            {data.apps.length === 0 ? (
              <Panel>
                <EmptyState
                  icon={<FileText className="size-5" />}
                  title="No applications yet"
                  description="Pick an open intake below to get started. You can apply to more than one."
                  action={
                    data.open[0] ? (
                      <ButtonLink href={`/apply/${data.open[0].c.slug}`} arrow>
                        Apply to {data.open[0].c.name}
                      </ButtonLink>
                    ) : undefined
                  }
                />
              </Panel>
            ) : (
              <div className="flex flex-col gap-4">
                {data.apps.map((a) => (
                  <ApplicationCard key={a.id} app={a} />
                ))}
              </div>
            )}
          </section>

          <Panel aria-labelledby="open-h">
            <PanelHeader
              title={<span id="open-h">Open for applications</span>}
              description={data.apps.length ? "Intakes run independently, so you can apply to more than one at a time." : "Choose an intake to start."}
            />
            {data.open.length === 0 ? (
              <p className="text-[14px] text-muted">{data.apps.length ? "You've applied to every intake that's open right now." : "No intakes are open right now."}</p>
            ) : (
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {data.open.map(({ c, form }) => (
                  <li key={c.id} className="flex flex-col rounded-[16px] bg-fog p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[16px] font-semibold">{c.name}</p>
                      <Badge tone="green">{form ? daysLeftLabel(form.closesAt, now) : "Open"}</Badge>
                    </div>
                    <p className="mt-1 text-[13.5px] text-muted">
                      Starts {fmtDateLong(c.startDate)} · {c.location}
                    </p>
                    <p className="mt-2 line-clamp-3 flex-1 text-[14px] leading-relaxed text-ink">{form?.intro}</p>
                    <ButtonLink href={`/apply/${c.slug}`} size="sm" arrow className="mt-4 self-start">
                      Start application
                    </ButtonLink>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <Panel>
            <PanelHeader title="Recent notifications" />
            {data.notifications.length === 0 ? (
              <p className="text-[14px] text-muted">Updates about your applications will appear here.</p>
            ) : (
              <ul className="-mx-2">
                {data.notifications.map((n) => {
                  const Icon = ICON[n.kind] ?? Bell;
                  return (
                    <li key={n.id}>
                      <Link
                        href={n.href}
                        onClick={() => markNotificationRead(n.id)}
                        className="flex items-start gap-3 rounded-[12px] px-2 py-2.5 transition-colors hover:bg-fog"
                      >
                        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-fog">
                          <Icon className="size-4" aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={cn("block text-[14.5px] leading-snug", n.readAt ? "font-medium" : "font-semibold")}>{n.title}</span>
                          <span className="mt-0.5 line-clamp-2 block text-[13px] text-muted">{n.body}</span>
                          <span className="mt-0.5 block text-[12px] text-muted">{fmtRelative(n.createdAt, now)}</span>
                        </span>
                        {!n.readAt && (
                          <span className="mt-2 size-2 shrink-0 rounded-full bg-jade" aria-label="Unread" />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          <Panel>
            <PanelHeader title="Coming up" description="Future intakes. We'll tell you the day they open." />
            {data.upcoming.length === 0 ? (
              <p className="text-[14px] text-muted">No future intakes have been announced yet.</p>
            ) : (
              <ul className="space-y-4">
                {data.upcoming.map(({ c, form }) => (
                  <li key={c.id} className="rounded-[16px] bg-fog p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[16px] font-semibold">{c.name}</p>
                      <Badge tone="blue" icon={<CalendarDays className="size-3.5" aria-hidden />}>
                        Opens {fmtDateLong(form?.opensAt)}
                      </Badge>
                    </div>
                    <p className="mt-1 text-[13.5px] text-muted">Starts {fmtDateLong(c.startDate)}</p>
                    <div className="mt-3">
                      {data.registered.has(c.id) ? (
                        <p className="flex items-center gap-2 text-[14px] text-leaf-ink">
                          <Sparkles className="size-4" aria-hidden /> You&apos;re on the list — we&apos;ll email {me.email} when it opens.
                        </p>
                      ) : (
                        <InterestForm cohorts={[c]} compact stack />
                      )}
                    </div>
                    <Link href={`/apply/${c.slug}`} className="mt-3 inline-block text-[13.5px] font-medium underline-offset-2 hover:underline">
                      Key dates
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
