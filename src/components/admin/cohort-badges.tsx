"use client";

import { CalendarClock, CheckCircle2, CircleDashed, DoorClosed, DoorOpen, Inbox, Megaphone, PlayCircle } from "lucide-react";
import type { ApplicationForm, Cohort } from "@/lib/domain/types";
import { windowState } from "@/lib/domain/selectors";
import { fmtDate } from "@/lib/utils";
import { Badge } from "@/components/ui/display";

export const COHORT_STATUS_LABEL: Record<Cohort["status"], string> = {
  active: "Active",
  intake: "Intake",
  announced: "Announced",
  completed: "Completed",
};

export function CohortStatusBadge({ status }: { status: Cohort["status"] }) {
  switch (status) {
    case "active":
      return (
        <Badge tone="green" icon={<PlayCircle className="size-3.5" aria-hidden />}>
          Active
        </Badge>
      );
    case "intake":
      return (
        <Badge tone="blue" icon={<Inbox className="size-3.5" aria-hidden />}>
          Intake
        </Badge>
      );
    case "announced":
      return (
        <Badge tone="neutral" icon={<Megaphone className="size-3.5" aria-hidden />}>
          Announced
        </Badge>
      );
    case "completed":
      return (
        <Badge tone="dark" icon={<CheckCircle2 className="size-3.5" aria-hidden />}>
          Completed
        </Badge>
      );
  }
}

/** Application window state for a cohort's form, with the relevant date. */
export function windowSummary(form: ApplicationForm | undefined, now: string) {
  const state = windowState(form, now);
  switch (state) {
    case "open":
      return { state, label: "Applications open", detail: `Closes ${fmtDate(form!.closesAt)}` };
    case "upcoming":
      return { state, label: "Opens soon", detail: `Opens ${fmtDate(form!.opensAt)}` };
    case "closed":
      return { state, label: "Window closed", detail: `Closed ${fmtDate(form!.closesAt)}` };
    default:
      return { state, label: form ? "Form not published" : "No form yet", detail: form ? "Draft form — publish to open applications" : "Create an application form to open intake" };
  }
}

export function WindowBadge({ form, now }: { form: ApplicationForm | undefined; now: string }) {
  const s = windowSummary(form, now);
  const map = {
    open: { tone: "green" as const, Icon: DoorOpen },
    upcoming: { tone: "blue" as const, Icon: CalendarClock },
    closed: { tone: "neutral" as const, Icon: DoorClosed },
    unpublished: { tone: "amber" as const, Icon: CircleDashed },
  }[s.state];
  return (
    <Badge tone={map.tone} icon={<map.Icon className="size-3.5" aria-hidden />}>
      {s.label}
    </Badge>
  );
}
