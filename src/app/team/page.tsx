import { existsSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import { InstagramIcon } from "@/components/ui/BrandIcons";
import { PageHero } from "@/components/sections/PageHero";
import { JsonLd } from "@/components/seo/JsonLd";
import { RevealGroup } from "@/components/team/RevealGroup";
import { TeamCard } from "@/components/team/TeamCard";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { absoluteUrl, site, socials } from "@/data/site";
import { team } from "@/data/team";
import { hasLogo } from "@/lib/assets";
import { buildMetadata } from "@/lib/seo";

const DESCRIPTION =
  "Meet the seven storytellers behind Kanpur Ki Kahaani — the writers, designers, strategists and social leads promoting Kanpur, Lucknow, Agra, Prayagraj, Varanasi and Ayodhya.";

export const metadata: Metadata = buildMetadata({
  title: "Meet the Team | Kanpur Ki Kahaani",
  description: DESCRIPTION,
  path: "/team",
  ogImage: "/og/team",
});

const STATS = ["7 storytellers", "6 cities", "1 kahaani", "5 platforms"];

/** Photos are checked at build time: a missing file shows an initials avatar instead of a broken image. */
const hasPhoto = (src: string) => existsSync(path.join(process.cwd(), "public", src));

export default function TeamPage() {
  const instagram = socials.find((s) => s.platform === "instagram")!.url;
  const org = {
    "@type": "Organization",
    "@id": `${site.url}/#organization`,
    name: site.name,
    url: site.url,
    logo: hasLogo ? absoluteUrl("/brand/logo.png") : absoluteUrl("/icon"),
    sameAs: socials.map((s) => s.url),
    member: team.map((m) => ({
      "@type": "Person",
      name: m.name,
      jobTitle: m.role,
      ...(hasPhoto(m.photo) ? { image: absoluteUrl(m.photo) } : {}),
      worksFor: { "@id": `${site.url}/#organization` },
    })),
  };

  return (
    <>
      <PageHero
        eyebrow="The Storytellers"
        title="Meet the Team"
        subtitle="Seven people, one city's story — the writers, designers, strategists and storytellers bringing Kanpur and its neighbours to your screen."
        crumbs={[{ name: "Team" }]}
      />

      <section aria-label="About the team" className="bg-bg py-12 md:py-16">
        <div className="container-site text-center">
          <p className="mx-auto max-w-[620px] text-[17px] leading-relaxed text-ink/85 md:text-[18px]">
            Kanpur Ki Kahaani is built by a small team that believes every lane, ghat and chai stall has a story worth telling. Here&apos;s who does what.
          </p>
          <ul className="mt-6 flex flex-wrap justify-center gap-2.5" aria-label="The team in numbers">
            {STATS.map((s) => (
              <li key={s} className="rounded-full border border-border bg-white px-4 py-1.5 text-sm font-semibold text-ink">
                {s}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Section tone="alt" labelledBy="team-title">
        <SectionHeader id="team-title" eyebrow="Our People" title="The faces behind the kahaani" align="center" />
        <RevealGroup className="mx-auto flex max-w-[1140px] flex-wrap justify-center gap-6">
          {team.map((m, i) => (
            <TeamCard key={m.slug} member={m} hasPhoto={hasPhoto(m.photo)} index={i} />
          ))}
        </RevealGroup>
      </Section>

      <section aria-labelledby="work-title" className="bg-dark py-14 md:py-16">
        <div className="container-site flex flex-col items-center gap-6 text-center">
          <h2 id="work-title" className="max-w-[640px] font-display text-[26px] font-bold leading-snug text-cream md:text-[32px]">
            Have a story about Kanpur, or want to collaborate on a reel or post?
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href={instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral"
            >
              <InstagramIcon size={17} /> Follow on Instagram<span className="sr-only"> (opens in a new tab)</span>
            </a>
            <Link
              href="/blogs"
              className="inline-flex items-center rounded-full border border-cream/40 px-6 py-3 text-sm font-semibold text-cream transition hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral"
            >
              Read our blogs
            </Link>
          </div>
        </div>
      </section>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          name: "Meet the Team",
          url: absoluteUrl("/team"),
          description: DESCRIPTION,
          inLanguage: "en-IN",
          mainEntity: org,
        }}
      />
    </>
  );
}
