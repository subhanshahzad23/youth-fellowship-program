import { cn } from "@/lib/utils";

/*
 * Client logo row. Goodcase hasn't confirmed which firms may be named, so the
 * row shows neutral placeholder wordmarks and says so — never invented clients.
 */
const SHAPES = ["Firm one", "Firm two", "Firm three", "Firm four", "Firm five", "Firm six"];

export function ClientLogoRow({ className, label = "Trusted by U.S. immigration law firms from solo practices to high-volume teams" }: { className?: string; label?: string }) {
  return (
    <section className={cn("bg-paper pb-4", className)} aria-labelledby="logos-h">
      <div className="container-page">
        <h2 id="logos-h" className="text-center text-[13px] font-light uppercase tracking-[0.22em] text-void">
          {label}
        </h2>
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {SHAPES.map((s, i) => (
            <li key={s} className="flex h-[72px] items-center justify-center gap-2 rounded-[12px] bg-fog text-[#9a9a9a]">
              <span aria-hidden className={cn("size-5 shrink-0 bg-[#c9c9c9]", i % 3 === 0 ? "rounded-full" : i % 3 === 1 ? "rounded-[4px]" : "rotate-45 rounded-[3px]")} />
              <span className="text-[15px] font-semibold tracking-[-0.02em]">Client logo</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-center text-[12.5px] text-muted">Placeholder row — real client logos appear once firms approve being named.</p>
      </div>
    </section>
  );
}
