import type { Metadata } from "next";
import Link from "next/link";
import { Download } from "lucide-react";
import { PageHero } from "@/components/sections/PageHero";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { JsonLd } from "@/components/seo/JsonLd";
import { CopyBox } from "@/components/seo/CopyBox";
import { cities } from "@/data/cities";
import { kanpurPlaces } from "@/data/places";
import { absoluteUrl, site, socials } from "@/data/site";
import { team } from "@/data/team";
import { DISTANCES_PATH } from "@/lib/distances";
import { getAllPublished } from "@/lib/posts";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 3600;

export const metadata: Metadata = buildMetadata({
  title: "Press Kit & Link to Us | Kanpur Ki Kahaani",
  description: "Logos, “Featured on Kanpur Ki Kahaani” badges, ready-to-use descriptions and our best guides to link to — for journalists, bloggers, colleges and partners.",
  path: "/press",
});

const instagram = socials.find((s) => s.platform === "instagram")!;

/** Pages worth linking to, with a one-line reason (what a linking site's readers get). */
const LINK_TARGETS = [
  { path: "/", label: "Kanpur Ki Kahaani — home", why: "the whole guide to Kanpur and its neighbouring cities" },
  { path: "/tourism", label: "Places to visit in Kanpur & trip planner", why: "a free 1–3 day itinerary builder" },
  { path: DISTANCES_PATH, label: "Distances from Kanpur", why: "road, rail and air times to five cities, with a CSV download" },
  { path: "/nearby", label: "Weekend trips from Kanpur", why: "Lucknow, Agra, Prayagraj, Varanasi and Ayodhya compared" },
  { path: "/celebrations", label: "Festivals in Kanpur", why: "Ganga Mela, Durga Puja, Dev Deepawali and more, month by month" },
  { path: "/culture-history", label: "Kanpur's history & heritage", why: "from ancient Jajmau to the Manchester of the East" },
  { path: "/weather", label: "Kanpur weather today", why: "live forecast and rain radar" },
  { path: "/blogs", label: "Stories from Kanpur", why: "travel journals, food trails and festival guides" },
];

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const badgeHtml = (theme: "light" | "dark") =>
  `<a href="${absoluteUrl("/")}" title="${site.name} — the stories of Kanpur"><img src="${absoluteUrl(`/badges/featured-${theme}.svg`)}" alt="Featured on ${site.name}" width="240" height="64" /></a>`;

/**
 * Press kit & "link to us" page (v11): everything someone needs to mention or link to the site
 * correctly, in one place — the practical way to earn genuine links from other websites.
 */
