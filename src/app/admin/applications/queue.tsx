"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, Download, FileStack, FilterX, Inbox, Search, Sparkles, X } from "lucide-react";
import type { Application, ApplicationStatus, EligibilityStatus, User } from "@/lib/domain/types";
import { adminCohortIds } from "@/lib/domain/permissions";
import { applicationsInScope, averageScore, reviewersOf, reviewsOf, STATUS_LABEL } from "@/lib/domain/selectors";
import { exportApplicationsCsv } from "@/lib/actions/applications";
import { downloadBlob } from "@/lib/files";
import { useNow } from "@/lib/hooks";
import { useDb, useMe } from "@/lib/store/store";
import { useUI } from "@/lib/store/ui";
import { cn, fmtDate, fmtRelative, plural, sleep } from "@/lib/utils";
import { Button, ButtonLink } from "@/components/ui/button";
import { Select } from "@/components/ui/form";
import { Avatar, Badge, EmptyState, PageHeader, Panel, StatusBadge } from "@/components/ui/display";
import { Table, TD, TH, THead, TR } from "@/components/ui/table";
import { ELIGIBILITY_META, EligibilityBadge } from "@/components/review/meta";

type StatusTab = ApplicationStatus | "all";
type SortKey = "submitted" | "score" | "applicant";
type SortDir = "asc" | "desc";

const STATUS_TABS: StatusTab[] = ["all", "submitted", "in_review", "changes_requested", "waitlisted", "approved", "rejected"];
const ELIG_OPTIONS: (EligibilityStatus | "all")[] = ["all", "inside", "outside", "ambiguous", "not_found", "unchecked"];

interface Row {
  app: Application;
  applicant?: User;
  name: string;
  venture: string;
  cohortName: string;
  trackName: string;
  trackId?: string;
  reviewers: User[];
  avg: number | null;
  submittedReviews: number;
  assignedToMe: boolean;
  needsMine: boolean;
  elig: EligibilityStatus;
}

/** Relative labels only add information for the last week; older dates already read as dates. */
function recent(iso: string | undefined, now: string) {
  return !!iso && Date.parse(now) - Date.parse(iso) < 7 * 86400000;
}

function isStatusTab(v: string | null): v is StatusTab {
  return !!v && (STATUS_TABS as string[]).includes(v);
}

