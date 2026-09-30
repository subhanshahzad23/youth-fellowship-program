"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { canViewModule, fellowMembership } from "@/lib/domain/permissions";
import { sessionState } from "@/lib/domain/selectors";
import { useDb, useMe } from "@/lib/store/store";
import { Denied, RecordNotFound } from "@/components/portal/states";
import { useCrumb } from "@/components/portal/crumbs";
import { AssignmentPanel } from "@/components/learning/assignment-panel";
import { CompletionCard, SessionPager } from "@/components/learning/completion";
import { trackSessionsFlat } from "@/components/learning/data";
import { SessionStateBadge } from "@/components/learning/meta";
import { SessionReader, useHashScroll } from "@/components/learning/session-reader";

export default function SessionPage() {
  const { moduleId, sessionId } = useParams<{ moduleId: string; sessionId: string }>();
  const db = useDb();
  const me = useMe()!;
  const mod = db.modules[moduleId];
  const session = db.sessions[sessionId];
  const content = session && session.moduleId === moduleId ? session.published : undefined;
  const access = mod ? canViewModule(db, me.id, mod.id) : null;
  const visible = !!mod && !!access?.ok && !!content;

  useCrumb(visible ? content!.title : access?.ok ? mod?.title : undefined);
  useHashScroll(visible);

  const trackId = fellowMembership(db, me.id)?.trackId;
  const nav = useMemo(() => {
    if (!trackId) return { prev: undefined, next: undefined };
    const flat = trackSessionsFlat(db, trackId);
    const i = flat.findIndex((x) => x.session.id === sessionId);
    return { prev: i > 0 ? flat[i - 1] : undefined, next: i >= 0 && i < flat.length - 1 ? flat[i + 1] : undefined };
  }, [db, trackId, sessionId]);

  if (!mod) return <RecordNotFound what="module" backHref="/workspace/learning" backLabel="Back to your modules" />;
  if (access && !access.ok) return <Denied reason={access.reason} backHref="/workspace/learning" backLabel="Back to your track" />;
  if (!session || !content)
    return (
      <RecordNotFound
        what="session"
        backHref={`/workspace/learning#${mod.id}`}
        backLabel={`Back to ${mod.title}`}
      />
    );

  const state = sessionState(db, me.id, session);

  return (
    <>
      <Link href={`/workspace/learning#${mod.id}`} className="mb-4 inline-flex h-9 items-center gap-1 rounded-[8px] pr-2 text-[14px] text-muted hover:text-void">
        <ChevronLeft className="size-4" aria-hidden /> All modules
      </Link>
      <SessionReader
        key={`${me.id}:${session.id}`}
        content={content}
        kind={session.kind}
        eyebrow={
          <Link href={`/workspace/learning#${mod.id}`} className="eyebrow text-muted hover:text-void">
            Module {mod.order} · {mod.title}
          </Link>
        }
        meta={<SessionStateBadge state={state} />}
        renderTask={(b) => (session.kind === "task" ? <AssignmentPanel key={`${me.id}:${session.id}`} session={session} task={b} /> : null)}
        after={session.kind !== "task" ? <CompletionCard session={session} module={mod} next={nav.next} /> : null}
      >
        <SessionPager prev={nav.prev} next={nav.next} />
      </SessionReader>
    </>
  );
}
