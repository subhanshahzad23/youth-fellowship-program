"use client";

import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { current, isDraft, produce, type Draft } from "immer";
import type { AppNotification, AuditEvent, Database, ID, OutboxEmail } from "@/lib/domain/types";
import { freshAnchor, nowISO, resumeAnchor, saveClock, setClockAnchor, type ClockAnchor } from "@/lib/clock";
import { createSeedDatabase, SEED_VERSION } from "@/lib/seed";
import { uid } from "@/lib/utils";

export const STORAGE_KEY = "launchpad-fellowship-demo";

export type StorageIssue = { kind: "corrupt" | "quota" | "unavailable"; message: string } | null;

export interface DemoState {
  db: Database;
  personaId: ID | null;
  clock: ClockAnchor | null;
  seedVersion: number;
  /** true once persisted state has been loaded on the client */
  hydrated: boolean;
  storageIssue: StorageIssue;
}

let reportIssue: (issue: StorageIssue) => void = () => {};

/** localStorage wrapper that never throws and reports corrupt/quota problems. */
const safeStorage: StateStorage = {
  getItem: (name) => {
    try {
      const raw = window.localStorage.getItem(name);
      if (raw) JSON.parse(raw); // validate
      return raw;
    } catch (e) {
      queueMicrotask(() =>
        reportIssue({
          kind: e instanceof SyntaxError ? "corrupt" : "unavailable",
          message: e instanceof SyntaxError ? "Saved demo data couldn't be read." : "Browser storage is unavailable, so changes won't survive a refresh.",
        }),
      );
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      window.localStorage.setItem(name, value);
    } catch {
      queueMicrotask(() => reportIssue({ kind: "quota", message: "Browser storage is full, so recent changes may not survive a refresh." }));
    }
  },
  removeItem: (name) => {
    try {
      window.localStorage.removeItem(name);
    } catch {
      /* ignore */
    }
  },
};

const initialDb = createSeedDatabase();

export const useDemoStore = create<DemoState>()(
  persist(
    (): DemoState => ({
      db: initialDb,
      personaId: null,
      clock: null,
      seedVersion: SEED_VERSION,
      hydrated: false,
      storageIssue: null,
    }),
    {
      name: STORAGE_KEY,
      version: SEED_VERSION,
      storage: createJSONStorage(() => safeStorage),
      skipHydration: true,
      partialize: (s) => ({ db: s.db, personaId: s.personaId, clock: s.clock, seedVersion: s.seedVersion }),
      migrate: (persisted, version) => {
        // Structure changed between demo builds: start from a clean seed rather than guess.
        if (version !== SEED_VERSION) return { db: createSeedDatabase(), personaId: null, clock: null, seedVersion: SEED_VERSION };
        return persisted as DemoState;
      },
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<DemoState>;
        if (!p.db || typeof p.db !== "object" || !p.db.users || !p.db.cohorts) return { ...current, personaId: typeof p.personaId === "string" ? p.personaId : null };
        return { ...current, ...p };
      },
    },
  ),
);

reportIssue = (issue) => useDemoStore.setState({ storageIssue: issue });

/** Load persisted state on the client (called once from <StoreHydrator/>). */
export async function hydrateStore() {
  try {
    await useDemoStore.persist.rehydrate();
  } catch {
    reportIssue({ kind: "corrupt", message: "Saved demo data couldn't be loaded." });
  }
  const clock = resumeAnchor();
  setClockAnchor(clock);
  useDemoStore.setState({ clock, hydrated: true });
}

/* ------------------------------------------------------------------ */
/* Mutations                                                           */
/* ------------------------------------------------------------------ */

export class ActionError extends Error {}

/** Deep, plain copy of a value that may be an immer draft (structuredClone can't clone proxies). */
export function plain<T>(v: T): T {
  if (v === undefined || v === null) return v;
  return isDraft(v) ? (current(v as Draft<T>) as T) : structuredClone(v);
}

export type ActionResult<T = undefined> = { ok: true; value: T; message?: string } | { ok: false; error: string };

