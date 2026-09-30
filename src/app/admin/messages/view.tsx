"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, MessagesSquare } from "lucide-react";
import { totalUnread, visibleConversations } from "@/lib/domain/selectors";
import { useDb, useMe } from "@/lib/store/store";
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from "@/components/ui/overlay";
import { Inbox } from "@/components/messaging/inbox";
import { SupervisionView } from "@/components/messaging/supervision";

type View = "mine" | "supervision";

export function AdminMessagesView() {
  const db = useDb();
  const me = useMe()!;
  const params = useSearchParams();
  const router = useRouter();
  const requested = params.get("view");
  const c = params.get("c");
  const conv = c ? db.conversations[c] : undefined;
  // A conversation link without an explicit view opens where it belongs: your inbox if you're in it, otherwise supervision.
  const tab: View = requested === "mine" || requested === "supervision" ? requested : conv && !conv.participantIds.includes(me.id) ? "supervision" : "mine";
  const unread = totalUnread(db, me.id);
  const inScope = useMemo(() => visibleConversations(db, me.id, "supervision").length, [db, me.id]);

  return (
    <TabsRoot value={tab} onValueChange={(v) => router.push(`/admin/messages?view=${v}`, { scroll: false })} className="flex min-h-0 flex-1 flex-col">
      <div className="mb-3 flex shrink-0 flex-wrap items-end justify-between gap-x-4 gap-y-1">
        <div>
          <p className="eyebrow text-muted">Program admin</p>
          <h1 className="font-display text-[32px] leading-[1.05] tracking-[-0.035em] sm:text-[36px]">Messages</h1>
        </div>
        <TabsList aria-label="Messages view" className="border-b-0">
          <TabsTrigger value="mine">
            <MessagesSquare className="size-4" aria-hidden />
            My conversations
            {unread > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-jade px-1.5 text-[11px] font-semibold text-void tabular">{unread}</span>}
          </TabsTrigger>
          <TabsTrigger value="supervision">
            <Eye className="size-4" aria-hidden />
            Supervision
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-fog px-1.5 text-[11px] font-semibold tabular">{inScope}</span>
          </TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="mine" className="min-h-0 flex-1 focus-visible:outline-none">
        <Inbox portal="admin" title="My conversations" headingLevel={2} />
      </TabsContent>
      <TabsContent value="supervision" className="min-h-0 flex-1 focus-visible:outline-none">
        <SupervisionView />
      </TabsContent>
    </TabsRoot>
  );
}
