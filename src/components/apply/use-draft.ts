"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ApplicationSection, ID } from "@/lib/domain/types";
import { saveApplication, setCurrentSection, type AnswersPatch } from "@/lib/actions/applications";
import { isEmptyPatch, mergePatch, withoutKeys } from "./answers";

export const AUTOSAVE_MS = 800;

/**
 * Local edits layered over the stored application.
 *
 * The store stays the source of truth: the form renders
 * `mergeAnswers(app.answers, pending)`, so anything that changes the stored
 * application (a location check, an attached document, another tab) shows up
 * immediately without clobbering fields the applicant is still typing in.
 * Pending edits are written through `saveApplication` ~800ms after the last
 * keystroke, on "Save progress", on step changes and when the page is hidden.
 */
export function useApplicationDraft(appId: ID, initialSection: ApplicationSection) {
  const [pending, setPending] = useState<AnswersPatch>({});
  const [error, setError] = useState<string | null>(null);
  const pendingRef = useRef<AnswersPatch>({});
  const sectionRef = useRef<ApplicationSection>(initialSection);

  const replace = useCallback((next: AnswersPatch) => {
    pendingRef.current = next;
    setPending(next);
  }, []);

  const edit = useCallback((patch: AnswersPatch) => replace(mergePatch(pendingRef.current, patch)), [replace]);

  /** Forget pending values the store now owns (e.g. after a location check). */
  const drop = useCallback((keys: string[]) => replace(withoutKeys(pendingRef.current, keys)), [replace]);

  /** Write pending edits now. Returns false if the save was rejected. */
  const flush = useCallback(
    (opts: { section?: ApplicationSection } = {}) => {
      if (opts.section) sectionRef.current = opts.section;
      const snapshot = pendingRef.current;
      if (isEmptyPatch(snapshot)) {
        if (opts.section) setCurrentSection(appId, opts.section);
        return true;
      }
      const r = saveApplication(appId, snapshot, { section: sectionRef.current });
      if (!r.ok) {
        setError(r.error);
        return false;
      }
      // Only clear what we saved; anything typed since stays pending.
      if (pendingRef.current === snapshot) replace({});
      setError(null);
      return true;
    },
    [appId, replace],
  );

  // Debounced autosave after edits.
  useEffect(() => {
    if (isEmptyPatch(pending)) return;
    const t = window.setTimeout(() => flush(), AUTOSAVE_MS);
    return () => window.clearTimeout(t);
  }, [pending, flush]);

  // Never lose edits when the tab is hidden, closed or the wizard unmounts.
  useEffect(() => {
    const onHide = () => flush();
    const onVisibility = () => document.visibilityState === "hidden" && flush();
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", onHide);
      document.removeEventListener("visibilitychange", onVisibility);
      flush();
    };
  }, [flush]);

  return { pending, dirty: !isEmptyPatch(pending), error, edit, drop, flush };
}
