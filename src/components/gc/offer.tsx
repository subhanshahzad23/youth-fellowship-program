import { Check } from "lucide-react";
import { OFFER } from "@/lib/content/site";
import { cn } from "@/lib/utils";

/**
 * The first-case offer. The brief asks for it under every hero and above
 * every closing button, so it is one component used everywhere.
 */
export function FirstCaseOffer({ tone = "light", className, compact }: { tone?: "light" | "dark" | "mint"; className?: string; compact?: boolean }) {
  return (
    <div
      data-offer
      className={cn("flex flex-wrap items-center gap-x-5 gap-y-2 text-[14.5px]", tone === "dark" ? "text-paper/85" : "text-void", className)}
    >
      {OFFER.items.map((item) => (
        <span key={item} className="inline-flex items-center gap-2">
          <span className={cn("grid size-[18px] shrink-0 place-items-center rounded-full", tone === "dark" ? "bg-jade text-void" : tone === "mint" ? "bg-void text-mint" : "bg-leaf text-leaf-ink")}>
            <Check className="size-3" strokeWidth={3} aria-hidden />
          </span>
          {item}
        </span>
      ))}
      {!compact && (
        <span className={cn("inline-flex items-center rounded-[26px] px-2.5 py-0.5 text-[13px] font-medium", tone === "dark" ? "bg-paper/10 text-paper" : tone === "mint" ? "bg-void/10 text-void" : "bg-fog text-void")}>
          {OFFER.price}
        </span>
      )}
    </div>
  );
}
