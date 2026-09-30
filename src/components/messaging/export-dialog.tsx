"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { CheckCircle2, Download, FileJson, FileSpreadsheet, History, Printer } from "lucide-react";
import type { ID } from "@/lib/domain/types";
import { exportConversations, type ExportFormat } from "@/lib/actions/messaging";
import { canModerate, canViewAuditEvent } from "@/lib/domain/permissions";
import { messagesOf, userName } from "@/lib/domain/selectors";
import { nowISO } from "@/lib/clock";
import { downloadBlob } from "@/lib/files";
import { useDb, useMe } from "@/lib/store/store";
import { fmtDateTime, sleep } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/display";
import { RadioCards } from "@/components/ui/form";
import { DialogClose, DialogContent, DialogRoot } from "@/components/ui/overlay";

const FORMATS: { value: ExportFormat; label: React.ReactNode; description: string }[] = [
  {
    value: "html",
    label: (
      <span className="inline-flex items-center gap-2">
        <Printer className="size-4" aria-hidden /> Printable transcript
      </span>
    ),
    description: "An HTML page you can read, print or save as PDF.",
  },
  {
    value: "csv",
    label: (
      <span className="inline-flex items-center gap-2">
        <FileSpreadsheet className="size-4" aria-hidden /> Spreadsheet (CSV)
      </span>
    ),
    description: "One row per message, for sorting and filtering.",
  },
  {
    value: "json",
    label: (
      <span className="inline-flex items-center gap-2">
        <FileJson className="size-4" aria-hidden /> Structured data (JSON)
      </span>
    ),
    description: "The complete record, including moderation metadata.",
  },
];

/** Scoped conversation export with a visible summary of what's included. Every export is written to the audit log. */
export function ExportDialog({ open, onOpenChange, convIds }: { open: boolean; onOpenChange: (v: boolean) => void; convIds: ID[] }) {
  const db = useDb();
  const me = useMe()!;
  const [format, setFormat] = useState<ExportFormat>("html");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ fileName: string; at: string } | null>(null);

  const summary = useMemo(() => {
    const inScope = convIds.filter((id) => db.conversations[id] && canModerate(db, me.id, db.conversations[id].cohortId).ok);
    const msgs = inScope.flatMap((id) => messagesOf(db, id));
    return {
      conversations: inScope.length,
      outOfScope: convIds.length - inScope.length,
      messages: msgs.length,
      hidden: msgs.filter((m) => m.hidden).length,
      flagged: msgs.filter((m) => m.autoFlag).length,
      cohorts: [...new Set(inScope.map((id) => db.cohorts[db.conversations[id].cohortId]?.name))].filter(Boolean).join(", "),
    };
  }, [db, convIds, me.id]);

  const recent = useMemo(
    () =>
      Object.values(db.audit)
        .filter((e) => e.action === "export.conversations" && canViewAuditEvent(db, me.id, e.cohortId))
        .sort((a, b) => (a.at < b.at ? 1 : -1))
        .slice(0, 3),
    [db, me.id],
  );

  const run = async () => {
    setBusy(true);
    await sleep(550);
    const r = exportConversations(convIds, format);
    setBusy(false);
    if (!r.ok) {
      toast.error(r.error);
      return;
    }
    downloadBlob(r.content, r.fileName, r.mime);
    setDone({ fileName: r.fileName, at: nowISO() });
    toast.success("Export downloaded", { description: `${r.fileName} · recorded in the audit log` });
  };

  return (
    <DialogRoot open={open} onOpenChange={(v) => !busy && onOpenChange(v)}>
      <DialogContent
        title={summary.conversations === 1 ? "Export conversation" : `Export ${summary.conversations} conversations`}
        description="Creates a supervised record for safeguarding. The download happens in this browser; nothing is sent anywhere."
        size="md"
        footer={
          <>
            <DialogClose asChild>
              <Button variant="ghost" disabled={busy}>
                {done ? "Close" : "Cancel"}
              </Button>
            </DialogClose>
            <Button variant="dark" loading={busy} disabled={!summary.conversations} icon={<Download className="size-4" />} onClick={run}>
              {done ? "Download again" : "Download export"}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-[14px] bg-fog p-4 text-[14px] sm:grid-cols-3">
            <div>
              <dt className="text-[12.5px] text-muted">Conversations</dt>
              <dd className="font-display text-[26px] leading-tight tabular">{summary.conversations}</dd>
            </div>
            <div>
              <dt className="text-[12.5px] text-muted">Messages</dt>
              <dd className="font-display text-[26px] leading-tight tabular">{summary.messages}</dd>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <dt className="text-[12.5px] text-muted">Scope</dt>
              <dd className="mt-1 font-medium">{summary.cohorts || "—"}</dd>
            </div>
            <div className="col-span-2 sm:col-span-3">
              <dt className="sr-only">Details</dt>
              <dd className="text-[13px] leading-relaxed text-ink">
                Includes {summary.hidden} hidden message{summary.hidden === 1 ? "" : "s"} (original text, with who hid it and why) and {summary.flagged} keyword flag{summary.flagged === 1 ? "" : "s"}. Generated by {me.name}
                {me.title ? ` (${me.title})` : ""}; timestamps are UTC.
              </dd>
            </div>
          </dl>
          {summary.outOfScope > 0 && <Notice tone="amber">{summary.outOfScope} selected conversation(s) are outside your supervision scope and will be left out.</Notice>}
          <fieldset>
            <legend className="mb-2 text-[14.5px] font-medium">Format</legend>
            <RadioCards name="export-format" columns={1} value={format} onChange={setFormat} options={FORMATS} />
          </fieldset>
          {done ? (
            <Notice tone="green" icon={<CheckCircle2 className="size-4 text-leaf-ink" />} title={`Downloaded ${done.fileName}`}>
              Recorded in the audit log at {fmtDateTime(done.at)} UTC with your name, the format and the scope.{" "}
              <Link href="/admin/audit" className="font-medium underline underline-offset-2">
                View audit log
              </Link>
            </Notice>
          ) : (
            <p className="flex items-start gap-2 text-[13.5px] text-muted">
              <History className="mt-0.5 size-4 shrink-0" aria-hidden />
              Each export is recorded in the audit log with your name, the time, the format and the cohorts included.
            </p>
          )}
          {recent.length > 0 && (
            <div>
              <p className="eyebrow mb-2 text-muted">Recent exports</p>
              <ul className="divide-y divide-line rounded-[12px] border border-line">
                {recent.map((e) => (
                  <li key={e.id} className="px-3 py-2.5 text-[13.5px]">
                    <p className="font-medium">{e.summary}</p>
                    <p className="text-[12.5px] text-muted">
                      {userName(db, e.actorId)} · {fmtDateTime(e.at)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </DialogContent>
    </DialogRoot>
  );
}
