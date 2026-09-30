import type { Metadata } from "next";
import { ApplyFrame } from "@/components/apply/apply-frame";

export const metadata: Metadata = { title: "Apply" };

export default function ApplyLayout({ children }: { children: React.ReactNode }) {
  return <ApplyFrame>{children}</ApplyFrame>;
}
