import { Suspense } from "react";
import { PeopleView } from "./view";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PeopleView />
    </Suspense>
  );
}
