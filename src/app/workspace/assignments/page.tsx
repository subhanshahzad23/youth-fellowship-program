"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ClipboardCheck, MessageSquareQuote, UserRoundCheck } from "lucide-react";
import { fellowMembership } from "@/lib/domain/permissions";
import { modulesOfTrack, publishedSessionsOfModule, sessionState, submissionFor, taskBlockOf, type SessionState } from "@/lib/domain/selectors";
import { useNow } from "@/lib/hooks";
import { useDb, useMe } from "@/lib/store/store";
import { fmtRelative } from "@/lib/utils";
import { EmptyState, PageHeader, Panel } from "@/components/ui/display";
import { Segmented } from "@/components/ui/overlay";
import { fmtMinutes, instructorNameForFellow, latestFeedback } from "@/components/learning/data";
import { SessionStateBadge, StateDot } from "@/components/learning/meta";

type Filter = "all" | "todo" | "review" | "changes" | "complete";

const MATCH: Record<Filter, (s: SessionState) => boolean> = {
  all: () => true,
  todo: (s) => s === "not_started" || s === "in_progress",
  review: (s) => s === "awaiting_review",
  changes: (s) => s === "changes_requested",
  complete: (s) => s === "complete",
};

const EMPTY: Record<Filter, string> = {
  all: "Your track doesn't have any assignments published yet.",
  todo: "Nothing left to start — nice work.",
  review: "Nothing is waiting for review right now.",
  changes: "No changes requested. When your instructor asks for changes, it shows up here.",
  complete: "Completed assignments will collect here.",
};

export default function AssignmentsPage() {
  const db = useDb();
  const me = useMe()!;
  const now = useNow();
  const fm = fellowMembership(db, me.id)!;
  const track = fm.trackId ? db.tracks[fm.trackId] : undefined;
  const [filter, setFilter] = useState<Filter>("all");

  const rows = useMemo(() => {
    if (!track) return [];
    return modulesOfTrack(db, track.id).flatMap((m) =>
      publishedSessionsOfModule(db, m.id)
        .filter((s) => s.kind === "task")
        .map((s) => {
          const sub = submissionFor(db, me.id, s.id);
          return { m, s, task: taskBlockOf(s.published), sub, state: sessionState(db, me.id, s), fb: latestFeedback(sub) };
        }),
    );
  }, [db, me.id, track]);
  const instructor = useMemo(() => instructorNameForFellow(db, me.id), [db, me.id]);

  const counts = useMemo(() => {
    const c = { all: 0, todo: 0, review: 0, changes: 0, complete: 0 } as Record<Filter, number>;
    for (const r of rows) for (const f of Object.keys(MATCH) as Filter[]) if (MATCH[f](r.state)) c[f]++;
    return c;
  }, [rows]);
  const visible = rows.filter((r) => MATCH[filter](r.state));

  return (
    <>
      <PageHeader
        eyebrow={track ? `${track.name} · ${counts.complete} of ${counts.all} complete` : undefined}
        title="Assignments"
        description={`Every assignment in your track, with where it stands and ${instructor === "your instructor" ? "your instructor's" : `${instructor.split(" ")[0]}'s`} latest feedback.`}
      />

      <div className="-mx-4 mb-4 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:px-0">
        <Segmented
          label="Filter assignments"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: `All · ${counts.all}` },
            { value: "todo", label: `To do · ${counts.todo}` },
            { value: "review", label: `In review · ${counts.review}` },
            { value: "changes", label: `Changes requested · ${counts.changes}` },
            { value: "complete", label: `Complete · ${counts.complete}` },
          ]}
        />
      </div>

      {visible.length === 0 ? (
        <EmptyState icon={<ClipboardCheck className="size-5" />} title="Nothing here" description={EMPTY[filter]} />
      ) : (
        <ul className="space-y-3">
          {visible.map(({ m, s, task, sub, state, fb }) => {
            const lastV = sub?.versions[sub.versions.length - 1];
            const activity =
              state === "awaiting_review" && lastV
                ? `Submitted ${fmtRelative(lastV.submittedAt, now)} · version ${sub!.versions.length}`
                : state === "in_progress" && sub?.draftSavedAt
                  ? `Draft saved ${fmtRelative(sub.draftSavedAt, now)}`
                  : state === "complete" && lastV
                    ? `Submitted ${fmtRelative(lastV.submittedAt, now)}`
                    : state === "changes_requested" && fb
                      ? `Changes requested ${fmtRelative(fb.at, now)}`
                      : `Estimated ${fmtMinutes(s.published?.durationMin ?? 0)}`;
            const cta = { not_started: "Start", in_progress: "Continue draft", awaiting_review: "View submission", changes_requested: "Revise and resubmit", complete: "View feedback" }[state];
            return (
              <li key={s.id}>
                <Panel as="article" className="p-0 sm:p-0">
                  <Link href={`/workspace/learning/${m.id}/${s.id}#assignment`} className="group flex flex-col gap-4 rounded-[20px] p-5 transition-colors hover:bg-[#fcfcfc] sm:flex-row sm:items-start sm:p-6">
                    <StateDot state={state} className="hidden sm:grid" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="eyebrow text-muted">
                          Module {m.order} · {m.title}
                        </p>
                      </div>
                      <h2 className="mt-1 text-[18px] font-semibold leading-snug tracking-[-0.01em] text-void group-hover:underline group-hover:underline-offset-2">{s.published?.title}</h2>
                      <p className="mt-1 text-[14px] text-muted">
                        {task?.title}
                        {task && (
                          <span className="ml-2 inline-flex items-center gap-1 whitespace-nowrap">
                            · <UserRoundCheck className="size-3.5" aria-hidden /> {task.requiresReview ? "Instructor review" : "No review needed"}
                          </span>
                        )}
                      </p>
                      <p className="mt-2 text-[13.5px] text-ink">{activity}</p>
                      {fb && (
                        <div className="mt-3 flex gap-2.5 rounded-[12px] bg-fog p-3">
                          <MessageSquareQuote className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
                          <div className="min-w-0">
                            <p className="line-clamp-2 text-[14px] leading-relaxed text-ink">“{fb.text}”</p>
                            <p className="mt-1 text-[12.5px] text-muted">
                              {db.users[fb.authorId]?.name} · {fmtRelative(fb.at, now)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                      <SessionStateBadge state={state} />
                      <span className="inline-flex items-center gap-1 text-[14px] font-medium text-void">
                        {cta}
                        <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
                      </span>
                    </div>
                  </Link>
                </Panel>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
