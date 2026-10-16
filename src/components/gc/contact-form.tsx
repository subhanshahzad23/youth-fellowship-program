"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { COMPANY } from "@/lib/content/site";
import { EMAIL_RE, useLeads } from "@/lib/leads";
import { Button } from "@/components/ui/button";
import { Checkbox, ErrorSummary, Field, fieldId, Input, Select, Textarea } from "@/components/ui/form";

const TOPICS = ["Case drafting", "Case management", "Pricing", "Casey", "Something else"] as const;

type Values = { name: string; email: string; firm: string; topic: string; message: string; marketing: boolean };
const EMPTY: Values = { name: "", email: "", firm: "", topic: "", message: "", marketing: false };

function validate(v: Values) {
  const issues: { field: keyof Values; message: string }[] = [];
  if (!v.name.trim()) issues.push({ field: "name", message: "Enter your name" });
  if (!EMAIL_RE.test(v.email.trim())) issues.push({ field: "email", message: "Enter a valid email, like name@yourfirm.com" });
  if (!v.topic) issues.push({ field: "topic", message: "Choose what your message is about" });
  if (v.message.trim().length < 20) issues.push({ field: "message", message: "Tell us a little more — at least 20 characters" });
  return issues;
}

/** Contact form — validated in the browser, simulated submission. */
export function ContactForm({ compact }: { compact?: boolean }) {
  const addMessage = useLeads((s) => s.addMessage);
  const [v, setV] = useState<Values>(EMPTY);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const issues = tried ? validate(v) : [];
  const err = (f: keyof Values) => issues.find((i) => i.field === f)?.message;
  const set = <K extends keyof Values>(k: K) => (val: Values[K]) => setV((s) => ({ ...s, [k]: val }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    const found = validate(v);
    if (found.length) {
      requestAnimationFrame(() => document.getElementById("contact-errors")?.focus());
      return;
    }
    setBusy(true);
    await new Promise((r) => setTimeout(r, 600));
    addMessage({ name: v.name.trim(), email: v.email.trim(), firm: v.firm.trim() || undefined, topic: v.topic, message: v.message.trim(), marketing: v.marketing });
    setBusy(false);
    setSent(v.name.trim().split(" ")[0]);
  };

  if (sent)
    return (
      <div role="status" className="rounded-[20px] bg-leaf p-6 text-leaf-ink sm:p-8" data-testid="contact-success">
        <CheckCircle2 className="size-7" aria-hidden />
        <p className="mt-3 text-[22px] font-medium tracking-[-0.01em] text-void">Thanks, {sent} — message received.</p>
        <p className="mt-2 text-[15px] leading-relaxed">{COMPANY.responseTime} A team lead will reply from info@goodcase.io.</p>
        <p className="mt-3 text-[13px] opacity-80">Design concept: your message stays in this browser and nothing is sent.</p>
        <Button
          variant="outline"
          className="mt-5"
          onClick={() => {
            setSent(null);
            setV(EMPTY);
            setTried(false);
          }}
        >
          Send another message
        </Button>
      </div>
    );

  return (
    <form onSubmit={submit} noValidate className="space-y-5" aria-label="Contact Goodcase" data-testid="contact-form">
      {issues.length > 0 && (
        <div id="contact-errors" tabIndex={-1}>
          <ErrorSummary issues={issues.map((i) => ({ field: `contact.${i.field}`, message: i.message }))} />
        </div>
      )}
      <div className={compact ? "grid grid-cols-1 gap-5" : "grid grid-cols-1 gap-5 sm:grid-cols-2"}>
        <div id={fieldId("contact.name")}>
          <Field label="Your name" required htmlFor="c-name" error={err("name")}>
            <Input id="c-name" autoComplete="name" value={v.name} onChange={(e) => set("name")(e.target.value)} aria-invalid={!!err("name") || undefined} aria-describedby={err("name") ? "c-name-error" : undefined} />
          </Field>
        </div>
        <div id={fieldId("contact.email")}>
          <Field label="Work email" required htmlFor="c-email" error={err("email")}>
            <Input id="c-email" type="email" autoComplete="email" inputMode="email" value={v.email} onChange={(e) => set("email")(e.target.value)} aria-invalid={!!err("email") || undefined} aria-describedby={err("email") ? "c-email-error" : undefined} />
          </Field>
        </div>
        <Field label="Firm" optional htmlFor="c-firm">
          <Input id="c-firm" autoComplete="organization" value={v.firm} onChange={(e) => set("firm")(e.target.value)} />
        </Field>
        <div id={fieldId("contact.topic")}>
          <Field label="What's it about?" required htmlFor="c-topic" error={err("topic")}>
            <Select id="c-topic" value={v.topic} onChange={(e) => set("topic")(e.target.value)} aria-invalid={!!err("topic") || undefined}>
              <option value="">Choose a topic</option>
              {TOPICS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </Select>
          </Field>
        </div>
      </div>
      <div id={fieldId("contact.message")}>
        <Field label="Message" required htmlFor="c-msg" error={err("message")} hint="Case types, monthly volume, deadlines — whatever helps us help you.">
          <Textarea id="c-msg" value={v.message} onChange={(e) => set("message")(e.target.value)} aria-invalid={!!err("message") || undefined} aria-describedby="c-msg-hint" />
        </Field>
      </div>
      <Checkbox checked={v.marketing} onChange={set("marketing")} label="Send me the Modern Immigration Practice newsletter" description="One email a month. Unsubscribe anytime." />
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" variant="dark" size="lg" arrow loading={busy}>
          Send message
        </Button>
        <p className="text-[13.5px] text-muted">{COMPANY.responseTime}</p>
      </div>
      <p className="text-[12.5px] text-muted">Please don&apos;t include client personal data in this form. Concept site: nothing is sent.</p>
    </form>
  );
}
