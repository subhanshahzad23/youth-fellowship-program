"use client";

import { SlidersHorizontal, UserRound } from "lucide-react";
import type { Database, ID } from "@/lib/domain/types";
import { Avatar } from "@/components/ui/display";
import { actorName } from "./audit-format";

/** Avatar for an audit actor; demo control and visitors get a neutral glyph instead of initials. */
export function ActorAvatar({ db, actorId, size = 32 }: { db: Database; actorId: ID; size?: number }) {
  const u = db.users[actorId];
  if (u) return <Avatar name={u.name} hue={u.avatarHue} size={size} />;
  const Icon = actorId === "demo_control" ? SlidersHorizontal : UserRound;
  return (
    <span className="grid shrink-0 place-items-center rounded-full bg-ash" style={{ width: size, height: size }} title={actorName(db, actorId)} aria-hidden>
      <Icon className="size-3.5" />
    </span>
  );
}
