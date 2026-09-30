"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AlertCircle, BellRing, CheckCircle2, Clock, History, Lock, Mail, RotateCcw, ShieldCheck, UserRoundCheck, XCircle } from "lucide-react";
import type { Application, Database, ID } from "@/lib/domain/types";
import { canDecideApplication, isAssignedReviewer } from "@/lib/domain/permissions";
import { averageScore, questionsForApplication, reviewsOf, visibleQuestions } from "@/lib/domain/selectors";
import { CHANGEABLE_FIELDS } from "@/lib/domain/validation";
import { decideApplication, requestChanges } from "@/lib/actions/applications";
import { fmtDateTime, plural, sleep } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Textarea } from "@/components/ui/form";
import { Badge, Notice, Panel, PanelHeader, StatusBadge } from "@/components/ui/display";
import { ConfirmDialog, DialogClose, DialogContent, DialogRoot } from "@/components/ui/overlay";
import { changeFieldLabel, RECOMMENDATION_META } from "./meta";

type Outcome = "approved" | "waitlisted" | "rejected";

function Effect({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-fog text-void">{icon}</span>
      <span className="min-w-0">{children}</span>
    </li>
  );
}

function DecisionDialog({ db, app, outcome, onClose, onApproved }: { db: Database; app: Application; outcome: Outcome; onClose: () => void; onApproved: () => void }) {
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const applicant = db.users[app.applicantId];
  const cohort = db.cohorts[app.cohortId];
  const track = app.answers.idea.trackPreference ? db.tracks[app.answers.idea.trackPreference] : undefined;
  const first = applicant?.firstName ?? "The applicant";
  const email = app.answers.about.email ?? applicant?.email;

  const copy = {
    approved: {
      title: `Approve ${applicant?.name}?`,
      description: `${first} will join ${cohort?.name} as a fellow.`,
      confirm: "Approve and enroll",
      variant: "primary" as const,
      noteLabel: "Personal note for the welcome email",
    },
    waitlisted: {
      title: `Waitlist ${applicant?.name}?`,
      description: "You can still approve from the waitlist if a place opens.",
      confirm: "Place on waitlist",
      variant: "dark" as const,
      noteLabel: "Note to the applicant",
    },
    rejected: {
      title: `Decline ${applicant?.name}'s application?`,
      description: "This is a final decision for this intake.",
      confirm: "Send decision",
      variant: "danger" as const,
      noteLabel: "Note to the applicant",
    },
  }[outcome];

  return (
    <ConfirmDialog
      open
      onOpenChange={(v) => !v && onClose()}
      title={copy.title}
      description={copy.description}
      confirmLabel={copy.confirm}
      confirmVariant={copy.variant}
      onConfirm={async () => {
        setError(null);
        await sleep(600);
        const r = decideApplication(app.id, outcome, note.trim());
        if (!r.ok) {
          setError(r.error);
          toast.error(r.error);
          return false;
        }
        if (outcome === "approved") {
          toast.success(`${applicant?.name} is now a ${cohort?.name} fellow`, { description: "Membership created on the same account. Welcome email sent (simulated)." });
          onApproved();
        } else if (outcome === "waitlisted") toast.success(`${applicant?.name} placed on the waitlist`, { description: "Decision email sent (simulated)." });
        else toast.success("Decision sent", { description: `${first} has been told by email (simulated) and on their dashboard.` });
      }}
    >
      <div className="space-y-4 text-[14px]">
        <div>
          <p className="eyebrow text-muted">What happens</p>
          <ul className="mt-2.5 space-y-2.5">
            {outcome === "approved" ? (
              <>
                <Effect icon={<CheckCircle2 className="size-3.5" />}>
                  Status becomes <strong>Approved</strong> — {first} sees it on their applicant dashboard.
                </Effect>
                <Effect icon={<UserRoundCheck className="size-3.5" />}>
                  A {cohort?.name} fellow membership is added to {first}&apos;s <strong>existing account</strong>
                  {email ? ` (${email})` : ""}. No new account is created.
                </Effect>
                {track && <Effect icon={<ShieldCheck className="size-3.5" />}>Track: {track.name}, their stated preference.</Effect>}
                <Effect icon={<Mail className="size-3.5" />}>A welcome email (simulated) and an in-app notification are sent.</Effect>
              </>
            ) : outcome === "waitlisted" ? (
              <>
                <Effect icon={<Clock className="size-3.5" />}>
                  Status becomes <strong>Waitlisted</strong>. {first} is told they&apos;re first in line if a place opens.
                </Effect>
                <Effect icon={<Mail className="size-3.5" />}>A decision email (simulated) and an in-app notification are sent.</Effect>
              </>
            ) : (
              <>
                <Effect icon={<XCircle className="size-3.5" />}>
                  Status becomes <strong>Not successful</strong>. This can&apos;t be undone in this intake.
                </Effect>
                <Effect icon={<Mail className="size-3.5" />}>A decision email (simulated) and an in-app notification are sent.</Effect>
              </>
            )}
            <Effect icon={<History className="size-3.5" />}>The decision is written to the timeline and the audit log.</Effect>
          </ul>
        </div>
        <Field
          label={copy.noteLabel}
          htmlFor="decision-note"
          optional
          hint={outcome === "rejected" ? "Be kind and specific — it's included in the email." : "Included in the email to the applicant."}
        >
          <Textarea id="decision-note" value={note} onChange={(e) => setNote(e.target.value)} className="min-h-[90px]" />
        </Field>
        {error && (
          <p className="flex items-start gap-1.5 text-[13.5px] text-[#b00d28]" role="alert">
            <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden /> {error}
          </p>
        )}
      </div>
    </ConfirmDialog>
  );
}

