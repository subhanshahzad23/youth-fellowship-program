"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUnsavedChangesGuard } from "@/lib/hooks";
import { ConfirmDialog } from "@/components/ui/overlay";

/**
 * Unsaved-changes guard for in-app navigation as well as tab close/reload.
 * Intercepts clicks on internal links while `dirty` and asks before leaving.
 */
export function LeaveGuard({ dirty, what = "changes" }: { dirty: boolean; what?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  useUnsavedChangesGuard(dirty);

  useEffect(() => {
    if (!dirty) return;
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      e.preventDefault();
      e.stopPropagation();
      setPending(url.pathname + url.search + url.hash);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [dirty]);

  return (
    <ConfirmDialog
      open={!!pending}
      onOpenChange={(v) => !v && setPending(null)}
      title="Leave without saving?"
      description={`You have unsaved ${what} on this page. If you leave now they'll be lost.`}
      confirmLabel="Leave page"
      confirmVariant="danger"
      onConfirm={() => {
        const href = pending;
        setPending(null);
        if (href) router.push(href);
      }}
    />
  );
}
