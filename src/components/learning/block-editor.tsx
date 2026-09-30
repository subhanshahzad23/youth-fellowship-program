"use client";

import { ArrowDown, ArrowUp, ClipboardCheck, FileDown, Heading2, Lightbulb, List, Pilcrow, PlayCircle, Plus, Quote, Trash2, type LucideIcon } from "lucide-react";
import type { ContentBlock, SessionContent, SessionKind } from "@/lib/domain/types";
import { VIDEO_SCRIPTS, WORKSHEETS } from "@/lib/seed/curriculum";
import { getWorksheet, type WorksheetFileName } from "@/lib/seed/curriculum/worksheets";
import videoManifest from "@/lib/seed/video-manifest.json";
import { uid } from "@/lib/utils";
import { Button, IconButton } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import { Menu, MenuContent, MenuItem, MenuLabel, MenuTrigger } from "@/components/ui/overlay";
import { fmtClock } from "./data";

type Manifest = Record<string, { src: string; poster: string; captions: string; durationSec: number; transcript: { t: number; text: string }[] }>;
const VIDEOS = videoManifest as Manifest;
export const VIDEO_IDS = Object.keys(VIDEOS);

export type BlockType = ContentBlock["type"];

export const BLOCK_META: Record<BlockType, { label: string; Icon: LucideIcon; hint: string }> = {
  heading: { label: "Heading", Icon: Heading2, hint: "Section title — also appears in “On this page”" },
  text: { label: "Text", Icon: Pilcrow, hint: "Paragraphs with light formatting" },
  callout: { label: "Callout", Icon: Lightbulb, hint: "Tip, example or warning box" },
  list: { label: "List", Icon: List, hint: "Bulleted or numbered" },
  quote: { label: "Quote", Icon: Quote, hint: "Pull quote with attribution" },
  file: { label: "Worksheet", Icon: FileDown, hint: "Downloadable PDF worksheet" },
  video: { label: "Video", Icon: PlayCircle, hint: "Narrated sample video with captions" },
  task: { label: "Assignment", Icon: ClipboardCheck, hint: "What fellows submit" },
};

const ORDER: BlockType[] = ["heading", "text", "callout", "list", "quote", "file", "video", "task"];

function videoIdOf(src: string) {
  return VIDEO_IDS.find((id) => VIDEOS[id].src === src) ?? "";
}
function videoTitle(id: string) {
  return VIDEO_SCRIPTS.find((v) => v.id === id)?.title ?? id;
}

export function videoBlockFields(id: string) {
  const v = VIDEOS[id];
  return { title: videoTitle(id), src: v.src, poster: v.poster, captions: v.captions, durationSec: v.durationSec, transcript: v.transcript };
}

export function fileBlockFields(fileName: string) {
  const { spec, size } = getWorksheet(fileName as WorksheetFileName);
  return { title: spec.title, href: `/samples/worksheets/${spec.fileName}`, fileName: spec.fileName, size };
}

export function newBlock(type: BlockType, sessionId: string): ContentBlock {
  const id = `${sessionId}-${uid("b").slice(2, 9)}`;
  switch (type) {
    case "heading":
      return { id, type, text: "" };
    case "text":
      return { id, type, text: "" };
    case "callout":
      return { id, type, tone: "tip", title: "", text: "" };
    case "list":
      return { id, type, ordered: false, items: [""] };
    case "quote":
      return { id, type, text: "", attribution: "" };
    case "file":
      return { id, type, description: "", ...fileBlockFields(WORKSHEETS[0].fileName) };
    case "video":
      return { id, type, ...videoBlockFields(VIDEO_IDS[0]) };
    case "task":
      return { id, type, title: "Your task", instructions: "", deliverable: "", requiresReview: true, rubric: [] };
  }
}

/** Trim editing artefacts (blank list items / rubric lines) before saving. */
export function normalizeContent(c: SessionContent): SessionContent {
  return {
    ...c,
    title: c.title.trim(),
    summary: c.summary.trim(),
    blocks: c.blocks.map((b) => {
      if (b.type === "list") return { ...b, items: b.items.map((i) => i.trim()).filter(Boolean) };
      if (b.type === "task") return { ...b, rubric: (b.rubric ?? []).map((r) => r.trim()).filter(Boolean) };
      return b;
    }),
  };
}

