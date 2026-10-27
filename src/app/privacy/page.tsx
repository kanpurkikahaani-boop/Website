import type { Metadata } from "next";
import { PageHero } from "@/components/sections/PageHero";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Privacy Policy | Kanpur Ki Kahaani",
  description:
    "How Kanpur Ki Kahaani handles your data: optional analytics, the newsletter form, affiliate booking links and embeds from YouTube, Spotify and Google Maps.",
  path: "/privacy",
  ogImage: "/og/privacy",
});

const sections = [
  { h: "About this site", p: "Kanpur Ki Kahaani is an academic digital marketing project. It doesn't sell anything directly and has no user accounts." },
  { h: "Analytics", p: "If enabled by the site owner, Google Analytics 4 and the Meta Pixel collect anonymous usage data (pages viewed, buttons clicked, approximate location and device type) to understand what content is useful. No analytics scripts load unless they are configured." },
  { h: "Newsletter form", p: "The newsletter form validates your email in your browser and records a sign-up event. In this demonstration version, email addresses are not stored or sent to any server." },
  { h: "Booking links", p: "\"Book this stay\" links open a third-party booking site with tracking parameters (UTM tags) so we can see which listings are popular. The booking site's own privacy policy applies once you leave this site." },
  { h: "Embedded content", p: "Maps, videos and music are embedded from Google Maps, YouTube (privacy-enhanced mode) and Spotify. They load only when you scroll to them or press play, and those services may set their own cookies." },
  { h: "Weather", p: "Live weather is fetched directly from the Open-Meteo API using fixed city coordinates — your own location is never requested." },
  { h: "Contact", p: "Questions about this policy can be sent through the project's social channels listed in the footer." },
];

export default function PrivacyPage() {
  return (
    <>
      <PageHero eyebrow="Kanpur Ki Kahaani" title="Privacy" subtitle="Short and plain: what this site collects, and what it doesn't." crumbs={[{ name: "Privacy" }]} />
      <div className="container-site max-w-3xl py-14">
        {sections.map((s) => (
          <section key={s.h} className="mb-8">
            <h2 className="text-2xl font-bold text-primary">{s.h}</h2>
            <p className="mt-2 leading-relaxed">{s.p}</p>
          </section>
        ))}
        <p className="text-sm">Last updated: October 2026.</p>
      </div>
    </>
  );
}
