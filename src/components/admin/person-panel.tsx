"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, HeartHandshake, Lock, MapPin, MessagesSquare, X } from "lucide-react";
import type { ID } from "@/lib/domain/types";
import { canMessage } from "@/lib/domain/permissions";
import { applicationsOf, cohortPhaseLabel, modulesOfTrack, moduleProgress, trackProgress } from "@/lib/domain/selectors";
import { useNow } from "@/lib/hooks";
import { useDb, useMe } from "@/lib/store/store";
import { fmtDate, plural } from "@/lib/utils";
import { Button, ButtonLink } from "@/components/ui/button";
import { Avatar, Badge, ProgressBar, RestrictedState, StatusBadge } from "@/components/ui/display";
import { Sheet } from "@/components/ui/overlay";
import { PairMentorDialog } from "./pair-mentor-dialog";
import { PERSON_ROLE_LABEL, mentorConversationId, peopleInScope } from "./people-data";

const ROLE_WORD: Record<string, string> = { fellow: "Fellow", program_admin: "Program admin", instructor: "Instructor", mentor: "Mentor" };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line px-5 py-5 sm:px-6">
      <h3 className="eyebrow mb-3 text-muted">{title}</h3>
      {children}
    </section>
  );
}

/** Right-hand person record for admins. Never shows private applicant fields or residence documents. */
export function PersonSheet({ userId, onClose }: { userId: ID | null; onClose: () => void }) {
  return (
    <Sheet open={!!userId} onOpenChange={(o) => !o && onClose()} title="Person details" side="right" className="w-[min(94vw,480px)]">
      <button type="button" onClick={onClose} className="absolute right-3 top-3 z-10 grid size-10 place-items-center rounded-[8px] hover:bg-fog" aria-label="Close person details">
        <X className="size-5" />
      </button>
      <div className="min-h-0 flex-1 overflow-y-auto">{userId && <PersonBody userId={userId} />}</div>
    </Sheet>
  );
}

