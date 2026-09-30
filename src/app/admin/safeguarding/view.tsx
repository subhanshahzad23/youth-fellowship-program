"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  CircleDot,
  Download,
  Eye,
  EyeOff,
  Flag,
  Hourglass,
  MessagesSquare,
  ScanText,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import type { ID, MessageReport, ReportStatus } from "@/lib/domain/types";
import { hideMessage, resolveReport, restoreMessage, startReportReview } from "@/lib/actions/messaging";
import { adminCohortIds, canMessage, canModerate } from "@/lib/domain/permissions";
import { conversationTitle, messagesOf, userName } from "@/lib/domain/selectors";
import { MODERATION_RULES } from "@/lib/sim/moderation";
import { useNow } from "@/lib/hooks";
import { useDb, useDemoStore, useMe } from "@/lib/store/store";
import { useUI } from "@/lib/store/ui";
import { cn, fmtDateTime, sleep } from "@/lib/utils";
import { Button, ButtonLink } from "@/components/ui/button";
import { Badge, EmptyState, Notice, PageHeader, Panel, PanelHeader, type Tone } from "@/components/ui/display";
import { Field, RadioCards, Select, Textarea } from "@/components/ui/form";
import { DialogClose, DialogContent, DialogRoot, TabsContent, TabsList, TabsRoot, TabsTrigger } from "@/components/ui/overlay";
import { ThreadNotice, KindChip } from "@/components/messaging/bits";
import { ExportDialog } from "@/components/messaging/export-dialog";
import { buildTimeline, DaySeparator, MessageCluster } from "@/components/messaging/message-list";
import { relTime } from "@/components/messaging/lib";

const STATUS_META: Record<ReportStatus, { label: string; tone: Tone; Icon: typeof CircleDot }> = {
  open: { label: "Open", tone: "amber", Icon: CircleDot },
  in_review: { label: "In review", tone: "purple", Icon: Hourglass },
  resolved: { label: "Resolved", tone: "green", Icon: CheckCircle2 },
};

type Outcome = NonNullable<MessageReport["resolution"]>["outcome"];
const OUTCOMES: { value: Outcome; label: string; description: string }[] = [
  { value: "no_action", label: "No action needed", description: "The message is acceptable or it was a misunderstanding." },
  { value: "message_hidden", label: "Message hidden", description: "The message stays hidden from participants." },
  { value: "warning_sent", label: "Warning given", description: "You've spoken to or messaged the sender about expectations." },
  { value: "escalated", label: "Escalated", description: "Passed to the executive team or safeguarding lead to follow up." },
];
const OUTCOME_LABEL = Object.fromEntries(OUTCOMES.map((o) => [o.value, o.label])) as Record<Outcome, string>;

function StatusBadge({ status }: { status: ReportStatus }) {
  const { label, tone, Icon } = STATUS_META[status];
  return (
    <Badge tone={tone} icon={<Icon className="size-3.5" aria-hidden />}>
      {label}
    </Badge>
  );
}

