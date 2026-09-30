"use client";

import { AlertCircle, ArrowRight, CheckCircle2, Lock } from "lucide-react";
import type { ApplicationSection } from "@/lib/domain/types";
import type { Issue } from "@/lib/domain/validation";
import { SECTION_LABEL } from "@/lib/domain/validation";
import { useDb } from "@/lib/store/store";
import { Panel, PanelHeader } from "@/components/ui/display";
import { AnswerSummary } from "./answer-summary";
import { fieldLabel } from "./answers";
import type { StepProps } from "./fields";

export function ReviewStep({
  p,
  allIssues,
  onEdit,
  onJump,
  mode,
}: {
  p: StepProps;
  allIssues: Issue[];
  onEdit: (s: ApplicationSection) => void;
  onJump: (issue: Issue) => void;
  mode: "draft" | "changes";
}) {
  const db = useDb();
  const bySection = allIssues.reduce<Partial<Record<ApplicationSection, Issue[]>>>((acc, i) => {
    (acc[i.section] ??= []).push(i);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <Panel id="review-issues" tabIndex={-1} className="outline-none sm:p-8" aria-live="polite">
        {allIssues.length === 0 ? (
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-leaf">
              <CheckCircle2 className="size-5 text-leaf-ink" aria-hidden />
            </span>
            <div>
              <h2 className="text-[17px] font-semibold tracking-[-0.01em]">{mode === "changes" ? "Ready to resubmit" : "Everything's ready to submit"}</h2>
              <p className="mt-0.5 text-[14.5px] leading-relaxed text-muted">
                {mode === "changes"
                  ? "Your updates will go back to the same reviewer under the same reference number."
                  : "Every required answer is complete. Give it one last read below, then submit when you're happy."}
              </p>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#ffe4e6]">
                <AlertCircle className="size-5 text-[#9f1239]" aria-hidden />
              </span>
              <div>
                <h2 className="text-[17px] font-semibold tracking-[-0.01em]">
                  {allIssues.length} {allIssues.length === 1 ? "thing" : "things"} to finish before you can submit
                </h2>
                <p className="mt-0.5 text-[14.5px] text-muted">Select an item to go straight to it.</p>
              </div>
            </div>
            <div className="mt-4 space-y-4">
              {(Object.keys(bySection) as ApplicationSection[]).map((s) => (
                <div key={s}>
                  <p className="eyebrow text-muted">{SECTION_LABEL[s]}</p>
                  <ul className="mt-1.5 space-y-1.5">
                    {bySection[s]!.map((i) => {
                      const locked = !p.canEdit(i.field);
                      return (
                        <li key={i.field + i.message}>
                          <button
                            type="button"
                            onClick={() => onJump(i)}
                            className="group flex w-full items-start gap-3 rounded-[12px] bg-[#fff5f6] px-3 py-2.5 text-left transition-colors hover:bg-[#ffe9ec]"
                          >
                            <span className="min-w-0 flex-1">
                              <span className="block text-[14px] font-medium text-[#8f0b21]">{fieldLabel(db, p.app, i.field)}</span>
                              <span className="block text-[13.5px] text-[#8f0b21]/85">{i.message}</span>
                              {locked && (
                                <span className="mt-1 flex items-center gap-1 text-[12.5px] text-muted">
                                  <Lock className="size-3" aria-hidden /> Locked — contact your program manager if this needs changing.
                                </span>
                              )}
                            </span>
                            <ArrowRight className="mt-1 size-4 shrink-0 text-[#8f0b21] transition-transform group-hover:translate-x-0.5" aria-hidden />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </Panel>

      <Panel className="sm:p-8">
        <PanelHeader title="Your answers" description={mode === "changes" ? "Highlighted items are the ones your reviewer asked about. Everything else stays as you submitted it." : "Use Edit to change anything before you submit."} />
        <AnswerSummary app={p.app} answers={p.view} onEdit={onEdit} requested={p.requested} />
      </Panel>
    </div>
  );
}
