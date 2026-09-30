"use client";

import { motion } from "motion/react";
import { ArrowLeft, HeartHandshake, MessageCircle, SearchX, ShieldAlert, Users } from "lucide-react";
import type { Conversation, ConversationKind, Database, ID } from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import { Avatar, Badge } from "@/components/ui/display";
import { ButtonLink } from "@/components/ui/button";
import { KIND_LABEL } from "./lib";

/**
 * Full-height frame for messaging screens: fills the viewport below the
 * portal topbar and cancels most of the shell's bottom padding, leaving room
 * for the floating demo control on small screens.
 */
export function MessagesFrame({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("-mb-9 flex h-[calc(100dvh-164px)] min-h-[520px] flex-col lg:-mb-[88px] lg:h-[calc(100dvh-128px)]", className)}>{children}</div>;
}

const KIND_ICON: Record<ConversationKind, typeof Users> = { direct: MessageCircle, mentor: HeartHandshake, group: Users };

export function KindChip({ kind, className }: { kind: ConversationKind; className?: string }) {
  const Icon = KIND_ICON[kind];
  return (
    <Badge tone={kind === "mentor" ? "green" : kind === "group" ? "blue" : "neutral"} className={cn("h-5 gap-1 px-2 text-[11.5px]", className)} icon={<Icon className="size-3" aria-hidden />}>
      {KIND_LABEL[kind]}
    </Badge>
  );
}

/** Avatar for a conversation: the other person, or a stacked pair for groups. */
export function ConversationAvatar({ db, conv, viewerId, size = 40 }: { db: Database; conv: Conversation; viewerId: ID | null; size?: number }) {
  const others = conv.participantIds.filter((p) => p !== viewerId).map((p) => db.users[p]).filter(Boolean);
  if (conv.kind !== "group" && others.length === 2) {
    // Supervisor view of a one-to-one conversation: show both people.
    const s = Math.round(size * 0.66);
    return (
      <span className="relative inline-block shrink-0" style={{ width: size, height: size }} aria-hidden>
        <Avatar name={others[0].name} hue={others[0].avatarHue} size={s} className="absolute left-0 top-0" />
        <Avatar name={others[1].name} hue={others[1].avatarHue} size={s} ring className="absolute bottom-0 right-0" />
      </span>
    );
  }
  if (conv.kind === "group" || others.length > 1) {
    return (
      <span className="relative inline-grid shrink-0 place-items-center rounded-full bg-[#e3edff] text-[#1e40af]" style={{ width: size, height: size }} aria-hidden>
        <Users style={{ width: size * 0.42, height: size * 0.42 }} strokeWidth={1.75} />
        <span className="absolute -bottom-0.5 -right-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-paper px-1 text-[10.5px] font-semibold text-void ring-1 ring-line tabular">
          {conv.participantIds.length}
        </span>
      </span>
    );
  }
  const o = others[0];
  return <Avatar name={o?.name ?? "?"} hue={o?.avatarHue} size={size} />;
}

export function TypingIndicator({ name }: { name: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
      className="flex items-center gap-2 pt-1"
      role="status"
    >
      <span className="inline-flex h-9 items-center gap-1 rounded-[18px] rounded-bl-[6px] bg-fog px-3.5" aria-hidden>
        <span className="typing-dot size-1.5 rounded-full bg-[#6b6b6b]" />
        <span className="typing-dot size-1.5 rounded-full bg-[#6b6b6b] [animation-delay:150ms]" />
        <span className="typing-dot size-1.5 rounded-full bg-[#6b6b6b] [animation-delay:300ms]" />
      </span>
      <span className="text-[12.5px] text-muted">{name} is typing…</span>
    </motion.div>
  );
}

/** Denied / missing panel shown inside the thread area (never a crash, always a way back). */
export function ThreadNotice({
  kind,
  title,
  reason,
  backHref,
  backLabel = "Back to inbox",
  extra,
}: {
  kind: "denied" | "missing";
  title: string;
  reason: string;
  backHref: string;
  backLabel?: string;
  extra?: React.ReactNode;
}) {
  return (
    <div className="grid h-full place-items-center overflow-y-auto p-6">
      <div className="w-full max-w-md">
        <span className={cn("grid size-12 place-items-center rounded-full", kind === "denied" ? "bg-[#fff1cc]" : "bg-fog")}>
          {kind === "denied" ? <ShieldAlert className="size-5 text-[#7a4b00]" aria-hidden /> : <SearchX className="size-5" aria-hidden />}
        </span>
        <h2 className="mt-4 font-display text-[28px] leading-tight tracking-[-0.03em]">{title}</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">{reason}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <ButtonLink href={backHref} variant="dark" icon={<ArrowLeft className="size-4" />}>
            {backLabel}
          </ButtonLink>
          {extra}
        </div>
      </div>
    </div>
  );
}
