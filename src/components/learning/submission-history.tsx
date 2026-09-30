"use client";

import { useState } from "react";
import { CheckCircle2, ChevronDown, FileX, MessageSquareText, RotateCcw, Send } from "lucide-react";
import type { DocumentRecord, ID, Submission, SubmissionFeedback, SubmissionVersion } from "@/lib/domain/types";
import { useNow } from "@/lib/hooks";
import { useDb } from "@/lib/store/store";
import { cn, fmtDateTime, fmtRelative } from "@/lib/utils";
import { Avatar, Badge } from "@/components/ui/display";
import { DocumentRow } from "@/components/ui/files";

/** Attachment list that is honest about files the owner has since removed. */
export function AttachmentList({ ids, emptyLabel }: { ids: ID[]; emptyLabel?: string }) {
  const db = useDb();
  const docs = ids.map((id) => db.documents[id]).filter((d): d is DocumentRecord => !!d);
  if (!docs.length) return emptyLabel ? <p className="text-[13.5px] text-muted">{emptyLabel}</p> : null;
  return (
    <ul className="m-0 list-none space-y-2 p-0">
      {docs.map((d) =>
        d.removedAt ? (
          <li key={d.id} className="m-0 flex items-center gap-3 rounded-[12px] border-[1.5px] border-dashed border-line px-3 py-2.5 text-[13.5px] text-muted">
            <FileX className="size-4 shrink-0" aria-hidden />
            <span className="min-w-0 flex-1 truncate">{d.name}</span>
            <span className="shrink-0">Removed by the fellow</span>
          </li>
        ) : (
          <li key={d.id} className="m-0">
            <DocumentRow doc={d} />
          </li>
        ),
      )}
    </ul>
  );
}

const DECISION = {
  approved: { label: "Approved", tone: "green" as const, Icon: CheckCircle2 },
  changes_requested: { label: "Changes requested", tone: "amber" as const, Icon: RotateCcw },
  comment: { label: "Comment", tone: "neutral" as const, Icon: MessageSquareText },
};

export function FeedbackItem({ f, compact }: { f: SubmissionFeedback; compact?: boolean }) {
  const db = useDb();
  const now = useNow();
  const author = db.users[f.authorId];
  const d = DECISION[f.decision];
  return (
    <div className={cn("flex gap-3", compact && "gap-2.5")}>
      <Avatar name={author?.name ?? "Instructor"} hue={author?.avatarHue} size={compact ? 30 : 36} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-[14.5px] font-semibold text-void">{author?.name ?? "Former instructor"}</span>
          <Badge tone={d.tone} icon={<d.Icon className="size-3.5" aria-hidden />}>
            {d.label}
          </Badge>
          <time dateTime={f.at} title={fmtDateTime(f.at)} className="text-[12.5px] text-muted">
            {fmtRelative(f.at, now)}
          </time>
        </div>
        <p className="mt-1.5 whitespace-pre-line text-[14.5px] leading-relaxed text-ink">{f.text}</p>
      </div>
    </div>
  );
}

function VersionItem({ v, n, defaultOpen }: { v: SubmissionVersion; n: number; defaultOpen?: boolean }) {
  const now = useNow();
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-[14.5px] font-semibold text-void">Version {n} submitted</span>
        <time dateTime={v.submittedAt} title={fmtDateTime(v.submittedAt)} className="text-[12.5px] text-muted">
          {fmtRelative(v.submittedAt, now)}
        </time>
        {v.attachmentIds.length > 0 && <span className="text-[12.5px] text-muted">· {v.attachmentIds.length} attachment{v.attachmentIds.length === 1 ? "" : "s"}</span>}
      </div>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="mt-1 inline-flex h-8 items-center gap-1 rounded-[6px] text-[13.5px] font-medium text-leaf-ink hover:underline">
        <ChevronDown className={cn("size-4 transition-transform duration-200", !open && "-rotate-90")} aria-hidden />
        {open ? "Hide response" : "Show response"}
      </button>
      {open && (
        <div className="mt-2 space-y-3">
          <div className="whitespace-pre-wrap rounded-[12px] bg-fog p-4 text-[14.5px] leading-relaxed text-ink">{v.text}</div>
          <AttachmentList ids={v.attachmentIds} />
        </div>
      )}
    </div>
  );
}

/**
 * Version history interleaved with the feedback thread, oldest first, so the
 * back-and-forth between a fellow and their instructor reads like a thread.
 */
export function SubmissionHistory({ sub, openLatest, className, title = "History and feedback" }: { sub: Submission; openLatest?: boolean; className?: string; title?: string }) {
  const items = [
    ...sub.versions.map((v, i) => ({ kind: "version" as const, at: v.submittedAt, v, n: i + 1 })),
    ...sub.feedback.map((f) => ({ kind: "feedback" as const, at: f.at, f })),
  ].sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : a.kind === "version" ? -1 : 1));
  if (!items.length) return null;
  const lastVersion = sub.versions.length;
  return (
    <section className={className} aria-label={title}>
      <h3 className="text-[15px] font-semibold text-void">{title}</h3>
      <ol className="relative m-0 mt-4 list-none space-y-5 p-0 before:absolute before:bottom-2 before:left-[17px] before:top-2 before:w-px before:bg-line">
        {items.map((it) => (
          <li key={it.kind === "version" ? it.v.id : it.f.id} className="relative m-0 flex gap-3">
            {it.kind === "version" ? (
              <>
                <span className="relative z-[1] grid size-9 shrink-0 place-items-center rounded-full bg-paper ring-[1.5px] ring-line">
                  <Send className="size-4 text-void" aria-hidden />
                </span>
                <VersionItem v={it.v} n={it.n} defaultOpen={openLatest && it.n === lastVersion} />
              </>
            ) : (
              <div className="relative z-[1] flex-1">
                <FeedbackItem f={it.f} />
              </div>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
