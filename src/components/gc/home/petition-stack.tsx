"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "motion/react";
import { Minus, MousePointer2, Plus } from "lucide-react";
import { useIsClient, useMediaQuery, usePrefersReducedMotion } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";
import { LAYERS, STAGE_MAX, TILES, activeFor } from "./layers";

/*
 * "How a Goodcase petition is built" — the Legora-inspired pinned 3D section.
 * Desktop with WebGL: a tall section whose sticky viewport holds the layer
 * list (left) and a three.js glass stack (right) that builds as you scroll.
 * Mobile, reduced motion or no WebGL: a CSS isometric stack driven by taps.
 */

const Scene = dynamic(() => import("./petition-stack-scene"), { ssr: false, loading: () => null });

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export function PetitionStack() {
  const isClient = useIsClient();
  const desktop = useMediaQuery("(min-width: 1024px)");
  const reduced = usePrefersReducedMotion();
  const [webgl] = useState(() => (typeof document === "undefined" ? false : hasWebGL()));
  const mode = isClient && desktop && !reduced && webgl ? "3d" : "css";
  return mode === "3d" ? <Pinned /> : <Stepper />;
}

/* ------------------------------------------------------------------ */
/* Desktop: pinned, scroll-driven three.js                              */
/* ------------------------------------------------------------------ */

