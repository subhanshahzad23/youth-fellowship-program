import { Suspense } from "react";
import { AnnouncementInbox } from "@/components/announcements/inbox";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AnnouncementInbox base="/staff/announcements" settingsHref="/staff/settings" />
    </Suspense>
  );
}
