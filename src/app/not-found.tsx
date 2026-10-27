import Link from "next/link";
import { LinkButton } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <section className="bg-dark">
      <div className="container-site flex min-h-[60vh] flex-col items-start justify-center py-20">
        <p className="eyebrow text-accent">404 · Page not found</p>
        <h1 className="mt-3 text-[40px] font-bold text-white md:text-[56px]">This chapter isn&apos;t written yet</h1>
        <p className="mt-4 max-w-md text-cream/75">The page you were looking for has wandered off. Let&apos;s get you back to the story.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <LinkButton href="/">Back to home</LinkButton>
          <LinkButton href="/tourism" variant="outline-light">
            Explore Kanpur
          </LinkButton>
        </div>
        <Link href="/nearby" className="mt-6 text-sm font-semibold text-accent hover:underline">
          Or plan a trip beyond Kanpur →
        </Link>
      </div>
    </section>
  );
}
