"use client";

import { useState } from "react";
import { isStaff } from "@/lib/domain/permissions";
import { applicationsOf, cohortBySlugOrId, formForCohort, windowState } from "@/lib/domain/selectors";
import { useNow } from "@/lib/hooks";
import { useDb, useHydrated, useMe } from "@/lib/store/store";
import { IdentityStep, StaffCannotApply, StartScreen } from "./identity";
import { LockedSummary, SubmittedSuccess } from "./success";
import { ApplySkeleton, ClosedState, CohortMissing, UnpublishedState, UpcomingState } from "./window-states";
import { ApplicationWizard, type SubmitResult } from "./wizard";

/**
 * /apply/[cohortId] — decides what to show from the intake's window state,
 * who is signed in, and whether they already have an application.
 */
export function ApplyRoute({ cohortKey }: { cohortKey: string }) {
  const hydrated = useHydrated();
  const db = useDb();
  const me = useMe();
  const now = useNow();
  const [success, setSuccess] = useState<SubmitResult | null>(null);

  const key = decodeURIComponent(cohortKey);
  const cohort = cohortBySlugOrId(db, key);
  const form = cohort ? formForCohort(db, cohort.id) : undefined;
  const myApp = me && cohort ? applicationsOf(db, me.id).find((a) => a.cohortId === cohort.id) : undefined;

  if (!hydrated) return <ApplySkeleton />;
  if (!cohort) return <CohortMissing cohortKey={key} />;

  if (myApp && success?.appId === myApp.id && myApp.status !== "draft" && myApp.status !== "changes_requested")
    return <SubmittedSuccess app={myApp} cohort={cohort} resubmitted={success.resubmitted} />;

  if (myApp && myApp.status !== "draft" && myApp.status !== "changes_requested") return <LockedSummary app={myApp} cohort={cohort} />;

  // Requested changes can be made even after the intake window closes.
  if (myApp?.status === "changes_requested") return <ApplicationWizard key={myApp.id} app={myApp} cohort={cohort} form={form} onSubmitted={setSuccess} />;

  const ws = windowState(form, now);
  if (ws === "unpublished" || !form) return <UnpublishedState cohort={cohort} />;
  if (ws === "upcoming") return <UpcomingState cohort={cohort} form={form} />;
  if (ws === "closed") return <ClosedState cohort={cohort} form={form} hasDraft={!!myApp} />;

  if (!me) return <IdentityStep cohort={cohort} form={form} />;
  if (isStaff(db, me.id)) return <StaffCannotApply cohort={cohort} />;
  if (!myApp) return <StartScreen cohort={cohort} form={form} />;
  return <ApplicationWizard key={myApp.id} app={myApp} cohort={cohort} form={form} onSubmitted={setSuccess} />;
}
