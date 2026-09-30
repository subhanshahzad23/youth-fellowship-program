"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, Clock, FileText, Hourglass, PartyPopper, RotateCcw, XCircle } from "lucide-react";
import { fellowMembership } from "@/lib/domain/permissions";
import { formForCohort, windowState } from "@/lib/domain/selectors";
import { SECTION_LABEL, sectionOfField } from "@/lib/domain/validation";
import { useNow } from "@/lib/hooks";
import { useDb, useMe } from "@/lib/store/store";
import { fmtDate, fmtDateLong } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";
import { Eyebrow, Notice, PageHeader, Panel, PanelHeader, StatusBadge } from "@/components/ui/display";
import { DocumentRow } from "@/components/ui/files";
import { Paragraphs } from "@/components/ui/rich-text";
import { useCrumb } from "@/components/portal/crumbs";
import { Denied, RecordNotFound } from "@/components/portal/states";
import { AnswerSummary, ApplicantTimeline, LockNotice, StatusProgress } from "@/components/apply/answer-summary";
import { SectionTicks } from "@/components/apply/application-card";
import { fieldLabel } from "@/components/apply/answers";
import { daysLeftLabel } from "@/components/apply/window-states";

export default function ApplicantApplicationDetail() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const db = useDb();
  const me = useMe()!;
  const now = useNow();
  const app = db.applications[applicationId];
  const owner = !!app && app.applicantId === me.id;
  const cohort = app ? db.cohorts[app.cohortId] : undefined;
  useCrumb(owner ? (app.reference ?? `${cohort?.name ?? ""} draft`) : null);

  const docs = useMemo(
    () => (app && owner ? app.documentIds.map((id) => db.documents[id]).filter((d) => d && !d.removedAt && d.ownerId === me.id) : []),
    [app, owner, db.documents, me.id],
  );

  if (!app) return <RecordNotFound what="application" backHref="/applicant/applications" backLabel="Back to your applications" />;
  if (!owner)
    return (
      <Denied
        title="This application isn't yours"
        reason="Applications are private. You can only open applications you started yourself — reviewers see submitted applications from the admin portal."
        backHref="/applicant/applications"
        backLabel="Back to your applications"
      />
    );

  const form = formForCohort(db, app.cohortId);
  const ws = windowState(form, now);
  const slug = cohort?.slug ?? app.cohortId;
  const cr = app.changeRequests.find((c) => !c.resolvedAt);
  const fm = fellowMembership(db, me.id);
  const editable = app.status === "draft" || app.status === "changes_requested";

  const primary =
    app.status === "draft" && ws === "open" ? (
      <ButtonLink href={`/apply/${slug}`} arrow>
        Continue application
      </ButtonLink>
    ) : app.status === "changes_requested" ? (
      <ButtonLink href={`/apply/${slug}`} arrow>
        Update requested items
      </ButtonLink>
    ) : undefined;

  return (
    <>
      <PageHeader
        eyebrow={
          <span className="inline-flex flex-wrap items-center gap-2">
            {cohort?.name}
            <span aria-hidden>·</span>
            <span className="font-mono tracking-[0.08em]">{app.reference ?? "Draft"}</span>
          </span>
        }
        title={`${cohort?.name ?? "Your"} application`}
        description={app.submittedAt ? `Submitted ${fmtDateLong(app.submittedAt)}${app.resubmissions ? ` · resubmitted ${app.resubmissions}×` : ""}` : `Started ${fmtDateLong(app.createdAt)} · not submitted yet`}
        actions={
          <>
            <StatusBadge status={app.status} className="h-8 px-3 text-[13.5px]" />
            {primary}
          </>
        }
      />

      <Panel className="mb-4">
        <StatusProgress status={app.status} />
      </Panel>

      {/* ------------------------- state panel ------------------------- */}
      {app.status === "draft" && (
        <Panel className="mb-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-[16px] font-semibold">
                <FileText className="size-4" aria-hidden /> This is a draft — only you can see it
              </p>
              <p className="mt-1 text-[14px] text-muted">
                {ws === "open" && form
                  ? `Applications close ${fmtDateLong(form.closesAt)} (${daysLeftLabel(form.closesAt, now)}). Reviewers see nothing until you submit.`
                  : ws === "closed"
                    ? "The application window has closed, so this draft can't be submitted. Your answers are saved for reference."
                    : "The application window isn't open right now."}
              </p>
              <SectionTicks app={app} className="mt-4 max-w-md" />
            </div>
            {ws === "open" && (
              <ButtonLink href={`/apply/${slug}`} arrow className="self-start sm:self-center">
                Continue
              </ButtonLink>
            )}
          </div>
        </Panel>
      )}

      {cr && (
        <section aria-labelledby="cr-h" className="mb-4 rounded-[20px] bg-[#fff6dd] p-5 ring-1 ring-[#f5d98a] sm:p-6">
          <div className="flex flex-wrap items-start gap-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#ffe7a3]">
              <RotateCcw className="size-5 text-[#7a4b00]" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id="cr-h" className="text-[17px] font-semibold text-[#5c3900]">
                {db.users[cr.requestedById]?.name ?? "Your reviewer"} asked for changes
              </h2>
              <p className="text-[13px] text-[#7a4b00]">Requested {fmtDateLong(cr.requestedAt)}</p>
              <blockquote className="mt-3 border-l-2 border-[#e0b44a] pl-3 text-[15px] leading-relaxed text-ink">
                <Paragraphs text={cr.note} />
              </blockquote>
              <p className="mt-4 text-[13.5px] font-medium text-[#5c3900]">Items to update</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {cr.fields.map((f) => (
                  <li key={f} className="inline-flex h-8 items-center rounded-full bg-paper px-3 text-[13.5px] ring-1 ring-[#e8c56b]">
                    {fieldLabel(db, app, f)}
                    <span className="ml-1 text-muted">· {SECTION_LABEL[sectionOfField(f)]}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <ButtonLink href={`/apply/${slug}`} arrow>
                  Update requested items
                </ButtonLink>
                <p className="text-[13px] text-[#7a4b00]">Everything else stays locked. You&apos;ll resubmit under {app.reference}.</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {(app.status === "submitted" || app.status === "in_review") && (
        <Notice tone={app.status === "submitted" ? "blue" : "purple"} className="mb-4" icon={<Hourglass className="size-4" aria-hidden />} title={app.status === "submitted" ? "Waiting for review" : "Being reviewed"}>
          {app.status === "submitted"
            ? "Your application is with the program team and a reviewer has been assigned. There's nothing you need to do right now."
            : "A reviewer is scoring your application with the program rubric. We'll let you know here and by email when there's a decision."}
        </Notice>
      )}

      {app.status === "approved" && (
        <section aria-labelledby="dec-h" className="dots-dark mb-4 rounded-[24px] p-6 text-paper sm:p-8">
          <p className="eyebrow flex items-center gap-2 text-jade">
            <PartyPopper className="size-4" aria-hidden /> Approved
          </p>
          <h2 id="dec-h" className="mt-3 font-display text-[32px] leading-[1.05] tracking-[-0.035em] sm:text-[40px]">
            You&apos;re in — welcome to {cohort?.name}
          </h2>
          {app.decision?.note && <p className="mt-3 max-w-2xl text-[15.5px] leading-relaxed text-[#d4d4d4]">“{app.decision.note}”{app.decision.decidedById && db.users[app.decision.decidedById] ? ` — ${db.users[app.decision.decidedById].name}` : ""}</p>}
          <p className="mt-3 max-w-2xl text-[14.5px] text-[#bdbdbd]">Your fellow workspace uses this same account. Kickoff is {fmtDateLong(cohort?.startDate)}.</p>
          {fm && (
            <div className="mt-6">
              <ButtonLink href="/workspace/dashboard" size="lg" arrow>
                Enter your fellow workspace
              </ButtonLink>
            </div>
          )}
        </section>
      )}

      {app.status === "waitlisted" && (
        <Panel className="mb-4 bg-[#fff6dd]">
          <p className="flex items-center gap-2 text-[17px] font-semibold text-[#5c3900]">
            <Clock className="size-5" aria-hidden /> You&apos;re on the waitlist
          </p>
          {app.decision?.note && <p className="mt-2 text-[15px] leading-relaxed">“{app.decision.note}”</p>}
          <p className="mt-2 text-[14px] leading-relaxed text-[#7a4b00]">
            If a place opens in {cohort?.name}, we&apos;ll contact you straight away — you don&apos;t need to do anything. You&apos;re also welcome to apply to another open intake.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <ButtonLink href="/apply" variant="outline" size="sm">
              See other intakes
            </ButtonLink>
          </div>
        </Panel>
      )}

      {app.status === "rejected" && (
        <Panel className="mb-4">
          <p className="flex items-center gap-2 text-[17px] font-semibold">
            <XCircle className="size-5" aria-hidden /> Not successful this time
          </p>
          <p className="mt-2 text-[15px] leading-relaxed text-ink">Thank you for applying to {cohort?.name}. We&apos;re not able to offer you a place in this intake.</p>
          {app.decision?.note && <p className="mt-3 rounded-[12px] bg-fog px-4 py-3 text-[14.5px] leading-relaxed">{app.decision.note}</p>}
          <p className="mt-3 text-[14px] text-muted">Many fellows apply more than once. We&apos;d love to hear from you again in a future intake.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <ButtonLink href="/apply" variant="outline" size="sm">
              See open and upcoming intakes
            </ButtonLink>
          </div>
        </Panel>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-4">
          <Panel className="sm:p-8">
            <PanelHeader title={editable && app.status === "draft" ? "Your answers so far" : "What you submitted"} description={cr ? "Highlighted items are the ones your reviewer asked about." : undefined} />
            {!editable && <LockNotice className="mb-5" />}
            {app.status === "changes_requested" && <LockNotice className="mb-5">Only the highlighted items can be changed. Everything else stays locked as you submitted it.</LockNotice>}
            <AnswerSummary app={app} requested={cr?.fields} />
          </Panel>
          <Panel>
            <PanelHeader title="Your documents" description="Restricted to you and reviewers assigned to this application." />
            {docs.length ? (
              <ul className="space-y-2">
                {docs.map((d) => (
                  <li key={d.id}>
                    <DocumentRow doc={d} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[14px] text-muted">No documents attached yet.</p>
            )}
          </Panel>
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          <Panel>
            <PanelHeader title="Timeline" />
            <ApplicantTimeline app={app} />
          </Panel>
          <Panel>
            <Eyebrow>Details</Eyebrow>
            <dl className="mt-3 space-y-2.5 text-[14px]">
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Reference</dt>
                <dd className={app.reference ? "font-mono" : "text-muted"}>{app.reference ?? "Assigned on submit"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Intake</dt>
                <dd>{cohort?.name}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Cohort starts</dt>
                <dd>{fmtDate(cohort?.startDate)}</dd>
              </div>
              {app.decision && (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Decision</dt>
                  <dd className="inline-flex items-center gap-1.5">
                    {app.decision.outcome === "approved" && <CheckCircle2 className="size-4 text-leaf-ink" aria-hidden />}
                    {fmtDate(app.decision.decidedAt)}
                  </dd>
                </div>
              )}
            </dl>
          </Panel>
        </div>
      </div>
    </>
  );
}
