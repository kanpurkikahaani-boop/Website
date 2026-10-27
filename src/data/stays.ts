import type { Stay } from "./types";

/**
 * SAMPLE accommodation listings for demonstration. Names are descriptive placeholders;
 * prices are indicative per-night ranges. No structured data is emitted for these. // VERIFY
 */
export const stays: Stay[] = [
  { slug: "kanpur-civil-lines-haveli", city: "kanpur", tier: "luxury", name: "Civil Lines Heritage Haveli", area: "Civil Lines", priceRange: "₹7,500–12,000", description: "Restored colonial bungalow with lawns, a library bar and suites with four-poster beds.", sample: true },
  { slug: "kanpur-mall-road-grand", city: "kanpur", tier: "luxury", name: "The Mall Road Grand", area: "Mall Road", priceRange: "₹6,500–10,000", description: "Business-class tower with a pool, spa and rooftop dining near Phool Bagh.", sample: true },
  { slug: "kanpur-swaroop-nagar-suites", city: "kanpur", tier: "mid-range", name: "Swaroop Nagar Suites", area: "Swaroop Nagar", priceRange: "₹2,800–4,500", description: "Smart rooms a short walk from Moti Jheel and the Arya Nagar food lane.", sample: true },
  { slug: "kanpur-central-comfort", city: "kanpur", tier: "mid-range", name: "Central Station Comfort Inn", area: "Near Kanpur Central", priceRange: "₹2,200–3,800", description: "Practical stay for early trains, with 24-hour check-in and a good breakfast.", sample: true },
  { slug: "kanpur-bithoor-homestay", city: "kanpur", tier: "budget", name: "Bithoor Ghat Homestay", area: "Bithoor", priceRange: "₹1,200–2,000", description: "Family-run rooms by the ghats — wake up to temple bells and river mist.", sample: true },
  { slug: "kanpur-kakadeo-hostel", city: "kanpur", tier: "budget", name: "Kakadeo Backpackers", area: "Kakadeo", priceRange: "₹600–1,400", description: "Dorms and private rooms in the student quarter, with a common kitchen.", sample: true },

  { slug: "lucknow-gomti-palace", city: "lucknow", tier: "luxury", name: "Gomti Riverside Palace", area: "Gomti Nagar", priceRange: "₹8,000–14,000", description: "Nawabi-inspired luxury hotel with Awadhi fine dining.", sample: true },
  { slug: "lucknow-hazratganj-inn", city: "lucknow", tier: "mid-range", name: "Hazratganj Boutique Inn", area: "Hazratganj", priceRange: "₹3,000–5,000", description: "Walk to the promenade, cafes and chikan stores.", sample: true },
  { slug: "lucknow-charbagh-stay", city: "lucknow", tier: "budget", name: "Charbagh Station Stay", area: "Charbagh", priceRange: "₹900–1,800", description: "Simple rooms opposite the railway station.", sample: true },

  { slug: "agra-taj-view-resort", city: "agra", tier: "luxury", name: "Taj View Resort", area: "Taj East Gate Road", priceRange: "₹10,000–22,000", description: "Rooms and a rooftop with views of the Taj's domes.", sample: true },
  { slug: "agra-fatehabad-road-hotel", city: "agra", tier: "mid-range", name: "Fatehabad Road Residency", area: "Fatehabad Road", priceRange: "₹2,800–4,800", description: "Comfortable base 10 minutes from the Taj gates.", sample: true },
  { slug: "agra-tajganj-guesthouse", city: "agra", tier: "budget", name: "Tajganj Rooftop Guesthouse", area: "Tajganj", priceRange: "₹800–1,800", description: "Backpacker favourite with a rooftop café facing the Taj.", sample: true },

  { slug: "prayagraj-civil-lines-hotel", city: "prayagraj", tier: "mid-range", name: "Civil Lines Residency", area: "Civil Lines", priceRange: "₹2,500–4,200", description: "Central, quiet and close to restaurants and the railway station.", sample: true },
  { slug: "prayagraj-sangam-camp", city: "prayagraj", tier: "luxury", name: "Sangam Luxury Tent Camp", area: "Arail, near Sangam", priceRange: "₹6,000–15,000", description: "Seasonal Swiss-cottage tents during Magh Mela — book months ahead.", sample: true },
  { slug: "prayagraj-dharamshala", city: "prayagraj", tier: "budget", name: "Sangam Yatri Niwas", area: "Daraganj", priceRange: "₹600–1,500", description: "Pilgrim lodge a short walk from the ghats.", sample: true },

  { slug: "varanasi-ghat-palace", city: "varanasi", tier: "luxury", name: "Ghat-side Palace Hotel", area: "Dashashwamedh", priceRange: "₹12,000–25,000", description: "A restored riverfront palace with boat transfers and aarti views.", sample: true },
  { slug: "varanasi-assi-guesthouse", city: "varanasi", tier: "mid-range", name: "Assi Ghat Guesthouse", area: "Assi", priceRange: "₹2,500–4,500", description: "River-view rooms steps from the morning aarti.", sample: true },
  { slug: "varanasi-hostel", city: "varanasi", tier: "budget", name: "Godowlia Backpackers", area: "Godowlia", priceRange: "₹500–1,500", description: "Social hostel in the old city with rooftop chai.", sample: true },

  { slug: "ayodhya-saryu-resort", city: "ayodhya", tier: "luxury", name: "Saryu Riverfront Resort", area: "Saryu riverfront", priceRange: "₹7,000–12,000", description: "New-build resort with temple shuttles and a riverside lawn.", sample: true },
  { slug: "ayodhya-ram-path-hotel", city: "ayodhya", tier: "mid-range", name: "Ram Path Residency", area: "Ram Path", priceRange: "₹2,500–4,500", description: "Walk to Hanuman Garhi and the Ram Mandir.", sample: true },
  { slug: "ayodhya-dharamshala", city: "ayodhya", tier: "budget", name: "Pilgrim Dharamshala", area: "Near Hanuman Garhi", priceRange: "₹500–1,200", description: "Clean, simple rooms for pilgrims — vegetarian meals on site.", sample: true },
];

export const stayTiers = [
  { value: "all", label: "All Stays" },
  { value: "budget", label: "Budget" },
  { value: "mid-range", label: "Mid-Range" },
  { value: "luxury", label: "Luxury" },
] as const;

/** Booking-platform search link with UTM tags (affiliate-ready). */
export function bookingUrl(stay: Stay, cityName: string) {
  const params = new URLSearchParams({
    ss: `${stay.area}, ${cityName}, Uttar Pradesh, India`,
    utm_source: "kanpurkikahaani",
    utm_medium: "referral",
    utm_campaign: "stay_listings",
    utm_content: stay.slug,
  });
  return `https://www.booking.com/searchresults.html?${params.toString()}`;
}
