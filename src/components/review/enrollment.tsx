"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Check, ChevronDown, IdCard, Mail, UserRoundCheck } from "lucide-react";
import type { Application, Database } from "@/lib/domain/types";
import { applicationsOf } from "@/lib/domain/selectors";
import { setPersona } from "@/lib/store/store";
import { cn, fmtDate, fmtDateTime } from "@/lib/utils";
import { Button, ButtonLink } from "@/components/ui/button";
import { Avatar, Badge } from "@/components/ui/display";
import { Paragraphs } from "@/components/ui/rich-text";

const EASE = [0.23, 1, 0.32, 1] as const;

function Card({ icon, title, children, delay, animate }: { icon: React.ReactNode; title: string; children: React.ReactNode; delay: number; animate: boolean }) {
  return (
    <motion.section
      initial={animate ? { opacity: 0, y: 10 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: EASE, delay }}
      className="min-w-0 rounded-[16px] border-[1.5px] border-line p-4"
    >
      <h3 className="flex items-center gap-2 text-[14.5px] font-semibold">
        <span className="grid size-7 place-items-center rounded-full bg-fog">{icon}</span>
        {title}
      </h3>
      <div className="mt-3 text-[14px]">{children}</div>
    </motion.section>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="min-w-0 truncate text-right">{children}</dd>
    </div>
  );
}

/**
 * Shown once an application is approved: proves the membership sits on the
 * applicant's existing identity, shows the simulated welcome email and lets
 * the presenter jump into the new fellow's workspace.
 */
