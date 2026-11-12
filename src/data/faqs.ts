import { cities } from "./cities";
import { allPlaces } from "./places";
import { food } from "./food";
import { shopping } from "./shopping";
import type { City } from "./types";

/**
 * FAQs for every page (update v8). Written for people first: each target keyword appears
 * naturally, at most ~3 times per page (checked by `npm run seo:faq`). Answers are plain text with
 * markdown links — [words](/path) — rendered by src/lib/faq-text.tsx; the same text (minus link
 * markup) goes into FAQPage JSON-LD. Live weather values are shown separately and never in the
 * JSON-LD. Misspellings people search for are deliberately never written anywhere.
 *
 * Facts come from the site's own data files or are long-established; anything time-sensitive or
 * approximate is marked // VERIFY. No prices, timings, phone numbers or rules are invented.
 */
export type LiveToken = "currentTemp" | "todaySummary" | "tomorrowSummary" | "rainChanceToday" | "rainChanceTomorrow";

export interface FaqItem {
  id: string;
  question: string;
  /** Plain text with [markdown](/links). 40–90 words, at least one internal link. */
  answer: string;
  /** Target keywords this item is meant to cover (checked by seo:faq). */
  keywords: string[];
  group?: string;
  live?: LiveToken;
}

export type FaqPage =
  | "home" | "tourism" | "culture" | "celebrations" | "food" | "shopping" | "outdoor" | "nearby"
  | "events" | "weather" | "news" | "accommodation" | "campus" | "blogs" | "team" | "playlist";

export const faqPageInfo: Record<FaqPage, { path: string; label: string; title: string }> = {
  home: { path: "/", label: "Kanpur", title: "Kanpur — Frequently Asked Questions" },
  tourism: { path: "/tourism", label: "Tourism & itinerary", title: "Planning a Kanpur Trip — FAQs" },
  culture: { path: "/culture-history", label: "Culture & history", title: "Kanpur's Heritage — FAQs" },
  celebrations: { path: "/celebrations", label: "Celebrations", title: "Festivals in Kanpur — FAQs" },
  food: { path: "/food-nightlife", label: "Food & night life", title: "Food & Night Life in Kanpur — FAQs" },
  shopping: { path: "/shopping", label: "Shopping", title: "Shopping in Kanpur — FAQs" },
  outdoor: { path: "/outdoor-sports", label: "Outdoor & sports", title: "Outdoor & Sports in Kanpur — FAQs" },
  nearby: { path: "/nearby", label: "Nearby cities", title: "Trips from Kanpur — FAQs" },
  events: { path: "/events", label: "Events", title: "What's On in Kanpur — FAQs" },
  weather: { path: "/weather", label: "Weather", title: "Kanpur Forecasts & Climate — FAQs" },
  news: { path: "/news", label: "News", title: "Kanpur Headlines — FAQs" },
  accommodation: { path: "/accommodation", label: "Where to stay", title: "Where to Stay in Kanpur — FAQs" },
  campus: { path: "/campus", label: "Campus life", title: "Campus Life in Kanpur — FAQs" },
  blogs: { path: "/blogs", label: "Blogs", title: "Our Blogs — FAQs" },
  team: { path: "/team", label: "Team", title: "About the Team — FAQs" },
  playlist: { path: "/playlist", label: "City playlist", title: "City Playlist — FAQs" },
};

export const weatherGroups = ["Today & right now", "Tomorrow", "Radar & rain", "Your location", "Forecasts, updates & sources", "Seasons"] as const;

