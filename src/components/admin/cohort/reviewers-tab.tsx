"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ClipboardCheck, Inbox, UserPlus } from "lucide-react";
import type { Application, Cohort, ID } from "@/lib/domain/types";
import { roleLabel } from "@/lib/domain/permissions";
import { weightedScore } from "@/lib/domain/selectors";
import { useDb } from "@/lib/store/store";
import { plural } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";
import { Avatar, Badge, EmptyState, Panel, PanelHeader, StatusBadge } from "@/components/ui/display";

export function ReviewersTab({ cohort }: { cohort: Cohort }) {
  const db = useDb();

  const data = useMemo(() => {
    const apps = Object.values(db.applications).filter((a) => a.cohortId === cohort.id && a.status !== "draft");
    const appIds = new Set(apps.map((a) => a.id));
    const assignments = Object.values(db.reviewerAssignments).filter((r) => appIds.has(r.applicationId));
    const byReviewer = new Map<ID, { app: Application; review?: (typeof db.reviews)[string] }[]>();
    for (const ra of assignments) {
      const app = db.applications[ra.applicationId];
      const review = Object.values(db.reviews).find((r) => r.applicationId === ra.applicationId && r.reviewerId === ra.reviewerId);
      const list = byReviewer.get(ra.reviewerId) ?? [];
      list.push({ app, review });
      byReviewer.set(ra.reviewerId, list);
    }
    const reviewers = [...byReviewer.entries()]
      .map(([id, items]) => ({
        user: db.users[id],
        items: items.sort((a, b) => ((a.app.submittedAt ?? "") < (b.app.submittedAt ?? "") ? 1 : -1)),
        submitted: items.filter((i) => i.review?.status === "submitted").length,
        pending: items.filter((i) => i.review?.status !== "submitted" && (i.app.status === "submitted" || i.app.status === "in_review")).length,
      }))
      .filter((r) => r.user)
      .sort((a, b) => b.pending - a.pending || a.user.name.localeCompare(b.user.name));
    const assigned = new Set(assignments.map((a) => a.applicationId));
    const unassigned = apps.filter((a) => !assigned.has(a.id) && (a.status === "submitted" || a.status === "in_review"));
    return { apps, assignments, reviewers, unassigned };
  }, [db, cohort.id]);

  if (data.apps.length === 0)
    return (
      <Panel>
        <EmptyState
          icon={<Inbox className="size-5" />}
          title="No submitted applications for this cohort"
          description="Reviewer assignments appear here once applications come in."
          action={
            <ButtonLink href="/admin/forms" size="sm" variant="outline">
              Application forms
            </ButtonLink>
          }
        />
      </Panel>
    );

  return (
    <div className="grid grid-cols-1 gap-4">
      <Panel>
        <PanelHeader
          title="Reviewer assignments"
          description={`${plural(data.assignments.length, "assignment")} across ${plural(data.apps.length, "submitted application")}`}
          actions={
            <ButtonLink href="/admin/applications" size="sm" variant="outline" icon={<Inbox className="size-4" />}>
              Application queue
            </ButtonLink>
          }
        />
        {data.reviewers.length === 0 ? (
          <p className="text-[14px] text-muted">No reviewers assigned yet. Assign them from each application.</p>
        ) : (
          <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-2">
            {data.reviewers.map((r) => (
              <section key={r.user.id} className="rounded-[14px] bg-fog p-4" aria-label={`${r.user.name}'s assignments`}>
                <div className="flex items-center gap-3">
                  <Avatar name={r.user.name} hue={r.user.avatarHue} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{r.user.name}</p>
                    <p className="truncate text-[12.5px] text-muted">{roleLabel(db, r.user)}</p>
                  </div>
                  <dl className="flex gap-3 text-center text-[12px] text-muted">
                    <div>
                      <dd className="text-[17px] font-semibold text-void tabular">{r.items.length}</dd>
                      <dt>assigned</dt>
                    </div>
                    <div>
                      <dd className="text-[17px] font-semibold text-void tabular">{r.submitted}</dd>
                      <dt>reviewed</dt>
                    </div>
                    <div>
                      <dd className="text-[17px] font-semibold text-void tabular">{r.pending}</dd>
                      <dt>to do</dt>
                    </div>
                  </dl>
                </div>
                <ul className="mt-3 grid grid-cols-1 gap-1.5">
                  {r.items.map(({ app, review }) => {
                    const score = review?.status === "submitted" ? weightedScore(db, review) : null;
                    return (
                      <li key={app.id}>
                        <Link href={`/admin/applications/${app.id}`} className="flex flex-wrap items-center gap-2 rounded-[10px] bg-paper px-3 py-2 text-[13.5px] hover:bg-[#fafafa]">
                          <span className="min-w-0 flex-1">
                            <span className="font-medium">{db.users[app.applicantId]?.name}</span> <span className="text-muted">· {app.reference}</span>
                          </span>
                          <StatusBadge status={app.status} />
                          {review?.status === "submitted" ? (
                            <Badge tone="green" icon={<ClipboardCheck className="size-3.5" aria-hidden />}>
                              Reviewed{score !== null ? ` · ${score}` : ""}
                            </Badge>
                          ) : review ? (
                            <Badge tone="neutral">Draft review</Badge>
                          ) : (
                            <Badge tone="amber">Not started</Badge>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </Panel>

      {data.unassigned.length > 0 && (
        <Panel>
          <PanelHeader title="Waiting for a reviewer" description="Submitted applications with nobody assigned yet" />
          <ul className="grid grid-cols-1 gap-1.5">
            {data.unassigned.map((a) => (
              <li key={a.id}>
                <Link href={`/admin/applications/${a.id}`} className="flex items-center gap-3 rounded-[12px] bg-fog px-3 py-2.5 text-[14px] hover:bg-ash">
                  <UserPlus className="size-4 shrink-0" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="font-medium">{db.users[a.applicantId]?.name}</span> <span className="text-muted">· {a.reference}</span>
                  </span>
                  <span className="text-[13px] font-medium">Assign reviewers</span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}
