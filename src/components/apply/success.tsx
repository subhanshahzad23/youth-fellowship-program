"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Check, CheckCircle2, Copy, LayoutDashboard, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { Application, Cohort } from "@/lib/domain/types";
import { fellowMembership } from "@/lib/domain/permissions";
import { applicationsOf, openForms } from "@/lib/domain/selectors";
import { useNow } from "@/lib/hooks";
import { useDb, useMe } from "@/lib/store/store";
import { fmtDateLong } from "@/lib/utils";
import { ButtonLink, Button } from "@/components/ui/button";
import { Eyebrow, Panel, PanelHeader, StatusBadge } from "@/components/ui/display";
import { AnswerSummary, ApplicantTimeline, LockNotice, StatusProgress } from "./answer-summary";

const EASE = [0.23, 1, 0.32, 1] as const;

function ReferenceBox({ reference }: { reference: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="inline-flex flex-wrap items-center gap-3 rounded-[14px] bg-fog py-2 pl-4 pr-2">
      <span className="text-left">
        <span className="eyebrow block text-muted">Your reference</span>
        <span className="font-mono text-[20px] font-medium tracking-[0.02em]">{reference}</span>
      </span>
      <Button
        size="sm"
        variant="light"
        icon={copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(reference);
            setCopied(true);
            toast.success("Reference copied");
            window.setTimeout(() => setCopied(false), 2000);
          } catch {
            toast.error("Couldn't copy — select the reference and copy it manually.");
          }
        }}
      >
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}

function OtherIntakes({ cohortId }: { cohortId: string }) {
  const db = useDb();
  const me = useMe();
  const now = useNow();
  const others = useMemo(() => {
    const mine = new Set(me ? applicationsOf(db, me.id).map((a) => a.cohortId) : []);
    return openForms(db, now).filter((f) => f.cohortId !== cohortId && !mine.has(f.cohortId));
  }, [db, me, now, cohortId]);
  if (!others.length) return null;
  return (
    <>
      {others.map((f) => (
        <ButtonLink key={f.id} href={`/apply/${db.cohorts[f.cohortId]?.slug}`} variant="outline" icon={<Sparkles className="size-4" />}>
          Also apply to {db.cohorts[f.cohortId]?.name}
        </ButtonLink>
      ))}
    </>
  );
}

/** Shown right after a successful submit or resubmit. */
export function SubmittedSuccess({ app, cohort, resubmitted }: { app: Application; cohort: Cohort; resubmitted: boolean }) {
  const me = useMe();
  const firstName = app.answers.about.preferredName || me?.firstName || "";
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <Panel className="overflow-hidden p-6 text-center sm:p-10">
        <motion.span
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.25, ease: EASE }}
          className="mx-auto grid size-16 place-items-center rounded-full bg-jade"
        >
          <Check className="size-8 text-void" strokeWidth={2.5} aria-hidden />
        </motion.span>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.08, ease: EASE }}>
          <Eyebrow className="mt-6">{resubmitted ? "Changes sent" : "Application submitted"}</Eyebrow>
          <h1 className="mx-auto mt-3 max-w-2xl font-display text-[34px] leading-[1.05] tracking-[-0.035em] sm:text-[48px]">
            {resubmitted ? `Thanks${firstName ? `, ${firstName}` : ""} — your updates are with your reviewer` : `Thanks${firstName ? `, ${firstName}` : ""} — your ${cohort.name} application is in`}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-[16px] leading-relaxed text-muted">
            {resubmitted
              ? "Same application, same reference number. Your reviewer has been notified and will pick up where they left off."
              : "We've sent a confirmation to your inbox (simulated) and assigned a reviewer. You can follow every step from your dashboard."}
          </p>
          <div className="mt-6 flex justify-center">
            <ReferenceBox reference={app.reference ?? "—"} />
          </div>
          <StatusProgress status={app.status} className="mx-auto mt-8 max-w-lg text-left" />
        </motion.div>
      </Panel>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Panel>
          <PanelHeader title="What happens next" />
          <ol className="space-y-4">
            {[
              { t: "A reviewer reads your application", d: "Reviewers score four areas — motivation, your idea, commitment and community impact — using the same rubric for everyone." },
              { t: "Your proof of residence is checked", d: "Only reviewers assigned to your application can open it. The location check is just one part of eligibility." },
              { t: "You hear back here and by email", d: "Most applicants hear within four weeks of the closing date. If a reviewer needs something, only those items reopen for you." },
            ].map((s, i) => (
              <li key={s.t} className="flex gap-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-fog text-[12.5px] font-semibold tabular">{i + 1}</span>
                <span className="min-w-0">
                  <span className="block text-[15px] font-medium">{s.t}</span>
                  <span className="mt-0.5 block text-[14px] leading-relaxed text-muted">{s.d}</span>
                </span>
              </li>
            ))}
          </ol>
        </Panel>
        <Panel>
          <PanelHeader title="Status" description={`${cohort.name} starts ${fmtDateLong(cohort.startDate)}`} actions={<StatusBadge status={app.status} />} />
          <ApplicantTimeline app={app} />
        </Panel>
      </div>

      <LockNotice className="bg-paper">
        Your answers are now locked. If a reviewer needs something changed, they&apos;ll ask — and only those items will reopen for editing.
      </LockNotice>

      <div className="flex flex-wrap gap-2">
        <ButtonLink href="/applicant/dashboard" arrow icon={<LayoutDashboard className="size-4" />}>
          Go to your dashboard
        </ButtonLink>
        <ButtonLink href={`/applicant/applications/${app.id}`} variant="outline">
          View application
        </ButtonLink>
        <OtherIntakes cohortId={cohort.id} />
      </div>
    </div>
  );
}

/** Already submitted: read-only summary with a route to the status page. */
export function LockedSummary({ app, cohort }: { app: Application; cohort: Cohort }) {
  const db = useDb();
  const fm = fellowMembership(db, app.applicantId);
  const isFellowHere = app.status === "approved" && fm;
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <Panel className="sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <Eyebrow>{cohort.name}</Eyebrow>
          <StatusBadge status={app.status} />
        </div>
        <h1 className="mt-3 font-display text-[34px] leading-[1.05] tracking-[-0.035em] sm:text-[44px]">You&apos;ve already applied to {cohort.name}</h1>
        <p className="mt-2 text-[15.5px] leading-relaxed text-muted">
          Reference <span className="font-mono font-medium text-void">{app.reference}</span>
          {app.submittedAt ? ` · submitted ${fmtDateLong(app.submittedAt)}` : ""}. One application per intake — follow its progress from your applicant portal.
        </p>
        <StatusProgress status={app.status} className="mt-6 max-w-lg" />
        <div className="mt-6 flex flex-wrap gap-2">
          {isFellowHere ? (
            <ButtonLink href="/workspace/dashboard" arrow icon={<CheckCircle2 className="size-4" />}>
              Enter your fellow workspace
            </ButtonLink>
          ) : (
            <ButtonLink href={`/applicant/applications/${app.id}`} arrow>
              View application status
            </ButtonLink>
          )}
          <ButtonLink href="/applicant/dashboard" variant="outline">
            Applicant dashboard
          </ButtonLink>
        </div>
      </Panel>
      <LockNotice className="bg-paper" />
      <Panel className="sm:p-8">
        <PanelHeader title="What you submitted" />
        <AnswerSummary app={app} />
      </Panel>
    </div>
  );
}
