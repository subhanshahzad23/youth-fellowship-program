"use client";

import { useParams } from "next/navigation";
import { canManageForms } from "@/lib/domain/permissions";
import { useDb, useMe } from "@/lib/store/store";
import { Denied, RecordNotFound } from "@/components/portal/states";
import { useCrumb } from "@/components/portal/crumbs";
import { FormBuilder } from "./builder";

export default function FormBuilderPage() {
  const { formId } = useParams<{ formId: string }>();
  const db = useDb();
  const me = useMe()!;
  const form = db.forms[formId];
  const access = form ? canManageForms(db, me.id, form.cohortId) : null;

  useCrumb(form ? (access?.ok ? form.title : "Restricted") : "Not found");

  if (!form) return <RecordNotFound what="application form" backHref="/admin/forms" backLabel="Back to forms" />;
  if (access && !access.ok) return <Denied title="This form belongs to another cohort" reason={access.reason} backHref="/admin/forms" backLabel="Back to forms" />;
  return <FormBuilder key={form.id} formId={form.id} />;
}
