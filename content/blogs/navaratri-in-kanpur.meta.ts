/**
 * Everything about the Navaratri post except the author's prose (which is in navaratri-in-kanpur.html).
 * The boxes below are written by the site, not by the author, and render outside her text.
 * External URLs are CANDIDATES until scripts/check-links.ts has verified them (see reports/).
 */
import { bookMyShowCityUrls } from "../../src/data/site";

const maps = (q: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q).replace(/%20/g, "+")}`;

export const navaratriPost = {
  slug: "navaratri-in-kanpur",
  title: "Why Navaratri in Kanpur Is Something Everyone Must Experience!",
  titleEmphasis: "Everyone Must Experience",
  author: { slug: "rakshaa-mukesh", name: "Rakshaa Mukesh", bio: "Writer and storyteller for Kanpur Ki Kahaani." },
  publishedAt: "2026-10-14T10:00:00+05:30",
  city: "kanpur",
  category: "celebrations",
  tags: ["navaratri", "durga-puja", "garba", "festivals", "kanpur-food", "culture", "uttar-pradesh"],
  excerpt:
    "Gujarat brings the garba, Kolkata brings the pandals — Kanpur brings both. A day-by-day guide to nine nights of chunri wishes, falahari feasts, 300+ pandals and Sindoor Khela.",
  seoTitle: "Navaratri in Kanpur: 9-Day Guide to Rituals, Food, Pandals & Garba | Kanpur Ki Kahaani",
  seoDescription:
    "From the Baradevi chunri ritual to falahari food trails, 300+ Durga Puja pandals, garba nights and Sindoor Khela — a day-by-day guide to Navaratri in Kanpur.",
  pullQuote:
    "In Kanpur, Navaratri is a cultural crossroad where 1,000-year-old local temples, Bengal community pandals, and vibrant garba nights all coexist under one splendid skyline.",
  cover: {
    url: "/images/blogs/navaratri-in-kanpur/cover.jpg",
    alt: "A brightly lit Durga Puja pandal with the goddess Durga idol at night",
    caption: "Representative image",
    credit: "", // filled in once the Wikimedia Commons photo is chosen and verified
  },

  keyFacts: [
    { label: "When", value: "Sharad Navaratri, usually late September–October" },
    { label: "Where", value: "Temples, Swaroop Nagar, Civil Lines and community pandals citywide" },
    { label: "Don't miss", value: "The Baradevi chunri ritual, Sandhi Puja and Sindoor Khela" },
    { label: "Eat", value: "Kuttu, sabudana and falahari chaat" },
  ],

  planVisit: [
    { group: "Getting here", label: "Kanpur Central railway station", url: maps("Kanpur Central railway station") },
    { group: "Getting here", label: "Kanpur Airport (Chakeri)", url: maps("Kanpur Airport Chakeri") },
    { group: "Getting here", label: "How to reach Kanpur", url: "/#reach" },
    { group: "Places in this story", label: "Kanpur Bengali Club", url: maps("Kanpur Bengali Club") },
    { group: "Places in this story", label: "Swaroop Nagar", url: maps("Swaroop Nagar, Kanpur") },
    { group: "Places in this story", label: "Civil Lines", url: maps("Civil Lines, Kanpur") },
    { group: "Places in this story", label: "JK Temple", url: maps("JK Temple, Kanpur") },
    { group: "Places in this story", label: "Bithoor ghats", url: maps("Bithoor Ghat, Kanpur") },
    { group: "On our site", label: "Where to stay in Kanpur", url: "/accommodation" },
    { group: "On our site", label: "Kanpur weather this week", url: "/weather" },
    { group: "On our site", label: "Upcoming events", url: "/events" },
    { group: "On our site", label: "Build your Kanpur itinerary", url: "/tourism#planner" },
    { group: "Tickets", label: "Garba & dandiya nights on BookMyShow", url: bookMyShowCityUrls.kanpur },
  ],

  glossary: [
    { term: "Ghatasthapana", definition: "The Day 1 ritual of installing a sacred pot (kalash) that invokes the goddess for the nine nights.", url: "https://en.wikipedia.org/wiki/Kalasha", source: "Wikipedia" },
    { term: "Falahar", definition: "Fasting food made without grains — fruit, kuttu, sabudana, potatoes and rock salt.", url: "https://en.wikipedia.org/wiki/Upavasa", source: "Wikipedia" },
    { term: "Akhand Jyoti", definition: "An oil lamp kept burning without a break through all nine days.", url: "https://en.wikipedia.org/wiki/Aarti", source: "Wikipedia" },
    { term: "Khazana", definition: "Temple-blessed coins kept at home as a token of the goddess's prosperity.", url: "https://en.wikipedia.org/wiki/Lakshmi_Puja", source: "Wikipedia" },
    { term: "Pandal", definition: "A temporary, often elaborately themed structure that houses the goddess's idol during Durga Puja.", url: "https://en.wikipedia.org/wiki/Pandal", source: "Wikipedia" },
    { term: "Dhunuchi", definition: "A clay incense burner filled with coconut husk and resin, swung in a devotional dance.", url: "https://en.wikipedia.org/wiki/Censer", source: "Wikipedia" },
    { term: "Dhak", definition: "A large barrel-shaped drum beaten with sticks — the signature sound of Durga Puja.", url: "https://en.wikipedia.org/wiki/Dhak_(instrument)", source: "Wikipedia" },
    { term: "Sandhi Puja", definition: "Worship in the 48 minutes where Ashtami ends and Navami begins.", url: "https://www.britannica.com/topic/Durga-Puja", source: "Britannica" },
    { term: "Muhurat", definition: "An astrologically auspicious window of time for a ritual.", url: "https://en.wikipedia.org/wiki/Panchangam", source: "Wikipedia" },
    { term: "Kanya Pujan", definition: "Honouring young girls as forms of the goddess with a meal and small gifts.", url: "https://en.wikipedia.org/wiki/Kumari_(goddess)", source: "Wikipedia" },
    { term: "Sindoor Khela", definition: "Married women smearing vermilion on the goddess and each other on the last day of Durga Puja.", url: "https://www.wbtourism.gov.in/", source: "West Bengal Tourism" },
    { term: "Visarjan", definition: "Immersion of the idol in a river or other water at the end of the festival.", url: "https://en.wikipedia.org/wiki/Visarjan", source: "Wikipedia" },
  ],

  furtherReading: [
    { title: "Uttar Pradesh Tourism", url: "https://uptourism.gov.in/", publisher: "Government of Uttar Pradesh" },
    { title: "Ministry of Culture", url: "https://www.indiaculture.gov.in/", publisher: "Government of India" },
    { title: "Navratri", url: "https://www.britannica.com/topic/Navratri", publisher: "Encyclopaedia Britannica" },
    { title: "Durga", url: "https://www.britannica.com/topic/Durga", publisher: "Encyclopaedia Britannica" },
    { title: "Kanpur Nagar district", url: "https://kanpurnagar.nic.in/", publisher: "Government of Uttar Pradesh" },
    { title: "Kanpur", url: "https://en.wikipedia.org/wiki/Kanpur", publisher: "Wikipedia" },
    { title: "Kolkata", url: "https://en.wikipedia.org/wiki/Kolkata", publisher: "Wikipedia" },
    { title: "Gujarat Tourism", url: "https://www.gujarattourism.com/", publisher: "Government of Gujarat" },
    { title: "Gujarat", url: "https://en.wikipedia.org/wiki/Gujarat", publisher: "Wikipedia" },
    { title: "Garba (dance)", url: "https://en.wikipedia.org/wiki/Garba_(dance)", publisher: "Wikipedia" },
    { title: "Culture of Bengal", url: "https://en.wikipedia.org/wiki/Culture_of_Bengal", publisher: "Wikipedia" },
    // Still to add once the network allows (each found by search and verified, never invented):
    // UP Tourism Kanpur page, Incredible India Navratri + Durga Puja pages, 4 news reports on Navaratri in Kanpur.
  ],
};