export function AddBlockMenu({ onAdd, kind, hasTask, trigger }: { onAdd: (t: BlockType) => void; kind: SessionKind; hasTask: boolean; trigger?: React.ReactNode }) {
  return (
    <Menu>
      <MenuTrigger asChild>
        {trigger ?? (
          <Button variant="outline" icon={<Plus className="size-4" />}>
            Add block
          </Button>
        )}
      </MenuTrigger>
      <MenuContent align="start" className="w-[300px]">
        <MenuLabel>Add a block</MenuLabel>
        {ORDER.map((t) => {
          const m = BLOCK_META[t];
          const disabled = t === "task" && (kind !== "task" || hasTask);
          return (
            <MenuItem key={t} icon={<m.Icon className="size-4" />} onSelect={() => onAdd(t)} disabled={disabled} className="items-start py-2">
              <span className="flex flex-col">
                <span className="text-[14.5px]">{m.label}</span>
                <span className="text-[12.5px] text-muted">{disabled ? (kind !== "task" ? "Only in assignment sessions" : "This session already has one") : m.hint}</span>
              </span>
            </MenuItem>
          );
        })}
      </MenuContent>
    </Menu>
  );
}

function rowsFor(text: string, min = 3, max = 14) {
  const lines = text.split("\n").reduce((n, l) => n + Math.max(1, Math.ceil(l.length / 72)), 0);
  return Math.min(max, Math.max(min, lines));
}

const FORMAT_HINT = "**bold**, *italic*, [link](https://…). A blank line starts a new paragraph; lines starting with “- ” become a list.";

function preview(b: ContentBlock) {
  switch (b.type) {
    case "heading":
    case "text":
    case "quote":
      return b.text;
    case "callout":
    case "file":
    case "video":
    case "task":
      return b.title;
    case "list":
      return b.items.filter(Boolean).join(" · ");
  }
}

