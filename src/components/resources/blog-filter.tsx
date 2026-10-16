"use client";

import { useState } from "react";
import type { Post } from "@/lib/content/site";
import { cn } from "@/lib/utils";
import { PostCard } from "./post-card";

const ALL = "All articles";

/** Category filter for the blog list. Client-side state only; the full list is server-rendered first. */
export function BlogFilter({ posts, categories }: { posts: Post[]; categories: string[] }) {
  const [active, setActive] = useState<string>(ALL);
  const shown = active === ALL ? posts : posts.filter((p) => p.category === active);
  const options = [ALL, ...categories];

  return (
    <div>
      <div role="group" aria-label="Filter articles by category" className="flex flex-wrap gap-2">
        {options.map((c) => {
          const on = c === active;
          const count = c === ALL ? posts.length : posts.filter((p) => p.category === c).length;
          return (
            <button
              key={c}
              type="button"
              aria-pressed={on}
              onClick={() => setActive(c)}
              className={cn(
                "inline-flex h-10 items-center gap-2 rounded-[26px] px-4 text-[14.5px] font-medium transition-colors duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]",
                on ? "bg-void text-paper" : "bg-fog text-void hover:bg-ash",
              )}
            >
              {c}
              <span className={cn("tabular text-[12.5px]", on ? "text-paper/60" : "text-muted")}>{count}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-5 text-[13.5px] text-muted" aria-live="polite">
        Showing {shown.length} of {posts.length} articles{active !== ALL && <> in {active}</>}
      </p>
      <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((p) => (
          <li key={p.slug} className="min-w-0">
            <PostCard post={p} />
          </li>
        ))}
      </ul>
    </div>
  );
}
