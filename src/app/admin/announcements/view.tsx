"use client";

import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/ui/display";
import { CohortContextInline } from "@/components/admin/cohort-context";
import { AnnouncementComposer } from "@/components/admin/announcements/composer";
import { AnnouncementDetail } from "@/components/admin/announcements/detail";
import { AnnouncementHistory } from "@/components/admin/announcements/history";

export function AnnouncementsView() {
  const params = useSearchParams();
  const id = params.get("id");
  const edit = params.get("edit") ?? undefined;
  const scope = params.get("scope") ?? undefined;

  if (id) return <AnnouncementDetail key={id} id={id} />;

  return (
    <>
      <PageHeader
        eyebrow="Program admin"
        title="Announcements"
        description="Reach a whole cohort at once. Each announcement lands under the bell and, for people who opted in, as a simulated email."
        actions={<CohortContextInline />}
      />
      <AnnouncementComposer key={edit ?? `new-${scope ?? ""}`} editId={edit} presetScope={scope} />
      <AnnouncementHistory />
    </>
  );
}
