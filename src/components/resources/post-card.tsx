import Link from "next/link";
import type { Post } from "@/lib/content/site";
import { cn, fmtDate } from "@/lib/utils";
import { Monogram } from "./monogram";

/** Editorial blog card: category, serif title, excerpt, author, date and read time. */
export function PostCard({ post, className }: { post: Post; className?: string }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className={cn("group flex h-full min-w-0 flex-col rounded-[24px] bg-fog p-6 transition-colors duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-ash sm:p-7", className)}
    >
      <p className="eyebrow text-muted">{post.category}</p>
      <h3 className="mt-4 font-display text-[25px] leading-[1.15] tracking-[-0.025em] text-void sm:text-[27px]">
        <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-left-bottom bg-no-repeat transition-[background-size] duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:bg-[length:100%_1px]">
          {post.title}
        </span>
      </h3>
      <p className="mt-3 line-clamp-3 text-[15px] leading-relaxed text-muted">{post.excerpt}</p>
      <div className="mt-auto flex min-w-0 items-center gap-3 pt-7">
        <Monogram name={post.author} size={32} />
        <div className="min-w-0 text-[13px] leading-tight">
          <p className="truncate font-medium text-void">{post.author}</p>
          <p className="mt-0.5 text-muted">
            <time dateTime={post.date}>{fmtDate(post.date)}</time> · {post.readMins} min read
          </p>
        </div>
      </div>
    </Link>
  );
}
