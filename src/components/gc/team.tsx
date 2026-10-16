import { TEAM, type TeamMember } from "@/lib/content/site";
import { cn, hashString, initials } from "@/lib/utils";
import { Reveal } from "@/components/site/reveal";

// Restrained portrait tones: paper greys with a quiet green or sand accent.
const TONES = [
  ["#eef1ef", "#1f3b2d"],
  ["#d5f8e0", "#007b3b"],
  ["#f1f1f1", "#333333"],
  ["#f3eee6", "#6b5a3e"],
  ["#e9eef5", "#2d4a73"],
  ["#e6ece8", "#00843f"],
] as const;

/** Monogram portrait standing in for team photography (Goodcase to supply real portraits). */
export function Portrait({ name, className, size = "md" }: { name: string; className?: string; size?: "sm" | "md" | "lg" }) {
  const [bg, ink] = TONES[hashString(name) % TONES.length];
  return (
    <div className={cn("dots-light relative grid aspect-[4/5] w-full place-items-center overflow-hidden rounded-[16px]", className)} style={{ backgroundColor: bg }} role="img" aria-label={`Portrait placeholder for ${name}`}>
      <span className={cn("font-display font-light tracking-[-0.04em]", size === "sm" ? "text-[26px]" : size === "lg" ? "text-[72px]" : "text-[52px]")} style={{ color: ink }}>
        {initials(name)}
      </span>
      {size !== "sm" && <span className="absolute bottom-2 left-2 rounded-[6px] bg-paper/80 px-1.5 py-0.5 text-[10px] font-medium text-muted backdrop-blur">Photo to come</span>}
    </div>
  );
}

export function TeamCard({ m, bio = true }: { m: TeamMember; bio?: boolean }) {
  return (
    <div className="min-w-0">
      <Portrait name={m.name} />
      <p className="mt-3 text-[16px] font-medium leading-tight">{m.name}</p>
      <p className="mt-0.5 text-[14px] text-muted">{m.role}</p>
      {bio && <p className="mt-2 text-[13.5px] leading-relaxed text-ink">{m.bio}</p>}
    </div>
  );
}

/** Full team grid grouped by role (About page). */
export function TeamGrid() {
  const groups = ["Leadership", "Team leads", "Case managers", "Legal writers"] as const;
  return (
    <div className="space-y-14">
      {groups.map((g) => (
        <div key={g}>
          <p className="eyebrow border-b border-line pb-3 text-muted">{g}</p>
          <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {TEAM.filter((m) => m.group === g).map((m, i) => (
              <Reveal as="li" key={m.name} delay={(i % 5) * 0.05}>
                <TeamCard m={m} />
              </Reveal>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/** Six-person preview used on the home page. */
export function TeamPreview() {
  const pick = ["Piotr Messerszmidt", "Monica Prado", "Francesco Cortese", "Marta Gronkiewicz", "Barbara Lage", "Lizy Mary Kurian"];
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-6">
      {pick.map((n, i) => {
        const m = TEAM.find((t) => t.name === n)!;
        return (
          <Reveal as="li" key={n} delay={i * 0.05}>
            <TeamCard m={m} bio={false} />
          </Reveal>
        );
      })}
    </ul>
  );
}
