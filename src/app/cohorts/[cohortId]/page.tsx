import type { Metadata } from "next";
import { COHORTS } from "@/lib/seed/people";
import { PublicShell } from "@/components/site/public-shell";
import { CohortView } from "./view";

export async function generateMetadata({ params }: PageProps<"/cohorts/[cohortId]">): Promise<Metadata> {
  const { cohortId } = await params;
  const c = COHORTS.find((x) => x.slug === cohortId || x.id === cohortId);
  return { title: c ? `${c.name} cohort` : "Cohort" };
}

export default async function CohortPage({ params }: PageProps<"/cohorts/[cohortId]">) {
  const { cohortId } = await params;
  return (
    <PublicShell>
      <CohortView cohortKey={cohortId} />
    </PublicShell>
  );
}
