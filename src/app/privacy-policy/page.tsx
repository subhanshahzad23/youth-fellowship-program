import type { Metadata } from "next";
import { PRIVACY_POLICY } from "@/lib/content/policies";
import { PublicHero, PublicShell } from "@/components/site/public-shell";
import { PolicyArticle, PolicyContact, PolicyHeroMeta } from "@/components/gc/policy";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Goodcase.io Sp. z o.o. processes personal data under the GDPR: the controller, legal bases for processing, your rights, transfers outside the EEA, cookies and profiling.",
};

export default function PrivacyPolicyPage() {
  const policy = PRIVACY_POLICY;
  return (
    <PublicShell>
      <PublicHero eyebrow="Legal" title={policy.title} offer={false}>
        <p className="mt-6 max-w-[620px] text-[17px] leading-[1.6] text-paper/80 sm:text-[18px]">{policy.summary}</p>
        <PolicyHeroMeta policy={policy} />
      </PublicHero>
      <PolicyArticle policy={policy} />
      <PolicyContact other={{ href: "/ai-use-policy", title: "AI Use Policy" }} />
    </PublicShell>
  );
}
