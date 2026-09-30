"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, CalendarClock, FilePlus2, FileStack, Inbox, Layers } from "lucide-react";
import type { ApplicationForm, Cohort } from "@/lib/domain/types";
import { adminCohortIds } from "@/lib/domain/permissions";
import { formForCohort, openForms, windowState, type WindowState } from "@/lib/domain/selectors";
import { createForm } from "@/lib/actions/admin";
import { useNow } from "@/lib/hooks";
import { useDb, useMe } from "@/lib/store/store";
import { useUI } from "@/lib/store/ui";
import { cn, fmtDate, fmtDateTime, fmtRelative, plural, sleep } from "@/lib/utils";
import { Button, ButtonLink } from "@/components/ui/button";
import { Badge, EmptyState, Notice, PageHeader, Panel } from "@/components/ui/display";
import { applicationsByVersion, hasDraftChanges, WINDOW_META } from "@/components/review/form-utils";

function windowLine(form: ApplicationForm, state: WindowState, now: string) {
  if (state === "open") return `Closes ${fmtRelative(form.closesAt, now)}`;
  if (state === "upcoming") return `Opens ${fmtRelative(form.opensAt, now)}`;
  if (state === "closed") return `Closed ${fmtDate(form.closesAt)}`;
  return "Publish to open the window on these dates";
}

