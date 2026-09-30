"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { CalendarDays, MapPin, Megaphone, Pencil } from "lucide-react";
import type { Cohort } from "@/lib/domain/types";
import { canManageCohort, mentorsOfFellow } from "@/lib/domain/permissions";
import { cohortBySlugOrId, cohortLearningProgress, cohortPhaseLabel, fellowsOfCohort } from "@/lib/domain/selectors";
import { useNow } from "@/lib/hooks";
import { useDb, useMe } from "@/lib/store/store";
import { fmtDate } from "@/lib/utils";
import { Button, ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/display";
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from "@/components/ui/overlay";
import { Denied, RecordNotFound } from "@/components/portal/states";
import { useCrumb } from "@/components/portal/crumbs";
import { CohortStatusBadge } from "@/components/admin/cohort-badges";
import { EditCohortDialog } from "@/components/admin/cohort-forms";
import { OverviewTab } from "@/components/admin/cohort/overview-tab";
import { FellowsTab } from "@/components/admin/cohort/fellows-tab";
import { StaffTab } from "@/components/admin/cohort/staff-tab";
import { PairingsTab } from "@/components/admin/cohort/pairings-tab";
import { ReviewersTab } from "@/components/admin/cohort/reviewers-tab";

const TABS = ["overview", "fellows", "staff", "pairings", "reviewers"] as const;
type Tab = (typeof TABS)[number];

export default function CohortDetailPage() {
  const { cohortId } = useParams<{ cohortId: string }>();
  const db = useDb();
  const me = useMe()!;
  const cohort = cohortBySlugOrId(db, decodeURIComponent(cohortId));
  useCrumb(cohort?.name);

  if (!cohort) return <RecordNotFound what="cohort" backHref="/admin/cohorts" backLabel="Back to cohorts" />;
  const access = canManageCohort(db, me.id, cohort.id);
  if (!access.ok) {
    const managers = Object.values(db.memberships)
      .filter((m) => m.cohortId === cohort.id && m.role === "program_admin" && m.status === "active")
      .map((m) => db.users[m.userId]?.name)
      .filter(Boolean);
    return (
      <Denied
        title={`${cohort.name} is outside your scope`}
        reason={`${access.reason} Program admins manage their assigned cohorts only${managers.length ? ` — ${cohort.name} is run by ${managers.join(" and ")}` : ""}. Executive admins can see every cohort.`}
        backHref="/admin/cohorts"
        backLabel="Back to your cohorts"
      />
    );
  }
  return <CohortDetail cohort={cohort} />;
}

function CohortDetail({ cohort }: { cohort: Cohort }) {
  const db = useDb();
  const now = useNow();
  const [tab, setTab] = useState<Tab>("overview");
  const [editing, setEditing] = useState(false);

  // Deep-link support: /admin/cohorts/<id>#staff
  useEffect(() => {
    const read = () => {
      const h = window.location.hash.slice(1) as Tab;
      if (TABS.includes(h)) setTab(h);
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);
  const changeTab = (v: string) => {
    setTab(v as Tab);
    window.history.replaceState(null, "", v === "overview" ? window.location.pathname : `#${v}`);
  };

  const counts = useMemo(() => {
    const fellows = fellowsOfCohort(db, cohort.id);
    return {
      fellows: fellows.length,
      paired: fellows.filter((f) => mentorsOfFellow(db, f.id).length > 0).length,
      staff: new Set(Object.values(db.memberships).filter((m) => m.cohortId === cohort.id && m.role !== "fellow" && m.status === "active").map((m) => m.userId)).size,
      pairings: Object.values(db.mentorAssignments).filter((a) => a.cohortId === cohort.id && a.status === "active").length,
      reviewers: new Set(
        Object.values(db.reviewerAssignments)
          .filter((r) => db.applications[r.applicationId]?.cohortId === cohort.id)
          .map((r) => r.reviewerId),
      ).size,
      progress: cohortLearningProgress(db, cohort.id),
      reports: Object.values(db.reports).filter((r) => r.cohortId === cohort.id && r.status !== "resolved").length,
    };
  }, [db, cohort.id]);

  return (
    <>
      <PageHeader
        eyebrow={
          <span className="inline-flex flex-wrap items-center gap-2">
            {cohortPhaseLabel(cohort, now)}
          </span>
        }
        title={
          <span className="inline-flex flex-wrap items-center gap-3">
            {cohort.name}
            <span className="font-sans tracking-normal">
              <CohortStatusBadge status={cohort.status} />
            </span>
          </span>
        }
        description={
          <span className="flex flex-wrap gap-x-4 gap-y-1">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-4" aria-hidden />
              {fmtDate(cohort.startDate)} – {fmtDate(cohort.endDate)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-4" aria-hidden />
              {cohort.location}
            </span>
          </span>
        }
        actions={
          <>
            <Button variant="outline" icon={<Pencil className="size-4" />} onClick={() => setEditing(true)}>
              Edit details
            </Button>
            <ButtonLink href={`/admin/announcements?scope=${cohort.id}`} icon={<Megaphone className="size-4" />}>
              Announce
            </ButtonLink>
          </>
        }
      />

      <dl className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["Enrollment", `${counts.fellows} / ${cohort.capacity}`, "fellows enrolled"],
          ["Mentor coverage", `${counts.paired} / ${counts.fellows}`, "fellows paired"],
          ["Learning progress", counts.progress.fellows ? `${counts.progress.avgPct}%` : "—", "average completion"],
          ["Open reports", String(counts.reports), counts.reports ? "need review" : "all clear"],
        ].map(([label, value, detail]) => (
          <div key={label} className="rounded-[16px] bg-paper px-4 py-3.5">
            <dt className="text-[13px] text-muted">{label}</dt>
            <dd className="mt-0.5 font-display text-[30px] leading-none tracking-[-0.03em] tabular">{value}</dd>
            <dd className="mt-1 text-[12.5px] text-muted">{detail}</dd>
          </div>
        ))}
      </dl>

      <TabsRoot value={tab} onValueChange={changeTab}>
        <TabsList aria-label={`${cohort.name} sections`} className="mb-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="fellows">
            Fellows <span className="tabular text-muted">{counts.fellows}</span>
          </TabsTrigger>
          <TabsTrigger value="staff">
            Staff <span className="tabular text-muted">{counts.staff}</span>
          </TabsTrigger>
          <TabsTrigger value="pairings">
            Mentor pairings <span className="tabular text-muted">{counts.pairings}</span>
          </TabsTrigger>
          <TabsTrigger value="reviewers">
            Reviewers <span className="tabular text-muted">{counts.reviewers}</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <OverviewTab cohort={cohort} onEdit={() => setEditing(true)} />
        </TabsContent>
        <TabsContent value="fellows">
          <FellowsTab cohort={cohort} />
        </TabsContent>
        <TabsContent value="staff">
          <StaffTab cohort={cohort} />
        </TabsContent>
        <TabsContent value="pairings">
          <PairingsTab cohort={cohort} />
        </TabsContent>
        <TabsContent value="reviewers">
          <ReviewersTab cohort={cohort} />
        </TabsContent>
      </TabsRoot>

      <EditCohortDialog cohort={cohort} open={editing} onOpenChange={setEditing} />
    </>
  );
}
