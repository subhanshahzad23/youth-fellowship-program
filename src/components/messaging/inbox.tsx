"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Eye, PenSquare } from "lucide-react";
import type { Portal } from "@/lib/domain/permissions";
import { canMessage, conversationAccess, isAdmin } from "@/lib/domain/permissions";
import { totalUnread, visibleConversations } from "@/lib/domain/selectors";
import { useNow } from "@/lib/hooks";
import { useDb, useMe } from "@/lib/store/store";
import { cn } from "@/lib/utils";
import { Button, ButtonLink } from "@/components/ui/button";
import { ThreadNotice } from "./bits";
import { ConversationRows, SearchBox, useConversationRows } from "./conversation-list";
import { NewMessageDialog } from "./new-message-dialog";
import { NoThreadSelected, Thread } from "./thread";
import { findDirectConversation, hrefWith } from "./lib";

/**
 * Participant inbox shared by the fellow workspace, staff portal and the
 * admin "My conversations" tab. URL state: ?c=<conversationId> selects a
 * thread, ?to=<userId> opens the composer for that person.
 */
export function Inbox({ portal, title = "Messages", headingLevel = 1 }: { portal: Portal; title?: string; headingLevel?: 1 | 2 }) {
  const db = useDb();
  const me = useMe()!;
  const now = useNow();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [composeOpen, setComposeOpen] = useState(false);

  const selectedId = params.get("c");
  const to = params.get("to");
  const conversations = useMemo(() => visibleConversations(db, me.id, "inbox"), [db, me.id]);
  const rows = useConversationRows(db, conversations, me.id, "participant", query);
  const unread = totalUnread(db, me.id);

  const selected = selectedId ? db.conversations[selectedId] : undefined;
  const access = selected ? conversationAccess(db, me.id, selected) : undefined;

  // ?to=<userId>: jump to an existing thread with that person, otherwise open the composer.
  const toDecision = to ? canMessage(db, me.id, to) : null;
  const existingForTo = to && toDecision?.ok ? findDirectConversation(db, me.id, to) : undefined;
  const existingId = existingForTo?.id;
  useEffect(() => {
    if (existingId) router.replace(hrefWith(pathname, params, { to: null, c: existingId }), { scroll: false });
  }, [existingId, pathname, params, router]);

  const dialogOpen = composeOpen || (!!to && !existingId);
  const closeDialog = () => {
    setComposeOpen(false);
    if (to) router.replace(hrefWith(pathname, params, { to: null }), { scroll: false });
  };

  const hrefFor = (id: string) => hrefWith(pathname, params, { c: id, to: null });
  const listHref = hrefWith(pathname, params, { c: null, to: null });
  const H = headingLevel === 1 ? "h1" : "h2";

  const newButton = (
    <Button size="sm" variant="dark" icon={<PenSquare className="size-4" />} onClick={() => setComposeOpen(true)}>
      New message
    </Button>
  );

  let thread: React.ReactNode;
  if (!selectedId) thread = <NoThreadSelected action={newButton} />;
  else if (!selected)
    thread = <ThreadNotice kind="missing" title="We couldn't find that conversation" reason="It may have been removed, the link may be mistyped, or the demo data may have been reset." backHref={listHref} />;
  else if (!access?.view) thread = <ThreadNotice kind="denied" title="You don't have access to this conversation" reason={access?.reason ?? "This conversation is outside your scope."} backHref={listHref} />;
  else if (access.mode !== "participant")
    thread = (
      <ThreadNotice
        kind="denied"
        title="This conversation isn't in your inbox"
        reason="You aren't a participant, so it doesn't appear in your inbox. Admins who supervise this cohort can review it read-only from Supervision."
        backHref={listHref}
        extra={
          portal === "admin" && isAdmin(db, me.id) ? (
            <ButtonLink href={`/admin/messages?view=supervision&c=${selected.id}`} variant="outline" icon={<Eye className="size-4" />}>
              Open in Supervision
            </ButtonLink>
          ) : undefined
        }
      />
    );
  else thread = <Thread key={selected.id} conv={selected} mode="participant" backHref={listHref} />;

  return (
    <div className="flex h-full min-h-0 overflow-hidden rounded-[20px] bg-paper">
      <aside className={cn("min-h-0 w-full shrink-0 flex-col border-line md:flex md:w-[320px] md:border-r lg:w-[356px]", selectedId ? "hidden" : "flex")} aria-label="Conversations">
        <div className="shrink-0 space-y-3 border-b border-line px-4 pb-3 pt-4">
          <div className="flex items-center justify-between gap-2">
            <H className={headingLevel === 1 ? "font-display text-[28px] leading-none tracking-[-0.03em]" : "text-[17px] font-semibold tracking-[-0.01em]"}>
              {title}
              {unread > 0 && <span className="sr-only">, {unread} unread</span>}
            </H>
            {newButton}
          </div>
          <SearchBox value={query} onChange={setQuery} label="Search conversations" placeholder="Search people or messages" />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <ConversationRows
            db={db}
            rows={rows}
            viewerId={me.id}
            mode="participant"
            selectedId={selectedId}
            hrefFor={hrefFor}
            now={now}
            emptyTitle={query ? "No matches" : "No conversations yet"}
            emptyDescription={query ? `Nothing matches “${query.trim()}” in your conversations.` : "Start one with New message — you'll only see people you're allowed to message."}
          />
        </div>
      </aside>
      <section className={cn("min-h-0 min-w-0 flex-1 flex-col md:flex", selectedId ? "flex" : "hidden")} aria-label="Conversation">
        {thread}
      </section>
      {dialogOpen && (
        <NewMessageDialog
          key={to ?? "new"}
          open={dialogOpen}
          onOpenChange={(v) => (v ? setComposeOpen(true) : closeDialog())}
          initialRecipientId={to}
          onSent={(convId) => {
            setComposeOpen(false);
            router.push(hrefWith(pathname, params, { c: convId, to: null }), { scroll: false });
          }}
        />
      )}
    </div>
  );
}
