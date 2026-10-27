import type { EventItem } from "./types";

/**
 * Upcoming events (Nov 2026 – Mar 2027). These are SAMPLE listings with indicative dates —
 * festivals follow the lunar calendar and organisers announce exact schedules late. // VERIFY every date.
 * Events whose end date has passed are hidden automatically on /events.
 */
export const events: EventItem[] = [
  { slug: "ayodhya-deepotsav-2026", city: "ayodhya", category: "FESTIVAL", title: "Ayodhya Deepotsav", start: "2026-11-07", venue: "Ram ki Paidi, Ayodhya", description: "Lakhs of diyas along the Saryu, a laser show and processions on the eve of Diwali.", url: "#", sample: true }, // VERIFY
  { slug: "varanasi-ganga-mahotsav-2026", city: "varanasi", category: "MUSIC", title: "Ganga Mahotsav", start: "2026-11-20", end: "2026-11-24", venue: "Rajghat & ghats, Varanasi", description: "Classical music and dance on the riverbank in the run-up to Dev Deepawali.", url: "#", sample: true }, // VERIFY
  { slug: "dev-deepawali-varanasi-2026", city: "varanasi", category: "FESTIVAL", title: "Dev Deepawali", start: "2026-11-24", venue: "Ghats of Varanasi", description: "On Kartik Purnima every ghat is lined with lamps — book a boat well in advance.", url: "#", sample: true }, // VERIFY
  { slug: "bithoor-kartik-purnima-2026", city: "kanpur", category: "FESTIVAL", title: "Kartik Purnima Snan & Deepdaan", start: "2026-11-24", venue: "Brahmavart Ghat, Bithoor", description: "A holy dip at dawn and lamps floated on the Ganga by evening.", url: "#", sample: true }, // VERIFY
  { slug: "lucknow-mahotsav-2026", city: "lucknow", category: "CULTURAL", title: "Lucknow Mahotsav", start: "2026-11-25", end: "2026-12-05", venue: "Smriti Upvan, Lucknow", description: "Ten days of Awadhi crafts, food stalls, folk performances and concerts.", url: "#", sample: true }, // VERIFY
  { slug: "kanpur-literature-festival-2026", city: "kanpur", category: "LITERATURE", title: "Kanpur Literature Festival", start: "2026-12-12", end: "2026-12-13", venue: "Civil Lines, Kanpur", description: "Authors, poets and journalists on Hindi and English writing, with a mushaira on day two.", url: "#", sample: true }, // VERIFY
  { slug: "ayodhya-vivah-panchami-2026", city: "ayodhya", category: "CULTURAL", title: "Ram Vivah Panchami", start: "2026-12-14", venue: "Kanak Bhawan & temples, Ayodhya", description: "Wedding processions re-enacting the marriage of Ram and Sita.", url: "#", sample: true }, // VERIFY
  { slug: "kanpur-christmas-carols-2026", city: "kanpur", category: "MUSIC", title: "Christmas Carol Evening", start: "2026-12-24", venue: "Kanpur Memorial Church, Cantonment", description: "Carols and candlelight in the 1875 Gothic church.", url: "#", sample: true }, // VERIFY
  { slug: "kanpur-leather-expo-2027", city: "kanpur", category: "EXPO", title: "Kanpur Leather & Footwear Expo", start: "2027-01-09", end: "2027-01-11", venue: "Kanpur exhibition grounds", description: "Tanneries and makers from Jajmau showcase bags, shoes and saddlery.", url: "#", sample: true }, // VERIFY
  { slug: "kanpur-half-marathon-2027", city: "kanpur", category: "SPORTS", title: "Kanpur Half Marathon", start: "2027-01-17", venue: "Green Park Stadium, Civil Lines", description: "21K, 10K and 5K routes through Civil Lines and Mall Road on a winter morning.", url: "#", sample: true }, // VERIFY
  { slug: "magh-mela-prayagraj-2027", city: "prayagraj", category: "FESTIVAL", title: "Magh Mela", start: "2027-01-22", end: "2027-03-06", venue: "Triveni Sangam, Prayagraj", description: "The annual pilgrimage fair at the Sangam, with main bathing days through Magh.", url: "#", sample: true }, // VERIFY
  { slug: "taj-mahotsav-2027", city: "agra", category: "CULTURAL", title: "Taj Mahotsav", start: "2027-02-18", end: "2027-02-27", venue: "Shilpgram, Agra", description: "Crafts, cuisine and performances from across India near the eastern gate of the Taj.", url: "#", sample: true }, // VERIFY
  { slug: "ganga-mela-kanpur-2027", city: "kanpur", category: "FESTIVAL", title: "Ganga Mela", start: "2027-03-29", venue: "Hatia & Sarsaiya Ghat, Kanpur", description: "Kanpur's unique post-Holi celebration: a last day of colour and a mela by the river.", url: "#", sample: true }, // VERIFY
];
