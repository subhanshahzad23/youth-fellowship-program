import { Suspense } from "react";
import { SafeguardingView } from "./view";

export default function SafeguardingPage() {
  return (
    <Suspense fallback={null}>
      <SafeguardingView />
    </Suspense>
  );
}
