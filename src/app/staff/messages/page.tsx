import { Suspense } from "react";
import { MessagesFrame } from "@/components/messaging/bits";
import { Inbox } from "@/components/messaging/inbox";

export default function StaffMessagesPage() {
  return (
    <MessagesFrame>
      <Suspense fallback={null}>
        <Inbox portal="staff" />
      </Suspense>
    </MessagesFrame>
  );
}
