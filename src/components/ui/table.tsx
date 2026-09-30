import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

/** Plain, readable data table. Pair with a card list below `md` for mobile. */
export function Table({ children, className, caption }: { children: React.ReactNode; className?: string; caption?: string }) {
  return (
    <div className={cn("overflow-x-auto rounded-[16px] bg-paper", className)}>
      <table className="w-full border-collapse text-left text-[14px]">
        {caption && <caption className="sr-only">{caption}</caption>}
        {children}
      </table>
    </div>
  );
}

export function THead({ children }: { children: React.ReactNode }) {
  return <thead className="border-b border-line text-[12.5px] uppercase tracking-[0.08em] text-muted">{children}</thead>;
}

export function TH({ children, className, sort, onSort, align }: { children?: React.ReactNode; className?: string; sort?: "asc" | "desc" | null; onSort?: () => void; align?: "left" | "right" }) {
  const Icon = sort === "asc" ? ArrowUp : sort === "desc" ? ArrowDown : ArrowUpDown;
  return (
    <th scope="col" aria-sort={sort === "asc" ? "ascending" : sort === "desc" ? "descending" : undefined} className={cn("h-11 whitespace-nowrap px-4 font-medium", align === "right" && "text-right", className)}>
      {onSort ? (
        <button type="button" onClick={onSort} className="inline-flex items-center gap-1 uppercase tracking-[0.08em] hover:text-void">
          {children}
          <Icon className={cn("size-3.5", !sort && "opacity-40")} aria-hidden />
        </button>
      ) : (
        children
      )}
    </th>
  );
}

export function TR({ children, className, onClick, selected }: { children: React.ReactNode; className?: string; onClick?: () => void; selected?: boolean }) {
  return (
    <tr onClick={onClick} className={cn("border-b border-line last:border-0 transition-colors", onClick && "cursor-pointer hover:bg-[#fafafa]", selected && "bg-leaf/50", className)}>
      {children}
    </tr>
  );
}

export function TD({ children, className, align }: { children?: React.ReactNode; className?: string; align?: "left" | "right" }) {
  return <td className={cn("px-4 py-3 align-middle", align === "right" && "text-right", className)}>{children}</td>;
}
