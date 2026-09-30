"use client";

import { useEffect } from "react";
import { MotionConfig } from "motion/react";
import { Toaster } from "sonner";
import { hydrateStore, STORAGE_KEY, useDemoStore } from "@/lib/store/store";
import { processDueReplies } from "@/lib/actions/messaging";
import { processSendingAnnouncements } from "@/lib/actions/comms";
import { StorageBanner } from "@/components/demo/storage-banner";
import { useUI } from "@/lib/store/ui";
import { saveClock } from "@/lib/clock";
import { TestHook } from "@/components/demo/test-hook";

/** Loads persisted demo state once, keeps tabs in sync and drives simulated async work. */
function StoreHydrator() {
  useEffect(() => {
    void hydrateStore();
    void useUI.persist.rehydrate();
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) void useDemoStore.persist.rehydrate();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  return null;
}

/** Bounded, deterministic simulations (scripted replies, announcement delivery). */
function SimulationTicker() {
  useEffect(() => {
    const t = window.setInterval(() => {
      processDueReplies();
      processSendingAnnouncements();
    }, 700);
    const c = window.setInterval(() => {
      if (useDemoStore.getState().hydrated) saveClock();
    }, 20000);
    const save = () => useDemoStore.getState().hydrated && saveClock();
    window.addEventListener("pagehide", save);
    return () => {
      window.clearInterval(t);
      window.clearInterval(c);
      window.removeEventListener("pagehide", save);
    };
  }, []);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <StoreHydrator />
      <SimulationTicker />
      <TestHook />
      <StorageBanner />
      {children}
      <Toaster
        position="bottom-right"
        closeButton
        toastOptions={{
          classNames: {
            toast: "!rounded-[12px] !border !border-line !bg-paper !text-void !shadow-float !font-sans",
            title: "!text-[14px] !font-medium",
            description: "!text-[13px] !text-muted",
          },
        }}
      />
    </MotionConfig>
  );
}