export function ReviewQueue() {
  const db = useDb();
  const me = useMe()!;
  const now = useNow();
  const router = useRouter();
  const params = useSearchParams();
  const cohortContext = useUI((s) => s.adminCohortFilter);
  const setCohortContext = useUI((s) => s.setAdminCohortFilter);

  const [q, setQ] = useState(() => params.get("q") ?? "");
  const [status, setStatus] = useState<StatusTab>(() => {
    const s = params.get("status");
    return isStatusTab(s) ? s : "all";
  });
  const [track, setTrack] = useState(() => params.get("track") ?? "all");
  const [reviewer, setReviewer] = useState(() => params.get("reviewer") ?? "all");
  const [elig, setElig] = useState(() => params.get("elig") ?? "all");
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>(() => {
    const k = params.get("sort");
    const d = params.get("dir");
    return { key: k === "score" || k === "applicant" ? k : "submitted", dir: d === "asc" ? "asc" : "desc" };
  });
  const [exporting, setExporting] = useState(false);

  /* ---------------------------- data ---------------------------- */

  const rows = useMemo<Row[]>(() => {
    return applicationsInScope(db, me.id).map((app) => {
      const applicant = db.users[app.applicantId];
      const reviewers = reviewersOf(db, app.id);
      const reviews = reviewsOf(db, app.id);
      const mine = reviews.find((r) => r.reviewerId === me.id);
      const assignedToMe = reviewers.some((u) => u.id === me.id);
      const trackId = app.answers.idea.trackPreference;
      return {
        app,
        applicant,
        name: applicant?.name ?? app.answers.about.fullName ?? "Unknown applicant",
        venture: app.answers.idea.ventureName ?? applicant?.ventureName ?? "Untitled idea",
        cohortName: db.cohorts[app.cohortId]?.name ?? "Unknown cohort",
        trackName: (trackId && db.tracks[trackId]?.name) || "No preference",
        trackId,
        reviewers,
        avg: averageScore(db, app.id),
        submittedReviews: reviews.filter((r) => r.status === "submitted").length,
        assignedToMe,
        needsMine: assignedToMe && ["submitted", "in_review"].includes(app.status) && mine?.status !== "submitted",
        elig: app.answers.residence.check?.status ?? "unchecked",
      };
    });
  }, [db, me.id]);

  const cohortOptions = useMemo(() => {
    const ids = new Set([...adminCohortIds(db, me.id), ...rows.map((r) => r.app.cohortId)]);
    return [...ids]
      .map((id) => db.cohorts[id])
      .filter(Boolean)
      .sort((a, b) => (a.startDate < b.startDate ? 1 : -1));
  }, [db, me.id, rows]);

  const reviewerOptions = useMemo(() => {
    const ids = new Set(rows.flatMap((r) => r.reviewers.map((u) => u.id)));
    ids.delete(me.id);
    return [...ids]
      .map((id) => db.users[id])
      .filter(Boolean)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [db, rows, me.id]);

  const trackOptions = useMemo(() => Object.values(db.tracks).sort((a, b) => a.order - b.order), [db.tracks]);

  const cohort = cohortContext !== "all" && cohortOptions.some((c) => c.id === cohortContext) ? cohortContext : "all";

  // A cohort in the URL (e.g. a link from the dashboard) sets the shared admin cohort context.
  const urlCohort = params.get("cohort");
  useEffect(() => {
    if (urlCohort && urlCohort !== cohortContext && cohortOptions.some((c) => c.id === urlCohort)) setCohortContext(urlCohort);
    // Only on first load: afterwards the page writes the URL itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep filters in the URL so returning from an application restores the same view.
  useEffect(() => {
    const sp = new URLSearchParams();
    if (q.trim()) sp.set("q", q.trim());
    if (status !== "all") sp.set("status", status);
    if (cohort !== "all") sp.set("cohort", cohort);
    if (track !== "all") sp.set("track", track);
    if (reviewer !== "all") sp.set("reviewer", reviewer);
    if (elig !== "all") sp.set("elig", elig);
    if (sort.key !== "submitted" || sort.dir !== "desc") {
      sp.set("sort", sort.key);
      sp.set("dir", sort.dir);
    }
    const next = sp.toString();
    if (next !== window.location.search.replace(/^\?/, "")) window.history.replaceState(null, "", next ? `${window.location.pathname}?${next}` : window.location.pathname);
  }, [q, status, cohort, track, reviewer, elig, sort]);

  /** Everything except the status filter — used for the status counts. */
  const base = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (cohort !== "all" && r.app.cohortId !== cohort) return false;
      if (track !== "all" && r.trackId !== track) return false;
      if (elig !== "all" && r.elig !== elig) return false;
      if (reviewer === "me" && !r.assignedToMe) return false;
      if (reviewer === "needs_me" && !r.needsMine) return false;
      if (reviewer === "none" && r.reviewers.length > 0) return false;
      if (!["all", "me", "needs_me", "none"].includes(reviewer) && !r.reviewers.some((u) => u.id === reviewer)) return false;
      if (needle) {
        const hay = `${r.name} ${r.app.reference ?? ""} ${r.venture}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [rows, q, cohort, track, elig, reviewer]);

  const counts = useMemo(() => {
    const c: Record<StatusTab, number> = { all: base.length, draft: 0, submitted: 0, in_review: 0, changes_requested: 0, waitlisted: 0, approved: 0, rejected: 0 };
    for (const r of base) c[r.app.status]++;
    return c;
  }, [base]);

  const visible = useMemo(() => {
    const list = status === "all" ? base : base.filter((r) => r.app.status === status);
    const m = sort.dir === "asc" ? 1 : -1;
    return [...list].sort((a, b) => {
      if (sort.key === "score") {
        if (a.avg === null && b.avg === null) return 0;
        if (a.avg === null) return 1; // unscored always last
        if (b.avg === null) return -1;
        return (a.avg - b.avg) * m;
      }
      if (sort.key === "applicant") return a.name.localeCompare(b.name) * m;
      return ((a.app.submittedAt ?? "") < (b.app.submittedAt ?? "") ? -1 : 1) * m;
    });
  }, [base, status, sort]);

  const needsMine = useMemo(() => rows.filter((r) => r.needsMine), [rows]);
  const filtersActive = !!q.trim() || status !== "all" || cohort !== "all" || track !== "all" || reviewer !== "all" || elig !== "all";

  function clearFilters() {
    setQ("");
    setStatus("all");
    setTrack("all");
    setReviewer("all");
    setElig("all");
    setCohortContext("all");
  }

  function toggleSort(key: SortKey) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "applicant" ? "asc" : "desc" }));
  }

  async function exportCsv() {
    if (!visible.length) return;
    setExporting(true);
    await sleep(450);
    try {
      const csv = exportApplicationsCsv(visible.map((r) => r.app.id));
      downloadBlob(csv, `launchpad-applications-${now.slice(0, 10)}.csv`, "text/csv;charset=utf-8");
      toast.success(`Exported ${plural(visible.length, "application")} to CSV`, {
        description: "A summary of the visible rows only. No residence documents, uploaded files or private contact details are included.",
      });
    } catch {
      toast.error("The export couldn't be created in this browser.");
    } finally {
      setExporting(false);
    }
  }

  const cohortLabel = cohort === "all" ? `${plural(cohortOptions.length, "cohort")} in your scope` : db.cohorts[cohort]?.name;

  return (
    <>
      <PageHeader
        eyebrow="Admissions"
        title="Applications"
        description={`Submitted applications for ${cohortLabel}. Drafts stay private to applicants until they submit.`}
        actions={
          <>
            <ButtonLink href="/admin/forms" variant="outline" icon={<FileStack className="size-4" />}>
              Application forms
            </ButtonLink>
            <Button variant="dark" icon={<Download className="size-4" />} loading={exporting} disabled={!visible.length} onClick={exportCsv}>
              Export CSV
            </Button>
          </>
        }
      />

      {needsMine.length > 0 && (
        <Panel className="mb-4 flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:py-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-leaf text-leaf-ink">
            <Sparkles className="size-[18px]" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold">{needsMine.length === 1 ? "1 application needs your review" : `${needsMine.length} applications need your review`}</p>
            <p className="truncate text-[13.5px] text-muted">
              {needsMine
                .slice(0, 3)
                .map((r) => `${r.name} (${r.app.reference})`)
                .join(" · ")}
              {needsMine.length > 3 ? ` and ${needsMine.length - 3} more` : ""}
            </p>
          </div>
          {reviewer === "needs_me" ? (
            <Button variant="soft" size="sm" onClick={() => setReviewer("all")}>
              Show all applications
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              arrow
              onClick={() => {
                setReviewer("needs_me");
                setStatus("all");
              }}
            >
              Show them
            </Button>
          )}
        </Panel>
      )}

      {/* ---------------------------- Filters ---------------------------- */}
      <Panel className="mb-4 space-y-4 p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-2.5 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,2.75fr)]">
          <div className="relative">
            <label htmlFor="queue-search" className="sr-only">
              Search applications
            </label>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
            <input
              id="queue-search"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Name, reference or venture"
              className="h-11 w-full rounded-[8px] border-[1.5px] border-line bg-paper pl-10 pr-10 text-[15px] placeholder:text-[#8a8a8a] hover:border-[#b9c0c6] focus:border-void focus:outline-none [&::-webkit-search-cancel-button]:hidden"
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ("")}
                className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-[6px] text-muted hover:bg-fog hover:text-void"
                aria-label="Clear search"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
            <FilterSelect label="Cohort" value={cohort} onChange={setCohortContext}>
              <option value="all">All cohorts</option>
              {cohortOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect label="Track preference" value={track} onChange={setTrack}>
              <option value="all">All tracks</option>
              {trackOptions.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect label="Reviewer" value={reviewer} onChange={setReviewer}>
              <option value="all">Any reviewer</option>
              <option value="me">Assigned to me</option>
              <option value="needs_me">Needs my review</option>
              <option value="none">Unassigned</option>
              {reviewerOptions.length > 0 && (
                <optgroup label="Assigned to">
                  {reviewerOptions.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </FilterSelect>
            <FilterSelect label="Location check" value={elig} onChange={setElig}>
              {ELIG_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o === "all" ? "Any location" : ELIGIBILITY_META[o].label}
                </option>
              ))}
            </FilterSelect>
          </div>
        </div>

        <div className="-mx-4 overflow-x-auto px-4 sm:-mx-5 sm:px-5 no-scrollbar">
          <div className="flex w-max gap-1.5 sm:w-auto sm:flex-wrap" role="group" aria-label="Filter by status">
            {STATUS_TABS.map((s) => {
              const active = status === s;
              return (
                <button
                  key={s}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setStatus(s)}
                  className={cn(
                    "inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-full px-3.5 text-[13.5px] transition-colors",
                    active ? "bg-void font-medium text-paper" : "bg-fog text-void hover:bg-ash",
                  )}
                >
                  {s === "all" ? "All" : STATUS_LABEL[s]}
                  <span className={cn("tabular rounded-full px-1.5 text-[12px]", active ? "bg-white/15" : "bg-paper text-muted")}>{counts[s]}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-[13.5px] text-muted">
          <p aria-live="polite">
            Showing <span className="font-medium text-void tabular">{visible.length}</span> of <span className="tabular">{rows.length}</span> submitted applications
          </p>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 xl:hidden">
              <span>Sort</span>
              <select
                value={`${sort.key}:${sort.dir}`}
                onChange={(e) => {
                  const [key, dir] = e.target.value.split(":") as [SortKey, SortDir];
                  setSort({ key, dir });
                }}
                className="h-9 rounded-[8px] border-[1.5px] border-line bg-paper px-2 text-[13.5px] text-void focus:border-void focus:outline-none"
              >
                <option value="submitted:desc">Newest first</option>
                <option value="submitted:asc">Oldest first</option>
                <option value="score:desc">Highest score</option>
                <option value="score:asc">Lowest score</option>
                <option value="applicant:asc">Name A–Z</option>
              </select>
            </label>
            {filtersActive && (
              <Button variant="ghost" size="sm" icon={<FilterX className="size-4" />} onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </div>
        </div>
      </Panel>

      {/* ---------------------------- Results ---------------------------- */}
      {rows.length === 0 ? (
        <Panel>
          <EmptyState
            icon={<Inbox className="size-5" />}
            title="No submitted applications yet"
            description="Applications appear here as soon as applicants submit them. Drafts stay private until then."
            action={
              <ButtonLink href="/admin/forms" variant="outline" size="sm">
                Check application windows
              </ButtonLink>
            }
          />
        </Panel>
      ) : visible.length === 0 ? (
        <Panel>
          <EmptyState
            icon={<FilterX className="size-5" />}
            title="No applications match these filters"
            description={q.trim() ? `Nothing matches “${q.trim()}” with the current filters.` : "Try a different status or widen the cohort, reviewer or location filters."}
            action={
              <Button variant="dark" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            }
          />
        </Panel>
      ) : (
        <>
          <Table caption="Applications in your scope" className="hidden xl:block">
            <THead>
              <tr>
                <TH className="px-3" sort={sort.key === "applicant" ? sort.dir : null} onSort={() => toggleSort("applicant")}>
                  Applicant
                </TH>
                <TH className="px-3">Reference</TH>
                <TH className="hidden px-3 min-[1400px]:table-cell">Cohort · track</TH>
                <TH className="px-3">Status</TH>
                <TH className="px-3">Location</TH>
                <TH className="px-3">Reviewers</TH>
                <TH className="px-3" align="right" sort={sort.key === "score" ? sort.dir : null} onSort={() => toggleSort("score")}>
                  Score
                </TH>
                <TH className="px-3" sort={sort.key === "submitted" ? sort.dir : null} onSort={() => toggleSort("submitted")}>
                  Submitted
                </TH>
              </tr>
            </THead>
            <tbody>
              {visible.map((r) => (
                <TR key={r.app.id} onClick={() => router.push(`/admin/applications/${r.app.id}`)} className={cn(r.needsMine && "bg-[#f4fcf7] hover:bg-[#ecf9f1]")}>
                  <TD className="relative px-3">
                    {r.needsMine && <span className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-jade" aria-hidden />}
                    <div className="flex items-center gap-3">
                      <Avatar name={r.name} hue={r.applicant?.avatarHue} size={34} />
                      <div className="min-w-0">
                        <Link
                          href={`/admin/applications/${r.app.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-[14.5px] font-medium underline-offset-2 hover:underline"
                        >
                          {r.name}
                        </Link>
                        <p className="truncate text-[13px] text-muted">{r.venture}</p>
                        {r.needsMine && (
                          <span className="mt-0.5 inline-flex items-center gap-1 text-[12px] font-medium text-leaf-ink">
                            <span className="size-1.5 rounded-full bg-jade" aria-hidden />
                            Needs your review
                          </span>
                        )}
                      </div>
                    </div>
                  </TD>
                  <TD className="px-3">
                    <span className="font-mono text-[12.5px]">{r.app.reference}</span>
                    <span className="block text-[12.5px] text-muted min-[1400px]:hidden">{r.cohortName}</span>
                  </TD>
                  <TD className="hidden px-3 min-[1400px]:table-cell">
                    <span className="block text-[14px]">{r.cohortName}</span>
                    <span className="block text-[12.5px] text-muted">{r.trackName}</span>
                  </TD>
                  <TD className="px-3">
                    <StatusBadge status={r.app.status} />
                  </TD>
                  <TD className="px-3">
                    <EligibilityBadge status={r.elig} short />
                  </TD>
                  <TD className="px-3">
                    <ReviewerStack reviewers={r.reviewers} meId={me.id} />
                  </TD>
                  <TD className="px-3" align="right">
                    <ScoreCell avg={r.avg} count={r.submittedReviews} />
                  </TD>
                  <TD className="px-3">
                    <span className="block whitespace-nowrap text-[14px]">{fmtDate(r.app.submittedAt)}</span>
                    {recent(r.app.submittedAt, now) && <span className="block whitespace-nowrap text-[12.5px] text-muted">{fmtRelative(r.app.submittedAt, now)}</span>}
                  </TD>
                </TR>
              ))}
            </tbody>
          </Table>

          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:hidden" aria-label="Applications">
            {visible.map((r) => (
              <li key={r.app.id}>
                <Link
                  href={`/admin/applications/${r.app.id}`}
                  className={cn(
                    "relative flex h-full flex-col gap-3 overflow-hidden rounded-[16px] bg-paper p-4 ring-1 ring-transparent transition-colors hover:ring-line",
                    r.needsMine && "bg-[#f4fcf7]",
                  )}
                >
                  {r.needsMine && <span className="absolute inset-y-3 left-0 w-[3px] rounded-full bg-jade" aria-hidden />}
                  <div className="flex items-start gap-3">
                    <Avatar name={r.name} hue={r.applicant?.avatarHue} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-semibold">{r.name}</p>
                      <p className="truncate text-[13.5px] text-muted">{r.venture}</p>
                    </div>
                    <ArrowRight className="mt-1 size-4 shrink-0 text-muted" aria-hidden />
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <StatusBadge status={r.app.status} />
                    <EligibilityBadge status={r.elig} short />
                    {r.needsMine && <Badge tone="green">Needs your review</Badge>}
                  </div>
                  <p className="text-[13px] text-muted">
                    <span className="font-mono text-void">{r.app.reference}</span> · {r.cohortName} · {r.trackName}
                  </p>
                  <div className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-3">
                    <ReviewerStack reviewers={r.reviewers} meId={me.id} />
                    <div className="text-right">
                      <ScoreCell avg={r.avg} count={r.submittedReviews} />
                    </div>
                  </div>
                  <p className="-mt-1 text-[12.5px] text-muted">
                    Submitted {fmtDate(r.app.submittedAt)}
                    {recent(r.app.submittedAt, now) ? ` · ${fmtRelative(r.app.submittedAt, now)}` : ""}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}

function FilterSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <Select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} className={cn(value !== "all" && "border-void")}>
        {children}
      </Select>
    </label>
  );
}

function ReviewerStack({ reviewers, meId }: { reviewers: User[]; meId: string }) {
  if (!reviewers.length)
    return (
      <Badge tone="amber" className="text-[12px]">
        Unassigned
      </Badge>
    );
  const names = reviewers.map((u) => (u.id === meId ? `${u.name} (you)` : u.name)).join(", ");
  return (
    <span className="flex items-center" title={names}>
      <span className="flex -space-x-2">
        {reviewers.slice(0, 3).map((u) => (
          <Avatar key={u.id} name={u.name} hue={u.avatarHue} size={28} ring />
        ))}
      </span>
      {reviewers.length > 3 && <span className="ml-1.5 text-[12.5px] text-muted">+{reviewers.length - 3}</span>}
      <span className="sr-only">Reviewers: {names}</span>
    </span>
  );
}

function ScoreCell({ avg, count }: { avg: number | null; count: number }) {
  if (avg === null)
    return (
      <span className="text-[13px] text-muted">
        <span aria-hidden>—</span>
        <span className="sr-only">No submitted reviews</span>
      </span>
    );
  return (
    <span className="inline-flex flex-col items-end leading-tight">
      <span className="text-[15px] font-semibold tabular">
        {avg}
        <span className="text-[12px] font-normal text-muted">/100</span>
      </span>
      <span className="text-[12px] text-muted">{plural(count, "review")}</span>
    </span>
  );
}
