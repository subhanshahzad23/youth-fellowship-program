import Link from "next/link";
import { ArrowUpRight, Mail } from "lucide-react";
import type { ArticleBlock } from "@/lib/content/articles";
import type { TeamMember } from "@/lib/content/site";
import { Inline } from "@/components/ui/rich-text";
import { Portrait } from "@/components/gc/team";

/** Renders one block of an article body inside `.prose-session`. */
export function ArticleBlockView({ block }: { block: ArticleBlock }) {
  switch (block.type) {
    case "p":
      return (
        <p>
          <Inline text={block.text} />
        </p>
      );
    case "ul":
      return (
        <ul>
          {block.items.map((it) => (
            <li key={it}>
              <Inline text={it} />
            </li>
          ))}
        </ul>
      );
    case "callout":
      return (
        <aside className="my-8 rounded-[16px] bg-leaf px-5 py-5 sm:px-6">
          <p className="!my-0 text-[13px] font-semibold uppercase tracking-[0.14em] text-leaf-ink">{block.title}</p>
          <p className="!mb-0 !mt-2 text-[16px] leading-relaxed text-void">
            <Inline text={block.text} />
          </p>
        </aside>
      );
    case "table":
      return (
        <figure className="my-8">
          <div className="overflow-x-auto rounded-[16px] ring-1 ring-line">
            <table className="w-full min-w-[460px] border-collapse text-left text-[14px] leading-snug sm:text-[15px]">
              <caption className="sr-only">{block.caption}</caption>
              <thead className="bg-fog">
                <tr>
                  {block.head.map((h, i) => (
                    <th key={i} scope="col" className="px-4 py-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-void">
                      {h || <span className="sr-only">Measure</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row) => (
                  <tr key={row[0]} className="border-t border-line align-top">
                    {row.map((cell, j) =>
                      j === 0 ? (
                        <th key={j} scope="row" className="px-4 py-3 font-medium text-void">
                          {cell}
                        </th>
                      ) : (
                        <td key={j} className="px-4 py-3 text-ink tabular">
                          {cell}
                        </td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <figcaption className="mt-3 text-[13.5px] leading-relaxed text-muted">
            {block.caption}.{block.note && <> {block.note}</>}
          </figcaption>
        </figure>
      );
  }
}

/** Table of contents. Stacks as a box on mobile, sticky in the sidebar on desktop. */
export function Toc({ items }: { items: { id: string; title: string }[] }) {
  return (
    <nav aria-label="On this page" className="rounded-[16px] bg-fog p-5 lg:bg-transparent lg:p-0">
      <p className="eyebrow text-muted">On this page</p>
      <ol className="mt-4 space-y-1 border-l border-line">
        {items.map((it, i) => (
          <li key={it.id}>
            <a href={`#${it.id}`} className="-ml-px flex gap-3 border-l border-transparent py-1.5 pl-4 text-[14px] leading-snug text-ink transition-colors hover:border-void hover:text-void">
              <span className="tabular text-muted">{String(i + 1).padStart(2, "0")}</span>
              <span className="min-w-0">{it.title}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Plain share links (no third-party scripts). */
export function ShareLinks({ url, title }: { url: string; title: string }) {
  const u = encodeURIComponent(url);
  const links = [
    { label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
    { label: "X", href: `https://x.com/intent/post?url=${u}&text=${encodeURIComponent(title)}` },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-[13.5px] text-muted">Share</span>
      {links.map((l) => (
        <a
          key={l.label}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 items-center gap-1.5 rounded-[26px] bg-fog px-3.5 text-[13.5px] font-medium text-void transition-colors hover:bg-ash"
        >
          {l.label}
          <ArrowUpRight className="size-3.5" aria-hidden />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      ))}
      <a
        href={`mailto:?subject=${encodeURIComponent(title)}&body=${u}`}
        className="inline-flex h-9 items-center gap-1.5 rounded-[26px] bg-fog px-3.5 text-[13.5px] font-medium text-void transition-colors hover:bg-ash"
      >
        <Mail className="size-3.5" aria-hidden />
        Email
      </a>
    </div>
  );
}

/** Author box with a monogram portrait (photos to be supplied by Goodcase). */
export function AuthorBox({ person, name }: { person?: TeamMember; name: string }) {
  return (
    <div className="grid grid-cols-1 gap-5 rounded-[24px] bg-fog p-6 sm:grid-cols-[96px_minmax(0,1fr)] sm:p-7">
      <Portrait name={name} size="sm" className="w-[96px]" />
      <div className="min-w-0">
        <p className="eyebrow text-muted">Written by</p>
        <p className="mt-2 font-display text-[26px] leading-tight tracking-[-0.02em] text-void">{name}</p>
        {person && <p className="mt-0.5 text-[14.5px] text-muted">{person.role} at Goodcase</p>}
        {person && <p className="mt-3 max-w-[56ch] text-[15px] leading-relaxed text-ink">{person.bio}</p>}
        <Link href="/about#team" className="mt-4 inline-flex items-center gap-1 text-[14.5px] font-medium text-void underline-offset-4 hover:underline">
          Meet the team
          <ArrowUpRight className="size-4" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
