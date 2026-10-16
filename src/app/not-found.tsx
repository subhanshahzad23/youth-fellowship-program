import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main id="main" className="dots-dark on-dark flex min-h-dvh flex-col text-paper">
      <div className="container-page flex h-20 items-center">
        <Link href="/" aria-label="Goodcase home">
          <Logo dark />
        </Link>
      </div>
      <div className="container-page flex flex-1 flex-col justify-center pb-24">
        <p className="eyebrow text-muted-display">404 · page not found</p>
        <h1 className="display-hero mt-4 max-w-[15ch]">
          <span className="text-muted-display">This page isn&apos;t in the file.</span> Let&apos;s get you back to your case.
        </h1>
        <div className="mt-10 flex flex-wrap gap-3">
          <ButtonLink href="/" size="lg" arrow>
            Go to the homepage
          </ButtonLink>
          <ButtonLink href="/book-a-call" size="lg" variant="ghost-dark">
            Book a 30-minute call
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}
