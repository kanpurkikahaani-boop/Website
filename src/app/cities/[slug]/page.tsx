import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Gauge, MapPin, Plane } from "lucide-react";
import { Breadcrumbs } from "@/components/sections/Breadcrumbs";
import { InfoStrip } from "@/components/sections/InfoStrip";
import { PlaceGrid } from "@/components/sections/PlaceGrid";
import { TravelCards } from "@/components/sections/TravelCards";
import { Timeline } from "@/components/sections/Timeline";
import { WeatherWidget, ForecastRow } from "@/components/sections/WeatherWidget";
import { MapEmbed } from "@/components/sections/MapEmbed";
import { ShareButtons } from "@/components/sections/ShareButtons";
import { CityCard } from "@/components/sections/CityCard";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ImageCard } from "@/components/ui/ImageCard";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { FadeUp } from "@/components/ui/FadeUp";
import { buttonClass } from "@/components/ui/Button";
import { JsonLd } from "@/components/seo/JsonLd";
import { cities, getCity } from "@/data/cities";
import { foodFor } from "@/data/food";
import { placesFor } from "@/data/places";
import { shoppingFor } from "@/data/shopping";
import { absoluteUrl } from "@/data/site";
import { buildMetadata, touristAttractionsJsonLd, touristDestinationJsonLd } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return cities.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/cities/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const city = getCity(slug);
  if (!city) return {};
  return buildMetadata({
    title: `Kanpur to ${city.name} Trip Guide – ${city.tagline} | Kanpur Ki Kahaani`,
    description: city.metaDescription,
    path: `/cities/${city.slug}`,
    ogImage: `/og/city-${city.slug}`,
  });
}

