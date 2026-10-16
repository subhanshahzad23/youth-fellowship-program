import { cn } from "@/lib/utils";
import { Reveal } from "@/components/site/reveal";

/** Standard section heading: eyebrow, serif title with an optional muted tail, and a lede. */
export function SectionHeader({
  eyebrow,
  title,
  muted,
  lede,
  align = "left",
  id,
  className,
  dark,
  children,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  muted?: React.ReactNode;
  lede?: React.ReactNode;
  align?: "left" | "center";
  id?: string;
  className?: string;
  dark?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <Reveal className={cn(align === "center" && "mx-auto text-center", "max-w-[860px]", className)}>
      {eyebrow && <p className={cn("eyebrow", dark ? "text-mint" : "text-void")}>{eyebrow}</p>}
      <h2 id={id} className={cn("display-xl mt-4", align === "center" && "mx-auto")}>
        {title} {muted && <span className="text-muted-display">{muted}</span>}
      </h2>
      {lede && <p className={cn("mt-5 max-w-[640px] text-[17px] leading-[1.6]", dark ? "text-paper/80" : "text-ink", align === "center" && "mx-auto")}>{lede}</p>}
      {children}
    </Reveal>
  );
}

/** Small "placeholder" tag used wherever Goodcase still has to supply real material. */
export function PlaceholderTag({ children = "Placeholder", className, dark }: { children?: React.ReactNode; className?: string; dark?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-[26px] px-2.5 py-0.5 text-[11.5px] font-medium", dark ? "bg-paper/12 text-paper/80" : "bg-[#fff1cc] text-[#7a4b00]", className)}>
      {children}
    </span>
  );
}