export default function FormsPage() {
  const db = useDb();
  const me = useMe()!;
  const now = useNow();
  const router = useRouter();
  const cohortContext = useUI((s) => s.adminCohortFilter);
  const setCohortContext = useUI((s) => s.setAdminCohortFilter);
  const [creating, setCreating] = useState<string | null>(null);

  const scope = useMemo(
    () =>
      adminCohortIds(db, me.id)
        .map((id) => db.cohorts[id])
        .filter(Boolean)
        .sort((a, b) => (a.startDate < b.startDate ? 1 : -1)),
    [db, me.id],
  );
  const filtered = cohortContext !== "all" && scope.some((c) => c.id === cohortContext) ? scope.filter((c) => c.id === cohortContext) : scope;

  const rows = useMemo(
    () =>
      filtered.map((cohort) => {
        const form = formForCohort(db, cohort.id);
        return { cohort, form };
      }),
    [db, filtered],
  );

  const openEverywhere = useMemo(
    () => openForms(db, now).map((f) => ({ form: f, cohort: db.cohorts[f.cohortId], mine: scope.some((c) => c.id === f.cohortId) })),
    [db, now, scope],
  );

  async function create(cohort: Cohort) {
    setCreating(cohort.id);
    await sleep(450);
    const r = createForm(cohort.id);
    setCreating(null);
    if (!r.ok) {
      toast.error(r.error);
      return;
    }
    toast.success(`Draft form created for ${cohort.name}`, { description: "It starts with two template questions. Nothing is visible to applicants until you publish." });
    router.push(`/admin/forms/${r.value}`);
  }

  return (
    <>
      <PageHeader
        eyebrow="Admissions"
        title="Application forms"
        description="Each cohort has its own form, questions and application window. Publishing creates a new version — applications already started keep the version they began with."
        actions={
          <ButtonLink href="/admin/applications" variant="outline" icon={<Inbox className="size-4" />}>
            Review queue
          </ButtonLink>
        }
      />

      <Notice
        tone={openEverywhere.length > 1 ? "green" : "neutral"}
        icon={<Layers className="size-4" />}
        className="mb-4"
        title={`${plural(openEverywhere.length, "application window")} open right now`}
      >
        {openEverywhere.length === 0 ? (
          "No windows are open at the moment."
        ) : (
          <>
            {openEverywhere.map(({ form, cohort, mine }, i) => (
              <span key={form.id}>
                {i > 0 && (i === openEverywhere.length - 1 ? " and " : ", ")}
                <span className="font-medium">{cohort?.name}</span> (closes {fmtDate(form.closesAt)}
                {mine ? "" : ", managed by another admin"})
              </span>
            ))}
            .{" "}
            {openEverywhere.length > 1
              ? "Windows run independently, so applicants can apply to more than one cohort at the same time."
              : "Windows run independently per cohort, so several can be open at once."}
          </>
        )}
      </Notice>

      {filtered.length !== scope.length && (
        <p className="mb-3 flex flex-wrap items-center gap-2 text-[13.5px] text-muted">
          Showing {filtered[0]?.name} only (your cohort context).
          <button type="button" onClick={() => setCohortContext("all")} className="font-medium text-void underline underline-offset-2 hover:no-underline">
            Show all {scope.length} cohorts
          </button>
        </p>
      )}

      {rows.length === 0 ? (
        <Panel>
          <EmptyState
            icon={<FileStack className="size-5" />}
            title="No cohorts in your scope"
            description="Forms belong to cohorts. Ask an executive admin to assign you to a cohort."
          />
        </Panel>
      ) : (
        <ul className="space-y-3">
          {rows.map(({ cohort, form }) => {
            if (!form)
              return (
                <li key={cohort.id}>
                  <Panel className="flex flex-col gap-4 border-[1.5px] border-dashed border-line sm:flex-row sm:items-center">
                    <span className="grid size-11 shrink-0 place-items-center rounded-[12px] bg-fog">
                      <FilePlus2 className="size-5" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="eyebrow text-muted">{cohort.name}</p>
                      <p className="mt-1 text-[16px] font-semibold">No application form yet</p>
                      <p className="text-[14px] text-muted">Starts {fmtDate(cohort.startDate)}. Create a draft form, add questions, then publish to open applications.</p>
                    </div>
                    <Button variant="primary" arrow loading={creating === cohort.id} onClick={() => create(cohort)}>
                      Create form
                    </Button>
                  </Panel>
                </li>
              );

            const state = windowState(form, now);
            const wm = WINDOW_META[state];
            const current = form.publishedVersionId ? db.formVersions[form.publishedVersionId] : undefined;
            const versions = Object.values(db.formVersions)
              .filter((v) => v.formId === form.id)
              .sort((a, b) => a.version - b.version);
            const byVersion = applicationsByVersion(db, form.id);
            const draft = hasDraftChanges(db, form);
            const questionCount = (form.draftQuestions ?? current?.questions ?? []).length;

            return (
              <li key={form.id}>
                <Link
                  href={`/admin/forms/${form.id}`}
                  className="group grid grid-cols-1 gap-4 rounded-[20px] bg-paper p-5 ring-1 ring-transparent transition-colors hover:ring-line sm:p-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1.2fr)_minmax(0,1fr)_auto] lg:items-center"
                >
                  <div className="min-w-0">
                    <p className="eyebrow text-muted">{cohort.name}</p>
                    <p className="mt-1 text-[17px] font-semibold leading-snug group-hover:underline group-hover:underline-offset-2">{form.title}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[13.5px] text-muted">
                      {current ? `Version ${current.version} live` : "Never published"} · {plural(questionCount, "custom question")}
                      {draft && (
                        <Badge tone="amber" className="h-5 text-[11.5px]">
                          Unpublished draft changes
                        </Badge>
                      )}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={wm.tone} icon={<CalendarClock className="size-3.5" aria-hidden />}>
                        {wm.label}
                      </Badge>
                      <span className="text-[13px] text-muted">{windowLine(form, state, now)}</span>
                    </div>
                    <dl className="mt-1.5 grid grid-cols-[52px_minmax(0,1fr)] gap-y-0.5 text-[13.5px]">
                      <dt className="text-muted">Opens</dt>
                      <dd>{fmtDateTime(form.opensAt)}</dd>
                      <dt className="text-muted">Closes</dt>
                      <dd>
                        {fmtDateTime(form.closesAt)} <span className="text-muted">UTC</span>
                      </dd>
                    </dl>
                  </div>

                  <div className="min-w-0">
                    <p className="text-[12.5px] text-muted">Applications by version</p>
                    {versions.length === 0 ? (
                      <p className="mt-1 text-[13.5px] text-muted">None yet</p>
                    ) : (
                      <ul className="mt-1 space-y-0.5">
                        {versions.map((v) => {
                          const c = byVersion[v.id];
                          return (
                            <li key={v.id} className="flex items-baseline gap-2 text-[13.5px]">
                              <span className={cn("font-mono text-[12.5px]", v.id === form.publishedVersionId ? "font-semibold" : "text-muted")}>v{v.version}</span>
                              <span>
                                {c ? plural(c.total, "application") : "0 applications"}
                                {c?.drafts ? <span className="text-muted"> ({c.drafts} in progress)</span> : null}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>

                  <span className="inline-flex items-center gap-1.5 text-[14px] font-medium">
                    Edit form <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