export default async function CityPage({ params }: PageProps<"/cities/[slug]">) {
  const { slug } = await params;
  const city = getCity(slug);
  if (!city) notFound();

  const places = placesFor(city.slug);
  const foods = foodFor(city.slug);
  const shops = shoppingFor(city.slug);
  const others = cities.filter((c) => c.slug !== city.slug);

  return (
    <>
      {/* Image hero */}
      <section className="relative flex min-h-[560px] items-end overflow-hidden bg-dark md:min-h-[620px]">
        <ImageWithFallback src={city.heroImage} alt={city.heroAlt} label={city.name} tone="dusk" hideLabel fill priority sizes="100vw" className="object-cover" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-dark/90 via-dark/60 to-dark/10" />
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-dark/80 to-transparent" />
        <div className="container-site relative pb-16 pt-28">
          <p className="eyebrow text-accent">Nearby city · ~{city.distanceKm} km from Kanpur</p>
          <h1 className="mt-3 text-[44px] font-bold leading-none text-white md:text-[68px]">{city.name}</h1>
          <p lang="hi" className="mt-2 font-deva text-2xl text-[#f6d79c] md:text-3xl">
            {city.hindi}
          </p>
          <p className="mt-4 max-w-lg font-display text-lg italic text-cream/85 md:text-xl">{city.tagline}</p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link href={`/tourism?cities=${city.slug}#planner`} className={buttonClass("primary", "px-7")}>
              Plan from Kanpur
            </Link>
            <a href="#itinerary" className={buttonClass("outline-light", "px-7")}>
              See the itinerary
            </a>
          </div>
        </div>
      </section>
      <Breadcrumbs crumbs={[{ name: "Home", href: "/" }, { name: "Nearby Cities", href: "/nearby" }, { name: city.name }]} />

      <InfoStrip
        label={`${city.name} quick facts`}
        items={[
          { icon: MapPin, label: "Distance from Kanpur", value: `~${city.distanceKm} km · ${city.driveTime}` },
          { icon: Gauge, label: "Fastest way there", value: city.fastestWay },
          { icon: Plane, label: "Nearest airport", value: city.nearestAirport },
          { icon: CalendarDays, label: "Best time to visit", value: city.bestTime },
        ]}
      />

      {/* About */}
      <Section labelledBy="about-title">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <FadeUp>
            <SectionHeader id="about-title" eyebrow={`About ${city.name}`} title={city.tagline} className="mb-6" />
            <div className="space-y-4 text-[15.5px] leading-relaxed">
              {city.about.map((p) => (
                <p key={p.slice(0, 20)}>{p}</p>
              ))}
            </div>
            <ShareButtons className="mt-6" url={absoluteUrl(`/cities/${city.slug}`)} title={`${city.name} — a trip from Kanpur`} context={`city_${city.slug}`} />
          </FadeUp>
          <FadeUp delay={0.1}>
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
              <ImageWithFallback src={city.aboutImage} alt={city.aboutAlt} label={city.name} sublabel={city.tagline} fill sizes="(min-width: 1024px) 540px, 100vw" className="object-cover" />
            </div>
          </FadeUp>
        </div>
      </Section>

      <Section tone="alt" labelledBy="places-title">
        <SectionHeader id="places-title" eyebrow="Sights" title="Top Places to Visit" intro={`The essential ${city.name} sights — filter by what you love.`} />
        <PlaceGrid places={places} cityLabel={city.name} />
      </Section>

      <Section labelledBy="food-title">
        <SectionHeader id="food-title" eyebrow="Taste" title="Must-Try Food" intro={`What to eat in ${city.name}, and where locals go for it.`} />
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {foods.map((f) => (
            <li key={f.slug}>
              <ImageCard image={f.image} alt={f.alt} imageLabel={f.name} imageSublabel={city.name} eyebrow={f.eyebrow} title={f.name} description={f.description} chips={[f.area, f.price]} />
            </li>
          ))}
        </ul>
      </Section>

      <Section tone="alt" labelledBy="shop-title">
        <SectionHeader id="shop-title" eyebrow="Shopping" title={`What to Buy in ${city.name}`} intro="Souvenirs worth the suitcase space — and where to find them." />
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shops.map((s) => (
            <li key={s.slug}>
              <ImageCard image={s.image} alt={s.alt} imageLabel={s.name} imageSublabel={s.area} eyebrow={s.area} title={s.name} description={s.knownFor} chips={[s.bestTime]} />
            </li>
          ))}
        </ul>
      </Section>

      <Section labelledBy="getting-title">
        <SectionHeader id="getting-title" eyebrow="Getting there" title={`Kanpur to ${city.name}`} intro={`About ${city.distanceKm} km — here's how to make the journey.`} />
        <TravelCards modes={city.gettingThere} />
      </Section>

      <Section tone="alt" id="itinerary" labelledBy="itinerary-title">
        <SectionHeader id="itinerary-title" eyebrow="Itinerary" title="Suggested Itinerary" intro="A one-day dash or a relaxed two-day stay — both starting from Kanpur." />
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="rounded-3xl border border-border bg-surface p-6 md:p-8">
            <h3 className="mb-6 text-2xl font-bold text-primary">1 day</h3>
            <Timeline
              headingLevel="h4"
              entries={city.itinerary.oneDay.flatMap((d) => d.stops.map((s) => ({ label: s.time, title: s.title, body: s.note })))}
            />
          </div>
          <div className="rounded-3xl border border-border bg-surface p-6 md:p-8">
            <h3 className="mb-6 text-2xl font-bold text-primary">2 days</h3>
            <Timeline
              headingLevel="h4"
              entries={city.itinerary.twoDay.flatMap((d) => d.stops.map((s) => ({ label: `${d.title.split(" · ")[0]} · ${s.time}`, title: s.title, body: s.note })))}
            />
          </div>
        </div>
      </Section>

      <Section labelledBy="weather-title">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="min-w-0">
            <SectionHeader id="weather-title" eyebrow="Live weather" title={`${city.name} Right Now`} intro={`Best time to visit: ${city.bestTime}.`} />
            <WeatherWidget lat={city.lat} lon={city.lon} place={city.name} compact />
            <div className="mt-6">
              <ForecastRow lat={city.lat} lon={city.lon} compact />
            </div>
          </div>
          <div className="min-w-0">
            <SectionHeader eyebrow="Map" title={`Find ${city.name}`} />
            <MapEmbed query={`${city.name}, Uttar Pradesh`} title={`Map of ${city.name}, Uttar Pradesh`} height={360} />
          </div>
        </div>
      </Section>

      <Section tone="alt" labelledBy="others-title">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <SectionHeader id="others-title" eyebrow="Keep exploring" title="Explore Other Cities" />
          <Link href="/" className="mb-10 text-sm font-semibold text-primary hover:underline">
            ← Back to Kanpur
          </Link>
        </div>
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {others.map((c) => (
            <li key={c.slug}>
              <CityCard city={c} from={`city_${city.slug}`} />
            </li>
          ))}
        </ul>
      </Section>

      <JsonLd
        data={[
          touristDestinationJsonLd({
            name: city.name,
            description: city.about[0],
            path: `/cities/${city.slug}`,
            lat: city.lat,
            lon: city.lon,
            includes: places.map((p) => p.name),
          }),
          touristAttractionsJsonLd(
            places.map((p) => ({ name: p.name, description: p.description, area: p.area, city: city.name })),
            `Places to visit in ${city.name}`,
          ),
        ]}
      />
    </>
  );
}
