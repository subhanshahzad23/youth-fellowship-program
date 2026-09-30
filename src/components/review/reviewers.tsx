"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { UserMinus, UserPlus } from "lucide-react";
import type { Application, Database, ID, User } from "@/lib/domain/types";
import { adminCanManageCohort, canAssignReviewers, isExec, roleLabel } from "@/lib/domain/permissions";
import { averageScore, reviewsOf, weightedScore } from "@/lib/domain/selectors";
import { assignReviewer, unassignReviewer } from "@/lib/actions/applications";
import { cn, fmtDate, plural, sleep } from "@/lib/utils";
import { Button, IconButton } from "@/components/ui/button";
import { Select } from "@/components/ui/form";
import { Avatar, Badge, Panel, PanelHeader } from "@/components/ui/display";
import { ConfirmDialog } from "@/components/ui/overlay";
import { eligibleReviewers, RecommendationBadge } from "./meta";
import { ScorePips } from "./rubric";

function ReviewerRow({
  db,
  app,
  user,
  meId,
  canAssign,
  assignedAt,
  unassigned,
}: {
  db: Database;
  app: Application;
  user: User;
  meId: ID;
  canAssign: boolean;
  assignedAt?: string;
  unassigned?: boolean;
}) {
  const [confirm, setConfirm] = useState(false);
  const review = reviewsOf(db, app.id).find((r) => r.reviewerId === user.id);
  const score = review?.status === "submitted" ? weightedScore(db, review) : null;
  const scoredCount = review ? db.rubric.filter((c) => review.scores[c.id] !== undefined).length : 0;

  return (
    <li className="py-3.5 first:pt-0 last:pb-0">
      <div className="flex items-start gap-3">
        <Avatar name={user.name} hue={user.avatarHue} size={36} />
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-x-1.5 text-[14.5px] font-medium">
            {user.name}
            {user.id === meId && <span className="text-[12.5px] font-normal text-muted">(you)</span>}
          </p>
          <p className="text-[12.5px] text-muted">
            {user.title ?? roleLabel(db, user)}
            {assignedAt ? ` · assigned ${fmtDate(assignedAt)}` : ""}
            {unassigned ? " · no longer assigned" : ""}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {review?.status === "submitted" ? (
              <>
                <Badge tone="dark" className="tabular">
                  {score}/100
                </Badge>
                <RecommendationBadge value={review.recommendation} />
              </>
            ) : review ? (
              <Badge tone="purple">
                Scoring in progress · {scoredCount} of {db.rubric.length}
              </Badge>
            ) : (
              <Badge tone="neutral">Not started</Badge>
            )}
          </div>
        </div>
        {canAssign && !unassigned && (
          <IconButton label={`Remove ${user.name} as reviewer`} onClick={() => setConfirm(true)} className="-mr-2 -mt-1 text-muted hover:text-void">
            <UserMinus className="size-4" />
          </IconButton>
        )}
      </div>

      {review?.status === "submitted" && (
        <div className="mt-3 rounded-[12px] bg-fog p-3 sm:ml-12">
          <ul className="space-y-1.5">
            {db.rubric.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-2 text-[12.5px]">
                <span className="truncate text-muted">{c.label}</span>
                <span className="flex items-center gap-1.5">
                  <ScorePips score={review.scores[c.id]} />
                  <span className="w-3 text-right font-semibold tabular">{review.scores[c.id] ?? "—"}</span>
                </span>
              </li>
            ))}
          </ul>
          {review.notes && <p className="mt-2.5 border-t border-line pt-2.5 text-[13.5px] leading-relaxed text-ink">“{review.notes}”</p>}
          <p className="mt-1.5 text-[12px] text-muted">Submitted {fmtDate(review.submittedAt)}</p>
        </div>
      )}

      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={`Remove ${user.name}?`}
        description={
          review?.status === "submitted"
            ? "Their submitted review stays on record and still counts toward the average."
            : "They'll lose access to this application's restricted documents."
        }
        confirmLabel="Remove reviewer"
        confirmVariant="danger"
        onConfirm={async () => {
          await sleep(350);
          const r = unassignReviewer(app.id, user.id);
          if (!r.ok) {
            toast.error(r.error);
            return false;
          }
          toast.success(`${user.name} removed as reviewer`);
        }}
      />
    </li>
  );
}

