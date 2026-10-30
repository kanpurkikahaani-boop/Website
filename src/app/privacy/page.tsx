import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/sections/PageHero";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Privacy Notice | Kanpur Ki Kahaani",
  description:
    "What Kanpur Ki Kahaani collects and why: newsletter email and city interests, optional analytics and embeds — and how to withdraw consent or erase your data.",
  path: "/privacy",
  ogImage: "/og/privacy",
});

const sections: { h: string; body: React.ReactNode }[] = [
  {
    h: "Who we are",
    body: "Kanpur Ki Kahaani is a travel and city guide to Kanpur and nearby cities, run as an academic digital marketing project. For this notice we are the “Data Fiduciary” under India's Digital Personal Data Protection Act, 2023 (DPDP Act).",
  },
  {
    h: "What we collect, and why",
    body: (
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <strong>Newsletter:</strong> your email address, the cities you tick (optional), where you signed up (home page, popup or a blog post), the date, and
          the fact that you gave consent. We use these only to send you the Kahaani letter.
        </li>
        <li>
          <strong>Analytics (optional):</strong> if enabled, Google Analytics and the Meta Pixel record anonymous usage, such as pages viewed, buttons
          clicked, approximate location and device type, so we can see what&apos;s useful.
        </li>
        <li>
          <strong>Basic security logs:</strong> your IP address is used briefly to limit repeated signup attempts. It isn&apos;t stored with your email.
        </li>
        <li>
          <strong>Team sign-in:</strong> only our editorial team signs in, to write blog posts. Visitors never need an account.
        </li>
      </ul>
    ),
  },
  {
    h: "Consent and your rights",
    body: (
      <>
        We rely on your consent, which you give by ticking or submitting a signup form. You can withdraw it at any time with the{" "}
        <em>Unsubscribe</em> link in every email. Under the DPDP Act you can also ask us to access, correct or erase your data, or nominate someone to act for you. Write
        to us through any of our social profiles linked in the footer and we&apos;ll respond within 30 days.
      </>
    ),
  },
  {
    h: "How long we keep it",
    body: "Subscriber records are kept while you're subscribed. After you unsubscribe we keep only the email and the unsubscribe date, so we don&apos;t email you again by mistake; you can ask us to delete even that. News headlines we display are deleted after 30 days.",
  },
  {
    h: "Who processes it for us",
    body: "Supabase (database and sign-in), Vercel (hosting), and — only if analytics are enabled — Google and Meta. We don't sell or rent your data, and we share it with no one else.",
  },
  {
    h: "Embedded content and links",
    body: "Maps, videos and music are embedded from Google Maps, YouTube (privacy-enhanced mode) and Spotify, and load only when you scroll to them or press play. News headlines link to the original publishers' websites, whose own privacy policies apply. Live weather comes from Open-Meteo using fixed city coordinates — we never ask for your location.",
  },
  {
    h: "Booking links",
    body: "“Book this stay” opens a third-party booking site with tracking tags (UTM parameters) so we can see which listings are popular. The booking site's own privacy policy applies once you leave this site.",
  },
];

export default function PrivacyPage() {
  return (
    <>
      <PageHero eyebrow="Kanpur Ki Kahaani" title="Privacy" subtitle="Short and plain: what this site collects, why, and how you stay in control." crumbs={[{ name: "Privacy" }]} />
      <div className="container-site max-w-3xl py-14">
        {sections.map((s) => (
          <section key={s.h} className="mb-9">
            <h2 className="text-2xl font-bold text-primary">{s.h}</h2>
            <div className="mt-2 leading-relaxed">{s.body}</div>
          </section>
        ))}
        <p className="text-sm">
          Last updated: 30 October 2026. Back to <Link href="/" className="text-primary underline">the home page</Link>.
        </p>
      </div>
    </>
  );
}
