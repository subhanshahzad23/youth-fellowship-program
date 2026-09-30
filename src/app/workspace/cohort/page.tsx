import { Suspense } from "react";
import { CohortView } from "./view";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CohortView />
    </Suspense>
  );
}
