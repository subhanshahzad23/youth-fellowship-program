"use client";

import { Info, MessagesSquare, ShieldCheck } from "lucide-react";
import { fellowMembership, membershipsOf, mentorFellowIds, roleLabel } from "@/lib/domain/permissions";
import { useDb, useMe } from "@/lib/store/store";
import { fmtDate } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";
import { Avatar, Notice, PageHeader, Panel, PanelHeader } from "@/components/ui/display";
import { NotificationSettings } from "@/components/settings/notification-settings";
import { messagingRuleFor, SUPERVISION_NOTICE } from "./lib";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-3 py-2.5 sm:grid-cols-[150px_minmax(0,1fr)]">
      <dt className="text-[13.5px] text-muted">{label}</dt>
      <dd className="min-w-0 break-words text-[14.5px]">{children}</dd>
    </div>
  );
}

/** Read-only profile summary + notification preferences for the workspace and staff portals. */
export function AccountSettings({ portal }: { portal: "workspace" | "staff" }) {
  const db = useDb();
  const me = useMe()!;
  const fm = fellowMembership(db, me.id);
  const staffCohorts = [...new Set(membershipsOf(db, me.id).filter((m) => m.role !== "fellow").map((m) => db.cohorts[m.cohortId]?.name).filter(Boolean))];
  const mentees = mentorFellowIds(db, me.id).length;
  const track = fm?.trackId ? db.tracks[fm.trackId] : undefined;

  return (
    <>
      <PageHeader eyebrow={portal === "workspace" ? "Fellow workspace" : "Staff"} title="Settings" description="Your profile and how Launchpad lets you know about new activity." />

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Panel aria-labelledby="profile-h">
          <div className="mb-3 flex items-center gap-4">
            <Avatar name={me.name} hue={me.avatarHue} size={56} />
            <div className="min-w-0">
              <h2 id="profile-h" className="truncate text-[19px] font-semibold tracking-[-0.01em]">
                {me.name}
              </h2>
              <p className="text-[14px] text-muted">{roleLabel(db, me)}</p>
            </div>
          </div>
          <dl className="divide-y divide-line border-y border-line">
            <Row label="Email">{me.email}</Row>
            {me.pronouns && <Row label="Pronouns">{me.pronouns}</Row>}
            {me.title && <Row label="Title">{me.title}</Row>}
            {fm && (
              <>
                <Row label="Cohort">
                  {db.cohorts[fm.cohortId]?.name} · since {fmtDate(fm.startedAt)}
                </Row>
                {track && <Row label="Track">{track.name}</Row>}
                {me.ventureName && (
                  <Row label="Venture">
                    {me.ventureName}
                    {me.ventureStage ? <span className="text-muted"> · {me.ventureStage}</span> : null}
                  </Row>
                )}
              </>
            )}
            {!fm && staffCohorts.length > 0 && <Row label="Cohorts">{staffCohorts.join(", ")}</Row>}
            {mentees > 0 && <Row label="Mentees">{mentees} assigned fellow{mentees === 1 ? "" : "s"}</Row>}
            {me.city && <Row label="Area">{me.city}</Row>}
          </dl>
          <Notice className="mt-4" icon={<Info className="size-4" />}>
            This is a fictional demo identity. Profile details are managed by the program team and can&apos;t be edited here.
          </Notice>
        </Panel>

        <Panel aria-labelledby="privacy-h">
          <PanelHeader title={<span id="privacy-h">Messaging and safety</span>} />
          <ul className="space-y-3 text-[14px] leading-relaxed">
            <li className="flex gap-2.5">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-leaf-ink" aria-hidden />
              <span>{SUPERVISION_NOTICE}</span>
            </li>
            <li className="flex gap-2.5">
              <MessagesSquare className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
              <span>{messagingRuleFor(db, me.id)}</span>
            </li>
            <li className="flex gap-2.5">
              <Info className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
              <span>If a message worries you, open its actions menu and choose Report. A person on the program team reviews every report.</span>
            </li>
          </ul>
          <ButtonLink href={`/${portal}/messages`} variant="outline" size="sm" className="mt-4" icon={<MessagesSquare className="size-4" />}>
            Open messages
          </ButtonLink>
        </Panel>
      </div>

      <NotificationSettings />
    </>
  );
}
