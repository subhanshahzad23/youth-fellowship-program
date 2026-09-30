import { Suspense } from "react";
import { AnnouncementInbox } from "@/components/announcements/inbox";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AnnouncementInbox base="/workspace/announcements" settingsHref="/workspace/settings" />
    </Suspense>
  );
}
