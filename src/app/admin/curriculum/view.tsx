"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { BarChart3, DatabaseZap, Layers } from "lucide-react";
import { PageHeader } from "@/components/ui/display";
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from "@/components/ui/overlay";
import { NotionTab } from "./notion-tab";
import { ProgressTab } from "./progress-tab";
import { TracksTab } from "./tracks-tab";

const TABS = ["tracks", "progress", "notion"] as const;
type Tab = (typeof TABS)[number];

export function CurriculumView() {
  const search = useSearchParams();
  const raw = search.get("tab");
  const [tab, setTab] = useState<Tab>(TABS.includes(raw as Tab) ? (raw as Tab) : "tracks");
  const change = (v: string) => {
    setTab(v as Tab);
    // Keep the URL shareable without a navigation round-trip.
    window.history.replaceState(window.history.state, "", v === "tracks" ? window.location.pathname : `${window.location.pathname}?tab=${v}`);
  };

  return (
    <>
      <PageHeader
        eyebrow="Program administration"
        title="Curriculum"
        description="Three tracks, six modules each, delivered over 18 months. See how content is organized, how fellows are progressing, and bring in content from the Notion workspace."
      />
      <TabsRoot value={tab} onValueChange={change}>
        <TabsList aria-label="Curriculum sections" className="mb-5">
          <TabsTrigger value="tracks">
            <Layers className="size-4" aria-hidden /> Tracks &amp; modules
          </TabsTrigger>
          <TabsTrigger value="progress">
            <BarChart3 className="size-4" aria-hidden /> Progress
          </TabsTrigger>
          <TabsTrigger value="notion">
            <DatabaseZap className="size-4" aria-hidden /> Notion migration
          </TabsTrigger>
        </TabsList>
        <TabsContent value="tracks" className="outline-none">
          <TracksTab />
        </TabsContent>
        <TabsContent value="progress" className="outline-none">
          <ProgressTab />
        </TabsContent>
        <TabsContent value="notion" className="outline-none">
          <NotionTab />
        </TabsContent>
      </TabsRoot>
    </>
  );
}
