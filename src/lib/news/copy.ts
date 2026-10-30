import { CITY_LABELS, genreLabel, type Genre, type NewsCity } from "./taxonomy";

/** Unique intro copy so each /news/[city]/[genre] landing page isn't a thin duplicate. */
const CITY_INTRO: Record<NewsCity, string> = {
  kanpur: "Kanpur moves fast — a leather and textile powerhouse on the Ganga, home to IIT Kanpur, Green Park and a metro that's still growing.",
  lucknow: "Lucknow is Uttar Pradesh's capital, where state politics, Awadhi culture and a booming services economy share the same headlines.",
  agra: "Agra's news follows the Taj Mahal and its millions of visitors, but also its shoe and marble-inlay industries and the Yamuna's health.",
  prayagraj: "Prayagraj — the old Allahabad — is the city of the Sangam, the Magh Mela and the Kumbh, and of courts, coaching and a historic university.",
  varanasi: "Varanasi's stories run along the ghats: Kashi Vishwanath, Ganga aartis, Banarasi silk, BHU and one of India's most-watched constituencies.",
  ayodhya: "Ayodhya has transformed since the Shri Ram Janmabhoomi Mandir opened, with pilgrim crowds, new infrastructure and Deepotsav making news.",
};

const GENRE_INTRO: Record<Genre, string> = {
  "local-news": "Civic updates, city services, traffic and the everyday stories residents talk about.",
  politics: "Elections, government decisions and what local representatives are up to.",
  business: "Companies, industries, markets and the entrepreneurs shaping the local economy.",
  economy: "Prices, budgets, jobs and the bigger economic picture as it affects the region.",
  sports: "Cricket, kabaddi, wrestling and the stadiums and athletes the city cheers for.",
  entertainment: "Films, music, shows and the artists with local roots.",
  education: "Schools, colleges, entrance exams and campus life.",
  "crime-safety": "Policing, court cases, road safety and public-safety alerts.",
  "lifestyle-culture": "Festivals, food, faith, heritage and the city's cultural calendar.",
  "weather-environment": "Heatwaves, monsoon, fog, air quality and the health of the rivers.",
};

export function newsIntro(city?: NewsCity, genre?: Genre) {
  const parts: string[] = [];
  if (city) parts.push(CITY_INTRO[city]);
  if (genre) parts.push(`${genreLabel(genre)}: ${GENRE_INTRO[genre]}`);
  parts.push("Headlines refresh every morning from national and local newspapers in English and Hindi — tap any story to read it at the source.");
  return parts.join(" ");
}

export function newsTitle(city?: NewsCity, genre?: Genre) {
  const c = city ? CITY_LABELS[city].en : "Kanpur & Nearby Cities";
  if (genre === "local-news") return `${c} Local News`;
  if (genre) return `${c} ${genreLabel(genre)} News`;
  return city ? `${c} News` : "Kanpur News";
}

export function newsDescription(city?: NewsCity, genre?: Genre) {
  const c = city ? CITY_LABELS[city].en : "Kanpur and nearby cities";
  const g = genre ? genreLabel(genre).toLowerCase() : "local";
  // Pick the first phrasing that lands in the 150–160 character sweet spot for search snippets.
  const variants = [
    `Latest ${g} news from ${c}, refreshed every morning from leading English and Hindi newspapers, with links to read each story at the original source.`,
    `Latest ${g} news from ${c}, refreshed every morning from English and Hindi newspapers, with links to read each story at the source.`,
    `Latest ${g} news from ${c}, refreshed daily from English and Hindi papers, with links to each story at the source.`,
    `${c} ${g} news: today's headlines from English and Hindi newspapers, refreshed every morning, each linking to the original story.`,
  ];
  return variants.find((v) => v.length >= 150 && v.length <= 160) ?? variants.reduce((a, b) => (Math.abs(155 - a.length) <= Math.abs(155 - b.length) ? a : b));
}