export function ReviewersPanel({ db, app, meId }: { db: Database; app: Application; meId: ID }) {
  const [pick, setPick] = useState("");
  const [busy, setBusy] = useState(false);
  const assignments = useMemo(
    () =>
      Object.values(db.reviewerAssignments)
        .filter((r) => r.applicationId === app.id)
        .sort((a, b) => (a.assignedAt < b.assignedAt ? -1 : 1)),
    [db.reviewerAssignments, app.id],
  );
  const reviews = reviewsOf(db, app.id);
  const assignedIds = new Set(assignments.map((a) => a.reviewerId));
  const orphanReviews = reviews.filter((r) => r.status === "submitted" && !assignedIds.has(r.reviewerId));
  const submitted = reviews.filter((r) => r.status === "submitted").length;
  const avg = averageScore(db, app.id);
  const can = canAssignReviewers(db, meId, app);
  const cohortName = db.cohorts[app.cohortId]?.name ?? "this cohort";

  const groups = useMemo(() => {
    const taken = new Set(assignments.map((a) => a.reviewerId));
    const available = eligibleReviewers(db).filter((u) => !taken.has(u.id));
    const cohortAdmins = available.filter((u) => !isExec(db, u.id) && adminCanManageCohort(db, u.id, app.cohortId));
    const execs = available.filter((u) => isExec(db, u.id));
    const others = available.filter((u) => !cohortAdmins.includes(u) && !execs.includes(u));
    const byName = (a: User, b: User) => a.name.localeCompare(b.name);
    return [
      { label: `Program admins · ${cohortName}`, users: cohortAdmins.sort(byName) },
      { label: "Executive admins", users: execs.sort(byName) },
      { label: "Program admins · other cohorts", users: others.sort(byName) },
    ].filter((g) => g.users.length);
  }, [db, app.cohortId, assignments, cohortName]);

  async function assign() {
    if (!pick) return;
    setBusy(true);
    await sleep(400);
    const r = assignReviewer(app.id, pick);
    setBusy(false);
    if (!r.ok) {
      toast.error(r.error);
      return;
    }
    const u = db.users[pick];
    toast.success(`${u?.name ?? "Reviewer"} assigned`, {
      description: pick === meId ? "You can now score this application and open its documents." : "They've been notified in the app.",
    });
    setPick("");
  }

  return (
    <Panel aria-labelledby="reviewers-h">
      <PanelHeader
        title={<span id="reviewers-h">Reviewers & scores</span>}
        description={`${plural(submitted, "submitted review")} · ${plural(assignments.length, "assigned reviewer")}`}
        actions={
          avg !== null ? (
            <span className="text-right">
              <span className="block font-display text-[30px] leading-none tracking-[-0.03em] tabular">
                {avg}
                <span className="font-sans text-[13px] text-muted">/100</span>
              </span>
              <span className="text-[12px] text-muted">average</span>
            </span>
          ) : undefined
        }
      />

      {assignments.length === 0 && orphanReviews.length === 0 ? (
        <p className="rounded-[12px] bg-[#fff6dd] px-3 py-3 text-[14px] text-[#7a4b00]">No reviewers yet. Assign at least one so the application can be scored.</p>
      ) : (
        <ul className="divide-y divide-line">
          {assignments.map((a) => {
            const u = db.users[a.reviewerId];
            if (!u) return null;
            return <ReviewerRow key={a.id} db={db} app={app} user={u} meId={meId} canAssign={can.ok} assignedAt={a.assignedAt} />;
          })}
          {orphanReviews.map((r) => {
            const u = db.users[r.reviewerId];
            if (!u) return null;
            return <ReviewerRow key={r.id} db={db} app={app} user={u} meId={meId} canAssign={false} unassigned />;
          })}
        </ul>
      )}

      {can.ok ? (
        <div className="mt-5 border-t border-line pt-4">
          <label htmlFor={`assign-${app.id}`} className="text-[14px] font-medium">
            Assign a reviewer
          </label>
          <p className="mt-0.5 text-[12.5px] text-muted">Assigned reviewers can score and open restricted documents. Every change is audited.</p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <div className="min-w-0 flex-1">
              <Select id={`assign-${app.id}`} value={pick} onChange={(e) => setPick(e.target.value)} disabled={!groups.length}>
                <option value="">{groups.length ? "Choose a staff member…" : "Everyone eligible is assigned"}</option>
                {groups.map((g) => (
                  <optgroup key={g.label} label={g.label}>
                    {g.users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                        {u.id === meId ? " (you)" : ""} — {u.title ?? roleLabel(db, u)}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </Select>
            </div>
            <Button variant="dark" icon={<UserPlus className="size-4" />} disabled={!pick} loading={busy} onClick={assign} className={cn("sm:h-11")}>
              Assign
            </Button>
          </div>
        </div>
      ) : (
        <p className="mt-4 border-t border-line pt-3 text-[12.5px] text-muted">{can.reason}</p>
      )}
    </Panel>
  );
}
