import type { NewsItem } from "./types";

/**
 * SAMPLE headlines for demonstration only. Replace with real stories and set `url`
 * to the article link (opens in a new tab). Keep `url: "#"` until then. // VERIFY
 */
export const news: NewsItem[] = [
  { slug: "metro-extension", city: "kanpur", source: "City Desk", date: "2026-10-24", headline: "Kanpur Metro's next stretch moves closer to opening for commuters", image: "/images/kanpur/news-metro.jpg", alt: "Elevated metro viaduct in Kanpur", url: "#", sample: true },
  { slug: "ghat-cleanup", city: "kanpur", source: "Riverfront Report", date: "2026-10-22", headline: "Volunteers spruce up Bithoor ghats ahead of Kartik Purnima", image: "/images/kanpur/bithoor-ghats.jpg", alt: "Volunteers cleaning steps of the ghats at Bithoor", url: "#", sample: true },
  { slug: "green-park-fixture", city: "kanpur", source: "Sports Wire", date: "2026-10-20", headline: "Green Park readies pitch and stands for the winter cricket season", image: "/images/kanpur/green-park-stadium.jpg", alt: "Groundstaff preparing the pitch at Green Park Stadium", url: "#", sample: true },
  { slug: "lucknow-mahotsav-dates", city: "lucknow", source: "Awadh Today", date: "2026-10-19", headline: "Lucknow Mahotsav organisers announce craft village and food lanes", image: "/images/lucknow/hazratganj.jpg", alt: "Festival stalls under lights in Lucknow", url: "#", sample: true },
  { slug: "varanasi-dev-deepawali-boats", city: "varanasi", source: "Kashi Chronicle", date: "2026-10-18", headline: "Boat bookings open early as Varanasi prepares for Dev Deepawali", image: "/images/varanasi/ghats-boat-ride.jpg", alt: "Boats lined up at the Varanasi ghats", url: "#", sample: true },
  { slug: "leather-exports", city: "kanpur", source: "Business Line-up", date: "2026-10-16", headline: "Jajmau tanneries bet on design studios to grow leather exports", image: "/images/kanpur/jajmau-leather.jpg", alt: "Leather goods on display in a Jajmau workshop", url: "#", sample: true },
  { slug: "ayodhya-deepotsav-prep", city: "ayodhya", source: "Saryu Samachar", date: "2026-10-15", headline: "Ayodhya aims for a brighter Deepotsav with more volunteers on the ghats", image: "/images/ayodhya/ram-ki-paidi.jpg", alt: "Diyas being arranged on the ghats of Ayodhya", url: "#", sample: true },
  { slug: "agra-sunrise-slots", city: "agra", source: "Taj City Times", date: "2026-10-12", headline: "Agra eases sunrise entry at the Taj Mahal with more ticket counters", image: "/images/agra/taj-mahal.jpg", alt: "Visitors at the Taj Mahal entrance at dawn", url: "#", sample: true },
  { slug: "magh-mela-planning", city: "prayagraj", source: "Sangam Express", date: "2026-10-10", headline: "Prayagraj begins laying out Magh Mela sectors on the Sangam sands", image: "/images/prayagraj/triveni-sangam.jpg", alt: "Tents being set up on the sands at the Sangam", url: "#", sample: true },
];
