"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import type { Cohort } from "@/lib/domain/types";
import { registerInterest } from "@/lib/actions/comms";
import { sleep } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { DialogContent, DialogRoot } from "@/components/ui/overlay";

/** Simulated interest registration for cohorts whose window isn't open. */
export function InterestDialog({ cohort, open, onOpenChange, opensLabel }: { cohort: Cohort; open: boolean; onOpenChange: (v: boolean) => void; opensLabel?: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<null | "new" | "dup">(null);

  const close = (v: boolean) => {
    onOpenChange(v);
    if (!v) setTimeout(() => setDone(null), 200);
  };

  return (
    <DialogRoot open={open} onOpenChange={close}>
      <DialogContent
        title={done ? "You're on the list" : `Register interest in ${cohort.name}`}
        description={done ? undefined : `${opensLabel ?? "We'll email you the day applications open."} Simulated — no email is actually sent.`}
        size="sm"
        footer={
          done ? (
            <Button variant="dark" onClick={() => close(false)}>
              Done
            </Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => close(false)}>
                Cancel
              </Button>
              <Button
                variant="dark"
                loading={busy}
                onClick={async () => {
                  setErr(null);
                  setBusy(true);
                  await sleep(400);
                  const r = registerInterest(cohort.id, name, email);
                  setBusy(false);
                  if (!r.ok) return setErr(r.error);
                  setDone(r.value.duplicate ? "dup" : "new");
                  if (!r.value.duplicate) toast.success(`Interest registered for ${cohort.name}`, { description: "A simulated confirmation was added to the outbox." });
                }}
              >
                Register interest
              </Button>
            </>
          )
        }
      >
        {done ? (
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 size-5 text-leaf-ink" aria-hidden />
            <p className="text-[15px] leading-relaxed">
              {done === "dup" ? "That email is already registered for this cohort — nothing else to do." : `Thanks, ${name.split(" ")[0]}. We'll let you know the day ${cohort.name} applications open.`}
            </p>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <Field label="Your name" htmlFor="int-name" required error={err && /name/i.test(err) ? err : undefined}>
              <Input id="int-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
            </Field>
            <Field label="Email" htmlFor="int-email" required hint="Use a made-up address for the demo." error={err && /email/i.test(err) ? err : undefined}>
              <Input id="int-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" />
            </Field>
            {err && !/name|email/i.test(err) && <p className="text-[13.5px] text-[#b00d28]">{err}</p>}
          </form>
        )}
      </DialogContent>
    </DialogRoot>
  );
}
