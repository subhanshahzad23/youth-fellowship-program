import { Suspense } from "react";
import { MessagesFrame } from "@/components/messaging/bits";
import { Inbox } from "@/components/messaging/inbox";

export default function WorkspaceMessagesPage() {
  return (
    <MessagesFrame>
      <Suspense fallback={null}>
        <Inbox portal="workspace" />
      </Suspense>
    </MessagesFrame>
  );
}
