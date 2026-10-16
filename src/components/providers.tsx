"use client";

import { useEffect } from "react";
import { MotionConfig } from "motion/react";
import { Toaster } from "sonner";
import { useLeads } from "@/lib/leads";

/** Loads persisted concept state (simulated bookings / messages) after hydration. */
function Hydrator() {
  useEffect(() => {
    void useLeads.persist.rehydrate();
  }, []);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <Hydrator />
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
