"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { homeFor, isStaff } from "@/lib/domain/permissions";
import { useDb, useHydrated, useMe } from "@/lib/store/store";
import { Logo } from "@/components/brand/logo";
import { DemoControl } from "@/components/demo/demo-control";

/**
 * Public application layout: a clean white top bar (logo → home, "Save & exit")
 * over a fog canvas. The wizard registers a flush function so "Save & exit"
 * writes any pending edits before leaving.
 */
type Flush = () => boolean;
const FrameCtx = createContext<{ register: (fn: Flush | null) => void }>({ register: () => {} });

export function useRegisterSaveExit(flush: Flush | null) {
  const { register } = useContext(FrameCtx);
  useEffect(() => {
    register(flush);
    return () => register(null);
  }, [register, flush]);
}

export function ApplyFrame({ children }: { children: React.ReactNode }) {
  const flushRef = useRef<Flush | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const register = useCallback((fn: Flush | null) => {
    flushRef.current = fn;
    setHasDraft(!!fn);
  }, []);
  const db = useDb();
  const me = useMe();
  const hydrated = useHydrated();
  const router = useRouter();

  const exitHref = !me ? "/" : isStaff(db, me.id) ? homeFor(db, me.id) : "/applicant/dashboard";

  return (
    <FrameCtx.Provider value={{ register }}>
      <div className="flex min-h-dvh flex-col bg-fog">
        <header className="sticky top-0 z-40 border-b border-line bg-paper">
          <div className="mx-auto flex h-16 w-full max-w-[1240px] items-center gap-3 px-4 sm:px-6 lg:px-10">
            <Link href="/" aria-label="Launchpad Fellowship — home" className="shrink-0">
              <span className="sm:hidden">
                <Logo compact />
              </span>
              <span className="hidden sm:inline-flex">
                <Logo />
              </span>
            </Link>
            <span className="hidden h-6 w-px bg-line sm:block" aria-hidden />
            <span className="hidden text-[14px] text-muted sm:block">Application</span>
            <div className="flex-1" />
            {hydrated && (
              <Link
                href={exitHref}
                onClick={(e) => {
                  const flush = flushRef.current;
                  if (!flush) return;
                  e.preventDefault();
                  if (flush()) {
                    toast.success("Progress saved", { description: "Your draft is waiting for you — pick up where you left off any time." });
                    router.push(exitHref);
                  } else toast.error("We couldn't save your latest changes. Try “Save progress” before leaving.");
                }}
                className="inline-flex h-10 items-center gap-2 rounded-[8px] px-3 text-[14.5px] font-medium text-void transition-colors hover:bg-fog"
              >
                <LogOut className="size-4" aria-hidden />
                {hasDraft ? "Save & exit" : me ? "Exit to dashboard" : "Exit"}
              </Link>
            )}
          </div>
        </header>
        <main id="main" className="mx-auto w-full max-w-[1240px] flex-1 px-4 pb-28 pt-6 sm:px-6 sm:pt-8 lg:px-10 lg:pt-10">
          {children}
        </main>
      </div>
      <DemoControl />
    </FrameCtx.Provider>
  );
}
