"use client";

import { Check, EyeOff, FileText, History, Lock } from "lucide-react";
import type { Application, Database, FormQuestion } from "@/lib/domain/types";
import { questionsForApplication, visibleQuestions } from "@/lib/domain/selectors";
import { ageOn, SECTION_LABEL } from "@/lib/domain/validation";
import { cn, fmtDate, plural, wordCount } from "@/lib/utils";
import { Badge, Panel, PanelHeader } from "@/components/ui/display";
import { Paragraphs } from "@/components/ui/rich-text";

type FlagFn = (field: string) => "requested" | "updated" | null;

/** Which fields the latest change request touched, and whether the applicant has since resubmitted. */
function flagsFor(app: Application): FlagFn {
  const latest = app.changeRequests[app.changeRequests.length - 1];
  const fields = new Set(latest?.fields ?? []);
  return (field) => (fields.has(field) ? (latest?.resolvedAt ? "updated" : "requested") : null);
}

function FlagBadge({ flag }: { flag: ReturnType<FlagFn> }) {
  if (!flag) return null;
  return flag === "requested" ? (
    <Badge tone="amber" className="h-5 text-[11.5px]">
      Change requested
    </Badge>
  ) : (
    <Badge tone="blue" className="h-5 text-[11.5px]" icon={<History className="size-3" aria-hidden />}>
      Updated after request
    </Badge>
  );
}

function Item({
  label,
  children,
  full,
  flag,
  isPrivate,
  canSeePrivate = true,
  meta,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
  flag?: ReturnType<FlagFn>;
  isPrivate?: boolean;
  canSeePrivate?: boolean;
  meta?: React.ReactNode;
}) {
  return (
    <div className={cn("min-w-0", full && "sm:col-span-2", flag === "requested" && "-mx-3 rounded-[12px] bg-[#fff8e6] px-3 py-2")}>
      <dt className="flex flex-wrap items-center gap-1.5 text-[13px] text-muted">
        {label}
        {isPrivate && (
          <Badge tone="neutral" className="h-5 gap-1 px-2 text-[11px] uppercase tracking-[0.08em]" icon={<Lock className="size-3" aria-hidden />}>
            Private
          </Badge>
        )}
        <FlagBadge flag={flag ?? null} />
        {meta && <span className="ml-auto text-[12px] tabular">{meta}</span>}
      </dt>
      <dd className="mt-1 text-[15.5px] leading-relaxed text-void">
        {isPrivate && !canSeePrivate ? (
          <span className="inline-flex items-center gap-1.5 text-[14px] text-muted">
            <EyeOff className="size-4" aria-hidden /> Visible to assigned reviewers and admins for this cohort
          </span>
        ) : (
          children
        )}
      </dd>
    </div>
  );
}

function Empty({ children = "Not provided" }: { children?: React.ReactNode }) {
  return <span className="text-[14.5px] text-muted">{children}</span>;
}

function Text({ value }: { value?: string }) {
  if (!value?.trim()) return <Empty />;
  return (
    <div className="space-y-2">
      <Paragraphs text={value} />
    </div>
  );
}

function Section({ id, title, children, description }: { id: string; title: string; children: React.ReactNode; description?: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="border-t border-line pt-5 first:border-0 first:pt-0">
      <h3 id={id} className="eyebrow text-muted">
        {title}
      </h3>
      {description && <div className="mt-1.5 text-[13.5px] text-muted">{description}</div>}
      <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">{children}</dl>
    </section>
  );
}

function dobLabel(dob: string | undefined, cohortStart: string | undefined) {
  if (!dob) return undefined;
  const date = fmtDate(`${dob}T00:00:00.000Z`);
  if (!cohortStart) return date;
  const age = ageOn(dob, cohortStart);
  return Number.isNaN(age) ? date : `${date} · ${age} at cohort start`;
}

function CustomAnswer({ db, q, value }: { db: Database; q: FormQuestion; value: string | string[] | undefined }) {
  const empty = value === undefined || value === "" || (Array.isArray(value) && value.length === 0);
  if (empty) return <Empty>{q.required ? "No answer" : "Not answered (optional)"}</Empty>;
  if (q.kind === "file") {
    const doc = typeof value === "string" ? db.documents[value] : undefined;
    if (!doc) return <Empty>File no longer available</Empty>;
    return (
      <span className="inline-flex items-center gap-2 text-[14.5px]">
        <FileText className="size-4 text-muted" aria-hidden />
        {doc.name}
        <span className="text-[13px] text-muted">{doc.removedAt ? "(removed by applicant)" : "— listed under Documents"}</span>
      </span>
    );
  }
  if (Array.isArray(value))
    return (
      <span className="flex flex-wrap gap-1.5">
        {value.map((v) => (
          <Badge key={v} tone="neutral" className="h-7 px-3 text-[13.5px]">
            {v}
          </Badge>
        ))}
      </span>
    );
  if (q.kind === "select" || q.kind === "yesno")
    return (
      <Badge tone="neutral" className="h-7 px-3 text-[13.5px]">
        {value}
      </Badge>
    );
  return <Text value={value} />;
}

