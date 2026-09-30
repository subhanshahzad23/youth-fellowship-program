"use client";

import { useEffect } from "react";
import * as applications from "@/lib/actions/applications";
import * as admin from "@/lib/actions/admin";
import * as learning from "@/lib/actions/learning";
import * as messaging from "@/lib/actions/messaging";
import * as comms from "@/lib/actions/comms";
import * as permissions from "@/lib/domain/permissions";
import * as selectors from "@/lib/domain/selectors";
import { resetDemo, setPersona, useDemoStore } from "@/lib/store/store";

/**
 * Exposes the demo's typed actions and permission helpers on
 * `window.__launchpad` so the Playwright suite can verify state transitions
 * and action-level permission checks (e.g. a hand-crafted recipient id).
 * This is a client-only demo; there is nothing server-side to protect here.
 */
export function TestHook() {
  useEffect(() => {
    (window as unknown as { __launchpad: unknown }).__launchpad = {
      getState: () => useDemoStore.getState(),
      setPersona,
      resetDemo,
      actions: { applications, admin, learning, messaging, comms },
      permissions,
      selectors,
    };
  }, []);
  return null;
}
