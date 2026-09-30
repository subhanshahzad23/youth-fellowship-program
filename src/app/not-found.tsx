import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main id="main" className="dots-dark flex min-h-dvh flex-col text-paper">
      <div className="container-page flex h-20 items-center">
        <Link href="/" aria-label="Launchpad Fellowship home">
          <Logo dark />
        </Link>
      </div>
      <div className="container-page flex flex-1 flex-col justify-center pb-24">
        <p className="eyebrow text-muted-display">404 · page not found</p>
        <h1 className="display-hero mt-4 max-w-[14ch]">
          <span className="text-muted-display">This page doesn&apos;t exist.</span> Let&apos;s get you back on track.
        </h1>
        <div className="mt-10 flex flex-wrap gap-3">
          <ButtonLink href="/" size="lg" arrow>
            Go to the homepage
          </ButtonLink>
          <ButtonLink href="/demo" size="lg" variant="ghost-dark">
            Explore the demo
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}
