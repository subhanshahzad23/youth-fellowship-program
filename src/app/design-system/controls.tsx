"use client";

import { useState } from "react";
import { Checkbox, Field, Input, Select, Switch } from "@/components/ui/form";
import { Segmented } from "@/components/ui/overlay";

/** Live form controls for the design-system page. */
export function DesignSystemControls() {
  const [email, setEmail] = useState("name@");
  const [checked, setChecked] = useState(true);
  const [on, setOn] = useState(false);
  const [view, setView] = useState<"am" | "24">("am");
  const invalid = !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  return (
    <div className="mt-4 grid min-w-0 grid-cols-1 gap-6 rounded-[24px] bg-fog p-6 sm:p-8 lg:grid-cols-2">
      <div className="min-w-0 space-y-5">
        <p className="eyebrow text-muted">Form controls</p>
        <Field label="Work email" required htmlFor="ds-email" error={invalid ? "Enter a valid work email, like name@yourfirm.com" : undefined}>
          <Input id="ds-email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={invalid || undefined} />
        </Field>
        <Field label="Typical volume" htmlFor="ds-vol">
          <Select id="ds-vol" defaultValue="3–5 cases a month">
            <option>1–2 cases a month</option>
            <option>3–5 cases a month</option>
            <option>6–15 cases a month</option>
          </Select>
        </Field>
      </div>
      <div className="min-w-0 space-y-5 lg:pt-8">
        <Checkbox checked={checked} onChange={setChecked} label="Send me the newsletter" description="One email a month." />
        <Switch checked={on} onCheckedChange={setOn} label="24-hour clock" description="Booking calendar preference" />
        <Segmented label="Clock format" value={view} onChange={setView} options={[{ value: "am", label: "am/pm" }, { value: "24", label: "24h" }]} />
      </div>
    </div>
  );
}