export function BlockCard({
  block,
  index,
  total,
  kind,
  hasTask,
  onChange,
  onMove,
  onRemove,
  onInsertBelow,
}: {
  block: ContentBlock;
  index: number;
  total: number;
  kind: SessionKind;
  hasTask: boolean;
  onChange: (b: ContentBlock) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
  onInsertBelow: (t: BlockType) => void;
}) {
  const m = BLOCK_META[block.type];
  const fid = (k: string) => `blk-${block.id}-${k}`;
  const label = `${m.label} block ${index + 1}`;
  return (
    <li className="min-w-0 rounded-[16px] border-[1.5px] border-line bg-paper" aria-label={label}>
      <div className="flex items-center gap-2 border-b border-line py-1.5 pl-3 pr-1.5">
        <span className="grid size-7 shrink-0 place-items-center rounded-[7px] bg-fog">
          <m.Icon className="size-4" aria-hidden />
        </span>
        <span className="text-[13.5px] font-semibold">{m.label}</span>
        <span className="min-w-0 flex-1 truncate text-[13px] text-muted">{preview(block)}</span>
        <IconButton label={`Move ${label} up`} onClick={() => onMove(-1)} disabled={index === 0} className="size-9">
          <ArrowUp className="size-4" />
        </IconButton>
        <IconButton label={`Move ${label} down`} onClick={() => onMove(1)} disabled={index === total - 1} className="size-9">
          <ArrowDown className="size-4" />
        </IconButton>
        <AddBlockMenu
          onAdd={onInsertBelow}
          kind={kind}
          hasTask={hasTask}
          trigger={
            <button type="button" aria-label={`Insert a block below ${label}`} title="Insert below" className="inline-grid size-9 place-items-center rounded-[8px] hover:bg-fog">
              <Plus className="size-4" />
            </button>
          }
        />
        <IconButton label={`Remove ${label}`} onClick={onRemove} className="size-9 text-[#b00d28] hover:bg-[#fff1f2]">
          <Trash2 className="size-4" />
        </IconButton>
      </div>
      <div className="grid grid-cols-1 gap-3 p-4">
        {block.type === "heading" && (
          <Field label="Heading text" htmlFor={fid("text")}>
            <Input id={fid("text")} value={block.text} onChange={(e) => onChange({ ...block, text: e.target.value })} placeholder="e.g. Before you start" />
          </Field>
        )}
        {block.type === "text" && (
          <Field label="Text" htmlFor={fid("text")} hint={FORMAT_HINT}>
            <Textarea id={fid("text")} value={block.text} rows={rowsFor(block.text)} onChange={(e) => onChange({ ...block, text: e.target.value })} className="min-h-[96px]" />
          </Field>
        )}
        {block.type === "callout" && (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[160px_minmax(0,1fr)]">
              <Field label="Style" htmlFor={fid("tone")}>
                <Select id={fid("tone")} value={block.tone} onChange={(e) => onChange({ ...block, tone: e.target.value as typeof block.tone })}>
                  <option value="tip">Tip</option>
                  <option value="example">Example</option>
                  <option value="warning">Watch out</option>
                </Select>
              </Field>
              <Field label="Title" htmlFor={fid("title")}>
                <Input id={fid("title")} value={block.title} onChange={(e) => onChange({ ...block, title: e.target.value })} />
              </Field>
            </div>
            <Field label="Text" htmlFor={fid("text")} hint={FORMAT_HINT}>
              <Textarea id={fid("text")} value={block.text} rows={rowsFor(block.text)} onChange={(e) => onChange({ ...block, text: e.target.value })} className="min-h-[96px]" />
            </Field>
          </>
        )}
        {block.type === "list" && (
          <>
            <Checkbox checked={block.ordered} onChange={(v) => onChange({ ...block, ordered: v })} label="Numbered list" description="Use for steps that happen in order." />
            <Field label="Items" htmlFor={fid("items")} hint="One item per line. **bold** and *italic* work here too.">
              <Textarea id={fid("items")} value={block.items.join("\n")} rows={rowsFor(block.items.join("\n"))} onChange={(e) => onChange({ ...block, items: e.target.value.split("\n") })} className="min-h-[96px]" />
            </Field>
          </>
        )}
        {block.type === "quote" && (
          <>
            <Field label="Quote" htmlFor={fid("text")}>
              <Textarea id={fid("text")} value={block.text} rows={rowsFor(block.text, 2)} onChange={(e) => onChange({ ...block, text: e.target.value })} className="min-h-[72px]" />
            </Field>
            <Field label="Attribution" htmlFor={fid("attr")} hint="Everyone in the demo is fictional — say so, e.g. “(fictional example)”.">
              <Input id={fid("attr")} value={block.attribution} onChange={(e) => onChange({ ...block, attribution: e.target.value })} />
            </Field>
          </>
        )}
        {block.type === "file" && (
          <>
            <Field label="Worksheet" htmlFor={fid("file")} hint="Bundled PDF worksheets. Fellows get a real download.">
              <Select id={fid("file")} value={block.fileName} onChange={(e) => onChange({ ...block, ...fileBlockFields(e.target.value) })}>
                {WORKSHEETS.map((w) => (
                  <option key={w.fileName} value={w.fileName}>
                    {w.title} ({w.fileName})
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Description" htmlFor={fid("desc")}>
              <Textarea id={fid("desc")} value={block.description} rows={2} onChange={(e) => onChange({ ...block, description: e.target.value })} className="min-h-[64px]" />
            </Field>
          </>
        )}
        {block.type === "video" && (
          <>
            <Field label="Video" htmlFor={fid("video")} hint="Narrated sample videos bundled with the demo, each with captions and a transcript.">
              <Select id={fid("video")} value={videoIdOf(block.src)} onChange={(e) => e.target.value && onChange({ ...block, ...videoBlockFields(e.target.value) })}>
                {!videoIdOf(block.src) && <option value="">Choose a video…</option>}
                {VIDEO_IDS.map((id) => (
                  <option key={id} value={id}>
                    {videoTitle(id)} · {fmtClock(VIDEOS[id].durationSec)}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="flex items-center gap-3 rounded-[12px] bg-fog p-2.5">
              {block.poster && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={block.poster} alt="" className="h-14 w-24 shrink-0 rounded-[6px] object-cover" />
              )}
              <p className="text-[13px] text-muted">
                {fmtClock(block.durationSec)} · {block.transcript.length} transcript lines · captions {block.captions ? "included" : "missing"}
              </p>
            </div>
            <Field label="Title shown above the player" htmlFor={fid("title")}>
              <Input id={fid("title")} value={block.title} onChange={(e) => onChange({ ...block, title: e.target.value })} />
            </Field>
          </>
        )}
        {block.type === "task" && (
          <>
            <Field label="Assignment title" htmlFor={fid("title")}>
              <Input id={fid("title")} value={block.title} onChange={(e) => onChange({ ...block, title: e.target.value })} />
            </Field>
            <Field label="Instructions" htmlFor={fid("instr")} hint={FORMAT_HINT}>
              <Textarea id={fid("instr")} value={block.instructions} rows={rowsFor(block.instructions)} onChange={(e) => onChange({ ...block, instructions: e.target.value })} className="min-h-[96px]" />
            </Field>
            <Field label="What to hand in" htmlFor={fid("deliv")}>
              <Textarea id={fid("deliv")} value={block.deliverable} rows={2} onChange={(e) => onChange({ ...block, deliverable: e.target.value })} className="min-h-[64px]" />
            </Field>
            <Checkbox
              checked={block.requiresReview}
              onChange={(v) => onChange({ ...block, requiresReview: v })}
              label="Requires instructor review"
              description={block.requiresReview ? "The session completes when you approve a submission." : "The session completes as soon as the fellow submits."}
            />
            <Field label="Rubric" htmlFor={fid("rubric")} hint="One criterion per line. Fellows see these under “How it's reviewed”." optional>
              <Textarea id={fid("rubric")} value={(block.rubric ?? []).join("\n")} rows={rowsFor((block.rubric ?? []).join("\n"), 3)} onChange={(e) => onChange({ ...block, rubric: e.target.value.split("\n") })} className="min-h-[96px]" />
            </Field>
          </>
        )}
      </div>
    </li>
  );
}

export function BlockList({
  content,
  kind,
  sessionId,
  onChange,
}: {
  content: SessionContent;
  kind: SessionKind;
  sessionId: string;
  onChange: (blocks: ContentBlock[]) => void;
}) {
  const blocks = content.blocks;
  const hasTask = blocks.some((b) => b.type === "task");
  const insertAt = (i: number, t: BlockType) => {
    const next = [...blocks];
    next.splice(i, 0, newBlock(t, sessionId));
    onChange(next);
    window.setTimeout(() => {
      const el = document.querySelectorAll<HTMLElement>("[data-block-list] > li")[i];
      el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      el?.querySelector<HTMLElement>("input,textarea,select")?.focus({ preventScroll: true });
    }, 60);
  };
  return (
    <div>
      {blocks.length === 0 ? (
        <p className="rounded-[14px] border-[1.5px] border-dashed border-line p-6 text-center text-[14px] text-muted">No blocks yet. Add a heading, some text or a video to get started.</p>
      ) : (
        <ol data-block-list className="m-0 grid list-none grid-cols-1 gap-3 p-0">
          {blocks.map((b, i) => (
            <BlockCard
              key={b.id}
              block={b}
              index={i}
              total={blocks.length}
              kind={kind}
              hasTask={hasTask}
              onChange={(nb) => onChange(blocks.map((x) => (x.id === b.id ? nb : x)))}
              onMove={(dir) => {
                const j = i + dir;
                if (j < 0 || j >= blocks.length) return;
                const next = [...blocks];
                [next[i], next[j]] = [next[j], next[i]];
                onChange(next);
              }}
              onRemove={() => onChange(blocks.filter((x) => x.id !== b.id))}
              onInsertBelow={(t) => insertAt(i + 1, t)}
            />
          ))}
        </ol>
      )}
      <div className="mt-3">
        <AddBlockMenu onAdd={(t) => insertAt(blocks.length, t)} kind={kind} hasTask={hasTask} />
      </div>
    </div>
  );
}
