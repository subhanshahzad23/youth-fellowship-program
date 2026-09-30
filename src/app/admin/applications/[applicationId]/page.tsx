"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowDown, ArrowLeft, History, Sparkles } from "lucide-react";
import { adminCanManageCohort, canViewApplication, isAssignedReviewer } from "@/lib/domain/permissions";
import { averageScore, reviewersOf, reviewsOf } from "@/lib/domain/selectors";
import { ageOn } from "@/lib/domain/validation";
import { recordApplicationView } from "@/lib/actions/applications";
import { useMediaQuery, useNow } from "@/lib/hooks";
import { useDb, useMe } from "@/lib/store/store";
import { daysBetween, fmtDate, fmtRelative, plural } from "@/lib/utils";
import { Avatar, Notice, PageHeader, Panel, StatusBadge } from "@/components/ui/display";
import { Denied, RecordNotFound } from "@/components/portal/states";
import { useCrumb } from "@/components/portal/crumbs";
import { ApplicationActivity } from "@/components/review/activity";
import { ApplicationAnswers } from "@/components/review/answers";
import { DecisionPanel } from "@/components/review/decision";
import { EligibilityAndDocuments } from "@/components/review/eligibility";
import { EnrollmentPanel } from "@/components/review/enrollment";
import { EligibilityBadge } from "@/components/review/meta";
import { ReviewersPanel } from "@/components/review/reviewers";
import { ReviewPanel } from "@/components/review/rubric";

function Fact({ label, children, detail }: { label: string; children: React.ReactNode; detail?: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[12.5px] text-muted">{label}</dt>
      <dd className="mt-1 text-[15px] font-medium">{children}</dd>
      {detail && <dd className="mt-0.5 text-[12.5px] text-muted">{detail}</dd>}
    </div>
  );
}

