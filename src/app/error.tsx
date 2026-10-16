"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/button";

/** Friendly error boundary — never show raw exceptions to visitors. */
export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main id="main" className="grid min-h-dvh place-items-center bg-fog px-4 py-16">
      <div className="w-full max-w-lg rounded-[24px] bg-paper p-8">
        <p className="eyebrow text-muted">Something went wrong</p>
        <h1 className="mt-3 font-display text-[34px] leading-tight tracking-[-0.03em]">This page hit a snag.</h1>
        <p className="mt-2 text-[15.5px] leading-relaxed text-muted">Try again, or head back to the homepage. If it keeps happening, email info@goodcase.io and we&apos;ll take a look.</p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button onClick={reset} variant="dark">
            Try again
          </Button>
          <ButtonLink href="/" variant="outline">
            Homepage
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}
