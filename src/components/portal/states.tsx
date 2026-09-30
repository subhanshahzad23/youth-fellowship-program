"use client";

import { SearchX, ShieldAlert } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

/** Missing-record recovery: explains what happened and offers a working destination. */
export function RecordNotFound({ what, backHref, backLabel, detail }: { what: string; backHref: string; backLabel: string; detail?: string }) {
  return (
    <div className="mx-auto max-w-xl rounded-[24px] bg-paper p-8 text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-full bg-fog">
        <SearchX className="size-5" aria-hidden />
      </span>
      <h1 className="mt-4 font-display text-[30px] leading-tight tracking-[-0.03em]">We couldn&apos;t find that {what}</h1>
      <p className="mt-2 text-[15px] text-muted">{detail ?? `It may have been removed, the link may be mistyped, or the demo data may have been reset.`}</p>
      <div className="mt-6 flex justify-center">
        <ButtonLink href={backHref} arrow>
          {backLabel}
        </ButtonLink>
      </div>
    </div>
  );
}

/** Intentional denial inside a portal (e.g. a direct URL to a record outside your scope). */
export function Denied({ title = "You don't have access to this", reason, backHref, backLabel }: { title?: string; reason: string; backHref: string; backLabel: string }) {
  return (
    <div className="mx-auto max-w-xl rounded-[24px] bg-paper p-8">
      <span className="grid size-12 place-items-center rounded-full bg-[#fff1cc]">
        <ShieldAlert className="size-5 text-[#7a4b00]" aria-hidden />
      </span>
      <h1 className="mt-4 font-display text-[30px] leading-tight tracking-[-0.03em]">{title}</h1>
      <p className="mt-2 text-[15px] leading-relaxed text-muted">{reason}</p>
      <div className="mt-6">
        <ButtonLink href={backHref} arrow>
          {backLabel}
        </ButtonLink>
      </div>
    </div>
  );
}