export default function ApplicationReviewPage() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const db = useDb();
  const me = useMe()!;
  const now = useNow();
  const wide = useMediaQuery("(min-width: 1280px)");
  const [celebrate, setCelebrate] = useState(false);

  const app = db.applications[applicationId];
  const access = app ? canViewApplication(db, me.id, app) : null;
  const allowed = !!access?.ok;

  useCrumb(app ? (allowed ? (app.reference ?? "Application") : "Restricted") : "Not found");

  useEffect(() => {
    if (allowed) recordApplicationView(applicationId);
  }, [allowed, applicationId]);

  if (!app)
    return (
      <RecordNotFound
        what="application"
        backHref="/admin/applications"
        backLabel="Back to applications"
        detail="It may have been removed, the link may be mistyped, or the demo data may have been reset."
      />
    );
  if (access && !access.ok)
    return (
      <Denied
        title={app.status === "draft" ? "This application is still a draft" : "This application is outside your scope"}
        reason={access.reason}
        backHref="/admin/applications"
        backLabel="Back to applications"
      />
    );

  const applicant = db.users[app.applicantId];
  const cohort = db.cohorts[app.cohortId];
  const track = app.answers.idea.trackPreference ? db.tracks[app.answers.idea.trackPreference] : undefined;
  const name = applicant?.name ?? app.answers.about.fullName ?? "Applicant";
  const venture = app.answers.idea.ventureName ?? applicant?.ventureName ?? "Untitled idea";
  const reviewers = reviewersOf(db, app.id);
  const submittedReviews = reviewsOf(db, app.id).filter((r) => r.status === "submitted");
  const myReview = reviewsOf(db, app.id).find((r) => r.reviewerId === me.id);
  const avg = averageScore(db, app.id);
  const assigned = isAssignedReviewer(db, me.id, app.id);
  const canSeePrivate = assigned || adminCanManageCohort(db, me.id, app.cohortId);
  const needsMine = assigned && ["submitted", "in_review"].includes(app.status) && myReview?.status !== "submitted";
  const dob = app.answers.about.dateOfBirth ?? applicant?.private?.dateOfBirth;
  const age = dob && cohort ? ageOn(dob, cohort.startDate) : NaN;
  const status = app.answers.residence.check?.status ?? "unchecked";

  const activity = <ApplicationActivity db={db} app={app} meId={me.id} />;

  return (
    <>
      <Link href="/admin/applications" className="mb-4 inline-flex h-9 items-center gap-1.5 rounded-[8px] pr-2 text-[13.5px] text-muted hover:text-void">
        <ArrowLeft className="size-4" aria-hidden /> All applications
      </Link>

      <PageHeader
        eyebrow={`${cohort?.name ?? "Unknown cohort"} · ${app.reference ?? "No reference"}`}
        title={
          <span className="flex items-center gap-4">
            <Avatar name={name} hue={applicant?.avatarHue} size={52} className="hidden sm:inline-grid" />
            <span className="min-w-0">{name}</span>
          </span>
        }
        description={`${venture}${app.answers.idea.stage ? ` · ${app.answers.idea.stage}` : ""}${track ? ` · prefers ${track.name}` : ""}`}
        actions={<StatusBadge status={app.status} className="h-8 px-3 text-[13.5px]" />}
        className="sm:mb-6"
      />

      {app.status === "approved" && <EnrollmentPanel db={db} app={app} celebrate={celebrate} />}

      <Panel className="mb-4 py-4 sm:py-5">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3 xl:grid-cols-6">
          <Fact
            label="Submitted"
            detail={app.submittedAt && daysBetween(app.submittedAt, now) >= 7 ? `${daysBetween(app.submittedAt, now)} days ago` : fmtRelative(app.submittedAt, now)}
          >
            {fmtDate(app.submittedAt)}
          </Fact>
          <Fact label="Resubmissions" detail={app.resubmissions ? "after requested changes" : "first submission"}>
            <span className="tabular">{app.resubmissions}</span>
          </Fact>
          <Fact label="Location check">
            <EligibilityBadge status={status} short />
          </Fact>
          <Fact label="Average score" detail={plural(submittedReviews.length, "submitted review")}>
            {avg !== null ? (
              <span className="tabular">
                {avg}
                <span className="text-[12.5px] font-normal text-muted">/100</span>
              </span>
            ) : (
              <span className="text-muted">—</span>
            )}
          </Fact>
          <Fact label="Age at cohort start" detail={cohort ? `Starts ${fmtDate(cohort.startDate)}` : undefined}>
            {canSeePrivate && !Number.isNaN(age) ? <span className="tabular">{age}</span> : <span className="text-muted">—</span>}
          </Fact>
          <Fact label="Reviewers" detail={reviewers.length ? reviewers.map((u) => u.firstName).join(", ") : "None assigned"}>
            {reviewers.length ? (
              <span className="flex -space-x-2">
                {reviewers.slice(0, 4).map((u) => (
                  <Avatar key={u.id} name={u.name} hue={u.avatarHue} size={26} ring />
                ))}
              </span>
            ) : (
              <span className="text-muted">—</span>
            )}
          </Fact>
        </dl>
      </Panel>

      {needsMine && (
        <Notice
          tone="green"
          icon={<Sparkles className="size-4 text-leaf-ink" />}
          className="mb-4"
          title="This application is waiting for your review"
          action={
            !wide ? (
              <a href="#your-review" className="inline-flex h-8 items-center gap-1 rounded-[8px] bg-paper px-3 text-[13.5px] font-medium">
                Score <ArrowDown className="size-3.5" aria-hidden />
              </a>
            ) : undefined
          }
        >
          Read the answers, check the proof of residence, then score the four criteria{wide ? " on the right" : " below"}.
        </Notice>
      )}

      {app.resubmissions > 0 && ["submitted", "in_review"].includes(app.status) && (
        <Notice tone="blue" icon={<History className="size-4" />} className="mb-4" title="Resubmitted after requested changes">
          Fields the reviewer asked about are marked “Updated after request”. Everything else is unchanged from the first submission.
        </Notice>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_400px] xl:items-start">
        <div className="min-w-0 space-y-4">
          <ApplicationAnswers db={db} app={app} canSeePrivate={canSeePrivate} />
          <EligibilityAndDocuments db={db} app={app} meId={me.id} />
          {wide && activity}
        </div>
        <div id="your-review" className="min-w-0 scroll-mt-24 space-y-4">
          <ReviewPanel db={db} app={app} meId={me.id} />
          <DecisionPanel
            db={db}
            app={app}
            meId={me.id}
            onApproved={() => {
              setCelebrate(true);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
          <ReviewersPanel db={db} app={app} meId={me.id} />
        </div>
        {!wide && activity}
      </div>
    </>
  );
}