export const faqs: Record<FaqPage, FaqItem[]> = {
  home: [
    {
      id: "where-is-kanpur-india",
      question: "Where is Kanpur, India, and why is it called the “Manchester of the East”?",
      answer:
        "Kanpur sits on the south bank of the Ganga in Uttar Pradesh, roughly halfway between Delhi and Varanasi. In the late 1800s its cotton and woollen mills, and later its leather tanneries, made it one of north India's great industrial cities, earning the nickname “Manchester of the East”. You can read the full story on our [Culture & History](/culture-history) page.",
      keywords: ["kanpur india", "kanpur"],
    },
    {
      id: "what-is-kanpur-city-famous-for",
      question: "What is Kanpur city famous for?",
      answer:
        "Kanpur city is known for its mill-town heritage, the 1857 memorials, the white marble JK Temple and the sacred ghats of Bithoor. Its culture is earthy and generous: Thaggu Ke Laddu, Arya Nagar chaat, Ganga Mela after Holi and leather from Jajmau. Start with our [places to visit](/tourism) and the [city's history](/culture-history).",
      keywords: ["kanpur city", "culture"],
    },
    {
      id: "how-do-i-plan-a-kanpur-itinerary",
      question: "How do I plan a 1–3 day Kanpur itinerary?",
      answer:
        "Use our free [trip planner](/tourism#planner): choose 1, 2 or 3 days and your interests, and it groups nearby places into mornings, afternoons and evenings so you spend less time in traffic. A good first day pairs JK Temple and Moti Jheel with an evening at Bithoor's ghats; later days add museums, markets and food streets.",
      keywords: ["itinerary"],
    },
    {
      id: "is-there-a-map-of-places-to-visit",
      question: "Is there a map of the top places to visit in Kanpur?",
      answer:
        "Yes. The [map of Kanpur](/#map-title) on this page shows the city on the Ganga so you can get your bearings, and every card on our [tourism page](/tourism) names its neighbourhood, so you can search it in your maps app. Our trip planner also keeps each day's stops close together.",
      keywords: ["map"],
    },
    {
      id: "what-is-the-weather-like-in-kanpur-today",
      question: "What's the weather like in Kanpur today?",
      answer:
        "The live line below shows the weather today in Kanpur, and our [weather page](/weather) has the full picture: current temperature, rain chances, an hourly forecast, tomorrow's outlook and a rain radar. October to March is the most comfortable time to explore; April to June is very hot, and July to September brings the monsoon.",
      keywords: ["weather", "weather today"],
      live: "todaySummary",
    },
    {
      id: "what-events-and-upcoming-festivals",
      question: "What events and upcoming festivals are happening in Kanpur?",
      answer:
        "Our [events page](/events) lists concerts, comedy, workshops and sports in Kanpur and nearby cities, refreshed daily with booking links. For the bigger picture, the [festival calendar](/celebrations) explains when each upcoming festival usually falls, from Holi and Ganga Mela to Durga Puja, Diwali and Dev Deepawali.",
      keywords: ["events", "upcoming festival"],
    },
    {
      id: "where-can-i-read-kanpur-news",
      question: "Where can I read the latest Kanpur news?",
      answer:
        "Our [news page](/news) gathers the latest headlines about Kanpur and its neighbouring cities from established newspapers such as Dainik Jagran, Amar Ujala, Hindustan and The Times of India. You can filter by city and topic, and every story links back to the original publisher so you read it at the source.",
      keywords: ["news"],
    },
    {
      id: "where-is-iit-kanpur",
      question: "Where is IIT Kanpur and how far is it from the city centre?",
      answer:
        "IIT Kanpur, which many locals simply call Kanpur IIT, is in Kalyanpur on the city's north-western edge, roughly 15 km from Kanpur Central railway station. Founded in 1959, its leafy campus even has its own airstrip. See our [campus guide](/campus) for colleges and student tips, and the [official IIT Kanpur website](https://www.iitk.ac.in) for visitor information.",
      keywords: ["kanpur iit"],
      // VERIFY: distance from Kanpur Central (~15 km by road).
    },
    {
      id: "where-to-go-for-a-night-out",
      question: "Where can I go for a good night out in Kanpur?",
      answer:
        "For a night out, head to Swaroop Nagar's rooftop restaurants, the late shows and food court at Z Square Mall, or Arya Nagar's evening chaat and kulfi stalls. The Ganga Barrage is a popular late drive with tea stalls by the river. Our [food & night life guide](/food-nightlife) has more ideas by area.",
      keywords: ["night out"],
    },
  ],

  tourism: [
    {
      id: "best-1-day-kanpur-itinerary",
      question: "What is the best 1-day itinerary for Kanpur?",
      answer:
        "Start early at JK Temple, then walk Moti Jheel or visit Kanpur Memorial Church and Phool Bagh. After lunch near Mall Road, drive out to Bithoor for the ghats and the evening aarti. Our [planner](#planner) builds a day like this for you and keeps each part of the day in one area.",
      keywords: ["itinerary"],
    },
    {
      id: "what-should-a-2-3-day-trip-include",
      question: "What should a 2–3 day Kanpur trip include?",
      answer:
        "With two or three days, add Allen Forest Zoo, the Kanpur Sangrahalaya museum, Jajmau's ancient mound and ghats, and a market evening in Naveen Market or Gumti No. 5. Save one evening for Arya Nagar's food lane. Set the days in our [planner](#planner) and it will spread the places sensibly across mornings and evenings.",
      keywords: [],
    },
    {
      id: "how-does-the-planner-work",
      question: "How does the trip planner on this page work?",
      answer:
        "Pick 1, 2 or 3 days and the interests you care about — history, food, nature or shopping. The [planner](#planner) chooses matching places, puts each at its best time of day, keeps same-day stops close together and lets you print or share the plan. It can also add Lucknow, Agra or Varanasi for a longer trip.",
      keywords: [],
    },
    {
      id: "is-there-a-map-of-tourist-places",
      question: "Is there a map of Kanpur's tourist places?",
      answer:
        "Each [place card](#sights-title) on this page names its neighbourhood, and our home page has a [map of Kanpur](/#map-title) to help you get your bearings. Most sights cluster in three areas: Mall Road and Phool Bagh in the centre, Sarvodaya Nagar around JK Temple, and Bithoor about 25 km upriver.",
      keywords: ["map"],
      // VERIFY: Bithoor distance from central Kanpur (~25 km).
    },
    {
      id: "best-weather-for-sightseeing",
      question: "What is the best weather for sightseeing in Kanpur?",
      answer:
        "October to March is ideal: sunny days of roughly 20–30°C and cool evenings. In summer, plan outdoor sights for early morning and evening; in the monsoon, keep an umbrella handy. Check the [weather forecast](/weather) for the week before you set off, including hourly rain chances.",
      keywords: ["weather forecast"],
    },
    {
      id: "can-i-add-nearby-cities",
      question: "Can I add Lucknow, Agra or Varanasi to my Kanpur trip?",
      answer:
        "Yes. Lucknow is about 90 km away (1.5–2 hours), while Agra and Varanasi are longer trips best done by train. Our [nearby cities guide](/nearby) compares distances and travel times, and its suggested circuits open straight in the planner on this page with the cities already selected.",
      keywords: [],
    },
    {
      id: "how-do-i-get-around-kanpur-city",
      question: "How do I get around Kanpur city?",
      answer:
        "Shared e-rickshaws and autos cover most short trips in Kanpur city, and app cabs are useful for longer hops such as Bithoor or IIT. The Kanpur Metro serves part of the city and is expanding, so check its current route before relying on it. Our [getting here guide](/#reach) covers trains, roads and flights.",
      keywords: ["kanpur city"],
      // VERIFY: Kanpur Metro operational stretch.
    },
  ],

  culture: [
    {
      id: "what-is-the-culture-of-kanpur-like",
      question: "What is the culture of Kanpur like?",
      answer:
        "It's a working city's character: direct, witty and hospitable. Its mill-town past brought people from across India, mixing Awadhi traditions with Bengali, Punjabi and Marwari communities. You'll feel it at Ganga Mela, in the ghats of Bithoor and on food streets. Our [festival calendar](/celebrations) is a good place to start.",
      keywords: ["culture"],
    },
    {
      id: "what-is-the-history-of-kanpur-india",
      question: "What is the history of Kanpur, India?",
      answer:
        "Known as Cawnpore under the British, the city grew around a large military cantonment from the late 1700s. It was at the centre of the 1857 uprising — the Siege of Cawnpore — and later became a textile and leather powerhouse. Bithoor and Jajmau are far older. See the [timeline](#timeline-title) on this page.",
      keywords: ["kanpur india"],
    },
    {
      id: "which-heritage-sites-and-is-there-a-map",
      question: "Which heritage sites tell Kanpur's story, and is there a map?",
      answer:
        "Start with the [heritage landmarks](#heritage-title) on this page: Kanpur Memorial Church, the Jajmau mound, Phool Bagh, the old mills and Bithoor. Each card names its area, and the [map on our home page](/#map-title) helps you place them. Most central sites can be seen in a day.",
      keywords: ["map"],
    },
    {
      id: "what-languages-are-spoken-in-kanpur",
      question: "What languages are spoken in Kanpur?",
      answer:
        "Hindi is the everyday language, spoken with a distinctive local Kanpuriya flavour that's famous for its humour. Urdu is widely understood, and English is common in business, colleges and hotels. Visitors who speak English or Hindi will get by easily; a friendly “bhaiya” goes a long way at shops and food stalls. Read more about the city's [people and history](#timeline-title).",
      keywords: [],
    },
    {
      id: "which-festival-shows-kanpur-best",
      question: "Which festival shows Kanpur at its most local?",
      answer:
        "Ganga Mela, a week after Holi, is uniquely Kanpur's: a final day of colour that ends at Sarsaiya Ghat. Navaratri and Durga Puja bring hundreds of pandals and garba nights — read our [Navaratri in Kanpur](/blogs/navaratri-in-kanpur) story. The full [festival calendar](/celebrations) covers the rest of the year.",
      keywords: [],
    },
  ],

  celebrations: [
    {
      id: "what-is-the-next-upcoming-festival",
      question: "What is the next upcoming festival in Kanpur?",
      answer:
        "Use the month filter on this page to see what usually falls next; dates follow the Hindu lunar calendar, so they shift a little each year. For exact dates of an upcoming festival and related concerts or melas, check our [events page](/events), which is refreshed daily.",
      keywords: ["upcoming festival"],
    },
    {
      id: "biggest-festivals-in-kanpur",
      question: "Which are the biggest festivals celebrated in Kanpur?",
      answer:
        "Holi and Kanpur's own Ganga Mela in March, Navaratri, Durga Puja and Dussehra in October, Diwali in October or November, and Dev Deepawali and Chhath on the ghats in November. Each has a card on this [festival calendar](#festivals-title) with where to experience it.",
      keywords: [],
    },
    {
      id: "what-is-ganga-mela",
      question: "What is Kanpur's Ganga Mela?",
      answer:
        "Ganga Mela is Kanpur's own post-Holi celebration, held about a week after Holi on Anuradha Nakshatra. It remembers the freedom struggle of 1942, when locals defied British orders against Holi celebrations. Colour fills Hatia and the old city before the day ends at a fair by Sarsaiya Ghat. See its card in the [festival calendar](#festivals-title).",
      keywords: [],
      // VERIFY: date each year (lunar calendar).
    },
    {
      id: "when-are-navaratri-and-durga-puja",
      question: "When are Navaratri and Durga Puja celebrated in Kanpur?",
      answer:
        "Sharad Navaratri usually falls in late September or October, with Durga Puja pandals opening in its final days and Dussehra after. Kanpur celebrates both: garba nights, Bengali pandals and the chunri ritual at Baradevi. Our story [Navaratri in Kanpur](/blogs/navaratri-in-kanpur) takes you through it day by day.",
      keywords: [],
      // VERIFY: dates each year.
    },
    {
      id: "festival-events-and-tickets",
      question: "Where can I find festival shows and tickets?",
      answer:
        "Our [events page](/events) lists garba and dandiya nights, concerts and melas in Kanpur and nearby cities, each with a link to book on BookMyShow when tickets are sold online. Many traditional celebrations, such as pandals and ghat aartis, are free and open to everyone.",
      keywords: ["events"],
    },
  ],

  food: [
    {
      id: "best-places-for-a-night-out",
      question: "Where are the best places for a night out in Kanpur?",
      answer:
        "Swaroop Nagar has the city's rooftop restaurants, Z Square Mall on Mall Road has late film shows and a food court, and Arya Nagar comes alive with chaat and kulfi in the evening. For a quieter night out, locals drive to the Ganga Barrage for tea by the river. See the [night life tab](#taste-title).",
      keywords: ["night out"],
    },
    {
      id: "what-street-food-is-kanpur-famous-for",
      question: "What street food is Kanpur famous for?",
      answer:
        "Kanpur is famous for Thaggu Ke Laddu at Bada Chauraha, spicy chaat and tikki, kachori-sabzi with jalebi for breakfast, kulhad chai with bun-maska, and handi biryani late at night. Browse the [street food tab](#taste-title) for where to find each, and try them hot from the stall.",
      keywords: [],
    },
    {
      id: "where-to-find-late-night-food",
      question: "Where can I find late-night food in Kanpur?",
      answer:
        "Handi biryani and kebab carts around Parade and Chaman Ganj, tea stalls near the Ganga Barrage, and the food court at Z Square Mall are the usual late options. Timings vary by season and day, so check before heading out. Our [food guide](#taste-title) lists the areas to try.",
      keywords: [],
    },
    {
      id: "good-cafes-for-a-relaxed-evening",
      question: "Are there good cafes in Kanpur for a relaxed evening?",
      answer:
        "Yes — Tilak Nagar, Civil Lines and Kakadeo have quiet cafes for coffee, bakes and long conversations, and Kakadeo's student cafes stay lively in the evenings. The [cafe tab](#taste-title) on this page suggests areas; the listings there are illustrative, so check maps for current openings.",
      keywords: [],
    },
    {
      id: "night-out-events-this-week",
      question: "Are there evening events in Kanpur this week?",
      answer:
        "Our [events page](/events) lists this week's comedy shows, concerts, open mics and parties in Kanpur, refreshed every morning with BookMyShow links. You can filter by city and category, so it's easy to pair a show with dinner in Swaroop Nagar or Mall Road.",
      keywords: ["events"],
    },
  ],

  shopping: [
    {
      id: "best-markets-in-kanpur-city",
      question: "Which are the best markets in Kanpur city?",
      answer:
        "Naveen Market for fabric and footwear, Gumti No. 5 for bangles and festive wear, Sisamau Bazaar for brass and spices, Bada Chauraha for wholesale textiles, and Z Square Mall for brands. Each [market card](#bazaars-title) on this page says what Kanpur city's bazaars are best for and when to go.",
      keywords: ["kanpur city"],
    },
    {
      id: "where-to-buy-leather-goods",
      question: "Where can I buy leather goods in Kanpur?",
      answer:
        "Jajmau, on the city's eastern edge, is the centre of Kanpur's leather industry, with factory outlets selling bags, belts, jackets and saddlery. Mornings on weekdays are quieter. Compare prices across a few shops, and see the [Jajmau leather market card](#bazaars-title) for more.",
      keywords: [],
    },
    {
      id: "best-time-to-visit-markets",
      question: "When is the best time to visit Kanpur's markets?",
      answer:
        "Most bazaars are busiest in the evening, when they're also at their liveliest; late mornings are calmer for serious shopping. Weekday afternoons suit wholesale areas like Bada Chauraha. In summer, the air-conditioned Z Square Mall is a relief at midday. Each [market card](#bazaars-title) suggests a best time.",
      keywords: [],
    },
    {
      id: "is-there-a-map-of-shopping-streets",
      question: "Is there a map of Kanpur's shopping streets?",
      answer:
        "We don't have a separate shopping map yet. Each [market card](#bazaars-title) names its area, and the [map of Kanpur](/#map-title) on our home page helps you get your bearings. Naveen Market, Bada Chauraha and Sisamau are close together in the old city; Z Square and Arya Nagar are nearer Mall Road and Swaroop Nagar.",
      keywords: ["map"],
    },
  ],

  outdoor: [
    {
      id: "sports-events-at-green-park",
      question: "What sports events happen at Green Park Stadium?",
      answer:
        "Green Park is one of India's oldest international cricket grounds and has hosted Test matches; it also stages domestic and state-level fixtures. Match schedules change each season, so check the official cricket boards for fixtures, and our [events page](/events) for ticketed matches when they're listed.",
      keywords: [],
      // VERIFY: upcoming fixtures each season.
    },
    {
      id: "parks-and-ghats-for-a-morning-out",
      question: "Which parks and ghats are best for a morning out?",
      answer:
        "Moti Jheel's promenade is the favourite for morning walks, Nana Rao Park is green and central, and Allen Forest Zoo combines a walk with wildlife. For sunrise by the river, drive out to Bithoor's ghats. See all six [outdoor spots](#outdoor-title) on this page.",
      keywords: [],
    },
    {
      id: "will-rain-affect-outdoor-plans-today",
      question: "Will rain affect outdoor plans today?",
      answer:
        "The live line below shows today's chance of rain in Kanpur. For anything more detailed, our [weather page](/weather) has the hourly rain forecast and a live radar, so you can see whether rain today is likely to clear by evening. In the monsoon, keep indoor options in mind.",
      keywords: ["rain today", "rain forecast"],
      live: "rainChanceToday",
    },
    {
      id: "is-boating-available-on-the-ganga",
      question: "Is boating available on the Ganga near Kanpur?",
      answer:
        "Boat rides are offered from the ghats at Bithoor, upriver from the city, depending on the river level and season. Availability and prices are set by local boatmen, so ask at the ghat and agree the fare before you set off. See the [Bithoor riverfront card](#outdoor-title) for more.",
      keywords: [],
      // VERIFY: seasonal availability.
    },
    {
      id: "best-season-for-outdoor-activities",
      question: "What is the best season for outdoor activities in Kanpur?",
      answer:
        "October to March, when the weather is cool and dry, is the best season for walks, cricket and riverside outings. From April to June, go early or late to avoid the heat; during the monsoon, check the forecast first. Our [weather page](/weather) shows the week ahead.",
      keywords: ["the weather"],
    },
  ],

  nearby: [
    {
      id: "best-weekend-trips-from-kanpur",
      question: "What are the best weekend trips from Kanpur?",
      answer:
        "Lucknow is the easiest — about 90 km for kebabs, monuments and chikankari. Ayodhya and Prayagraj make good two-day trips, while Agra and Varanasi are best by train with an overnight stay. Compare them in the [city table](#compare-title) and pick a [circuit](#circuits-title) that fits your days.",
      keywords: [],
    },
    {
      id: "is-there-a-map-of-cities-around-kanpur",
      question: "Is there a map of the cities around Kanpur?",
      answer:
        "Yes — the [hub map](#hub-title) at the top of this page shows Kanpur at the centre with approximate road distances to Lucknow, Agra, Prayagraj, Varanasi and Ayodhya. Tap a city to open its guide, which has its own map of top places.",
      keywords: ["map"],
    },
    {
      id: "plan-a-multi-city-itinerary",
      question: "How do I plan a multi-city itinerary from Kanpur?",
      answer:
        "Choose one of our [suggested circuits](#circuits-title), such as Kanpur–Lucknow–Ayodhya, and it opens in the [trip planner](/tourism?cities=lucknow,ayodhya#planner) with those cities selected. You can change the days and interests there, and the itinerary is grouped day by day so you can print or share it.",
      keywords: ["itinerary"],
    },
    {
      id: "how-far-are-the-nearby-cities",
      question: "How far are Lucknow, Agra, Prayagraj, Varanasi and Ayodhya from Kanpur?",
      answer:
        "By road, roughly: Lucknow 90 km (1.5–2 hours), Prayagraj 200 km (3.5–4 hours), Ayodhya 220 km (about 4 hours), Agra 280 km (4.5–5 hours) and Varanasi 330 km (5–6 hours). Trains are often faster for the longer trips. See the [comparison table](#compare-title).",
      keywords: [],
      // VERIFY: approximate distances and journey times.
    },
    {
      id: "check-weather-in-each-city",
      question: "How can I check the weather in each city before I travel?",
      answer:
        "Our [weather page](/weather) has a button for each city, with current conditions, an hourly and 7-day weather forecast and a rain radar. Each city guide also links straight to its own forecast, so you can check before booking trains or packing.",
      keywords: ["weather forecast"],
    },
  ],

  events: [
    {
      id: "what-events-are-on-this-week",
      question: "What's happening in Kanpur this week?",
      answer:
        "This page lists concerts, comedy, workshops, sports and festivals in Kanpur, sorted by date. Use the city and category filters to narrow it down, and the BookMyShow buttons to see everything on sale. New listings are added by our team and checked every morning. For seasonal celebrations, see the [festival calendar](/celebrations).",
      keywords: ["events"],
    },
    {
      id: "next-upcoming-festival-kanpur-and-nearby",
      question: "What is the next upcoming festival in Kanpur and nearby cities?",
      answer:
        "Festival shows appear in this list as their dates are announced. For the bigger picture — when Holi, Ganga Mela, Durga Puja, Diwali or Dev Deepawali usually fall — see our [festival calendar](/celebrations). Varanasi's Dev Deepawali and Ayodhya's Deepotsav are well worth the trip.",
      keywords: ["upcoming festival"],
    },
    {
      id: "good-night-out-events",
      question: "What's on for a good night out in Kanpur?",
      answer:
        "Stand-up comedy, live music and screenings are the regulars; filter this list by category to find them. Pair a show with dinner using our [food & night life guide](/food-nightlife), which covers rooftops, cafes and late-night food by area for a complete night out.",
      keywords: ["night out"],
    },
    {
      id: "how-often-is-the-list-updated",
      question: "How often is this list updated?",
      answer:
        "Every morning. Past listings are archived automatically and booking links are re-checked daily, so you shouldn't see expired listings. The BookMyShow buttons at the top always open the full, current list for each city. Missing something? Tell us via the [team page](/team).",
      keywords: [],
    },
    {
      id: "how-do-i-book-tickets",
      question: "How do I book tickets for an event?",
      answer:
        "Tap the BookMyShow button on an event to book on BookMyShow's own site — we don't sell tickets or handle payments. Some celebrations, like ghat aartis and pandals, are free. Always check timings and venue details on the booking page before you go. Browse more ideas on our [celebrations page](/celebrations).",
      keywords: [],
    },
    {
      id: "are-nearby-city-events-listed",
      question: "Are shows in Lucknow, Varanasi and other nearby cities listed too?",
      answer:
        "Yes. Use the city filter for Lucknow, Agra, Prayagraj, Varanasi or Ayodhya, or the BookMyShow button for each city. Listings are refreshed every morning like Kanpur's. Combine a show with a weekend trip using our [nearby cities guide](/nearby), which compares distances and travel times.",
      keywords: [],
    },
  ],

  weather: [
    // Today & right now
    {
      id: "what-is-the-weather-today-in-kanpur",
      group: "Today & right now",
      question: "What is the weather today in Kanpur?",
      answer:
        "The live line below sums up conditions in Kanpur, and the [today strip](#today) adds the high and low, chance of rain, humidity, wind, UV index and sunrise and sunset. Scroll on for the next 24 hours, tomorrow and the week ahead — everything you need to plan around the weather.",
      keywords: ["weather today", "the weather"],
      live: "todaySummary",
    },
    {
      id: "what-is-the-current-temperature-in-kanpur",
      group: "Today & right now",
      question: "What is the current temperature in Kanpur right now?",
      answer:
        "The “Kanpur weather right now” card at the top shows the temperature now, what it feels like, humidity and wind. This live temperature refreshes every 30 minutes, so it's a dependable guide to the weather now; reload before you head out. For the temperature today from morning to night, see the [next 24 hours](#hourly).",
      keywords: ["current temperature", "temperature now", "live temperature", "weather right now", "weather now", "temperature today"],
      live: "currentTemp",
    },
    {
      id: "will-it-rain-today-in-kanpur",
      group: "Today & right now",
      question: "Will it rain today in Kanpur?",
      answer:
        "The live line below shows today's highest chance of rain. For timing, the [hourly row](#hourly) gives the rain percentage for each hour, and the radar shows showers moving in. If you're checking the weather today, rain is unlikely outside the monsoon; from July to September, wet weather, rain and waterlogging are common, so carry an umbrella.",
      keywords: ["rain today", "weather today rain", "weather rain"],
      live: "rainChanceToday",
    },
    {
      id: "todays-weather-conditions-and-report",
      group: "Today & right now",
      question: "What are today's weather conditions in Kanpur?",
      answer:
        "Together, the current weather card and the [today strip](#today) work as a simple weather report today: sky conditions, high and low, rain chance, humidity, wind, UV index and sunrise and sunset. These weather conditions come from computer models rather than a staffed station; for an official weather report and warnings, use [IMD](https://mausam.imd.gov.in).",
      keywords: ["current weather", "weather report today", "weather conditions", "weather report"],
    },
    // Tomorrow
    {
      id: "weather-forecast-for-tomorrow-in-kanpur",
      group: "Tomorrow",
      question: "What is the weather forecast for tomorrow in Kanpur?",
      answer:
        "The [Tomorrow card](#tomorrow) shows Kanpur weather tomorrow at a glance: the sky, the high and low, and the chance of rain. The live line below gives the same summary. Forecasts for tomorrow are usually reliable, but they're updated through the day, so check again in the evening before you plan an early start.",
      keywords: ["weather forecast for tomorrow", "weather tomorrow"],
      live: "tomorrowSummary",
    },
    {
      id: "will-it-rain-tomorrow",
      group: "Tomorrow",
      question: "Will it rain tomorrow in Kanpur?",
      answer:
        "Planning around the weather tomorrow, rain included? Chances above about 50% mean showers are likely at some point; below 20%, a dry day is much more likely. The live line below shows tomorrow's rain forecast, and the [7-day outlook](#week) shows how the week develops.",
      keywords: ["weather tomorrow rain", "rain forecast"],
      live: "rainChanceTomorrow",
    },
    // Radar & rain
    {
      id: "is-there-a-live-weather-radar-for-kanpur",
      group: "Radar & rain",
      question: "Is there a live weather radar for Kanpur?",
      answer:
        "Yes — the [live rain radar](#radar) on this page shows rain and showers around Kanpur or your chosen city, replaying roughly the last two hours so you can see where the rain is heading. The weather radar images come from RainViewer, drawn over an OpenStreetMap base. If the radar can't load, we link to IMD's official images instead.",
      keywords: ["live weather radar", "rain radar", "weather radar", "radar"],
    },
    {
      id: "how-accurate-is-the-rain-forecast",
      group: "Radar & rain",
      question: "How accurate is the rain forecast and radar?",
      answer:
        "The map shows rain that is falling now, so it's best for the next hour or two. A prediction is a probability: a 30% chance means rain is possible, not certain. Short, heavy monsoon showers are the hardest to time. For important plans, check the [hourly row](#hourly) and [IMD](https://mausam.imd.gov.in) warnings.",
      keywords: ["forecast"],
    },
    // Your location
    {
      id: "can-i-check-the-weather-at-my-location",
      group: "Your location",
      question: "Can I check the weather today at my location?",
      answer:
        "Yes. Tap Use my location beside the city buttons and allow access when your browser asks. The page then shows the local weather wherever you are, with the place name on top. Whether you searched for weather near me or weather in my location, it covers today, the next 24 hours and the week. You can switch back to any [city](#now-title) at any time.",
      keywords: ["weather today at my location", "local weather", "weather near me"],
    },
    {
      id: "temperature-and-rain-at-my-location",
      group: "Your location",
      question: "Can I see the temperature today at my location, and whether it will rain?",
      answer:
        "Yes. Once Use my location is on, every card switches over — rain, weather today at my location, the hourly row and tomorrow — so the page becomes a weather report today in my location. The [today strip](#today) gives the high, low and rain chance; the hourly row shows when rain is most likely.",
      keywords: ["temperature today at my location", "rain weather today at my location", "weather report today in my location"],
    },
    {
      id: "can-i-check-the-weather-tomorrow-at-my-location",
      group: "Your location",
      question: "Can I check the weather tomorrow at my location?",
      answer:
        "Yes. With Use my location turned on, the [Tomorrow card](#tomorrow) and the 7-day outlook show your area instead of Kanpur. The button remembers that you chose it, so the page can offer your own “my weather” view next time; it still asks your browser for permission each time.",
      keywords: ["weather tomorrow at my location", "my weather"],
    },
    {
      id: "do-you-store-my-location",
      group: "Your location",
      question: "Do you store my location?",
      answer:
        "No. Your browser shares your position only after you tap the button, and your browser uses it, rounded to about a kilometre, to fetch your readings from Open-Meteo and the place name from BigDataCloud. We never save it or send it to our servers; all we remember, on your device, is that you chose this weather location option. See our [privacy policy](/privacy).",
      keywords: ["weather location", "weather in my location"],
      // Note: "weather in my location" — the location answer above covers it too.
    },
    // Forecasts, updates & sources
    {
      id: "how-far-ahead-does-the-forecast-go",
      group: "Forecasts, updates & sources",
      question: "How far ahead does the local weather forecast go?",
      answer:
        "This page shows the next 24 hours hour by hour, a tomorrow card and a 7-day weather forecast. The first two or three days are the most dependable; days five to seven show the trend rather than exact details. See the [7-day outlook](#week).",
      keywords: ["local weather forecast", "weather forecast"],
    },
    {
      id: "how-often-is-the-weather-updated",
      group: "Forecasts, updates & sources",
      question: "How often is the weather updated, and where does the weather information come from?",
      answer:
        "Our weather information comes from Open-Meteo, a free, open data service that combines national forecasting models. The page refreshes every 30 minutes, so each weather update today shows the latest model run; the time of the last weather update is shown under the [7-day outlook](#week). It's live weather from computer models, not a staffed station.",
      keywords: ["weather information", "weather update today", "weather update", "live weather"],
    },
    {
      id: "where-to-find-weather-news-and-warnings",
      group: "Forecasts, updates & sources",
      question: "Where can I find weather news and official warnings?",
      answer:
        "For official warnings — heatwaves, cold waves, fog or heavy rain — use the India Meteorological Department at [IMD](https://mausam.imd.gov.in). For weather news, such as monsoon updates and fog delays, see our [monsoon, fog and heat stories](/news?genre=weather-environment), collected from local papers.",
      keywords: ["weather news"],
    },
    {
      id: "what-does-feels-like-mean",
      group: "Forecasts, updates & sources",
      question: "What does the “feels like” temperature mean?",
      answer:
        "The weather temperature is what a thermometer reads in the shade. “Feels like” adds humidity and wind to estimate how warm or cold it feels on your skin: in a humid Kanpur summer it can be several degrees higher. Use it to plan clothing and water; see it on the [current conditions card](#now-title).",
      keywords: ["weather temperature"],
    },
    // Seasons
    {
      id: "best-weather-to-visit-kanpur",
      group: "Seasons",
      question: "What is the best season to visit Kanpur?",
      answer:
        "October to March is the most pleasant time: sunny days of about 20–30°C and cool evenings, perfect for ghats, walks and festivals like Diwali and Dev Deepawali. Late December and January can be foggy and cold at night. See the [seasons guide](#seasons-title) and plan places with our [itinerary planner](/tourism#planner).",
      keywords: [],
    },
    {
      id: "how-hot-is-summer-and-when-is-the-monsoon",
      group: "Seasons",
      question: "How hot does Kanpur get in summer, and when is the monsoon?",
      answer:
        "From April to June afternoons often pass 40°C, with hot, dry winds; plan sightseeing for early morning and evening and drink plenty of water. The monsoon usually arrives in late June or early July and lasts until September, bringing heavy showers and humidity. Read the [seasons guide](#seasons-title).",
      keywords: [],
      // VERIFY: monsoon onset varies each year.
    },
    {
      id: "does-kanpur-get-fog-in-winter",
      group: "Seasons",
      question: "Does Kanpur get fog in winter, and does it affect trains and flights?",
      answer:
        "Yes. Dense fog is common on December and January mornings, and nights can drop to around 5°C. Fog often delays trains across north India and can affect flights. Check your train's running status and airline updates, and see [IMD](https://mausam.imd.gov.in) for fog warnings. More in our [seasons guide](#seasons-title).",
      keywords: [],
    },
  ],

  news: [
    {
      id: "latest-kanpur-news-today",
      question: "Where can I read the latest Kanpur headlines today?",
      answer:
        "Right here: this page gathers the latest local stories about Kanpur and its neighbouring cities from established newspapers, sorted newest first. Every story links to the original publisher. Use the city and topic filters to focus on what you need, or browse the [newspaper directory](#directory-title) for each paper's own site.",
      keywords: ["news"],
    },
    {
      id: "how-often-is-the-news-updated",
      question: "How often are the headlines updated?",
      answer:
        "Once a day, early every morning, from the newspapers' public feeds; between refreshes the page keeps the latest stories. Breaking stories may appear on the publishers' sites first, so for something urgent, open the paper directly from our [directory](#directory-title). Older stories drop off as new ones arrive.",
      keywords: [],
    },
    {
      id: "weather-news-and-updates",
      question: "Where can I find weather news and updates for Kanpur?",
      answer:
        "Choose the Weather & Environment topic, or open [weather news](/news?genre=weather-environment) directly, for stories on heatwaves, fog, the monsoon and air quality. Stories come from the same established newspapers as the rest of this page. For a live weather update, hourly forecast and rain radar, see our [weather page](/weather).",
      keywords: ["weather news", "weather update"],
    },
    {
      id: "filter-news-by-city-and-topic",
      question: "Can I filter stories by city and topic?",
      answer:
        "Yes. Use the city buttons for Kanpur, Lucknow, Agra, Prayagraj, Varanasi or Ayodhya, and the topic buttons for city affairs, politics, business, sports, culture, education, health, weather and more. Each combination also has its own page, such as [Kanpur lifestyle & culture](/news/kanpur/lifestyle-culture).",
      keywords: [],
    },
    {
      id: "which-newspapers-and-sources",
      question: "Which newspapers and sources do you include?",
      answer:
        "Established Hindi and English publishers, including Dainik Jagran, Amar Ujala, Hindustan, Dainik Bhaskar, Navbharat Times, The Times of India, Hindustan Times, The Indian Express, The Hindu, India Today and NDTV. We show headlines and links only; the full stories stay on the publishers' sites. See the [directory](#directory-title).",
      keywords: [],
    },
  ],

  accommodation: [
    {
      id: "best-area-to-stay-in-kanpur-city",
      question: "Which is the best area to stay in Kanpur city?",
      answer:
        "Mall Road and Civil Lines are central and well connected, with older hotels and easy access to museums and shopping. Swaroop Nagar has restaurants and a lively evening scene. Near Kanpur Central suits a quick rail stop-over. See the [stay areas](#stays-title) on this page — the listings there are examples to show what each area offers, so book through trusted platforms.",
      keywords: ["kanpur city"],
    },
    {
      id: "where-to-stay-near-iit-kanpur",
      question: "Where should I stay near IIT Kanpur?",
      answer:
        "IIT Kanpur is in Kalyanpur on the north-western edge of the city, so Kalyanpur and Kakadeo are the closest areas with guesthouses and student-friendly stays. Visitors with official business can ask their host department about on-campus guesthouses. More on the [Kanpur IIT campus](/campus) and [stay areas](#stays-title).",
      keywords: ["kanpur iit"],
    },
    {
      id: "hotels-near-kanpur-central",
      question: "Are there hotels near Kanpur Central railway station?",
      answer:
        "Yes, there are several budget and mid-range hotels within a short ride of Kanpur Central, convenient for early trains. Read recent reviews and check the exact distance before booking. Our [stay areas](#stays-title) section explains what each part of the city is like.",
      keywords: [],
    },
    {
      id: "is-there-a-map-of-stay-areas",
      question: "Is there a map of stay areas in Kanpur?",
      answer:
        "We don't have a dedicated hotels map yet. Each card in the [stay areas](#stays-title) section names its area, and the [map of Kanpur](/#map-title) on our home page helps you see how Mall Road, Civil Lines, Swaroop Nagar and Kanpur Central sit in relation to each other.",
      keywords: ["map"],
    },
  ],

  campus: [
    {
      id: "where-is-iit-kanpur-and-how-to-get-there",
      question: "Where is IIT Kanpur located, and how do I get there?",
      answer:
        "IIT Kanpur is in Kalyanpur, on the city's north-western edge, roughly 15 km from Kanpur Central. Autos, cabs and city buses run to the main gate on the Grand Trunk Road side. Many locals call it Kanpur IIT. For directions and visitor details, see the [official IIT Kanpur website](https://www.iitk.ac.in) and our [student tips](#tips-title).",
      keywords: ["kanpur iit"],
      // VERIFY: distance from Kanpur Central.
    },
    {
      id: "can-visitors-enter-iit-kanpur",
      question: "Can visitors enter the IIT Kanpur campus?",
      answer:
        "Rules for visitors can change, so please check the [official IIT Kanpur website](https://www.iitk.ac.in) or contact the institute before you go. Public events, such as fests and lectures, sometimes welcome visitors with registration. Our [campus guide](#inst-title) covers other colleges in the city too.",
      keywords: [],
    },
    {
      id: "main-colleges-and-universities",
      question: "Which are the main colleges and universities in Kanpur?",
      answer:
        "IIT Kanpur, Harcourt Butler Technical University (HBTU), GSVM Medical College, Chhatrapati Shahu Ji Maharaj University (CSJMU), Christ Church College and DAV College are the best known. Together they bring thousands of students to the city every year. See each [institution card](#inst-title) for what it's known for, and our student tips for life off campus.",
      keywords: [],
    },
    {
      id: "student-night-out-and-weekends",
      question: "What do students do for a night out or weekend in Kanpur?",
      answer:
        "Cafes in Kakadeo and Swaroop Nagar, chaat in Arya Nagar, films at Z Square and late tea at the Ganga Barrage are student favourites for a night out. Weekends mean trips to Bithoor, Lucknow or a fest. Our [food & night life guide](/food-nightlife) and [events page](/events) have more.",
      keywords: ["night out"],
    },
    {
      id: "weather-across-the-academic-year",
      question: "What's the weather like for students across the academic year?",
      answer:
        "The odd semester starts in the humid monsoon, cools down by October, and ends in a foggy, cold December. The even semester runs from mild January into a very hot April and May. Pack layers for winter and cotton for summer, and check the [weather page](/weather) before trips.",
      keywords: [],
    },
  ],

  blogs: [
    {
      id: "who-writes-the-blogs",
      question: "Who writes the Kanpur Ki Kahaani blogs?",
      answer:
        "Our stories are written by the Kanpur Ki Kahaani team — writers, strategists and storytellers who love the city — led by our blog editor. Each story has an author box, and you can [meet the whole team](/team) to see who does what.",
      keywords: [],
    },
    {
      id: "what-topics-do-the-blogs-cover",
      question: "What topics do the blogs cover?",
      answer:
        "Travel journals, food trails, festivals, history and everyday life in Kanpur and its neighbouring cities. Expect stories on culture, such as how the city celebrates Navaratri, and guides timed to each upcoming festival. Start with [Navaratri in Kanpur](/blogs/navaratri-in-kanpur), then browse by tag or city.",
      keywords: ["culture", "upcoming festival"],
    },
    {
      id: "get-new-stories-by-email",
      question: "How can I get new stories by email?",
      answer:
        "Sign up for The Kahaani Letter using the form on this page or on our [home page](/#newsletter). It arrives once a week with new stories, food trails and weekend ideas, and you can unsubscribe at any time with one click.",
      keywords: [],
    },
  ],

  team: [
    {
      id: "who-is-behind-kanpur-ki-kahaani",
      question: "Who is behind Kanpur Ki Kahaani?",
      answer:
        "A team of seven: a blog editor, a web designer, a content strategist, leads for Reddit and Medium, Instagram and Facebook, outreach, and SEO and promotions. Together they research, write, design and share stories about Kanpur and its neighbours. Read each person's role on this page, then explore our [blogs](/blogs).",
      keywords: [],
    },
    {
      id: "how-can-i-collaborate",
      question: "How can I collaborate or feature my story about Kanpur?",
      answer:
        "Message us on Instagram — our outreach lead works with creators, volunteers and local businesses on reels, reposts with credit, and features. Have a written story? Tell us what it's about and we'll get back to you. Our [blogs](/blogs) show the kind of stories we tell.",
      keywords: [],
    },
    {
      id: "where-to-follow-kanpur-ki-kahaani",
      question: "Where can I follow Kanpur Ki Kahaani on social media?",
      answer:
        "We're on Instagram, Facebook, X, Medium and Reddit — the icons are in the top bar and the footer of every page. Follow along for reels, photo stories and discussions about the city. For new stories once a week, straight to your inbox, join our [newsletter](/#newsletter).",
      keywords: [],
    },
  ],

  playlist: [
    {
      id: "what-is-the-city-playlist",
      question: "What is the Kanpur Ki Kahaani city playlist?",
      answer:
        "The Sound of Kanpur is a Spotify playlist we put together to soundtrack the city — songs that capture the region's mood, from classic thumri and kajri influences to modern indie. Listen right on this page, and pair it with our [stories](/blogs).",
      keywords: [],
    },
    {
      id: "music-that-reflects-kanpurs-culture",
      question: "What kind of music reflects Kanpur's culture?",
      answer:
        "Kanpur sits in the Awadh region, so its musical culture shares Lucknow's love of thumri, ghazal and qawwali, alongside folk forms like kajri sung in the monsoon. Today the city's young musicians add indie and Hindi pop. Explore more of the city's [culture and history](/culture-history).",
      keywords: ["culture"],
    },
    {
      id: "can-i-listen-on-spotify",
      question: "Can I listen to the playlist on Spotify?",
      answer:
        "Yes — the player on this page streams it from Spotify, and the Open in Spotify button lets you follow it in the app. You'll need a Spotify account for full playback; without one you may hear previews. Find more of the city on our [home page](/).",
      keywords: [],
    },
  ],
};

