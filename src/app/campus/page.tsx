import type { Metadata } from "next";
import { Lightbulb } from "lucide-react";
import { PageHero } from "@/components/sections/PageHero";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { IconBadge } from "@/components/ui/IconBadge";
import { TagChip } from "@/components/ui/TagChip";
import { InlineLink } from "@/components/ui/InlineLink";
import { FadeUp } from "@/components/ui/FadeUp";
import { JsonLd } from "@/components/seo/JsonLd";
import { institutions, studentTips } from "@/data/campus";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Campus Life in Kanpur – IIT Kanpur, HBTU, GSVM & More | Kanpur Ki Kahaani",
  description:
    "Student life in Kanpur: IIT Kanpur, HBTU, GSVM Medical College, CSJM University, Christ Church and DAV College, plus tips on budget food, transport, weekends.",
  path: "/campus",
  ogImage: "/og/campus",
});

export default function CampusPage() {
  return (
    <>
      <PageHero
        eyebrow="Stay & Live"
        title="Campus Life"
        subtitle="Kanpur teaches as well as it trades — home to IIT Kanpur and a constellation of colleges that keep the city young."
        crumbs={[{ name: "Stay & Live", href: "/accommodation" }, { name: "Campus Life" }]}
      />
      <Section labelledBy="inst-title">
        <SectionHeader id="inst-title" eyebrow="Institutions" title="Colleges & Universities" intro="From a world-class IIT to colleges older than the mills." />
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {institutions.map((i, idx) => (
            <FadeUp as="li" key={i.slug} delay={(idx % 3) * 0.06} className="flex flex-col rounded-2xl border border-border bg-surface p-6">
              <p className="eyebrow text-[11px]">{i.area}</p>
              <h3 className="mt-1.5 text-xl font-semibold leading-snug">{i.name}</h3>
              <p className="mt-2 text-sm leading-relaxed">{i.description}</p>
              <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Programmes">
                {i.programmes.map((p) => (
                  <li key={p}>
                    <TagChip>{p}</TagChip>
                  </li>
                ))}
              </ul>
              {i.url && (
                <InlineLink href={i.url} external className="mt-auto pt-4">
                  Official website
                </InlineLink>
              )}
            </FadeUp>
          ))}
        </ul>
      </Section>
      <Section tone="alt" labelledBy="tips-title">
        <SectionHeader id="tips-title" eyebrow="Survival kit" title="Student Tips" intro="What seniors wish they'd known in their first semester." />
        <ul className="grid gap-6 md:grid-cols-2">
          {studentTips.map((t) => (
            <li key={t.title} className="flex gap-4 rounded-2xl border border-border bg-surface p-6">
              <IconBadge icon={Lightbulb} size={44} />
              <div>
                <h3 className="text-xl font-semibold">{t.title}</h3>
                <p className="mt-1.5 text-[15px] leading-relaxed">{t.body}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-sm">
          Weekend sorted: <InlineLink href="/cities/lucknow">a day trip from Kanpur to Lucknow</InlineLink>
        </p>
      </Section>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Colleges and universities in Kanpur",
          itemListElement: institutions.map((i, idx) => ({
            "@type": "ListItem",
            position: idx + 1,
            item: { "@type": "CollegeOrUniversity", name: i.name, ...(i.url ? { url: i.url } : {}), address: { "@type": "PostalAddress", streetAddress: i.area, addressLocality: "Kanpur", addressCountry: "IN" } },
          })),
        }}
      />
    </>
  );
}
