"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Flag } from "lucide-react";
import type { Message } from "@/lib/domain/types";
import { reportMessage } from "@/lib/actions/messaging";
import { useDb } from "@/lib/store/store";
import { sleep } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/display";
import { Field, RadioCards, Textarea } from "@/components/ui/form";
import { DialogClose, DialogContent, DialogRoot } from "@/components/ui/overlay";
import { REPORT_REASONS } from "./lib";

type Reason = (typeof REPORT_REASONS)[number]["value"];

export function ReportDialog({ message, open, onOpenChange }: { message: Message; open: boolean; onOpenChange: (v: boolean) => void }) {
  const db = useDb();
  const [reason, setReason] = useState<Reason | undefined>();
  const [details, setDetails] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const sender = db.users[message.senderId];
  const cohort = db.cohorts[db.conversations[message.conversationId]?.cohortId ?? ""];

  const submit = async () => {
    if (!reason) {
      setError("Choose the reason that fits best.");
      return;
    }
    if (reason === "Something else" && !details.trim()) {
      setError("Tell the program team a little about what happened.");
      return;
    }
    setBusy(true);
    await sleep(450);
    const r = reportMessage(message.id, reason, details);
    setBusy(false);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    toast.success("Report sent to the program team", { description: "Thank you for speaking up. Someone will review it." });
    onOpenChange(false);
    setReason(undefined);
    setDetails("");
    setError(null);
  };

  return (
    <DialogRoot open={open} onOpenChange={(v) => !busy && onOpenChange(v)}>
      <DialogContent
        title="Report this message"
        description={`Reports go to the ${cohort?.name ?? "cohort"} program team, who review them and decide what to do.`}
        size="md"
        footer={
          <>
            <DialogClose asChild>
              <Button variant="ghost" disabled={busy}>
                Cancel
              </Button>
            </DialogClose>
            <Button variant="dark" loading={busy} icon={<Flag className="size-4" />} onClick={submit}>
              Send report
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <blockquote className="rounded-[12px] bg-fog px-4 py-3 text-[14.5px] leading-relaxed">
            <p className="mb-1 text-[12.5px] font-medium text-muted">{sender?.name ?? "Former member"} wrote</p>
            <p className="line-clamp-4 whitespace-pre-wrap">{message.body || "(attachment only)"}</p>
          </blockquote>
          <fieldset>
            <legend className="mb-2 text-[14.5px] font-medium">
              What&apos;s wrong with this message?<span className="ml-0.5 text-[#c8102e]" aria-hidden>*</span>
            </legend>
            <RadioCards
              name="report-reason"
              columns={1}
              value={reason}
              invalid={!!error && !reason}
              onChange={(v) => {
                setReason(v);
                setError(null);
              }}
              options={REPORT_REASONS.map((r) => ({ value: r.value, label: r.value, description: r.description }))}
            />
          </fieldset>
          <Field label="Anything else the program team should know?" optional={reason !== "Something else"} required={reason === "Something else"} htmlFor="report-details">
            <Textarea id="report-details" value={details} onChange={(e) => setDetails(e.target.value)} maxLength={1000} className="min-h-[96px]" placeholder="What happened, and how it made you feel." />
          </Field>
          {error && (
            <p role="alert" className="text-[13.5px] text-[#b00d28]">
              {error}
            </p>
          )}
          <Notice tone="neutral">
            {sender?.firstName ?? "The sender"} isn&apos;t notified by the platform when you report. If anyone is in immediate danger, contact emergency services first, then tell a trusted adult or your program manager.
          </Notice>
        </div>
      </DialogContent>
    </DialogRoot>
  );
}
