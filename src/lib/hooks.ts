"use client";

import { useEffect, useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};
/** true only after hydration on the client — use to gate browser-only values (dates, timezones). */
export function useIsClient() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

function mediaStore(query: string) {
  return {
    subscribe: (cb: () => void) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    get: () => window.matchMedia(query).matches,
  };
}

const cache = new Map<string, ReturnType<typeof mediaStore>>();
function storeFor(query: string) {
  let s = cache.get(query);
  if (!s) {
    s = mediaStore(query);
    cache.set(query, s);
  }
  return s;
}

export function useMediaQuery(query: string) {
  const s = storeFor(query);
  return useSyncExternalStore(s.subscribe, s.get, () => false);
}

export function usePrefersReducedMotion() {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

/** Warn before leaving a page with unsaved edits. */
export function useUnsavedChangesGuard(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
}