function Pinned() {
  const outer = useRef<HTMLElement>(null);
  const stage = useRef(0);
  const bar = useRef<HTMLSpanElement>(null);
  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);
  const [split, setSplit] = useState(false);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const el = outer.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      const p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
      stage.current = p * STAGE_MAX;
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
      setActive(activeFor(stage.current));
      setSplit(stage.current > 6.5);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    // Sections below (GSAP ScrollTriggers) must re-measure now that this section is tall.
    const refresh = requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    const io = new IntersectionObserver(([e]) => setRunning(e.isIntersecting), { rootMargin: "200px 0px" });
    io.observe(el);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      io.disconnect();
      cancelAnimationFrame(refresh);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const goTo = useCallback((i: number) => {
    const el = outer.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const total = el.offsetHeight - window.innerHeight;
    const s = i === LAYERS.length - 1 ? STAGE_MAX : i + 0.05;
    window.scrollTo({ top: top + (s / STAGE_MAX) * total, behavior: "smooth" });
  }, []);

  return (
    <section ref={outer} id="petition-stack" className="relative bg-[#eef1ef]" style={{ height: "640vh" }} aria-labelledby="stack-h" data-testid="petition-stack" data-mode="3d">
      <div className="dots-light sticky top-0 flex h-dvh flex-col overflow-hidden">
        <div className="container-page grid min-h-0 flex-1 grid-cols-[minmax(340px,0.9fr)_1.4fr] gap-8 pb-8 pt-[112px]">
          <div className="flex min-h-0 min-w-0 flex-col">
            <p className="eyebrow text-void">Inside every petition</p>
            <h2 id="stack-h" className="display-lg mt-3 max-w-[13ch]">
              How a Goodcase petition is built.
            </h2>
            <p className="mt-3 max-w-[40ch] text-[15.5px] leading-relaxed text-ink">Layer by layer — and the first layer is always yours.</p>
            <ol className="mt-6 min-h-0 space-y-1.5 overflow-y-auto pr-1 no-scrollbar" aria-label="Petition layers">
              {LAYERS.map((l, i) => {
                const on = active === i;
                return (
                  <li key={l.key}>
                    <button
                      type="button"
                      onClick={() => goTo(i)}
                      onMouseEnter={() => setHovered(i)}
                      onMouseLeave={() => setHovered(null)}
                      aria-current={on ? "step" : undefined}
                      aria-expanded={on}
                      className={cn(
                        "w-full rounded-[14px] text-left transition-colors duration-300",
                        on ? "bg-void px-4 py-3.5 text-paper" : "bg-paper/70 px-4 py-2.5 text-void hover:bg-paper",
                        !on && hovered === i && "bg-paper ring-2 ring-jade",
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <span className={cn("text-[12px] font-medium tabular", on ? "text-jade" : "text-muted")}>{String(i + 1).padStart(2, "0")}</span>
                        <span className="flex-1 text-[15.5px] font-medium">{l.title}</span>
                        <span className={cn("grid size-6 place-items-center rounded-full", on ? "bg-paper/15" : "bg-fog")}>{on ? <Minus className="size-3.5" aria-hidden /> : <Plus className="size-3.5" aria-hidden />}</span>
                      </span>
                      <AnimatePresence initial={false}>
                        {on && (
                          <motion.span initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }} className="block overflow-hidden">
                            <span className="block pl-8 pt-2 text-[14px] leading-relaxed text-paper/80">{l.body}</span>
                            <span className="mt-2 block pl-8 text-[12px] font-medium uppercase tracking-[0.14em] text-mint">{l.owner}</span>
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </button>
                  </li>
                );
              })}
            </ol>
            <div className="mt-5 flex items-center gap-4">
              <span className="relative h-1 w-40 overflow-hidden rounded-full bg-black/10" aria-hidden>
                <span ref={bar} className="absolute inset-0 origin-left rounded-full bg-void" style={{ transform: "scaleX(0)" }} />
              </span>
              <span className="text-[12.5px] text-muted tabular" aria-live="polite">
                Layer {active + 1} of {LAYERS.length}
              </span>
            </div>
          </div>

          <div className="relative min-h-0 min-w-0">
            <div className="absolute inset-0">{running && <Scene stage={stage} active={active} hovered={hovered} onHover={setHovered} onSelect={goTo} running={running} />}</div>
            <AnimatePresence>
              {split && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute right-0 top-4 rounded-[14px] bg-paper px-4 py-3 shadow-float">
                  <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-muted">Ready to sign</p>
                  <p className="mt-0.5 text-[15px] font-medium">{TILES.join(" · ")}</p>
                  <ButtonLink href="/case-drafting" size="sm" variant="dark" arrow className="mt-2">
                    See what&apos;s in each package
                  </ButtonLink>
                </motion.div>
              )}
            </AnimatePresence>
            <p className="pointer-events-none absolute bottom-2 right-0 flex items-center gap-1.5 text-[12px] text-muted">
              <MousePointer2 className="size-3.5" aria-hidden /> Move to tilt · hover a layer · scroll to build
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Mobile / reduced motion / no WebGL: CSS isometric stack              */
/* ------------------------------------------------------------------ */

function Stepper() {
  const [active, setActive] = useState(LAYERS.length - 1);
  return (
    <section id="petition-stack" className="dots-light bg-[#eef1ef] py-[var(--space-section)]" aria-labelledby="stack-h" data-testid="petition-stack" data-mode="css">
      <div className="container-page grid grid-cols-1 gap-x-10 gap-y-8 lg:grid-cols-[0.9fr_1.2fr] lg:grid-rows-[auto_1fr]">
        <div className="min-w-0">
          <p className="eyebrow text-void">Inside every petition</p>
          <h2 id="stack-h" className="display-lg mt-3 max-w-[14ch]">
            How a Goodcase petition is built.
          </h2>
          <p className="mt-3 max-w-[40ch] text-[15.5px] leading-relaxed text-ink">Layer by layer — and the first layer is always yours. Tap a layer to see who owns it.</p>
        </div>
        <div className="min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-center">
          <CssStack active={active} onSelect={setActive} />
        </div>
        <ol className="min-w-0 space-y-1.5" aria-label="Petition layers">
          {LAYERS.map((l, i) => {
            const on = active === i;
            return (
              <li key={l.key}>
                <button type="button" onClick={() => setActive(i)} aria-expanded={on} className={cn("w-full rounded-[14px] px-4 text-left transition-colors", on ? "bg-void py-3.5 text-paper" : "bg-paper/70 py-2.5 hover:bg-paper")}>
                  <span className="flex items-center gap-3">
                    <span className={cn("text-[12px] font-medium tabular", on ? "text-jade" : "text-muted")}>{String(i + 1).padStart(2, "0")}</span>
                    <span className="flex-1 text-[15.5px] font-medium">{l.title}</span>
                    <span className={cn("grid size-6 place-items-center rounded-full", on ? "bg-paper/15" : "bg-fog")}>{on ? <Minus className="size-3.5" aria-hidden /> : <Plus className="size-3.5" aria-hidden />}</span>
                  </span>
                  {on && (
                    <span className="block pb-0.5 pl-8 pt-2">
                      <span className="block text-[14px] leading-relaxed text-paper/80">{l.body}</span>
                      <span className="mt-2 block text-[12px] font-medium uppercase tracking-[0.14em] text-mint">{l.owner}</span>
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

function CssStack({ active, onSelect }: { active: number; onSelect: (i: number) => void }) {
  return (
    <div className="relative mx-auto grid h-[380px] w-full max-w-[560px] place-items-center overflow-hidden sm:h-[520px]" aria-hidden>
      <div className="relative h-[200px] w-[290px] scale-[0.82] [transform-style:preserve-3d] sm:scale-100" style={{ transform: "rotateX(58deg) rotateZ(-42deg)" }}>
        {LAYERS.map((l, i) => {
          const on = active === i;
          const top = i === LAYERS.length - 1;
          return (
            <div
              key={l.key}
              onClick={() => onSelect(i)}
              className={cn(
                "absolute inset-0 cursor-pointer rounded-[18px] border transition-[background-color,border-color,box-shadow] duration-300",
                l.tone === "ink" ? "border-white/10 bg-[#0d0d0d] text-paper" : "border-white/80 text-void backdrop-blur-[2px]",
                l.tone !== "ink" && (on ? "bg-mint/75" : l.tone === "jade" ? "bg-[#d9fbe8]/70" : "bg-white/55"),
                on && "border-jade shadow-[0_0_0_2px_#00c27a]",
                top && "bg-transparent! border-transparent! shadow-none!",
              )}
              style={{ transform: `translateZ(${i * 30}px)`, boxShadow: on ? undefined : "0 18px 30px -18px rgba(11,42,28,0.35)" }}
            >
              {top ? (
                <div className="grid h-full grid-cols-3 grid-rows-2 gap-1.5">
                  {TILES.map((t) => (
                    <div key={t} className={cn("flex items-end rounded-[12px] border border-white/80 p-2 text-[12px] font-semibold", on ? "bg-mint" : "bg-[#e9fff1]/85")} style={{ transform: on ? "translateZ(14px)" : undefined, transition: "transform 400ms cubic-bezier(0.23,1,0.32,1)" }}>
                      {t}
                    </div>
                  ))}
                </div>
              ) : (
                <span className={cn("absolute bottom-3 left-4 font-display text-[19px] italic leading-none", l.tone === "ink" && "text-paper")}>{l.title}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
