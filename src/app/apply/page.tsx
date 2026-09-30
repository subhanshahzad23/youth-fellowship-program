"use client";

import { useHydrated } from "@/lib/store/store";
import { ApplySkeleton, IntakeIndex } from "@/components/apply/window-states";

export default function ApplyIndexPage() {
  const hydrated = useHydrated();
  return hydrated ? <IntakeIndex /> : <ApplySkeleton />;
}
