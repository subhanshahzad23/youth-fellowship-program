"use client";

import { createContext, useContext, useEffect, useState } from "react";

/** Lets a page name the last breadcrumb (e.g. an application reference). */
const Ctx = createContext<{ label: string | null; set: (l: string | null) => void }>({ label: null, set: () => {} });

export function CrumbProvider({ children }: { children: React.ReactNode }) {
  const [label, set] = useState<string | null>(null);
  return <Ctx.Provider value={{ label, set }}>{children}</Ctx.Provider>;
}

export function useCrumbLabel() {
  return useContext(Ctx).label;
}

export function useCrumb(label: string | null | undefined) {
  const { set } = useContext(Ctx);
  useEffect(() => {
    set(label ?? null);
    return () => set(null);
  }, [label, set]);
}