export interface Ctx {
  actorId: ID;
  now: string;
  audit: (e: Omit<AuditEvent, "id" | "at" | "actorId" | "outcome"> & { outcome?: AuditEvent["outcome"]; actorId?: ID }) => void;
  notify: (n: Omit<AppNotification, "id" | "createdAt">) => void;
  email: (e: Omit<OutboxEmail, "id" | "createdAt" | "status">) => void;
  fail: (reason: string) => never;
}

/**
 * The single mutation path. Runs `recipe` against an immer draft of the
 * database. If the recipe calls ctx.fail() (or throws), nothing is applied —
 * multi-step transitions such as approval → membership → welcome email →
 * audit are therefore atomic.
 */
export function commit<T>(recipe: (db: Draft<Database>, ctx: Ctx) => T, opts: { allowAnonymous?: boolean } = {}): ActionResult<T> {
  const state = useDemoStore.getState();
  const actorId = state.personaId;
  if (!actorId && !opts.allowAnonymous) return { ok: false, error: "Choose a demo identity first." };
  const now = nowISO();
  let value!: T;
  try {
    const next = produce(state.db, (draft) => {
      const ctx: Ctx = {
        actorId: actorId ?? "anonymous",
        now,
        audit: (e) => {
          const id = uid("au");
          draft.audit[id] = { id, at: now, actorId: e.actorId ?? actorId ?? "anonymous", outcome: e.outcome ?? "success", ...e } as AuditEvent;
        },
        notify: (n) => {
          const id = uid("n");
          draft.notifications[id] = { id, createdAt: now, ...n };
        },
        email: (e) => {
          const id = uid("em");
          draft.outbox[id] = { id, createdAt: now, status: "simulated", ...e };
        },
        fail: (reason) => {
          throw new ActionError(reason);
        },
      };
      value = recipe(draft, ctx);
    });
    if (next !== state.db) useDemoStore.setState({ db: next });
    return { ok: true, value };
  } catch (e) {
    if (e instanceof ActionError) return { ok: false, error: e.message };
    console.error(e);
    return { ok: false, error: "Something went wrong applying that change. Your data is unchanged." };
  }
}

/**
 * Record a denied attempt in the audit log without applying anything else.
 * Used when a permission check fails on a sensitive action (e.g. opening a
 * restricted document) so the attempt is still traceable.
 */
export function auditDenied(e: Omit<AuditEvent, "id" | "at" | "actorId" | "outcome">) {
  const s = useDemoStore.getState();
  if (!s.personaId) return;
  const id = uid("au");
  const ev: AuditEvent = { id, at: nowISO(), actorId: s.personaId, outcome: "denied", ...e };
  useDemoStore.setState({ db: { ...s.db, audit: { ...s.db.audit, [id]: ev } } });
}

/* ------------------------------------------------------------------ */
/* Session / demo controls                                             */
/* ------------------------------------------------------------------ */

export function setPersona(userId: ID | null) {
  useDemoStore.setState({ personaId: userId });
}

export async function resetDemo() {
  const clock = freshAnchor();
  setClockAnchor(clock);
  saveClock(clock.demoMs);
  useDemoStore.setState({ db: createSeedDatabase(), personaId: null, clock, seedVersion: SEED_VERSION, storageIssue: null });
  try {
    const { clearAllFiles } = await import("@/lib/files");
    await clearAllFiles();
  } catch {
    /* file store unavailable — nothing to clear */
  }
}

/** Clear a corrupt saved state and start fresh. */
export function recoverStorage() {
  safeStorage.removeItem(STORAGE_KEY);
  void resetDemo();
}

/* ------------------------------------------------------------------ */
/* Read hooks                                                          */
/* ------------------------------------------------------------------ */

/**
 * NOTE for components: select stable slices (db, db.x, personaId) and derive
 * lists with useMemo. Never return a freshly built array/object from a
 * selector — that re-renders forever.
 */
export const useDb = () => useDemoStore((s) => s.db);
export const usePersonaId = () => useDemoStore((s) => s.personaId);
export const useHydrated = () => useDemoStore((s) => s.hydrated);
export function useMe() {
  const db = useDb();
  const id = usePersonaId();
  return id ? db.users[id] ?? null : null;
}
