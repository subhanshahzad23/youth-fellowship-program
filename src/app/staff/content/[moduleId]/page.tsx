import { Suspense } from "react";
import { ModuleContentView } from "./view";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ModuleContentView />
    </Suspense>
  );
}
