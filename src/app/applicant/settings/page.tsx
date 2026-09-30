"use client";

import { useMemo } from "react";
import { ArrowUpRight, UserRound } from "lucide-react";
import { fellowMembership, roleLabel } from "@/lib/domain/permissions";
import { applicationsOf } from "@/lib/domain/selectors";
import { useDb, useMe } from "@/lib/store/store";
import { fmtDateLong } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";
import { Avatar, Badge, Notice, PageHeader, Panel, PanelHeader } from "@/components/ui/display";
import { NotificationSettings } from "@/components/settings/notification-settings";

export default function ApplicantSettings() {
  const db = useDb();
  const me = useMe()!;
  const apps = useMemo(() => applicationsOf(db, me.id), [db, me.id]);
  const latest = apps.find((a) => a.answers.about.phone || a.answers.about.school) ?? apps[0];
  const fm = fellowMembership(db, me.id);

  const rows: { label: string; value?: string }[] = [
    { label: "Name", value: me.name },
    { label: "Email", value: me.email },
    { label: "Pronouns", value: me.pronouns },
    { label: "School, college or workplace", value: latest?.answers.about.school },
    { label: "Account created", value: fmtDateLong(me.createdAt) },
  ];

  return (
    <>
      <PageHeader title="Settings" description="Your profile and how we keep in touch. Sign-in is simulated in this demo — there's no password to manage." />
      <Panel className="mb-4">
        <PanelHeader
          title="Profile"
          description="Details from your account and most recent application."
          actions={
            fm ? (
              <ButtonLink href="/workspace/settings" size="sm" variant="outline" icon={<ArrowUpRight className="size-4" />}>
                Fellow settings
              </ButtonLink>
            ) : undefined
          }
        />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[auto_1fr]">
          <div className="flex items-center gap-4 md:flex-col md:items-start">
            <Avatar name={me.name} hue={me.avatarHue} size={64} />
            <div>
              <p className="text-[17px] font-semibold">{me.name}</p>
              <Badge className="mt-1" icon={<UserRound className="size-3.5" aria-hidden />}>
                {roleLabel(db, me)}
              </Badge>
            </div>
          </div>
          <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
            {rows.map((r) => (
              <div key={r.label} className="min-w-0">
                <dt className="text-[13px] text-muted">{r.label}</dt>
                <dd className="mt-0.5 break-words text-[15px]">{r.value || <span className="text-muted">Not provided</span>}</dd>
              </div>
            ))}
            <div className="min-w-0">
              <dt className="text-[13px] text-muted">Applications</dt>
              <dd className="mt-0.5 text-[15px]">
                {apps.length ? apps.map((a) => `${db.cohorts[a.cohortId]?.name}${a.reference ? ` (${a.reference})` : " (draft)"}`).join(", ") : "None yet"}
              </dd>
            </div>
          </dl>
        </div>
        <Notice className="mt-5">
          You can change the details on an application until you submit it. After that, answers are locked so reviewers see exactly what you sent — if something needs correcting, your reviewer can reopen just those items.
        </Notice>
      </Panel>
      <NotificationSettings />
    </>
  );
}
