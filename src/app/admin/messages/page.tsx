import { Suspense } from "react";
import { MessagesFrame } from "@/components/messaging/bits";
import { AdminMessagesView } from "./view";

export default function AdminMessagesPage() {
  return (
    <MessagesFrame>
      <Suspense fallback={null}>
        <AdminMessagesView />
      </Suspense>
    </MessagesFrame>
  );
}
