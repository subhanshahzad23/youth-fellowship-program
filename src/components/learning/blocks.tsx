"use client";

import { AlertTriangle, Download, ExternalLink, FileText, Lightbulb, NotebookPen } from "lucide-react";
import type { ContentBlock } from "@/lib/domain/types";
import { Inline } from "@/components/ui/rich-text";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { anchorId, type FileBlock, type TaskBlock } from "./data";
import { VideoPlayer } from "./video-player";

/**
 * Paragraph-aware lightweight markdown. Chunks separated by a blank line
 * become paragraphs; a chunk whose lines all start with "- " or "1. " becomes
 * a list. Inline formatting is handled by the shared safe <Inline/>.
 */
export function RichText({ text, className }: { text: string; className?: string }) {
  const chunks = text.split(/\n{2,}/).filter((c) => c.trim());
  return (
    <>
      {chunks.map((chunk, i) => {
        const lines = chunk.split("\n").filter((l) => l.trim());
        if (lines.length && lines.every((l) => /^\s*[-*]\s+/.test(l)))
          return (
            <ul key={i} className={className}>
              {lines.map((l, j) => (
                <li key={j}>
                  <Inline text={l.replace(/^\s*[-*]\s+/, "")} />
                </li>
              ))}
            </ul>
          );
        if (lines.length && lines.every((l) => /^\s*\d+[.)]\s+/.test(l)))
          return (
            <ol key={i} className={className}>
              {lines.map((l, j) => (
                <li key={j}>
                  <Inline text={l.replace(/^\s*\d+[.)]\s+/, "")} />
                </li>
              ))}
            </ol>
          );
        return (
          <p key={i} className={className}>
            {lines.map((line, j) => (
              <span key={j}>
                <Inline text={line} />
                {j < lines.length - 1 && <br />}
              </span>
            ))}
          </p>
        );
      })}
    </>
  );
}

const CALLOUT = {
  tip: { label: "Tip", Icon: Lightbulb, box: "bg-leaf", icon: "bg-paper text-leaf-ink", eyebrow: "text-leaf-ink" },
  example: { label: "Example", Icon: NotebookPen, box: "bg-[#eef4ff]", icon: "bg-paper text-[#1e40af]", eyebrow: "text-[#1e40af]" },
  warning: { label: "Watch out", Icon: AlertTriangle, box: "bg-[#fff6dd]", icon: "bg-paper text-[#7a4b00]", eyebrow: "text-[#7a4b00]" },
} as const;

function Callout({ block }: { block: Extract<ContentBlock, { type: "callout" }> }) {
  const m = CALLOUT[block.tone];
  return (
    <aside className={cn("my-8 flex gap-4 rounded-[16px] p-5 sm:p-6", m.box)} aria-label={`${m.label}: ${block.title}`}>
      <span className={cn("grid size-9 shrink-0 place-items-center rounded-full", m.icon)}>
        <m.Icon className="size-[18px]" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn("eyebrow", m.eyebrow)}>{m.label}</p>
        {block.title && <p className="mt-1 text-[17px] font-semibold leading-snug text-void">{block.title}</p>}
        <div className="mt-1.5 text-[16px] leading-[1.65] text-ink [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-0 [&_p+p]:mt-3 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5">
          <RichText text={block.text} />
        </div>
      </div>
    </aside>
  );
}

