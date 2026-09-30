import type { Metadata } from "next";
import { TRACKS } from "@/lib/seed/people";
import { PublicShell } from "@/components/site/public-shell";
import { TrackView } from "./view";

export async function generateMetadata({ params }: PageProps<"/tracks/[trackId]">): Promise<Metadata> {
  const { trackId } = await params;
  const t = TRACKS.find((x) => x.slug === trackId || x.id === trackId);
  return { title: t ? `${t.name} track` : "Track not found" };
}

export default async function TrackPage({ params }: PageProps<"/tracks/[trackId]">) {
  const { trackId } = await params;
  return (
    <PublicShell>
      <TrackView trackKey={trackId} />
    </PublicShell>
  );
}
