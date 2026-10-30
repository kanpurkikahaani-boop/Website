import Link from "next/link";
import { Plane, PlaneTakeoff, Thermometer, TrainFront } from "lucide-react";
import type { Metadata } from "next";
import { HeroCarousel } from "@/components/sections/HeroCarousel";
import { InfoStrip } from "@/components/sections/InfoStrip";
import { WeatherInline } from "@/components/sections/WeatherInline";
import { TravelCards } from "@/components/sections/TravelCards";
import { MapEmbed } from "@/components/sections/MapEmbed";
import { LiteYouTube } from "@/components/sections/LiteYouTube";
import { CityCard } from "@/components/sections/CityCard";
import { NewsletterBand } from "@/components/sections/NewsletterBand";
import { NewsletterPopup } from "@/components/sections/NewsletterPopup";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ImageCard } from "@/components/ui/ImageCard";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { InlineLink } from "@/components/ui/InlineLink";
import { LinkButton } from "@/components/ui/Button";
import { FadeUp } from "@/components/ui/FadeUp";
import { JsonLd } from "@/components/seo/JsonLd";
import { heroSlides, sectionImages } from "@/data/images";
import { cities } from "@/data/cities";
import { posts } from "@/data/blog";
import { videos } from "@/data/videos";
import { kanpurPlaces } from "@/data/places";
import { site, socials, absoluteUrl } from "@/data/site";
import { buildMetadata, touristDestinationJsonLd } from "@/lib/seo";
import { formatDate, readingTime } from "@/lib/utils";
import { hasLogo } from "@/lib/assets";

export const metadata: Metadata = buildMetadata({
  title: "Kanpur Tourism – Things to Do in Kanpur & Weekend Trips Nearby | Kanpur Ki Kahaani",
  description:
    "Kanpur tourism guide: places to visit in Kanpur, street food, festivals, a free itinerary planner and weekend trips from Kanpur to Lucknow, Agra and Varanasi.",
  path: "/",
});

const exploreCards = [
  { href: "/tourism", title: "Tourism & Itinerary Planner", teaser: "Ghats, temples and a planner that builds your trip day by day.", img: sectionImages.exploreTourism },
  { href: "/culture-history", title: "Culture & History", teaser: "From ancient Jajmau to the mills of the Manchester of the East.", img: sectionImages.exploreCulture },
  { href: "/celebrations", title: "Celebrations", teaser: "Ganga Mela, Dev Deepawali and nights when the bazaars never sleep.", img: sectionImages.exploreCelebrations },
  { href: "/food-nightlife", title: "Food & Night Life", teaser: "Thaggu Ke Laddu, Arya Nagar chaat and midnight handi biryani.", img: sectionImages.exploreFood },
  { href: "/shopping", title: "Shopping Streets", teaser: "Jajmau leather, Gumti bangles and Naveen Market bargains.", img: sectionImages.exploreShopping },
  { href: "/outdoor-sports", title: "Outdoor & Sports", teaser: "Green Park cricket, forest zoo walks and river mornings.", img: sectionImages.exploreOutdoor },
];

const reach = [
  { mode: "train" as const, title: "By Train", body: "Kanpur Central (CNB) is one of India's busiest junctions on the Delhi–Howrah main line, with direct trains from Delhi in about 5 hours and Lucknow in under 2." },
  { mode: "road" as const, title: "By Road", body: "NH-19 and NH-27 meet here. Lucknow is ~90 km by road, Agra ~280 km via the expressway link, and UPSRTC buses run from Jhakarkati and Rawatpur." },
  { mode: "air" as const, title: "By Air", body: "Kanpur Airport at Chakeri (KNU) has domestic flights; Lucknow's international airport (LKO) is about 80 km away for wider connections." },
];

