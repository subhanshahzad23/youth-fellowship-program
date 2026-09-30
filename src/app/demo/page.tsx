import type { Metadata } from "next";
import { DemoExplorer } from "./explorer";

export const metadata: Metadata = { title: "Explore the demo" };

export default function DemoPage() {
  return <DemoExplorer />;
}