export function FileCard({ block, preview }: { block: FileBlock; preview?: boolean }) {
  return (
    <div className="my-8 flex flex-col gap-4 rounded-[16px] border-[1.5px] border-line bg-paper p-4 sm:flex-row sm:items-center sm:p-5">
      <div className="flex min-w-0 flex-1 items-start gap-4">
        <span className="relative grid h-14 w-11 shrink-0 place-items-center rounded-[6px] bg-fog ring-1 ring-line">
          <FileText className="size-5 text-void" aria-hidden />
          <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 rounded-[4px] bg-void px-1 text-[9.5px] font-semibold tracking-wide text-paper">PDF</span>
        </span>
        <div className="min-w-0">
          <p className="eyebrow text-muted">Worksheet · {block.size}</p>
          <p className="mt-1 text-[16px] font-semibold leading-snug text-void">{block.title}</p>
          {block.description && <p className="mt-1 text-[14.5px] leading-relaxed text-muted">{block.description}</p>}
          <p className="mt-1 truncate font-mono text-[12px] text-muted">{block.fileName}</p>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <ButtonLink href={block.href} download={block.fileName} variant="dark" size="md" icon={<Download className="size-4" />} aria-label={`Download ${block.title} (PDF, ${block.size})`}>
          Download
        </ButtonLink>
        {!preview && (
          <ButtonLink href={block.href} target="_blank" rel="noreferrer" variant="outline" size="md" icon={<ExternalLink className="size-4" />} aria-label={`Open ${block.title} in a new tab`}>
            Open
          </ButtonLink>
        )}
      </div>
    </div>
  );
}

/** Headings, video and assignment blocks are landmarks for the table of contents. */
export function tocEntries(blocks: ContentBlock[]) {
  const out: { id: string; label: string; kind: "heading" | "video" | "task" }[] = [];
  for (const b of blocks) {
    if (b.type === "heading" && b.text.trim()) out.push({ id: anchorId(b.id), label: b.text, kind: "heading" });
    if (b.type === "video") out.push({ id: anchorId(b.id), label: `Video: ${b.title}`, kind: "video" });
    if (b.type === "task") out.push({ id: "assignment", label: "Your assignment", kind: "task" });
  }
  return out;
}

/**
 * Renders session content blocks. Text-like blocks use the `.prose-session`
 * reading styles; rich widgets (video, file, task) are rendered outside the
 * prose scope so their controls keep their own styling.
 */
export function SessionBlocks({ blocks, renderTask, preview }: { blocks: ContentBlock[]; renderTask: (b: TaskBlock) => React.ReactNode; preview?: boolean }) {
  return (
    <div className="[&>.prose-session:first-child>*:first-child]:mt-0">
      {blocks.map((b) => {
        switch (b.type) {
          case "heading":
            return (
              <div key={b.id} className="prose-session">
                <h2 id={anchorId(b.id)} className="scroll-mt-24">
                  {b.text}
                </h2>
              </div>
            );
          case "text":
            return (
              <div key={b.id} className="prose-session">
                <RichText text={b.text} />
              </div>
            );
          case "list":
            return (
              <div key={b.id} className="prose-session">
                {b.ordered ? (
                  <ol>
                    {b.items.filter((it) => it.trim()).map((it, i) => (
                      <li key={i}>
                        <Inline text={it} />
                      </li>
                    ))}
                  </ol>
                ) : (
                  <ul>
                    {b.items.filter((it) => it.trim()).map((it, i) => (
                      <li key={i}>
                        <Inline text={it} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          case "quote":
            return (
              <figure key={b.id} className="my-10 border-l-[3px] border-jade pl-5 sm:pl-7">
                <blockquote className="font-display text-[23px] leading-[1.35] tracking-[-0.015em] text-void sm:text-[26px]">
                  <span aria-hidden>“</span>
                  <Inline text={b.text.replace(/^[“"]|[”"]$/g, "")} />
                  <span aria-hidden>”</span>
                </blockquote>
                {b.attribution && <figcaption className="mt-3 text-[14px] text-muted">— {b.attribution}</figcaption>}
              </figure>
            );
          case "callout":
            return <Callout key={b.id} block={b} />;
          case "file":
            return <FileCard key={b.id} block={b} preview={preview} />;
          case "video":
            return (
              <div key={b.id} id={anchorId(b.id)} className="my-10 scroll-mt-24">
                <VideoPlayer block={b} />
              </div>
            );
          case "task":
            return (
              <div key={b.id} className="my-10">
                {renderTask(b)}
              </div>
            );
        }
      })}
    </div>
  );
}