/**
 * City-page FAQs from one template, filled from the city data so every city's answers are
 * specific (places, food, best time, how to get there).
 */
export function cityFaqs(city: City): FaqItem[] {
  const places = allPlaces.filter((p) => p.city === city.slug).map((p) => p.name);
  const dishes = food.filter((f) => f.city === city.slug).map((f) => f.name);
  const markets = shopping.filter((s) => s.city === city.slug).map((s) => s.name);
  const list = (xs: string[], n: number) => {
    const s = xs.slice(0, n);
    return s.length > 1 ? `${s.slice(0, -1).join(", ")} and ${s.at(-1)}` : (s[0] ?? "");
  };
  return [
    {
      id: `what-is-${city.slug}-famous-for`,
      question: `What is ${city.name} famous for?`,
      answer: `${city.name} — ${city.tagline.toLowerCase()} — is known for ${city.bestFor.toLowerCase()}. Its culture shows in places like ${list(places, 3)}, in dishes such as ${list(dishes, 2)}, and in markets like ${list(markets, 2)}. Our [guide to ${city.name}](#about-title) has the full story.`,
      keywords: ["culture"],
    },
    {
      id: `${city.slug}-itinerary`,
      question: `What is a good 1–2 day itinerary for ${city.name}?`,
      answer: `Our [suggested itinerary](#itinerary) for ${city.name} covers the highlights day by day, starting with ${list(places, 2)}. With a second day, slow down and add ${list(places.slice(2), 2) || "a slower walk through the old city"}. To combine ${city.name} with Kanpur, open it in our [trip planner](/tourism?cities=${city.slug}#planner).`,
      keywords: ["itinerary"],
    },
    {
      id: `weather-in-${city.slug}-today`,
      question: `What's the weather in ${city.name} today, and when is the best time to visit?`,
      answer: `The live line below gives the weather today in ${city.name}; for the hourly view, tomorrow and the week ahead, see [${city.name} weather](/weather?city=${city.slug}). The best time to visit is ${city.bestTime}, when days are pleasant for sightseeing; summers are very hot and the monsoon runs roughly July to September.`,
      keywords: ["weather today"],
      live: "todaySummary",
    },
    {
      id: `how-to-reach-${city.slug}-from-kanpur`,
      question: `How do I reach ${city.name} from Kanpur?`,
      answer: `${city.name} is about ${city.distanceKm} km from Kanpur. By road it takes ${city.driveTime}; by train, ${city.trainTime}. The fastest option is usually: ${city.fastestWay}. The nearest airport is ${city.nearestAirport}. See [getting there](#getting-title) for all the options.`,
      keywords: [],
      // VERIFY: distances and journey times are approximate.
    },
    {
      id: `events-and-festivals-in-${city.slug}`,
      question: `What events and upcoming festivals are there in ${city.name}?`,
      answer: `Our [events page](/events?city=${city.slug}) lists concerts, shows and festival events in ${city.name}, refreshed daily with booking links. For each upcoming festival, remember that dates follow the lunar calendar; ${city.bestTime.includes("(") ? `the big one here is ${city.bestTime.split("(")[1].replace(")", "")}` : "October to March is festival season"}. Our [festival calendar](/celebrations) explains when each one usually falls and how to experience it.`,
      keywords: ["events", "upcoming festival"],
    },
    {
      id: `map-of-${city.slug}`,
      question: `Where can I see a map of ${city.name}'s top places?`,
      answer: `The [map of ${city.name}](#map-title) on this page shows the city, and every [place card](#places-title) names its area so you can find it in your maps app. Most visitors start with ${list(places, 2)}, then add the rest by area to keep travel short. The [itinerary](#itinerary) groups them day by day.`,
      keywords: ["map"],
    },
  ];
}

/** FAQs for every page, in a stable order (for /faq and the coverage check). */
export function allFaqGroups() {
  return [
    ...(Object.keys(faqs) as FaqPage[]).map((k) => ({ key: k as string, ...faqPageInfo[k], items: faqs[k] })),
    ...cities.map((c) => ({ key: `city-${c.slug}`, path: `/cities/${c.slug}`, label: c.name, title: `${c.name} — FAQs`, items: cityFaqs(c) })),
  ];
}
