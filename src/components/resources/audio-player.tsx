import { Play } from "lucide-react";
import { hashString, prng } from "@/lib/utils";
import { PlaceholderTag } from "@/components/gc/section";

/** "38 min" → "38:00" */
function clock(duration: string) {
  const m = Number.parseInt(duration, 10);
  return Number.isFinite(m) ? `${m}:00` : duration;
}

/**
 * Static audio-player mock. There is no audio yet: the play button is
 * disabled and the waveform is a deterministic decoration seeded by the slug.
 */
export function AudioPlayerMock({ seed, title, duration }: { seed: string; title: string; duration: string }) {
  const rand = prng(hashString(seed));
  const bars = Array.from({ length: 44 }, (_, i) => {
    const wave = 0.55 + 0.35 * Math.sin(i / 3.1);
    return Math.round(18 + 78 * Math.min(1, wave * (0.55 + rand() * 0.6)));
  });

  return (
    <div className="rounded-[24px] bg-paper p-5 text-void shadow-panel sm:p-6" data-testid="audio-mock">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="eyebrow text-muted">Listen</p>
        <PlaceholderTag>Audio player placeholder</PlaceholderTag>
      </div>
      <p className="mt-3 line-clamp-2 font-display text-[22px] leading-tight tracking-[-0.02em]">{title}</p>
      <div className="mt-5 flex items-center gap-4">
        <button
          type="button"
          disabled
          aria-label="Play episode (audio not available yet)"
          className="grid size-14 shrink-0 place-items-center rounded-full bg-jade text-void disabled:opacity-100"
        >
          <Play className="ml-0.5 size-5 fill-current" aria-hidden />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex h-12 items-center gap-[2px]" aria-hidden>
            {bars.map((h, i) => (
              <span key={i} className={i < 3 ? "min-w-0 flex-1 rounded-full bg-void" : "min-w-0 flex-1 rounded-full bg-void/20"} style={{ height: `${h}%` }} />
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[12.5px] text-muted tabular">
            <span>0:00</span>
            <span>{clock(duration)}</span>
          </div>
        </div>
      </div>
      <p className="mt-4 text-[12.5px] leading-relaxed text-muted">The recording will play here once the episode audio is connected.</p>
    </div>
  );
}
