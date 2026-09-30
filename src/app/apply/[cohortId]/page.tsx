"use client";

import { useParams } from "next/navigation";
import { ApplyRoute } from "@/components/apply/apply-route";

export default function ApplyCohortPage() {
  const { cohortId } = useParams<{ cohortId: string }>();
  return <ApplyRoute cohortKey={cohortId} />;
}
