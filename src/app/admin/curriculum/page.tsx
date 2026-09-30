import { Suspense } from "react";
import { CurriculumView } from "./view";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CurriculumView />
    </Suspense>
  );
}
