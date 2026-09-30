import { Suspense } from "react";
import { SubmissionsView } from "./view";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <SubmissionsView />
    </Suspense>
  );
}