export function EnrollmentPanel({ db, app, celebrate }: { db: Database; app: Application; celebrate: boolean }) {
  const router = useRouter();
  const [emailOpen, setEmailOpen] = useState(celebrate);
  const applicant = db.users[app.applicantId];
  const cohort = db.cohorts[app.cohortId];
  if (!applicant || !cohort) return null;

  const membership = Object.values(db.memberships).find((m) => m.userId === app.applicantId && m.cohortId === app.cohortId && m.role === "fellow");
  const track = membership?.trackId ? db.tracks[membership.trackId] : undefined;
  const welcome = Object.values(db.outbox)
    .filter((e) => e.kind === "welcome" && e.toUserId === app.applicantId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))[0];
  const accountsWithEmail = Object.values(db.users).filter((u) => u.email.toLowerCase() === applicant.email.toLowerCase()).length;
  const theirApps = applicationsOf(db, applicant.id).length;
  const decidedBy = app.decision ? db.users[app.decision.decidedById] : undefined;
  const canOpenWorkspace = membership?.status === "active";
  const accountSince = applicant.createdAt < app.createdAt ? applicant.createdAt : app.createdAt;

  return (
    <motion.section
      aria-labelledby="enrolled-h"
      initial={celebrate ? { opacity: 0, y: 14, scale: 0.985 } : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: EASE }}
      className="mb-4 overflow-hidden rounded-[24px] bg-paper"
    >
      <div className="dots-mint relative px-5 py-6 sm:px-8 sm:py-8">
        <div className="flex flex-col gap-5">
          <div className="min-w-0">
            <motion.span
              initial={celebrate ? { scale: 0.4, opacity: 0 } : false}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.25, ease: EASE, delay: celebrate ? 0.12 : 0 }}
              className="grid size-12 place-items-center rounded-full bg-jade text-void"
              aria-hidden
            >
              <Check className="size-6" strokeWidth={2.75} />
            </motion.span>
            <p className="eyebrow mt-4 text-[#0b4d2a]">{celebrate ? "Approved just now" : "Enrollment complete"}</p>
            <h2 id="enrolled-h" className="mt-1.5 max-w-2xl font-display text-[32px] leading-[1.05] tracking-[-0.035em] sm:text-[40px]">
              {applicant.name} is {celebrate ? "now " : ""}a {cohort.name} fellow
            </h2>
            <p className="mt-2 text-[14.5px] text-[#1c3b2a]">
              Approved by {decidedBy?.name ?? "a program admin"} · {fmtDateTime(app.decision?.decidedAt)} · {app.reference}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canOpenWorkspace && (
              <Button
                variant="dark"
                size="lg"
                arrow
                onClick={() => {
                  setPersona(applicant.id);
                  router.push("/workspace/dashboard");
                }}
              >
                Open fellow workspace as {applicant.firstName}
              </Button>
            )}
            <ButtonLink href="/admin/applications" variant="light" size="lg">
              Back to queue
            </ButtonLink>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 p-4 sm:p-6 md:grid-cols-3">
        <Card icon={<IdCard className="size-3.5" />} title="Cohort membership" delay={0.08} animate={celebrate}>
          {membership ? (
            <dl className="divide-y divide-line/70">
              <Fact label="Role">
                <Badge tone="green">Fellow</Badge>
              </Fact>
              <Fact label="Cohort">{cohort.name}</Fact>
              <Fact label="Track">{track?.name ?? "Not set"}</Fact>
              <Fact label="Started">{fmtDate(membership.startedAt)}</Fact>
              <Fact label="Created from">{membership.sourceApplicationId === app.id ? app.reference : "An earlier record"}</Fact>
            </dl>
          ) : (
            <p className="text-muted">No fellow membership found for this cohort.</p>
          )}
        </Card>

        <Card icon={<UserRoundCheck className="size-3.5" />} title="Same identity" delay={0.14} animate={celebrate}>
          <div className="flex items-center gap-3">
            <Avatar name={applicant.name} hue={applicant.avatarHue} size={40} />
            <div className="min-w-0">
              <p className="truncate font-medium">{applicant.name}</p>
              <p className="truncate text-[13px] text-muted">{applicant.email}</p>
            </div>
          </div>
          <ul className="mt-3 space-y-1.5 text-[13.5px]">
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 size-3.5 shrink-0 text-leaf-ink" aria-hidden />
              <span>
                Account since {fmtDate(accountSince)} — {accountsWithEmail === 1 ? "no new account was created" : `${accountsWithEmail} accounts share this email`}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 size-3.5 shrink-0 text-leaf-ink" aria-hidden />
              <span>Keeps their application history ({theirApps === 1 ? "1 application" : `${theirApps} applications`}) and notifications</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 size-3.5 shrink-0 text-leaf-ink" aria-hidden />
              <span>Signs in exactly as before and now lands in the fellow workspace</span>
            </li>
          </ul>
        </Card>

        <Card icon={<Mail className="size-3.5" />} title="Welcome email (simulated)" delay={0.2} animate={celebrate}>
          {welcome ? (
            <>
              <dl className="text-[13.5px]">
                <Fact label="To">{welcome.toEmail}</Fact>
                <Fact label="Sent">{fmtDateTime(welcome.createdAt)}</Fact>
              </dl>
              <p className="mt-2 font-medium leading-snug">{welcome.subject}</p>
              <p className="mt-0.5 text-[13px] text-muted">{welcome.preview}</p>
              <button
                type="button"
                onClick={() => setEmailOpen((v) => !v)}
                aria-expanded={emailOpen}
                className="mt-2 inline-flex items-center gap-1 text-[13.5px] font-medium underline-offset-2 hover:underline"
              >
                {emailOpen ? "Hide email" : "Read the email"}
                <ChevronDown className={cn("size-4 transition-transform duration-200", emailOpen && "rotate-180")} aria-hidden />
              </button>
            </>
          ) : (
            <p className="text-muted">No welcome email is on record for this approval.</p>
          )}
        </Card>
      </div>

      {welcome && emailOpen && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: EASE }} className="px-4 pb-6 sm:px-6">
          <div className="rounded-[16px] bg-fog p-4 sm:p-6">
            <p className="text-[12.5px] text-muted">
              From Launchpad Fellowship · To {welcome.toName} &lt;{welcome.toEmail}&gt; · Not actually sent — demo outbox only
            </p>
            <p className="mt-2 text-[17px] font-semibold">{welcome.subject}</p>
            <div className="mt-3 max-w-2xl space-y-3 text-[15px] leading-relaxed">
              <Paragraphs text={welcome.bodyText} />
            </div>
          </div>
        </motion.div>
      )}
    </motion.section>
  );
}
