import type { Metadata } from "next";
import { AI_USE_POLICY } from "@/lib/content/policies";
import { PublicHero, PublicShell } from "@/components/site/public-shell";
import { PolicyArticle, PolicyContact, PolicyHeroMeta } from "@/components/gc/policy";

export const metadata: Metadata = {
  title: "AI Use Policy",
  description:
    "How Goodcase uses — and doesn’t use — artificial intelligence in paralegal support. Client data never goes into AI tools, people prepare every document, and every citation is verified by a team member.",
};

export default function AiUsePolicyPage() {
  const policy = AI_USE_POLICY;
  return (
    <PublicShell>
      <PublicHero eyebrow="Legal" title={policy.title} offer={false}>
        <p className="mt-6 max-w-[620px] text-[17px] leading-[1.6] text-paper/80 sm:text-[18px]">{policy.summary}</p>
        <PolicyHeroMeta policy={policy} />
      </PublicHero>
      <PolicyArticle policy={policy} />
      <PolicyContact other={{ href: "/privacy-policy", title: "Privacy Policy" }} />
    </PublicShell>
  );
}
