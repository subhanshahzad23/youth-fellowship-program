import { Suspense } from "react";
import { ReviewQueue } from "./queue";

export default function ApplicationsPage() {
  return (
    <Suspense fallback={null}>
      <ReviewQueue />
    </Suspense>
  );
}
