import { Suspense } from "react";
import { AnnouncementsView } from "./view";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AnnouncementsView />
    </Suspense>
  );
}
