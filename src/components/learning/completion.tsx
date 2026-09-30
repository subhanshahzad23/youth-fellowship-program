"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, LayoutList, Undo2 } from "lucide-react";
import { toast } from "sonner";
import type { Module, Session } from "@/lib/domain/types";
import { markSessionComplete, markSessionIncomplete } from "@/lib/actions/learning";
import { moduleProgress } from "@/lib/domain/selectors";
import { useNow } from "@/lib/hooks";
import { useDb, useMe } from "@/lib/store/store";
import { fmtRelative, sleep } from "@/lib/utils";
import { Button, ButtonLink } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/display";
import { KindIcon } from "./meta";

const EASE = [0.23, 1, 0.32, 1] as const;

/**
 * "Mark complete" for reading and video sessions. Completing shows a small,
 * celebratory check and the module progress bar filling in.
 */
export function CompletionCard({ session, module, next }: { session: Session; module: Module; next?: { module: Module; session: Session } }) {
  const db = useDb();
  const me = useMe()!;
  const now = useNow();
  const completion = Object.values(db.completions).find((c) => c.userId === me.id && c.sessionId === session.id);
  const done = !!completion;
  const progress = moduleProgress(db, me.id, module.id);
  const [busy, setBusy] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  async function complete() {
    setBusy(true);
    await sleep(280);
    const r = markSessionComplete(session.id);
    setBusy(false);
    if (!r.ok) {
      toast.error(r.error);
      return;
    }
    setCelebrate(true);
    toast.success("Session complete", { description: `${module.title}: ${progress.done + 1} of ${progress.total} done.` });
  }

  async function undo() {
    setBusy(true);
    await sleep(200);
    const r = markSessionIncomplete(session.id);
    setBusy(false);
    setCelebrate(false);
    if (!r.ok) toast.error(r.error);
    else toast("Marked as not complete");
  }

  return (
    <div className="mt-12 rounded-[20px] bg-fog p-5 sm:p-6" aria-live="polite">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="relative grid size-14 shrink-0 place-items-center">
          <AnimatePresence>
            {celebrate && done && (
              <motion.span
                key="burst"
                className="absolute inset-0 rounded-full bg-jade"
                initial={{ scale: 0.8, opacity: 0.5 }}
                animate={{ scale: 1.9, opacity: 0 }}
                transition={{ duration: 0.6, ease: EASE }}
                aria-hidden
              />
            )}
          </AnimatePresence>
          <motion.span
            key={done ? "done" : "todo"}
            initial={celebrate && done ? { scale: 0.5, opacity: 0 } : false}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.24, ease: EASE }}
            className={done ? "grid size-14 place-items-center rounded-full bg-jade text-void" : "grid size-14 place-items-center rounded-full bg-paper text-muted ring-[1.5px] ring-line"}
          >
            {done ? <Check className="size-7" strokeWidth={3} aria-hidden /> : <KindIcon kind={session.kind} className="size-6" />}
          </motion.span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[16px] font-semibold text-void">{done ? "You finished this session" : "Finished this session?"}</p>
          <p className="mt-0.5 text-[14px] text-muted">
            {done ? `Marked complete ${fmtRelative(completion!.completedAt, now)}.` : "Mark it complete to track your progress through the module."}
          </p>
          <div className="mt-3 max-w-sm">
            <div className="mb-1 flex items-center justify-between text-[12.5px] text-muted">
              <span className="truncate">
                Module {module.order} · {module.title}
              </span>
              <span className="tabular">
                {progress.done}/{progress.total}
              </span>
            </div>
            <ProgressBar value={progress.pct} className="h-1.5" label={`${module.title} progress`} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end">
          {done ? (
            <>
              {next && (
                <ButtonLink href={`/workspace/learning/${next.module.id}/${next.session.id}`} arrow>
                  Next session
                </ButtonLink>
              )}
              <Button variant="ghost" size="sm" icon={<Undo2 className="size-4" />} onClick={() => void undo()} disabled={busy}>
                Mark as not complete
              </Button>
            </>
          ) : (
            <Button icon={<CheckCircle2 className="size-4" />} onClick={() => void complete()} loading={busy} size="lg">
              Mark complete
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Previous / next session across modules in the fellow's track. */
export function SessionPager({ prev, next }: { prev?: { module: Module; session: Session }; next?: { module: Module; session: Session } }) {
  const card = (item: { module: Module; session: Session }, dir: "prev" | "next") => (
    <Link
      href={`/workspace/learning/${item.module.id}/${item.session.id}`}
      className={`group flex min-h-[88px] flex-1 items-center gap-3 rounded-[16px] bg-paper p-4 transition-colors hover:bg-[#fafafa] ${dir === "next" ? "justify-end text-right" : ""}`}
    >
      {dir === "prev" && <ArrowLeft className="size-5 shrink-0 transition-transform duration-200 group-hover:-translate-x-0.5" aria-hidden />}
      <span className="min-w-0">
        <span className="eyebrow block text-muted">{dir === "prev" ? "Previous" : "Next"} · Module {item.module.order}</span>
        <span className="mt-1 line-clamp-2 block text-[15px] font-medium text-void">{item.session.published?.title}</span>
      </span>
      {dir === "next" && <ArrowRight className="size-5 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />}
    </Link>
  );
  return (
    <nav aria-label="Session navigation" className="mt-4 flex flex-col gap-3 sm:flex-row">
      {prev ? card(prev, "prev") : <div className="hidden flex-1 sm:block" />}
      {next ? (
        card(next, "next")
      ) : (
        <Link href="/workspace/learning" className="group flex min-h-[88px] flex-1 items-center justify-end gap-3 rounded-[16px] bg-paper p-4 text-right hover:bg-[#fafafa]">
          <span>
            <span className="eyebrow block text-muted">End of track</span>
            <span className="mt-1 block text-[15px] font-medium">Back to all modules</span>
          </span>
          <LayoutList className="size-5" aria-hidden />
        </Link>
      )}
    </nav>
  );
}
