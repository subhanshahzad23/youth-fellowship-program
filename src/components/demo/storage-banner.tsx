"use client";

import { AlertTriangle } from "lucide-react";
import { recoverStorage, useDemoStore } from "@/lib/store/store";

/** Explicit recovery path for corrupt, full or unavailable browser storage — never a white screen. */
export function StorageBanner() {
  const issue = useDemoStore((s) => s.storageIssue);
  if (!issue) return null;
  return (
    <div role="alert" className="fixed inset-x-0 top-0 z-[90] flex flex-wrap items-center justify-center gap-3 bg-amber px-4 py-2 text-[14px] text-void">
      <AlertTriangle className="size-4" aria-hidden />
      <span>{issue.message}</span>
      {issue.kind !== "unavailable" && (
        <button onClick={recoverStorage} className="rounded-[8px] border border-void bg-paper px-3 py-1 font-medium">
          Reset demo data
        </button>
      )}
      <button onClick={() => useDemoStore.setState({ storageIssue: null })} className="underline underline-offset-2">
        Dismiss
      </button>
    </div>
  );
}