export function SafeguardingView() {
  const db = useDb();
  const me = useMe()!;
  const now = useNow();
  const params = useSearchParams();
  const { adminCohortFilter, setAdminCohortFilter } = useUI();
  const scope = adminCohortIds(db, me.id);
  const cohortFilter = adminCohortFilter !== "all" && scope.includes(adminCohortFilter) ? adminCohortFilter : "all";

  const reports = useMemo(
    () =>
      Object.values(db.reports)
        .filter((r) => canModerate(db, me.id, r.cohortId).ok)
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    [db, me.id],
  );
  const visible = reports.filter((r) => cohortFilter === "all" || r.cohortId === cohortFilter);
  const counts: Record<ReportStatus, number> = { open: 0, in_review: 0, resolved: 0 };
  for (const r of visible) counts[r.status]++;

  const selectedId = params.get("r");
  const selected = selectedId ? db.reports[selectedId] : undefined;
  const decision = selected ? canModerate(db, me.id, selected.cohortId) : null;
  const [tabOverride, setTab] = useState<ReportStatus | null>(null);
  const tab: ReportStatus = tabOverride ?? (selected && decision?.ok ? selected.status : "open");

  let detail: React.ReactNode;
  if (!selectedId)
    detail = (
      <Panel className="hidden lg:block">
        <EmptyState
          icon={<ShieldCheck className="size-5" />}
          title={counts.open ? `${counts.open} report${counts.open === 1 ? "" : "s"} waiting for review` : "Nothing waiting for review"}
          description="Choose a report to see the flagged message in context, its history and the actions you can take."
        />
      </Panel>
    );
  else if (!selected)
    detail = (
      <Panel className="p-0 sm:p-0">
        <ThreadNotice kind="missing" title="We couldn't find that report" reason="It may have been removed, the link may be mistyped, or the demo data may have been reset." backHref="/admin/safeguarding" backLabel="Back to the queue" />
      </Panel>
    );
  else if (!decision?.ok)
    detail = (
      <Panel className="p-0 sm:p-0">
        <ThreadNotice kind="denied" title="This report is outside your scope" reason={decision && !decision.ok ? decision.reason : "Moderation is limited to admins for this cohort."} backHref="/admin/safeguarding" backLabel="Back to the queue" />
      </Panel>
    );
  else detail = <ReportDetail key={selected.id} report={selected} onStatus={setTab} />;

  return (
    <>
      <PageHeader
        eyebrow="Program admin"
        title="Safeguarding"
        description="Reports from participants and simple keyword flags in the cohorts you supervise. A person on the program team reviews every one."
        actions={
          <div className="w-[220px]">
            <label htmlFor="sg-cohort" className="sr-only">
              Cohort
            </label>
            <Select id="sg-cohort" value={cohortFilter} onChange={(e) => setAdminCohortFilter(e.target.value)} className="h-10 text-[14px]">
              <option value="all">All my cohorts ({scope.length})</option>
              {scope.map((id) => (
                <option key={id} value={id}>
                  {db.cohorts[id]?.name}
                </option>
              ))}
            </Select>
          </div>
        }
      />

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <div className={cn("min-w-0 space-y-4", selectedId && "hidden lg:block")}>
          <Panel className="overflow-hidden p-0 sm:p-0">
            <TabsRoot value={tab} onValueChange={(v) => setTab(v as ReportStatus)}>
              <TabsList aria-label="Report status" className="px-3">
                {(Object.keys(STATUS_META) as ReportStatus[]).map((s) => (
                  <TabsTrigger key={s} value={s}>
                    {STATUS_META[s].label}
                    <span className={cn("grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-semibold tabular", s === "open" && counts.open ? "bg-void text-paper" : "bg-fog")}>{counts[s]}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
              {(Object.keys(STATUS_META) as ReportStatus[]).map((s) => (
                <TabsContent key={s} value={s} className="focus-visible:outline-none">
                  <ReportList reports={visible.filter((r) => r.status === s)} selectedId={selectedId} now={now} status={s} />
                </TabsContent>
              ))}
            </TabsRoot>
          </Panel>
          <RulesPanel className="hidden lg:block" />
        </div>
        <div className="min-w-0 space-y-4">{detail}</div>
      </div>
      <RulesPanel className={cn("mt-4 lg:hidden", selectedId && "hidden")} />
    </>
  );
}

function ReportList({ reports, selectedId, now, status }: { reports: MessageReport[]; selectedId: string | null; now: string; status: ReportStatus }) {
  const db = useDb();
  if (!reports.length)
    return (
      <p className="px-5 py-10 text-center text-[14px] text-muted">
        {status === "open" ? "No open reports. New reports and keyword flags appear here." : status === "in_review" ? "Nothing in review right now." : "No resolved reports yet."}
      </p>
    );
  return (
    <ul className="flex flex-col gap-0.5 p-2">
      {reports.map((r) => {
        const msg = db.messages[r.messageId];
        const conv = db.conversations[r.conversationId];
        const active = r.id === selectedId;
        return (
          <li key={r.id}>
            <Link
              href={`/admin/safeguarding?r=${r.id}`}
              scroll={false}
              aria-current={active ? "true" : undefined}
              className={cn("relative block rounded-[14px] px-3 py-3 transition-colors", active ? "bg-fog" : "hover:bg-[#f7f7f7]")}
            >
              {active && <span className="absolute bottom-3 left-0 top-3 w-[3px] rounded-full bg-jade" aria-hidden />}
              <span className="flex items-start gap-2.5">
                <span className={cn("mt-0.5 grid size-8 shrink-0 place-items-center rounded-full", r.source === "keyword_rule" && !r.reporterId ? "bg-[#ffe4e6] text-[#9f1239]" : "bg-[#fff1cc] text-[#7a4b00]")}>
                  {r.source === "keyword_rule" && !r.reporterId ? <ScanText className="size-4" aria-hidden /> : <Flag className="size-4" aria-hidden />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-[14.5px] font-semibold">{r.reason}</span>
                    <span className="shrink-0 text-[12px] text-muted">{relTime(r.createdAt, now)}</span>
                  </span>
                  <span className="mt-0.5 line-clamp-2 text-[13px] text-ink">
                    {msg ? `${db.users[msg.senderId]?.firstName ?? "Someone"}: ${msg.body}` : "Message no longer available"}
                  </span>
                  <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-muted">
                    <span>{r.reporterId ? `Reported by ${userName(db, r.reporterId)}` : "Keyword rule"}</span>
                    <span aria-hidden>·</span>
                    <span>{db.cohorts[r.cohortId]?.name}</span>
                    {conv && (
                      <>
                        <span aria-hidden>·</span>
                        <span className="truncate">{conversationTitle(db, conv, null)}</span>
                      </>
                    )}
                    {msg?.hidden && (
                      <span className="inline-flex items-center gap-1 text-[#7a4b00]">
                        <EyeOff className="size-3" aria-hidden /> Hidden
                      </span>
                    )}
                  </span>
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function RulesPanel({ className }: { className?: string }) {
  return (
    <Panel className={className} aria-labelledby="rules-h">
      <PanelHeader title={<span id="rules-h">How automatic flags work</span>} description="Simple keyword rules, not AI moderation. A human always decides." />
      <ul className="space-y-3">
        {MODERATION_RULES.map((r) => (
          <li key={r.id} className="rounded-[12px] bg-fog p-3">
            <p className="flex items-center gap-2 text-[14.5px] font-semibold">
              <ScanText className="size-4 text-[#9f1239]" aria-hidden /> {r.label}
            </p>
            <p className="mt-0.5 text-[13.5px] text-ink">{r.description}</p>
            <p className="mt-2 text-[12px] text-muted">
              Pattern: <code className="break-all rounded-[6px] bg-paper px-1.5 py-0.5 font-mono text-[11.5px] text-ink">{r.pattern.source}</code>
            </p>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[13px] leading-relaxed text-muted">
        Rules only look for specific words and number patterns, so they miss things and sometimes flag harmless messages. A flag never hides anything by itself — it adds the message to this queue for a person to review. Fellows are told that program staff can review conversations.
      </p>
    </Panel>
  );
}

type DialogKind = "hide" | "restore" | "resolve" | "export" | null;

function ReportDetail({ report, onStatus }: { report: MessageReport; onStatus: (s: ReportStatus) => void }) {
  const db = useDb();
  const me = useMe()!;
  const now = useNow();
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [starting, setStarting] = useState(false);
  const conv = db.conversations[report.conversationId];
  const msg = db.messages[report.messageId];
  const sender = msg ? db.users[msg.senderId] : undefined;
  const canContactSender = !!sender && canMessage(db, me.id, sender.id).ok;
  const rule = msg?.autoFlag ? MODERATION_RULES.find((x) => x.id === msg.autoFlag!.rule) : undefined;

  const context = useMemo(() => {
    if (!conv || !msg) return null;
    const all = messagesOf(db, conv.id);
    const i = all.findIndex((m) => m.id === msg.id);
    const from = Math.max(0, i - 3);
    const slice = all.slice(from, i + 4);
    return { timeline: buildTimeline(slice, now), before: from, after: Math.max(0, all.length - (i + 4)) };
  }, [db, conv, msg, now]);

  const refreshStatus = () => {
    const st = useDemoStore.getState().db.reports[report.id]?.status;
    if (st) onStatus(st);
  };

  const startReview = async () => {
    setStarting(true);
    await sleep(400);
    const r = startReportReview(report.id);
    setStarting(false);
    if (!r.ok) return toast.error(r.error);
    toast.success("Review started", { description: "You're now assigned to this report." });
    refreshStatus();
  };

  if (!conv || !msg)
    return (
      <Panel>
        <ThreadNotice kind="missing" title="The reported message is no longer available" reason="The conversation or message may have been removed from the demo data." backHref="/admin/safeguarding" backLabel="Back to the queue" />
      </Panel>
    );

  return (
    <>
      <Panel>
        <Link href="/admin/safeguarding" scroll={false} className="-ml-1 mb-3 inline-flex h-10 items-center gap-2 rounded-[8px] px-1 text-[14px] font-medium hover:bg-fog lg:hidden">
          <ArrowLeft className="size-4" aria-hidden /> Back to the queue
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="eyebrow text-muted">
              {db.cohorts[report.cohortId]?.name} · {report.reporterId ? "Participant report" : "Keyword flag"}
            </p>
            <h2 className="mt-1 font-display text-[30px] leading-[1.1] tracking-[-0.03em]">{report.reason}</h2>
          </div>
          <StatusBadge status={report.status} />
        </div>

        <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 text-[14px] sm:grid-cols-2">
          <div>
            <dt className="text-[12.5px] text-muted">Source</dt>
            <dd className="mt-0.5 flex items-center gap-1.5">
              {report.reporterId ? (
                <>
                  <UserRound className="size-4 text-muted" aria-hidden /> Reported by {userName(db, report.reporterId)}
                  {rule && <span className="text-muted">· also keyword rule</span>}
                </>
              ) : (
                <>
                  <ScanText className="size-4 text-[#9f1239]" aria-hidden /> Keyword rule{rule ? ` — ${rule.label}` : ""}
                </>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-[12.5px] text-muted">Conversation</dt>
            <dd className="mt-0.5 flex flex-wrap items-center gap-2">
              {conversationTitle(db, conv, null)} <KindChip kind={conv.kind} />
            </dd>
          </div>
          <div>
            <dt className="text-[12.5px] text-muted">Reported</dt>
            <dd className="mt-0.5">{fmtDateTime(report.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-[12.5px] text-muted">Assigned to</dt>
            <dd className="mt-0.5">{report.assignedToId ? userName(db, report.assignedToId) : <span className="text-muted">Nobody yet</span>}</dd>
          </div>
        </dl>

        {report.details && (
          <blockquote className="mt-4 rounded-[12px] bg-fog px-4 py-3 text-[14.5px] leading-relaxed">
            <p className="mb-1 text-[12.5px] font-medium text-muted">{report.reporterId ? `${db.users[report.reporterId]?.firstName ?? "The reporter"} added` : "Rule details"}</p>
            {report.details}
          </blockquote>
        )}

        {report.resolution && (
          <Notice className="mt-4" tone="green" icon={<CheckCircle2 className="size-4 text-leaf-ink" />} title={`Resolved · ${OUTCOME_LABEL[report.resolution.outcome]}`}>
            {report.resolution.note}
            <span className="mt-1 block text-[12.5px] text-muted">
              {userName(db, report.resolution.byId)} · {fmtDateTime(report.resolution.at)}
            </span>
          </Notice>
        )}

        <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
          {report.status === "open" && (
            <Button variant="dark" loading={starting} icon={<Hourglass className="size-4" />} onClick={startReview}>
              Start review
            </Button>
          )}
          {report.status !== "resolved" && (
            <Button variant={report.status === "open" ? "outline" : "primary"} icon={<CheckCircle2 className="size-4" />} onClick={() => setDialog("resolve")}>
              Resolve
            </Button>
          )}
          {msg.hidden ? (
            <Button variant="outline" icon={<Eye className="size-4" />} onClick={() => setDialog("restore")}>
              Restore message
            </Button>
          ) : (
            <Button variant="outline" icon={<EyeOff className="size-4" />} onClick={() => setDialog("hide")}>
              Hide message
            </Button>
          )}
          <ButtonLink href={`/admin/messages?view=supervision&c=${conv.id}`} variant="ghost" icon={<MessagesSquare className="size-4" />}>
            Open conversation
          </ButtonLink>
          <Button variant="ghost" icon={<Download className="size-4" />} onClick={() => setDialog("export")}>
            Export
          </Button>
          {canContactSender && sender && (
            <ButtonLink href={`/admin/messages?view=mine&to=${sender.id}`} variant="ghost" icon={<UserRound className="size-4" />}>
              Message {sender.firstName}
            </ButtonLink>
          )}
        </div>
      </Panel>

      <Panel aria-labelledby="ctx-h">
        <PanelHeader
          title={<span id="ctx-h">Flagged message in context</span>}
          description={
            !context || (!context.before && !context.after)
              ? "Showing the whole conversation."
              : `Up to three messages either side.${context.before ? ` ${context.before} earlier` : ""}${context.before && context.after ? " and" : ""}${context.after ? ` ${context.after} later` : ""} not shown.`
          }
          actions={
            <Link href={`/admin/messages?view=supervision&c=${conv.id}`} className="text-[13.5px] font-medium underline-offset-2 hover:underline">
              Full conversation
            </Link>
          }
        />
        <div className="rounded-[14px] border border-line px-3 py-2 sm:px-4">
          <AnimatePresence initial={false}>
            {context?.timeline.map((item) =>
              item.type === "day" ? <DaySeparator key={item.key} label={item.label} /> : <MessageCluster key={item.key} db={db} conv={conv} viewerId={me.id} mode="supervisor" messages={item.messages} highlightId={msg.id} />,
            )}
          </AnimatePresence>
        </div>
        <p className="mt-2 text-[12.5px] text-muted">
          {msg.hidden ? "Participants see “This message was hidden by the program team” in place of this message." : "Participants currently see this message as written."} Viewing here doesn&apos;t change read receipts.
        </p>
      </Panel>

      <Panel aria-labelledby="hist-h">
        <PanelHeader title={<span id="hist-h">History</span>} description="Every step is also written to the audit log." />
        <ol className="relative ml-2 space-y-4 border-l-[1.5px] border-line pl-5">
          {report.history.map((h, i) => (
            <li key={i} className="relative">
              <span className={cn("absolute -left-[27px] top-1 size-3 rounded-full ring-4 ring-paper", h.byId ? "bg-void" : "bg-[#e11d48]")} aria-hidden />
              <p className="text-[14.5px] font-medium">{h.action}</p>
              <p className="text-[12.5px] text-muted">
                {h.byId ? userName(db, h.byId) : "Automatic keyword rule"} · {fmtDateTime(h.at)}
              </p>
              {h.note && <p className="mt-1 rounded-[10px] bg-fog px-3 py-2 text-[13.5px]">{h.note}</p>}
            </li>
          ))}
        </ol>
      </Panel>

      {dialog === "hide" && (
        <NoteDialog
          title="Hide this message"
          description="Participants will see “This message was hidden by the program team”. The original stays in the record for supervisors and exports."
          label="Reason for hiding"
          hint="Recorded on the report and in the audit log."
          quick={["Insulting language toward another fellow.", "Shared personal contact details to move the conversation off-platform.", "Not appropriate for the fellowship community."]}
          confirmLabel="Hide message"
          confirmVariant="danger"
          required
          onClose={() => setDialog(null)}
          onSubmit={(note) => {
            const r = hideMessage(msg.id, note, report.id);
            if (r.ok) {
              toast.success("Message hidden", { description: "Participants now see a placeholder." });
              refreshStatus();
            }
            return r;
          }}
        />
      )}
      {dialog === "restore" && (
        <NoteDialog
          title="Restore this message"
          description="Participants will see the original message again."
          label="Note for the record"
          hint="Why is it OK to show this message again?"
          quick={["Reviewed with context — the message is acceptable.", "Hidden by mistake."]}
          confirmLabel="Restore message"
          confirmVariant="dark"
          required
          onClose={() => setDialog(null)}
          onSubmit={(note) => {
            const r = restoreMessage(msg.id, note);
            if (r.ok) toast.success("Message restored", { description: "Participants can see it again." });
            return r;
          }}
        />
      )}
      {dialog === "resolve" && (
        <ResolveDialog
          report={report}
          defaultOutcome={msg.hidden ? "message_hidden" : "no_action"}
          onClose={() => setDialog(null)}
          onResolved={() => {
            onStatus("resolved");
          }}
        />
      )}
      {dialog === "export" && <ExportDialog open onOpenChange={(v) => !v && setDialog(null)} convIds={[conv.id]} />}
    </>
  );
}

function NoteDialog({
  title,
  description,
  label,
  hint,
  quick,
  confirmLabel,
  confirmVariant,
  required,
  onSubmit,
  onClose,
}: {
  title: string;
  description: string;
  label: string;
  hint?: string;
  quick?: string[];
  confirmLabel: string;
  confirmVariant: "danger" | "dark" | "primary";
  required?: boolean;
  onSubmit: (note: string) => { ok: true } | { ok: false; error: string };
  onClose: () => void;
}) {
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (required && !note.trim()) {
      setError("Add a short note — it's kept on the record.");
      return;
    }
    setBusy(true);
    await sleep(450);
    const r = onSubmit(note);
    setBusy(false);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    onClose();
  };
  return (
    <DialogRoot open onOpenChange={(v) => !v && !busy && onClose()}>
      <DialogContent
        title={title}
        description={description}
        size="md"
        footer={
          <>
            <DialogClose asChild>
              <Button variant="ghost" disabled={busy}>
                Cancel
              </Button>
            </DialogClose>
            <Button variant={confirmVariant} loading={busy} onClick={submit}>
              {confirmLabel}
            </Button>
          </>
        }
      >
        <Field label={label} hint={hint} required={required} error={error ?? undefined} htmlFor="sg-note">
          <Textarea
            id="sg-note"
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              setError(null);
            }}
            maxLength={500}
            className="min-h-[100px]"
            aria-invalid={!!error || undefined}
          />
        </Field>
        {quick && (
          <div className="mt-3 flex flex-wrap gap-2">
            {quick.map((q) => (
              <button key={q} type="button" onClick={() => setNote(q)} className="rounded-full border border-line px-3 py-1.5 text-left text-[13px] hover:border-void">
                {q}
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </DialogRoot>
  );
}

function ResolveDialog({ report, defaultOutcome, onClose, onResolved }: { report: MessageReport; defaultOutcome: Outcome; onClose: () => void; onResolved: () => void }) {
  const db = useDb();
  const [outcome, setOutcome] = useState<Outcome>(defaultOutcome);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!note.trim()) {
      setError("Add a short resolution note for the record.");
      return;
    }
    setBusy(true);
    await sleep(500);
    const r = resolveReport(report.id as ID, outcome, note);
    setBusy(false);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    toast.success("Report resolved", { description: report.reporterId ? `${db.users[report.reporterId]?.firstName ?? "The reporter"} has been told it was reviewed.` : "The outcome is on the record." });
    onResolved();
    onClose();
  };
  return (
    <DialogRoot open onOpenChange={(v) => !v && !busy && onClose()}>
      <DialogContent
        title="Resolve report"
        description="Records the outcome on the report and in the audit log."
        size="md"
        footer={
          <>
            <DialogClose asChild>
              <Button variant="ghost" disabled={busy}>
                Cancel
              </Button>
            </DialogClose>
            <Button loading={busy} onClick={submit} icon={<CheckCircle2 className="size-4" />}>
              Resolve report
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <fieldset>
            <legend className="mb-2 text-[14.5px] font-medium">Outcome</legend>
            <RadioCards name="outcome" columns={2} value={outcome} onChange={setOutcome} options={OUTCOMES.map((o) => ({ value: o.value, label: o.label, description: o.description }))} />
          </fieldset>
          <Field label="Resolution note" required error={error ?? undefined} htmlFor="sg-resolve-note" hint="What you decided and why. Kept on the record.">
            <Textarea
              id="sg-resolve-note"
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                setError(null);
              }}
              maxLength={500}
              className="min-h-[100px]"
              aria-invalid={!!error || undefined}
            />
          </Field>
          <Notice tone="neutral">
            {report.reporterId ? `${db.users[report.reporterId]?.firstName ?? "The reporter"} gets an in-app notice that their report was reviewed. ` : ""}
            Choosing an outcome doesn&apos;t message anyone else automatically — contact the people involved yourself if needed.
          </Notice>
        </div>
      </DialogContent>
    </DialogRoot>
  );
}
