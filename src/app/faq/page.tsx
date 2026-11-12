import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/sections/PageHero";
import { FaqSection } from "@/components/faq/FaqSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { allFaqGroups, faqs, weatherGroups } from "@/data/faqs";
import { plainAnswer } from "@/lib/faq-text";
import { buildMetadata, faqJsonLd } from "@/lib/seo";
import { FaqSearch } from "./FaqSearch";

export const metadata: Metadata = buildMetadata({
  title: "FAQs – Kanpur Travel, Weather, Events & More | Kanpur Ki Kahaani",
  description: "Answers to common questions about visiting Kanpur and its neighbouring cities: planning a trip, festivals, food, shopping, weather, events, news and our team.",
  path: "/faq",
});

/**
 * Every FAQ on the site in one place. The answers already carry FAQPage markup on their own
 * pages, so this page's JSON-LD covers only the general questions (home, blogs, team) to avoid
 * marking the same question up twice.
 */
export default function FaqPage() {
  const groups = allFaqGroups();
  const ld = [...faqs.home, ...faqs.blogs, ...faqs.team].map((f) => ({ question: f.question, answerText: plainAnswer(f.answer) }));
  return (
    <>
      <PageHero eyebrow="Help" title="Frequently Asked Questions" subtitle="Quick answers about Kanpur and its neighbours — trips, weather, festivals, food and more." crumbs={[{ name: "FAQs" }]} />
      <section className="bg-bg-alt py-12 md:py-16" aria-label="All FAQs">
        <div className="container-site">
          <FaqSearch groups={groups.map((g) => ({ key: g.key, label: g.label }))} />
          <div className="mt-10 space-y-16">
            {groups.map((g) => (
              <div key={g.key} id={`topic-${g.key}`} data-faq-group={g.key} className="scroll-mt-28">
                <FaqSection
                  bare
                  id={`faq-${g.key}`}
                  eyebrow={g.label}
                  title={g.title}
                  items={g.items.map((f) => ({ ...f, answer: f.answer.replace(/\]\(#/g, `](${g.path === "/" ? "/" : g.path}#`) }))}
                  groups={g.key === "weather" ? weatherGroups : undefined}
                  jsonLd={false}
                  anchorPrefix={`${g.key}-`}
                />
                <p className="mx-auto mt-4 max-w-[760px] text-right text-sm">
                  <Link href={g.path} className="font-semibold text-primary hover:underline">
                    Go to the {g.label} page →
                  </Link>
                </p>
              </div>
            ))}
          </div>
          <p data-faq-empty hidden className="mx-auto mt-10 max-w-[760px] text-center">
            No questions match your search. Try another word, or browse the topics above.
          </p>
        </div>
      </section>
      <JsonLd data={faqJsonLd(ld)} />
    </>
  );
}