export default function HomePage() {
  const orgJsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: site.name,
      url: site.url,
      description: site.description,
      inLanguage: "en-IN",
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: site.name,
      url: site.url,
      logo: hasLogo ? absoluteUrl("/brand/logo.png") : absoluteUrl("/icon"),
      sameAs: socials.map((s) => s.url),
    },
    touristDestinationJsonLd({
      name: "Kanpur",
      description: "Kanpur, the 'Manchester of the East', is an industrial and cultural city on the Ganga in Uttar Pradesh.",
      path: "/",
      lat: site.kanpur.lat,
      lon: site.kanpur.lon,
      includes: kanpurPlaces.slice(0, 10).map((p) => p.name),
    }),
  ];

  return (
    <>
      <JsonLd data={orgJsonLd} />
      <HeroCarousel slides={heroSlides} />

      <InfoStrip
        label="Kanpur at a glance"
        items={[
          { icon: Thermometer, label: "Live in Kanpur", value: <WeatherInline lat={site.kanpur.lat} lon={site.kanpur.lon} /> },
          { icon: TrainFront, label: "Nearest railway station", value: "Kanpur Central (CNB)" },
          { icon: Plane, label: "Nearest airport", value: "Kanpur Airport, Chakeri (KNU)" },
          { icon: PlaneTakeoff, label: "Nearest international airport", value: "Lucknow (LKO), ~80 km" },
        ]}
      />

      {/* About */}
      <Section id="about" labelledBy="about-title">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <FadeUp>
            <SectionHeader id="about-title" eyebrow="About Kanpur" title="The Manchester of the East" className="mb-6" />
            <div className="space-y-4 text-[15.5px] leading-relaxed">
              <p>
                Kanpur grew from a riverside village into a British cantonment, then into north India&apos;s great mill
                town — its chimneys once earned it the name &ldquo;Manchester of the East&rdquo;. Before all that came
                Jajmau&apos;s ancient mound and the sacred ghats of Bithoor, where legend places Valmiki&apos;s ashram.
              </p>
              <p>
                Today it&apos;s a city of leather and learning, of IIT Kanpur and Thaggu Ke Laddu, Green Park cricket
                and Ganga Mela colours — loud, generous and endlessly snackable. There are plenty of things to do in
                Kanpur, and five legendary cities within a few hours&apos; drive.
              </p>
            </div>
            <InlineLink href="/culture-history" className="mt-6">
              Read the city&apos;s story
            </InlineLink>
          </FadeUp>
          <FadeUp delay={0.1}>
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
              <ImageWithFallback
                src={sectionImages.aboutKanpur.image}
                alt={sectionImages.aboutKanpur.alt}
                label={sectionImages.aboutKanpur.label}
                sublabel="Kanpur"
                fill
                sizes="(min-width: 1024px) 540px, 100vw"
                className="object-cover"
              />
            </div>
          </FadeUp>
        </div>
      </Section>

      {/* How to reach */}
      <Section tone="alt" id="reach" labelledBy="reach-title">
        <SectionHeader
          id="reach-title"
          eyebrow="Getting here"
          title="How to Reach Kanpur"
          intro="Sitting on the Delhi–Howrah rail line and two national highways, Kanpur is one of the best-connected cities in Uttar Pradesh."
        />
        <TravelCards modes={reach} />
      </Section>

      {/* Map */}
      <Section labelledBy="map-title">
        <SectionHeader
          id="map-title"
          eyebrow="Location"
          title="Find Kanpur on the Map"
          intro="On the south bank of the Ganga, roughly midway between Agra and Varanasi — the heart of the Uttar Pradesh travel circuit."
        />
        <MapEmbed query="Kanpur, Uttar Pradesh" title="Map of Kanpur, Uttar Pradesh" />
      </Section>

      {/* Videos */}
      <Section tone="dark" labelledBy="watch-title">
        <SectionHeader id="watch-title" dark eyebrow="Watch" title="Kanpur in Motion" intro="Short films on the streets, flavours and stories of the city." />
        <ul className="grid gap-6 md:grid-cols-3">
          {videos.map((v) => (
            <li key={v.caption}>
              <LiteYouTube id={v.id} title={v.title} />
              <p className="mt-3 font-display text-lg text-cream">{v.caption}</p>
            </li>
          ))}
        </ul>
      </Section>

      {/* Explore */}
      <Section labelledBy="explore-title">
        <SectionHeader
          id="explore-title"
          eyebrow="Start exploring"
          title="Every Corner of the City"
          intro="Six ways into Kanpur — pick a thread and follow the story."
        />
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {exploreCards.map((c, i) => (
            <FadeUp as="li" key={c.href} delay={(i % 3) * 0.06}>
              <ImageCard image={c.img.image} alt={c.img.alt} imageLabel={c.title} title={c.title} description={c.teaser} href={c.href} />
            </FadeUp>
          ))}
        </ul>
      </Section>

      {/* Beyond Kanpur */}
      <Section tone="white" labelledBy="beyond-title">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionHeader
            id="beyond-title"
            eyebrow="Nearby cities"
            title="Five Cities, One Journey"
            intro="Weekend trips from Kanpur to Lucknow, Agra, Prayagraj, Varanasi and Ayodhya — each a train ride or highway drive away."
          />
          <LinkButton href="/nearby" className="mb-10 shrink-0 self-start md:self-auto">
            Plan a multi-city trip
          </LinkButton>
        </div>
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cities.map((c, i) => (
            <FadeUp as="li" key={c.slug} delay={(i % 3) * 0.06}>
              <CityCard city={c} />
            </FadeUp>
          ))}
        </ul>
      </Section>

      {/* Blog */}
      <Section tone="alt" id="stories" labelledBy="stories-title">
        <SectionHeader id="stories-title" eyebrow="Stories" title="From Our Blogs" intro="Journals, food crawls and histories from around the city." />
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p, i) => (
            <FadeUp as="li" key={p.slug} delay={(i % 3) * 0.06}>
              <ImageCard
                image={p.image}
                alt={p.alt}
                imageLabel={p.title}
                eyebrow={p.category}
                title={p.title}
                description={p.excerpt}
                chips={[formatDate(p.date), `${readingTime(p.body)} min read`]}
                href={`/blog/${p.slug}`}
              />
            </FadeUp>
          ))}
        </ul>
        <p className="mt-8 text-sm">
          Planning already?{" "}
          <Link href="/tourism#planner" className="font-semibold text-primary hover:underline">
            Build your Kanpur itinerary in seconds
          </Link>
          .
        </p>
      </Section>

      <NewsletterBand />
      <NewsletterPopup />
    </>
  );
}
