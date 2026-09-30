"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ClipboardCheck, Inbox, SearchX } from "lucide-react";
import type { Submission } from "@/lib/domain/types";
import { instructorScopes, instructorTrackIds, isInstructor } from "@/lib/domain/permissions";
import { modulesOfTrack, submissionsForInstructor } from "@/lib/domain/selectors";
import { useNow } from "@/lib/hooks";
import { useDb, useMe } from "@/lib/store/store";
import { cn, fmtRelative } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, EmptyState, PageHeader, Panel } from "@/components/ui/display";
import { Select } from "@/components/ui/form";
import { Segmented } from "@/components/ui/overlay";
import { Denied } from "@/components/portal/states";
import { SubmissionStatusBadge } from "@/components/learning/meta";
import { ReviewPanel } from "@/components/learning/review-panel";

type StatusFilter = "all" | "submitted" | "changes_requested" | "reviewed";
const RANK: Record<Submission["status"], number> = { submitted: 0, changes_requested: 1, reviewed: 2, draft: 3 };

function lastActivity(s: Submission) {
  if (s.status === "submitted") return s.versions[s.versions.length - 1]?.submittedAt ?? s.updatedAt;
  return s.updatedAt;
}

export function SubmissionsView() {
  const search = useSearchParams();
  const selectedId = search.get("s");
  const router = useRouter();
  const pathname = usePathname();
  const db = useDb();
  const me = useMe()!;
  const now = useNow();

  const [cohort, setCohort] = useState("all");
  const [moduleId, setModuleId] = useState("all");
  const [status, setStatus] = useState<StatusFilter>("all");

  const queue = useMemo(
    () =>
      submissionsForInstructor(db, me.id).sort((a, b) => {
        const r = RANK[a.status] - RANK[b.status];
        if (r) return r;
        // Waiting items: oldest first (fair queue). Everything else: most recent first.
        return a.status === "submitted" ? (lastActivity(a) < lastActivity(b) ? -1 : 1) : lastActivity(a) < lastActivity(b) ? 1 : -1;
      }),
    [db, me.id],
  );
  const cohortOptions = useMemo(() => [...new Set(instructorScopes(db, me.id).map((s) => s.cohortId))].map((id) => db.cohorts[id]).filter(Boolean), [db, me.id]);
  const moduleOptions = useMemo(() => instructorTrackIds(db, me.id).flatMap((t) => modulesOfTrack(db, t)), [db, me.id]);

  const filtered = queue.filter((s) => {
    if (cohort !== "all" && s.cohortId !== cohort) return false;
    if (moduleId !== "all" && db.sessions[s.sessionId]?.moduleId !== moduleId) return false;
    if (status !== "all" && s.status !== status) return false;
    return true;
  });
  const counts = {
    all: queue.length,
    submitted: queue.filter((s) => s.status === "submitted").length,
    changes_requested: queue.filter((s) => s.status === "changes_requested").length,
    reviewed: queue.filter((s) => s.status === "reviewed").length,
  };

  if (!isInstructor(db, me.id))
    return <Denied reason="Submissions are reviewed by the instructor assigned to each track and cohort. Mentors can follow their mentees' progress from the overview." backHref="/staff/dashboard" backLabel="Back to overview" />;

  const selected = selectedId ? db.submissions[selectedId] : undefined;
  const visibleSelected = selected && selected.status !== "draft" ? selected : undefined;
  const hasSelection = !!selectedId;

  const select = (id: string) => router.push(`${pathname}?s=${id}`, { scroll: false });
  const clear = () => router.push(pathname, { scroll: false });

  return (
    <>
      <PageHeader
        eyebrow="Review queue"
        title="Submissions"
        description="Assignments from the tracks and cohorts you teach. Waiting items come first, oldest at the top."
        className={cn(hasSelection && "hidden lg:flex")}
      />

      <div className={cn("mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between", hasSelection && "hidden lg:flex")}>
        <div className="-mx-4 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:px-0">
          <Segmented
            label="Filter by status"
            value={status}
            onChange={setStatus}
            options={[
              { value: "all", label: `All · ${counts.all}` },
              { value: "submitted", label: `Awaiting review · ${counts.submitted}` },
              { value: "changes_requested", label: `Changes requested · ${counts.changes_requested}` },
              { value: "reviewed", label: `Reviewed · ${counts.reviewed}` },
            ]}
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <label className="sm:w-48">
            <span className="sr-only">Cohort</span>
            <Select value={cohort} onChange={(e) => setCohort(e.target.value)} className="h-10 text-[14px]">
              <option value="all">All cohorts</option>
              {cohortOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </label>
          <label className="sm:w-56">
            <span className="sr-only">Module</span>
            <Select value={moduleId} onChange={(e) => setModuleId(e.target.value)} className="h-10 text-[14px]">
              <option value="all">All modules</option>
              {moduleOptions.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.order}. {m.title}
                </option>
              ))}
            </Select>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:items-start">
        {/* Queue */}
        <Panel as="aside" className={cn("p-2 sm:p-2 lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7.5rem)] lg:overflow-y-auto", hasSelection && "hidden lg:block")} aria-label="Submission queue">
          {filtered.length === 0 ? (
            <EmptyState
              icon={<Inbox className="size-5" />}
              title={queue.length === 0 ? "No submissions yet" : "Nothing matches these filters"}
              description={queue.length === 0 ? "When fellows submit assignments in your tracks, they'll appear here." : "Try a different status, cohort or module."}
              action={
                queue.length > 0 ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setStatus("all");
                      setCohort("all");
                      setModuleId("all");
                    }}
                  >
                    Clear filters
                  </Button>
                ) : undefined
              }
              className="m-2 border-0"
            />
          ) : (
            <ul className="grid gap-0.5">
              {filtered.map((s) => {
                const f = db.users[s.fellowId];
                const sess = db.sessions[s.sessionId];
                const mod = sess ? db.modules[sess.moduleId] : undefined;
                const active = s.id === selectedId;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => select(s.id)}
                      aria-current={active ? "true" : undefined}
                      className={cn("flex w-full items-start gap-3 rounded-[14px] p-3 text-left transition-colors", active ? "bg-fog ring-[1.5px] ring-void" : "hover:bg-fog")}
                    >
                      <Avatar name={f?.name ?? "?"} hue={f?.avatarHue} size={38} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-[14.5px] font-semibold">{f?.name ?? "Former fellow"}</span>
                          <span className="shrink-0 text-[12px] text-muted">{fmtRelative(lastActivity(s), now)}</span>
                        </span>
                        <span className="mt-0.5 block truncate text-[13.5px] text-ink">{sess?.published?.title}</span>
                        <span className="mt-0.5 block truncate text-[12.5px] text-muted">
                          {db.cohorts[s.cohortId]?.name} · Module {mod?.order}
                          {s.versions.length > 1 && ` · v${s.versions.length}`}
                        </span>
                        <SubmissionStatusBadge sub={s} className="mt-2" />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        {/* Detail */}
        <section className={cn("min-w-0", !hasSelection && "hidden lg:block")} aria-label="Review">
          {visibleSelected ? (
            <ReviewPanel key={visibleSelected.id} sub={visibleSelected} onBack={clear} />
          ) : hasSelection ? (
            <div>
              <button type="button" onClick={clear} className="mb-3 inline-flex h-10 items-center gap-1 rounded-[8px] pr-2 text-[14px] text-muted hover:text-void lg:hidden">
                <ChevronLeft className="size-4" aria-hidden /> All submissions
              </button>
              <EmptyState
                icon={<SearchX className="size-5" />}
                title="We couldn't find that submission"
                description="It may not have been submitted yet, or the demo data may have been reset."
                action={
                  <Button variant="outline" onClick={clear}>
                    Back to the queue
                  </Button>
                }
                className="bg-paper"
              />
            </div>
          ) : (
            <EmptyState
              icon={<ClipboardCheck className="size-5" />}
              title={counts.submitted ? `${counts.submitted} waiting for your review` : "You're all caught up"}
              description={counts.submitted ? "Choose a submission from the queue to read it and give feedback." : "Approved and returned work stays in the queue for reference."}
              action={
                counts.submitted && filtered.find((s) => s.status === "submitted") ? (
                  <Button onClick={() => select(filtered.find((s) => s.status === "submitted")!.id)}>Start with the oldest</Button>
                ) : undefined
              }
              className="bg-paper py-16"
            />
          )}
        </section>
      </div>
    </>
  );
}
