import { Suspense } from "react";
import { CohortsView } from "./view";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CohortsView />
    </Suspense>
  );
}
