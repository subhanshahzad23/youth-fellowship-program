"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDb } from "@/lib/store/store";
import { Skeleton } from "@/components/ui/display";
import { RecordNotFound } from "@/components/portal/states";

/** Modules live as sections of the learning overview; forward there. */
export default function ModuleRedirect() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const db = useDb();
  const router = useRouter();
  const exists = !!db.modules[moduleId];
  useEffect(() => {
    if (exists) router.replace(`/workspace/learning#${moduleId}`);
  }, [exists, moduleId, router]);
  if (!exists) return <RecordNotFound what="module" backHref="/workspace/learning" backLabel="Back to your modules" />;
  return <Skeleton className="h-64 w-full" />;
}
