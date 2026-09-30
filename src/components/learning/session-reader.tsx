"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Clock, ClipboardCheck, Hash, ListTree, PlayCircle } from "lucide-react";
import type { SessionContent, SessionKind } from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import { SessionBlocks, tocEntries } from "./blocks";
import { fmtMinutes, type TaskBlock } from "./data";
import { KindLabel } from "./meta";

type Entry = ReturnType<typeof tocEntries>[number];

function jumpTo(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  try {
    window.history.replaceState(window.history.state, "", `#${id}`);
  } catch {
    /* ignore */
  }
}

function EntryIcon({ kind }: { kind: Entry["kind"] }) {
  if (kind === "video") return <PlayCircle className="size-3.5 shrink-0" aria-hidden />;
  if (kind === "task") return <ClipboardCheck className="size-3.5 shrink-0" aria-hidden />;
  return <Hash className="size-3.5 shrink-0 opacity-50" aria-hidden />;
}

/** "On this page" navigation that follows the reader's scroll position. */
export function Toc({ entries, className }: { entries: Entry[]; className?: string }) {
  const [active, setActive] = useState<string | null>(null);
  const key = entries.map((e) => e.id).join("|");

  useEffect(() => {
    const ids = key ? key.split("|") : [];
    const els = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
    if (!els.length || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(
      (items) => {
        const visible = items.filter((i) => i.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-88px 0px -60% 0px" },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [key]);

  if (!entries.length) return null;
  return (
    <nav aria-label="On this page" className={className}>
      <p className="eyebrow mb-3 flex items-center gap-2 text-muted">
        <ListTree className="size-3.5" aria-hidden /> On this page
      </p>
      <ol className="space-y-0.5 border-l border-line">
        {entries.map((e) => {
          const on = active === e.id;
          return (
            <li key={e.id}>
              <a
                href={`#${e.id}`}
                onClick={(ev) => {
                  ev.preventDefault();
                  setActive(e.id);
                  jumpTo(e.id);
                }}
                aria-current={on ? "location" : undefined}
                className={cn(
                  "-ml-px flex items-start gap-2 border-l-2 py-1.5 pl-3 pr-2 text-[13.5px] leading-snug transition-colors",
                  on ? "border-jade font-medium text-void" : "border-transparent text-muted hover:border-[#b9c0c6] hover:text-void",
                )}
              >
                <span className="mt-[3px]">
                  <EntryIcon kind={e.kind} />
                </span>
                <span>{e.label}</span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function MobileToc({ entries }: { entries: Entry[] }) {
  const [open, setOpen] = useState(false);
  if (!entries.length) return null;
  return (
    <div className="mb-8 rounded-[12px] bg-fog">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex h-11 w-full items-center justify-between gap-2 px-4 text-[14px] font-medium">
        <span className="inline-flex items-center gap-2">
          <ListTree className="size-4" aria-hidden /> On this page · {entries.length}
        </span>
        <ChevronDown className={cn("size-4 transition-transform duration-200", open && "rotate-180")} aria-hidden />
      </button>
      {open && (
        <ol className="space-y-0.5 px-2 pb-2">
          {entries.map((e) => (
            <li key={e.id}>
              <a
                href={`#${e.id}`}
                onClick={(ev) => {
                  ev.preventDefault();
                  setOpen(false);
                  jumpTo(e.id);
                }}
                className="flex min-h-10 items-center gap-2 rounded-[8px] px-2 text-[14px] text-ink hover:bg-paper"
              >
                <EntryIcon kind={e.kind} />
                {e.label}
              </a>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/** Scrolls to the URL hash once the (client-rendered) content exists. */
export function useHashScroll(ready: boolean) {
  useEffect(() => {
    if (!ready) return;
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;
    const t = window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
    return () => window.clearTimeout(t);
  }, [ready]);
}

/**
 * The learner-facing session layout, shared by the fellow reader and the
 * instructor's "Preview as learner" so both render identically.
 */
export function SessionReader({
  content,
  kind,
  eyebrow,
  meta,
  banner,
  renderTask,
  showToc = true,
  preview,
  after,
  children,
}: {
  content: SessionContent;
  kind: SessionKind;
  eyebrow?: React.ReactNode;
  meta?: React.ReactNode;
  banner?: React.ReactNode;
  renderTask: (b: TaskBlock) => React.ReactNode;
  showToc?: boolean;
  preview?: boolean;
  after?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const entries = tocEntries(content.blocks);
  const withToc = showToc && entries.length > 1;
  return (
    <div className={cn("mx-auto w-full", withToc ? "max-w-[1060px] lg:grid lg:grid-cols-[minmax(0,1fr)_220px] lg:gap-10" : "max-w-[800px]")}>
      <div className="min-w-0">
        {banner}
        <article className="rounded-[24px] bg-paper px-5 py-8 sm:px-10 sm:py-12" aria-labelledby="session-title">
          <header className="mb-8 border-b border-line pb-8">
            {eyebrow}
            <h1 id="session-title" className="mt-3 font-display text-[34px] leading-[1.05] tracking-[-0.035em] text-void sm:text-[46px]">
              {content.title || "Untitled session"}
            </h1>
            {content.summary && <p className="mt-4 text-[17px] leading-relaxed text-muted sm:text-[18px]">{content.summary}</p>}
            <div className="mt-5 flex flex-wrap items-center gap-2 text-[13.5px] text-ink">
              <span className="inline-flex h-7 items-center rounded-full bg-fog px-3">
                <KindLabel kind={kind} />
              </span>
              <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-fog px-3 tabular">
                <Clock className="size-4" aria-hidden />
                {fmtMinutes(content.durationMin)}
              </span>
              {meta}
            </div>
          </header>
          <div className={cn(withToc && "lg:hidden")}>
            <MobileToc entries={entries} />
          </div>
          {content.blocks.length === 0 ? (
            <p className="rounded-[12px] bg-fog p-6 text-center text-[15px] text-muted">This session has no content blocks yet.</p>
          ) : (
            <SessionBlocks blocks={content.blocks} renderTask={renderTask} preview={preview} />
          )}
          {after}
        </article>
        {children}
      </div>
      {withToc && (
        <aside className="hidden lg:block">
          <div className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto pb-6">
            <Toc entries={entries} />
          </div>
        </aside>
      )}
    </div>
  );
}