export function ApplicationAnswers({ db, app, canSeePrivate }: { db: Database; app: Application; canSeePrivate: boolean }) {
  const flag = flagsFor(app);
  const a = app.answers;
  const applicant = db.users[app.applicantId];
  const cohort = db.cohorts[app.cohortId];
  const form = db.forms[app.formId];
  const version = db.formVersions[app.formVersionId];
  const currentVersion = form?.publishedVersionId ? db.formVersions[form.publishedVersionId] : undefined;
  const questions = questionsForApplication(db, app);
  const shown = visibleQuestions(questions, a.custom);
  const hiddenCount = questions.length - shown.length;
  const dob = a.about.dateOfBirth ?? applicant?.private?.dateOfBirth;
  const age = dob && cohort ? ageOn(dob, cohort.startDate) : NaN;
  const track = a.idea.trackPreference ? db.tracks[a.idea.trackPreference] : undefined;
  const guardian = [a.about.guardianName, a.about.guardianEmail].filter(Boolean).join(" · ");

  return (
    <Panel aria-labelledby="answers-h">
      <PanelHeader
        title={<span id="answers-h">Application answers</span>}
        description={`Exactly as submitted${app.resubmissions ? `, including ${plural(app.resubmissions, "resubmission")}` : ""}. Answers are locked unless changes are requested.`}
      />
      <div className="space-y-6">
        <Section id="sec-about" title={SECTION_LABEL.about}>
          <Item label="Full name">{a.about.fullName || <Empty />}</Item>
          <Item label="Preferred name">{a.about.preferredName || <Empty />}</Item>
          <Item label="Email">{a.about.email ? <span className="break-all">{a.about.email}</span> : <Empty />}</Item>
          <Item label="Pronouns">{a.about.pronouns || <Empty />}</Item>
          <Item label="School or college" full>
            {a.about.school || <Empty />}
          </Item>
          <Item label="Date of birth" isPrivate canSeePrivate={canSeePrivate} flag={flag("about.dateOfBirth")}>
            {dobLabel(dob, cohort?.startDate) ?? <Empty />}
          </Item>
          <Item label="Phone" isPrivate canSeePrivate={canSeePrivate}>
            {a.about.phone || applicant?.private?.phone || <Empty />}
          </Item>
          <Item label="Parent or guardian" isPrivate canSeePrivate={canSeePrivate} flag={flag("about.guardianEmail")} full>
            {guardian ? <span className="break-all">{guardian}</span> : !Number.isNaN(age) && age >= 18 ? <Empty>Not required — 18 or older at cohort start</Empty> : <Empty />}
          </Item>
        </Section>

        <Section id="sec-idea" title={SECTION_LABEL.idea}>
          <Item label="Venture name">{a.idea.ventureName || <Empty />}</Item>
          <Item label="Stage">{a.idea.stage || <Empty />}</Item>
          <Item label="Track preference" full>
            {track ? (
              <span className="inline-flex items-center gap-2">
                <span className="size-2.5 rounded-full" style={{ background: track.color }} aria-hidden />
                {track.name}
                <span className="text-[13.5px] text-muted">— {track.tagline}</span>
              </span>
            ) : (
              <Empty />
            )}
          </Item>
          <Item label="The problem" full flag={flag("idea.problem")} meta={`${wordCount(a.idea.problem)} words`}>
            <Text value={a.idea.problem} />
          </Item>
          <Item label="Who has this problem" full flag={flag("idea.customer")} meta={`${wordCount(a.idea.customer)} words`}>
            <Text value={a.idea.customer} />
          </Item>
          <Item label="Why now" full flag={flag("idea.whyNow")} meta={`${wordCount(a.idea.whyNow)} words`}>
            <Text value={a.idea.whyNow} />
          </Item>
        </Section>

        <Section
          id="sec-questions"
          title={SECTION_LABEL.questions}
          description={
            <>
              From <span className="text-void">{form?.title ?? "the application form"}</span>, version {version?.version ?? "?"}
              {version?.publishedAt ? ` (published ${fmtDate(version.publishedAt)})` : ""}.{" "}
              {currentVersion && version && currentVersion.id !== version.id
                ? `Version ${currentVersion.version} has since been published — this application keeps the version it started with.`
                : "Later edits to the form never change what was submitted."}
            </>
          }
        >
          {shown.length === 0 && (
            <Item label="Custom questions" full>
              <Empty>This form version has no custom questions.</Empty>
            </Item>
          )}
          {shown.map((q, i) => (
            <Item
              key={q.id}
              label={`${i + 1}. ${q.label}`}
              full
              flag={flag(`custom.${q.id}`)}
              meta={q.kind === "long" && typeof a.custom[q.id] === "string" ? `${wordCount(a.custom[q.id] as string)}${q.wordLimit ? ` / ${q.wordLimit}` : ""} words` : undefined}
            >
              <CustomAnswer db={db} q={q} value={a.custom[q.id]} />
            </Item>
          ))}
          {hiddenCount > 0 && (
            <p className="text-[13px] text-muted sm:col-span-2">
              {plural(hiddenCount, "conditional question")} {hiddenCount === 1 ? "wasn't" : "weren't"} shown to this applicant because of an earlier answer.
            </p>
          )}
          <Item label="Hours per week">{a.commitment?.hoursPerWeek || <Empty />}</Item>
          <Item label="Community standards">
            {a.commitment?.agreeToCommunityStandards ? (
              <span className="inline-flex items-center gap-1.5">
                <Check className="size-4 text-leaf-ink" aria-hidden /> Agreed
              </span>
            ) : (
              <Empty>Not confirmed</Empty>
            )}
          </Item>
          <Item label="Usually free" full flag={flag("commitment.availability")}>
            {a.commitment?.availability?.length ? (
              <span className="flex flex-wrap gap-1.5">
                {a.commitment.availability.map((v) => (
                  <Badge key={v} tone="neutral" className="h-7 px-3 text-[13.5px]">
                    {v}
                  </Badge>
                ))}
              </span>
            ) : (
              <Empty />
            )}
          </Item>
        </Section>
      </div>
    </Panel>
  );
}
