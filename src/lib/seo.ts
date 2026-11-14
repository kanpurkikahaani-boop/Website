import type { Metadata } from "next";
import { site, absoluteUrl } from "@/data/site";

interface BuildMetaInput {
  title: string;
  description: string;
  path: string;
  /** Path of a route-level opengraph-image (or an absolute photo URL, e.g. a post's cover) */
  ogImage?: string;
  /** Pixel size of ogImage when it isn't the 1200×630 generated card (omit when unknown). */
  ogImageSize?: { width: number; height: number } | null;
  ogImageAlt?: string;
  type?: "website" | "article";
  publishedTime?: string;
}

/** Shared metadata builder: title, description, canonical, OG and Twitter tags. */
export function buildMetadata({ title, description, path, ogImage, ogImageSize, ogImageAlt, type = "website", publishedTime }: BuildMetaInput): Metadata {
  const url = absoluteUrl(path);
  const size = ogImageSize === undefined ? { width: 1200, height: 630 } : ogImageSize ?? {};
  const images = [{ url: ogImage ?? "/opengraph-image", ...size, alt: ogImageAlt ?? title }];
  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: url,
      types: { "application/rss+xml": [{ url: "/rss.xml", title: `${site.name} — Stories` }] },
    },
    openGraph: {
      title,
      description,
      url,
      siteName: site.name,
      locale: site.locale,
      type,
      images,
      ...(publishedTime ? { publishedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: images.map((i) => i.url),
    },
  };
}

export interface Crumb {
  name: string;
  href?: string;
}

export function breadcrumbJsonLd(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      ...(c.href ? { item: absoluteUrl(c.href) } : {}),
    })),
  };
}

export function touristAttractionsJsonLd(
  items: { name: string; description: string; area?: string; city: string; image?: string }[],
  listName: string,
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: listName,
    itemListElement: items.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "TouristAttraction",
        name: p.name,
        description: p.description,
        ...(p.image ? { image: absoluteUrl(p.image) } : {}),
        address: {
          "@type": "PostalAddress",
          ...(p.area ? { streetAddress: p.area } : {}),
          addressLocality: p.city,
          addressRegion: "Uttar Pradesh",
          addressCountry: "IN",
        },
      },
    })),
  };
}

export function touristDestinationJsonLd(input: {
  name: string;
  description: string;
  path: string;
  lat: number;
  lon: number;
  image?: string;
  includes?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "TouristDestination",
    name: input.name,
    description: input.description,
    url: absoluteUrl(input.path),
    ...(input.image ? { image: absoluteUrl(input.image) } : {}),
    geo: { "@type": "GeoCoordinates", latitude: input.lat, longitude: input.lon },
    containedInPlace: { "@type": "State", name: "Uttar Pradesh", containedInPlace: { "@type": "Country", name: "India" } },
    ...(input.includes?.length
      ? { includesAttraction: input.includes.map((n) => ({ "@type": "TouristAttraction", name: n })) }
      : {}),
  };
}

/** FAQPage structured data. Answer text must match the visible (static) answer exactly. */
export function faqJsonLd(items: { question: string; answerText: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({
      "@type": "Question",
      name: i.question,
      acceptedAnswer: { "@type": "Answer", text: i.answerText },
    })),
  };
}