function PersonBody({ userId }: { userId: ID }) {
  const db = useDb();
  const me = useMe()!;
  const meId = me.id;
  const now = useNow();
  const [pairing, setPairing] = useState(false);
  const row = useMemo(() => peopleInScope(db, meId).find((r) => r.user.id === userId), [db, meId, userId]);
  const user = db.users[userId];

  const detail = useMemo(() => {
    if (!row) return null;
    const u = row.user;
    const memberships = Object.values(db.memberships)
      .filter((m) => m.userId === u.id && (row.cohortIds.includes(m.cohortId) || m.role === "fellow"))
      .sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1));
    const track = row.fellow?.trackId ? db.tracks[row.fellow.trackId] : undefined;
    const progress = track ? trackProgress(db, u.id, track.id) : undefined;
    const modules = track ? modulesOfTrack(db, track.id).map((m) => ({ m, p: moduleProgress(db, u.id, m.id) })) : [];
    const drafts = applicationsOf(db, u.id).filter((a) => a.status === "draft" && row.cohortIds.includes(a.cohortId)).length;
    const mentees = u.staffRoles.includes("mentor")
      ? Object.values(db.mentorAssignments)
          .filter((a) => a.mentorId === u.id && a.status === "active")
          .map((a) => db.users[a.fellowId])
          .filter(Boolean)
      : [];
    const pastMentors = Object.values(db.mentorAssignments).filter((a) => a.fellowId === u.id && a.status === "ended");
    const openSubs = Object.values(db.submissions).filter((s) => s.fellowId === u.id && s.status === "submitted").length;
    return { memberships, track, progress, modules, drafts, mentees, pastMentors, openSubs };
  }, [db, row]);

  if (!user)
    return (
      <div className="p-6 pt-14">
        <p className="font-display text-[26px] tracking-[-0.03em]">We couldn&apos;t find that person</p>
        <p className="mt-2 text-[14.5px] text-muted">The link may be mistyped, or the demo data was reset.</p>
      </div>
    );
  if (!row || !detail)
    return (
      <div className="p-6 pt-14">
        <p className="font-display text-[26px] tracking-[-0.03em]">{user.name}</p>
        <div className="mt-4">
          <RestrictedState title="Outside your scope" reason="This person isn't connected to any cohort you manage, so their record isn't available to you. Executive admins can see everyone." />
        </div>
      </div>
    );

  const u = row.user;
  const msg = canMessage(db, meId, u.id);
  const mentor = row.mentorId ? db.users[row.mentorId] : undefined;
  const conv = row.mentorId ? mentorConversationId(db, row.mentorId, u.id) : undefined;
  const isApplicantish = row.roles.includes("fellow") || row.roles.includes("applicant");

  return (
    <div>
      <div className="px-5 pb-5 pt-6 sm:px-6">
        <div className="flex items-center gap-4 pr-10">
          <Avatar name={u.name} hue={u.avatarHue} size={56} />
          <div className="min-w-0">
            <h2 className="font-display text-[28px] leading-tight tracking-[-0.03em]">{u.name}</h2>
            <p className="text-[13.5px] text-muted">
              {[u.pronouns, u.title].filter(Boolean).join(" · ") || PERSON_ROLE_LABEL[row.roles[0]]}
            </p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {row.roles.map((r) => (
            <Badge key={r} tone={r === "fellow" ? "green" : r === "applicant" ? "blue" : "neutral"}>
              {PERSON_ROLE_LABEL[r]}
            </Badge>
          ))}
        </div>
        <dl className="mt-4 grid grid-cols-1 gap-1.5 text-[13.5px]">
          <div className="flex gap-2">
            <dt className="w-16 shrink-0 text-muted">Email</dt>
            <dd className="min-w-0 truncate">{u.email}</dd>
          </div>
          {u.city && (
            <div className="flex gap-2">
              <dt className="w-16 shrink-0 text-muted">Area</dt>
              <dd className="inline-flex items-center gap-1">
                <MapPin className="size-3.5 text-muted" aria-hidden />
                {u.city}
              </dd>
            </div>
          )}
        </dl>
        <div className="mt-4 flex flex-wrap gap-2">
          {msg.ok && u.id !== meId && (
            <ButtonLink href={`/admin/messages?to=${u.id}`} size="sm" variant="dark" icon={<MessagesSquare className="size-3.5" />}>
              Message
            </ButtonLink>
          )}
          {row.fellow && (
            <Button size="sm" variant="outline" icon={<HeartHandshake className="size-3.5" />} onClick={() => setPairing(true)}>
              {mentor ? "Change mentor" : "Pair mentor"}
            </Button>
          )}
          {row.fellow && (
            <ButtonLink href={`/admin/cohorts/${row.fellow.cohortId}#fellows`} size="sm" variant="ghost">
              Open cohort
            </ButtonLink>
          )}
        </div>
        {!msg.ok && u.id !== meId && <p className="mt-2 text-[12.5px] text-muted">{msg.reason}</p>}
      </div>

      {row.fellow && (
        <Section title="Fellowship">
          <dl className="grid grid-cols-1 gap-2 text-[14px]">
            <div className="grid grid-cols-[96px_1fr] gap-2">
              <dt className="text-muted">Cohort</dt>
              <dd>
                <Link href={`/admin/cohorts/${row.fellow.cohortId}`} className="underline-offset-2 hover:underline">
                  {db.cohorts[row.fellow.cohortId]?.name}
                </Link>{" "}
                <span className="text-muted">· {cohortPhaseLabel(db.cohorts[row.fellow.cohortId], now)}</span>
              </dd>
            </div>
            <div className="grid grid-cols-[96px_1fr] gap-2">
              <dt className="text-muted">Track</dt>
              <dd>{detail.track?.name ?? "Not set"}</dd>
            </div>
            <div className="grid grid-cols-[96px_1fr] gap-2">
              <dt className="text-muted">Mentor</dt>
              <dd>
                {mentor ? (
                  <span className="flex flex-wrap items-center gap-x-2">
                    <Link href={`/admin/people?u=${mentor.id}`} className="underline-offset-2 hover:underline">
                      {mentor.name}
                    </Link>
                    {conv && (
                      <Link href={`/admin/messages?c=${conv}`} className="text-[13px] text-muted underline underline-offset-2 hover:text-void">
                        View conversation
                      </Link>
                    )}
                  </span>
                ) : (
                  <span className="text-muted">No mentor yet</span>
                )}
              </dd>
            </div>
            <div className="grid grid-cols-[96px_1fr] gap-2">
              <dt className="text-muted">Joined</dt>
              <dd>
                {fmtDate(row.fellow.startedAt)}
                {row.fellow.sourceApplicationId && db.applications[row.fellow.sourceApplicationId] && (
                  <>
                    {" "}
                    <span className="text-muted">via</span>{" "}
                    <Link href={`/admin/applications/${row.fellow.sourceApplicationId}`} className="underline-offset-2 hover:underline">
                      {db.applications[row.fellow.sourceApplicationId].reference}
                    </Link>
                  </>
                )}
              </dd>
            </div>
          </dl>
          {detail.pastMentors.length > 0 && (
            <p className="mt-3 text-[12.5px] text-muted">
              Previous mentor{detail.pastMentors.length > 1 ? "s" : ""}: {detail.pastMentors.map((a) => `${db.users[a.mentorId]?.name} (ended ${fmtDate(a.endedAt)})`).join(", ")}
            </p>
          )}
        </Section>
      )}

      {detail.progress && (
        <Section title="Learning progress">
          <div className="flex items-baseline justify-between text-[14px]">
            <span className="inline-flex items-center gap-1.5">
              <BookOpen className="size-4" aria-hidden /> {detail.track?.name}
            </span>
            <span className="font-semibold tabular">{detail.progress.pct}%</span>
          </div>
          <ProgressBar value={detail.progress.pct} className="mt-2" label={`${u.name} track progress`} />
          <p className="mt-1.5 text-[12.5px] text-muted">
            {detail.progress.done} of {plural(detail.progress.total, "session")} complete
            {detail.openSubs ? ` · ${plural(detail.openSubs, "assignment")} awaiting instructor review` : ""}
          </p>
          <ul className="mt-3 grid grid-cols-1 gap-1.5">
            {detail.modules.map(({ m, p }) => (
              <li key={m.id} className="grid grid-cols-[1fr_72px_36px] items-center gap-2 text-[12.5px]">
                <span className="truncate text-muted">
                  {m.order}. {m.title}
                </span>
                <ProgressBar value={p.pct} tone="dark" className="h-1" label={`${m.title} progress`} />
                <span className="text-right tabular">{p.pct}%</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {(u.ventureName || u.ventureSummary) && (
        <Section title="Venture">
          <p className="text-[15px] font-semibold">
            {u.ventureName}
            {u.ventureStage && (
              <Badge tone="neutral" className="ml-2 align-middle">
                {u.ventureStage}
              </Badge>
            )}
          </p>
          {u.ventureSummary && <p className="mt-1.5 text-[14px] leading-relaxed text-ink">{u.ventureSummary}</p>}
        </Section>
      )}

      {(row.apps.length > 0 || detail.drafts > 0) && (
        <Section title="Applications">
          <ul className="grid grid-cols-1 gap-1.5">
            {row.apps.map((a) => (
              <li key={a.id}>
                <Link href={`/admin/applications/${a.id}`} className="flex flex-wrap items-center gap-2 rounded-[10px] bg-fog px-3 py-2.5 text-[13.5px] hover:bg-ash">
                  <span className="min-w-0 flex-1">
                    <span className="font-medium">{a.reference ?? "Application"}</span> <span className="text-muted">· {db.cohorts[a.cohortId]?.name} · {fmtDate(a.submittedAt)}</span>
                  </span>
                  <StatusBadge status={a.status} />
                </Link>
              </li>
            ))}
          </ul>
          {detail.drafts > 0 && <p className="mt-2 text-[12.5px] text-muted">Plus {plural(detail.drafts, "draft")} in progress — drafts stay private until submitted.</p>}
        </Section>
      )}

      {detail.mentees.length > 0 && (
        <Section title={`Mentees · ${detail.mentees.length}`}>
          <ul className="flex flex-wrap gap-2">
            {detail.mentees.map((f) => (
              <li key={f.id}>
                <Link href={`/admin/people?u=${f.id}`} className="inline-flex h-9 items-center gap-2 rounded-full bg-fog pl-1 pr-3 text-[13.5px] hover:bg-ash">
                  <Avatar name={f.name} hue={f.avatarHue} size={28} />
                  {f.name}
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {u.bio && (
        <Section title="About">
          <p className="text-[14px] leading-relaxed text-ink">{u.bio}</p>
        </Section>
      )}

      {detail.memberships.length > 0 && (
        <Section title="Roles & memberships">
          <ul className="divide-y divide-line">
            {detail.memberships.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-[13.5px]">
                <span>
                  <span className="font-medium">{db.cohorts[m.cohortId]?.name}</span>{" "}
                  <span className="text-muted">
                    · {ROLE_WORD[m.role]}
                    {m.trackId ? ` · ${db.tracks[m.trackId]?.shortName}` : ""}
                  </span>
                </span>
                <span className="text-[12.5px] text-muted">
                  {m.status === "active" ? `Since ${fmtDate(m.startedAt)}` : `Ended ${fmtDate(m.endedAt)}`}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {isApplicantish && (
        <Section title="Private details">
          <RestrictedState
            title="Restricted to assigned reviewers"
            reason="Date of birth, phone number, guardian contact, home address and residence documents are only visible to reviewers assigned to each application. They are never shown in people records or the fellow directory."
          />
          <p className="mt-2 inline-flex items-center gap-1.5 text-[12px] text-muted">
            <Lock className="size-3" aria-hidden /> Access to restricted documents is recorded in the audit log.
          </p>
        </Section>
      )}

      {row.fellow && <PairMentorDialog cohortId={row.fellow.cohortId} fellowId={u.id} open={pairing} onOpenChange={setPairing} />}
    </div>
  );
}
