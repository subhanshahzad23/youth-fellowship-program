import { Suspense } from "react";
import { MenteesView } from "./view";

export default function MenteesPage() {
  return (
    <Suspense fallback={null}>
      <MenteesView />
    </Suspense>
  );
}