function RequestChangesDialog({ db, app, onClose }: { db: Database; app: Application; onClose: () => void }) {
  const [fields, setFields] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<{ fields?: string; note?: string; action?: string }>({});
  const [busy, setBusy] = useState(false);
  const applicant = db.users[app.applicantId];
  const questions = visibleQuestions(questionsForApplication(db, app), app.answers.custom);

  const toggle = (key: string, on: boolean) => {
    setFields((f) => (on ? [...f, key] : f.filter((k) => k !== key)));
    setErrors((e) => ({ ...e, fields: undefined }));
  };

  async function send() {
    const next: typeof errors = {};
    if (!fields.length) next.fields = "Choose at least one field the applicant should change.";
    if (!note.trim()) next.note = "Explain what the applicant should change.";
    setErrors(next);
    if (next.fields || next.note) return;
    setBusy(true);
    await sleep(600);
    const r = requestChanges(app.id, fields, note.trim());
    setBusy(false);
    if (!r.ok) {
      setErrors({ action: r.error });
      toast.error(r.error);
      return;
    }
    toast.success("Changes requested", {
      description: `${applicant?.firstName ?? "The applicant"} can now edit ${plural(fields.length, "field")} and resubmit. Everything else stays locked.`,
    });
    onClose();
  }

  return (
    <DialogRoot open onOpenChange={(v) => !v && !busy && onClose()}>
      <DialogContent
        title="Request changes"
        description={`${applicant?.firstName ?? "The applicant"} can edit only the fields you choose. Everything else stays locked.`}
        footer={
          <>
            <DialogClose asChild>
              <Button variant="ghost" disabled={busy}>
                Cancel
              </Button>
            </DialogClose>
            <Button variant="dark" loading={busy} icon={<RotateCcw className="size-4" />} onClick={send}>
              Send request
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <fieldset aria-describedby={errors.fields ? "cr-fields-error" : undefined}>
            <legend className="text-[14.5px] font-medium">
              Fields to reopen{" "}
              <span className="text-[#c8102e]" aria-hidden>
                *
              </span>
            </legend>
            <p className="mt-2 eyebrow text-muted">Standard answers</p>
            <div className="mt-1.5 grid grid-cols-1 gap-x-4 sm:grid-cols-2">
              {CHANGEABLE_FIELDS.map((f) => (
                <Checkbox key={f.key} label={f.label} checked={fields.includes(f.key)} onChange={(v) => toggle(f.key, v)} invalid={!!errors.fields} />
              ))}
            </div>
            {questions.length > 0 && (
              <>
                <p className="mt-4 eyebrow text-muted">This form&apos;s questions</p>
                <div className="mt-1.5 space-y-0.5">
                  {questions.map((q) => (
                    <Checkbox key={q.id} label={q.label} checked={fields.includes(`custom.${q.id}`)} onChange={(v) => toggle(`custom.${q.id}`, v)} invalid={!!errors.fields} />
                  ))}
                </div>
              </>
            )}
            {errors.fields && (
              <p id="cr-fields-error" className="mt-2 flex items-center gap-1.5 text-[13.5px] text-[#b00d28]" role="alert">
                <AlertCircle className="size-3.5" aria-hidden /> {errors.fields}
              </p>
            )}
          </fieldset>
          <Field label="What should they change?" htmlFor="cr-note" required error={errors.note} hint="Sent by email (simulated) and shown on their application.">
            <Textarea
              id="cr-note"
              value={note}
              aria-invalid={!!errors.note || undefined}
              onChange={(e) => {
                setNote(e.target.value);
                setErrors((x) => ({ ...x, note: undefined }));
              }}
              placeholder="Be specific: what's missing, and what a good answer would include."
              className="min-h-[110px]"
            />
          </Field>
          {errors.action && (
            <p className="flex items-start gap-1.5 text-[13.5px] text-[#b00d28]" role="alert">
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden /> {errors.action}
            </p>
          )}
        </div>
      </DialogContent>
    </DialogRoot>
  );
}

export function DecisionPanel({ db, app, meId, onApproved }: { db: Database; app: Application; meId: ID; onApproved: () => void }) {
  const [dialog, setDialog] = useState<Outcome | "changes" | null>(null);
  const can = canDecideApplication(db, meId, app);
  const reviews = reviewsOf(db, app.id).filter((r) => r.status === "submitted");
  const avg = averageScore(db, app.id);
  const questions = questionsForApplication(db, app);
  const openRequest = app.status === "changes_requested" ? app.changeRequests.find((c) => !c.resolvedAt) : undefined;
  const decidedBy = app.decision ? db.users[app.decision.decidedById] : undefined;
  const iAmReviewer = isAssignedReviewer(db, meId, app.id);
  const myReviewSubmitted = reviews.some((r) => r.reviewerId === meId);
  const recTally = reviews.reduce<Record<string, number>>((acc, r) => {
    if (r.recommendation) acc[r.recommendation] = (acc[r.recommendation] ?? 0) + 1;
    return acc;
  }, {});
  const noReviews = reviews.length === 0;
  const canRequestChanges = can.ok && ["submitted", "in_review"].includes(app.status);

  return (
    <Panel aria-labelledby="decision-h">
      <PanelHeader title={<span id="decision-h">Decision</span>} actions={<StatusBadge status={app.status} />} />

      {app.decision && (
        <div className="mb-4 rounded-[12px] bg-fog p-3.5 text-[14px]">
          <p className="font-medium">
            {app.decision.outcome === "approved" ? "Approved" : app.decision.outcome === "waitlisted" ? "Waitlisted" : "Not successful"} by {decidedBy?.name ?? "a program admin"}
          </p>
          <p className="text-[13px] text-muted">{fmtDateTime(app.decision.decidedAt)}</p>
          {app.decision.note && <p className="mt-2 leading-relaxed text-ink">“{app.decision.note}”</p>}
        </div>
      )}

      {openRequest && (
        <Notice tone="amber" icon={<RotateCcw className="size-4" />} title="Waiting for the applicant to resubmit" className="mb-4">
          <p>
            Requested by {db.users[openRequest.requestedById]?.name ?? "a reviewer"} · {fmtDateTime(openRequest.requestedAt)}
          </p>
          <p className="mt-1.5">“{openRequest.note}”</p>
          <p className="mt-1.5 flex flex-wrap gap-1">
            {openRequest.fields.map((f) => (
              <Badge key={f} tone="amber" className="bg-paper">
                {changeFieldLabel(f, questions)}
              </Badge>
            ))}
          </p>
        </Notice>
      )}

      {can.ok ? (
        <>
          {noReviews ? (
            <Notice tone="amber" icon={<Lock className="size-4" />} className="mb-4">
              Decisions unlock after at least one assigned reviewer submits a review.
              {iAmReviewer && !myReviewSubmitted ? " Submit your review to continue." : " Assign a reviewer or wait for their scores."}
            </Notice>
          ) : (
            <p className="mb-4 text-[13.5px] text-muted">
              Based on {plural(reviews.length, "submitted review")}
              {avg !== null ? (
                <>
                  {" "}
                  · average <span className="font-semibold text-void tabular">{avg}/100</span>
                </>
              ) : null}
              {Object.keys(recTally).length > 0 && (
                <>
                  {" "}
                  ·{" "}
                  {Object.entries(recTally)
                    .map(([k, n]) => `${n} ${RECOMMENDATION_META[k as keyof typeof RECOMMENDATION_META].label.toLowerCase()}`)
                    .join(", ")}
                </>
              )}
            </p>
          )}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button variant="primary" className="sm:col-span-2" icon={<CheckCircle2 className="size-4" />} disabled={noReviews} onClick={() => setDialog("approved")}>
              Approve and enroll
            </Button>
            {app.status !== "waitlisted" && (
              <Button variant="outline" icon={<Clock className="size-4" />} disabled={noReviews} onClick={() => setDialog("waitlisted")}>
                Waitlist
              </Button>
            )}
            <Button
              variant="outline"
              icon={<XCircle className="size-4" />}
              disabled={noReviews}
              onClick={() => setDialog("rejected")}
              className={app.status === "waitlisted" ? "sm:col-span-2" : undefined}
            >
              Not successful
            </Button>
            {canRequestChanges && (
              <Button variant="soft" className="sm:col-span-2" icon={<RotateCcw className="size-4" />} onClick={() => setDialog("changes")}>
                Request changes
              </Button>
            )}
          </div>
          {canRequestChanges && <p className="mt-2 text-[12.5px] text-muted">Requesting changes doesn&apos;t need a submitted review.</p>}
        </>
      ) : (
        !app.decision &&
        !openRequest && (
          <p className="flex items-start gap-2 text-[14px] text-muted">
            <Lock className="mt-0.5 size-4 shrink-0" aria-hidden /> {can.reason}
          </p>
        )
      )}

      {app.status === "approved" && (
        <p className="mt-1 flex items-start gap-2 text-[12.5px] text-muted">
          <BellRing className="mt-0.5 size-3.5 shrink-0" aria-hidden /> Approval is final and can&apos;t be repeated — the membership already exists.
        </p>
      )}

      {dialog && dialog !== "changes" && <DecisionDialog key={dialog} db={db} app={app} outcome={dialog} onClose={() => setDialog(null)} onApproved={onApproved} />}
      {dialog === "changes" && <RequestChangesDialog db={db} app={app} onClose={() => setDialog(null)} />}
    </Panel>
  );
}
