"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type TocItem = { id: string; label: string; n: number };

/** Pixels below the viewport top where a section counts as "current" (sticky nav + breathing room). */
const OFFSET = 140;

/**
 * Policy table of contents. Desktop: a sticky list beside the article with the
 * current section highlighted. Mobile: a collapsible "On this page" panel.
 */
export function PolicyToc({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState(items[0]?.id);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      let current = items[0]?.id;
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      if (atBottom) {
        // The last sections can be too short to reach the top; treat the end of the page as the last one.
        const last = [...items].reverse().find((it) => {
          const el = document.getElementById(it.id);
          return el && el.getBoundingClientRect().top < window.innerHeight;
        });
        current = last?.id ?? current;
      } else {
        for (const it of items) {
          const el = document.getElementById(it.id);
          if (el && el.getBoundingClientRect().top - OFFSET <= 0) current = it.id;
        }
      }
      setActive(current);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [items]);

  const current = items.find((it) => it.id === active);

  return (
    <nav aria-label="On this page" className="lg:sticky lg:top-[120px]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="policy-toc-list"
        className="flex w-full items-center justify-between gap-4 rounded-[16px] bg-fog px-5 py-4 text-left lg:hidden"
      >
        <span className="min-w-0">
          <span className="eyebrow block text-muted">On this page · {items.length} sections</span>
          <span className="mt-1 block truncate text-[15.5px] font-medium">{current ? `${current.n}. ${current.label}` : "Contents"}</span>
        </span>
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-paper">
          <ChevronDown className={cn("size-4 transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]", open && "rotate-180")} aria-hidden />
        </span>
      </button>

      <p className="eyebrow hidden text-muted lg:block">On this page</p>
      <ol id="policy-toc-list" className={cn("mt-2 space-y-0.5 rounded-[16px] bg-fog p-2 lg:mt-4 lg:block lg:rounded-none lg:bg-transparent lg:p-0", open ? "block" : "hidden")}>
        {items.map((it) => {
          const isActive = it.id === active;
          return (
            <li key={it.id}>
              <a
                href={`#${it.id}`}
                onClick={() => setOpen(false)}
                aria-current={isActive ? "location" : undefined}
                className={cn(
                  "flex gap-3 rounded-[8px] px-3 py-2 text-[14.5px] leading-snug transition-colors duration-200",
                  isActive ? "bg-paper font-medium text-void lg:bg-fog" : "text-muted hover:text-void",
                )}
              >
                <span className="w-5 shrink-0 text-muted-display tabular">{it.n}</span>
                <span className="min-w-0">{it.label}</span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