export default async function PressPage() {
  const posts = await getAllPublished();
  const placeCount = kanpurPlaces.length;
  const short = `${site.name} is an independent guide to Kanpur, Uttar Pradesh — its heritage, food, festivals and everyday life — and the cities around it.`;
  const long = `${site.name} (${absoluteUrl("/").replace(/\/$/, "")}) is a free guide to Kanpur, the “Manchester of the East”, and five nearby cities: Lucknow, Agra, Prayagraj, Varanasi and Ayodhya. It covers ${placeCount} places to visit in Kanpur, a 1–3 day trip planner, festival and food guides, live weather, local news and long-form stories, written by a team of ${team.length} as an academic digital marketing project.`;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: site.name,
          url: site.url,
          logo: absoluteUrl("/brand/logo.png"),
          description: short,
          sameAs: socials.map((s) => s.url),
        }}
      />
      <PageHero eyebrow="Press & partners" title="Press Kit & Link to Us" subtitle="Logos, badges, descriptions and our best pages — everything you need to mention or link to Kanpur Ki Kahaani." crumbs={[{ name: "Press kit" }]} />

      <Section labelledBy="about-title">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <SectionHeader id="about-title" eyebrow="About us" title="Describing Kanpur Ki Kahaani" intro="Copy these as they are, or shorten them — please keep the link." className="mb-6" />
            <div className="space-y-5">
              <CopyBox label="One line" value={short} mono={false} />
              <CopyBox label="Paragraph" value={long} mono={false} />
            </div>
          </div>
          <aside aria-label="At a glance" className="rounded-2xl border border-border bg-surface p-6">
            <h3 className="font-display text-lg font-bold text-primary">At a glance</h3>
            <dl className="mt-3 space-y-2 text-sm">
              {[
                ["Places in Kanpur", placeCount],
                ["Nearby city guides", cities.length],
                ["Published stories", posts.length],
                ["Team", team.length],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 border-b border-border/60 pb-2 last:border-0">
                  <dt>{k}</dt>
                  <dd className="font-semibold text-ink">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-sm">
              Meet the people behind it on our <Link href="/team" className="font-semibold text-primary underline">team page</Link>.
            </p>
          </aside>
        </div>
      </Section>

      <Section tone="alt" labelledBy="badges-title">
        <SectionHeader id="badges-title" eyebrow="Badges" title="“Featured on Kanpur Ki Kahaani”" intro="Featured in one of our stories or guides? Add a badge to your website — paste the code where you want it to appear." />
        <div className="grid gap-6 md:grid-cols-2">
          {(["light", "dark"] as const).map((theme) => (
            <div key={theme} className="rounded-2xl border border-border bg-surface p-6">
              <div className={theme === "dark" ? "rounded-xl bg-[#3a2a25] p-6" : "rounded-xl bg-white p-6"}>
                {/* eslint-disable-next-line @next/next/no-img-element -- the exact file other sites embed */}
                <img src={`/badges/featured-${theme}.svg`} alt={`Featured on ${site.name} (${theme} badge)`} width={240} height={64} className="mx-auto" />
              </div>
              <CopyBox className="mt-4" label={`${theme === "light" ? "Light" : "Dark"} badge — HTML`} value={badgeHtml(theme)} />
              <p className="mt-3 flex flex-wrap gap-3 text-sm font-semibold">
                <a href={`/badges/featured-${theme}.svg`} download className="inline-flex items-center gap-1 text-primary hover:underline"><Download size={14} aria-hidden /> SVG</a>
                <a href={`/badges/featured-${theme}.png`} download className="inline-flex items-center gap-1 text-primary hover:underline"><Download size={14} aria-hidden /> PNG</a>
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section labelledBy="link-title">
        <SectionHeader id="link-title" eyebrow="Link to us" title="Our most useful pages" intro="Writing about Kanpur, a trip in Uttar Pradesh or Indian festivals? These pages give your readers the most." />
        <ul className="grid gap-4 md:grid-cols-2">
          {LINK_TARGETS.map((t) => (
            <li key={t.path} className="rounded-2xl border border-border bg-surface p-5">
              <Link href={t.path} className="font-display text-lg font-semibold text-ink hover:text-primary">{t.label}</Link>
              <p className="mt-1 text-sm">{t.why}</p>
              <CopyBox className="mt-3" label="Link" value={`<a href="${esc(absoluteUrl(t.path))}">${esc(t.label)}</a>`} />
            </li>
          ))}
        </ul>
        {posts.length > 0 && (
          <div className="mt-10">
            <h3 className="font-display text-xl font-bold text-primary">Latest stories</h3>
            <ul className="mt-3 list-disc space-y-1.5 pl-5">
              {posts.slice(0, 5).map((p) => (
                <li key={p.slug}>
                  <Link href={`/blogs/${p.slug}`} className="font-semibold text-primary underline">{p.title}</Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Section>

      <Section tone="alt" labelledBy="assets-title">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <SectionHeader id="assets-title" eyebrow="Logo" title="Logo & usage" className="mb-5" />
            <div className="flex items-center gap-5">
              {/* eslint-disable-next-line @next/next/no-img-element -- downloadable asset preview */}
              <img src="/brand/logo.png" alt={`${site.name} logo`} width={96} height={96} className="rounded-full" />
              <a href="/brand/logo.png" download className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover">
                <Download size={15} aria-hidden /> Logo (PNG, 512 × 512)
              </a>
            </div>
            <ul className="mt-5 list-disc space-y-1.5 pl-5 text-[15px]">
              <li>Use the logo and badges as they are — don&apos;t recolour, stretch or crop them.</li>
              <li>Link them to {absoluteUrl("/").replace(/\/$/, "")} (or the page you&apos;re mentioning).</li>
              <li>Photos on the site aren&apos;t covered here: ask us before reusing any photo. Our data tables (e.g. <Link href={DISTANCES_PATH} className="text-primary underline">distances</Link>) are CC BY 4.0.</li>
            </ul>
          </div>
          <div>
            <SectionHeader eyebrow="Contact" title="Press, collaborations & quotes" className="mb-5" />
            <p className="text-[15.5px]">
              For interviews, quotes about Kanpur travel and food, collaborations or a correction, message us on{" "}
              <a href={instagram.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary underline">Instagram ↗<span className="sr-only"> (opens in new tab)</span></a>. We&apos;re also on{" "}
              {socials
                .filter((s) => s.platform !== "instagram")
                .map((s, i, arr) => (
                  <span key={s.platform}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-primary underline">{s.label}</a>
                    {i < arr.length - 2 ? ", " : i === arr.length - 2 ? " and " : ""}
                  </span>
                ))}
              .
            </p>
          </div>
        </div>
      </Section>
    </>
  );
}
