import type { ShopItem } from "./types";

/** Markets & high streets. "Best time" values are local tips. // VERIFY */
export const shopping: ShopItem[] = [
  { slug: "naveen-market", city: "kanpur", area: "Parade", name: "Naveen Market", knownFor: "Fabric, ready-to-wear, footwear and bridal shopping at local prices.", bestTime: "Best time: 4–8 pm", image: "/images/kanpur/naveen-market.jpg", alt: "Clothing stores and shoppers in Naveen Market, Kanpur" },
  { slug: "sisamau-bazaar", city: "kanpur", area: "Sisamau", name: "Sisamau Bazaar", knownFor: "Brass and steel utensils, spices, wedding trousseau and everyday bargains.", bestTime: "Best time: Late mornings", image: "/images/kanpur/sisamau-bazaar.jpg", alt: "Brassware and spice stalls in Sisamau Bazaar" },
  { slug: "gumti-no-5", city: "kanpur", area: "Gumti No. 5", name: "Gumti No. 5", knownFor: "Bangles, ethnic wear, cosmetics and festive accessories in a dense, glittering market.", bestTime: "Best time: Evenings", image: "/images/kanpur/gumti-no-5.jpg", alt: "Stacks of colourful glass bangles at Gumti No. 5 market" },
  { slug: "bada-chauraha", city: "kanpur", area: "Bada Chauraha", name: "Bada Chauraha", knownFor: "Wholesale textiles, electricals and the famous Thaggu Ke Laddu sweet shop.", bestTime: "Best time: Weekday afternoons", image: "/images/kanpur/bada-chauraha.jpg", alt: "Busy crossroads market at Bada Chauraha, Kanpur" },
  { slug: "arya-nagar-market", city: "kanpur", area: "Arya Nagar", name: "Arya Nagar Market", knownFor: "Boutiques and branded stores by day, chaat and kulfi stalls by night.", bestTime: "Best time: 6–10 pm", image: "/images/kanpur/arya-nagar-market.jpg", alt: "Evening shoppers at Arya Nagar market" },
  { slug: "z-square-mall", city: "kanpur", area: "Mall Road", name: "Z Square Mall", knownFor: "Brands, a multiplex and a food court — air-conditioned relief in peak summer.", bestTime: "Best time: Weekday evenings", image: "/images/kanpur/z-square.jpg", alt: "Interior atrium of Z Square Mall, Kanpur" },
  { slug: "jajmau-leather", city: "kanpur", area: "Jajmau", name: "Jajmau Leather Market", knownFor: "Factory-outlet bags, belts, jackets and saddlery from India's leather capital.", bestTime: "Best time: Weekday mornings", image: "/images/kanpur/jajmau-leather.jpg", alt: "Leather bags and jackets displayed in a Jajmau outlet" },

  { slug: "aminabad-chikankari", city: "lucknow", area: "Aminabad", name: "Chikankari at Aminabad", knownFor: "Hand-embroidered chikan kurtas, sarees and dupattas at every price point.", bestTime: "Best time: Afternoons", image: "/images/lucknow/aminabad.jpg", alt: "Racks of white chikankari kurtas in Aminabad" },
  { slug: "chowk-lucknow", city: "lucknow", area: "Chowk", name: "Chowk", knownFor: "Old-city chikan workshops, attar perfumers and silver work.", bestTime: "Best time: Late mornings", image: "/images/lucknow/chowk.jpg", alt: "Narrow lane with chikan and attar shops in Chowk, Lucknow" },
  { slug: "hazratganj-shopping", city: "lucknow", area: "Hazratganj", name: "Hazratganj", knownFor: "Bookshops, boutiques and Lucknow's most elegant promenade.", bestTime: "Best time: Evenings", image: "/images/lucknow/hazratganj.jpg", alt: "Shopfronts along Hazratganj, Lucknow" },

  { slug: "agra-marble-inlay", city: "agra", area: "Tajganj", name: "Marble Inlay Workshops", knownFor: "Pietra dura tabletops, boxes and coasters from artisans descended from the Taj's craftsmen.", bestTime: "Best time: After the Taj", image: "/images/agra/marble-inlay.jpg", alt: "Artisan setting semi-precious stones into white marble" },
  { slug: "sadar-bazaar-agra", city: "agra", area: "Sadar Bazaar", name: "Sadar Bazaar", knownFor: "Leather shoes and bags, petha and evening street food.", bestTime: "Best time: Evenings", image: "/images/agra/sadar-bazaar.jpg", alt: "Evening crowds in Sadar Bazaar, Agra" },

  { slug: "civil-lines-prayagraj", city: "prayagraj", area: "Civil Lines", name: "Civil Lines Market", knownFor: "Books, sweets and everyday shopping around the old colonial grid.", bestTime: "Best time: Evenings", image: "/images/prayagraj/civil-lines.jpg", alt: "Shops along Civil Lines, Prayagraj" },
  { slug: "katra-market", city: "prayagraj", area: "Katra", name: "Katra Market", knownFor: "Student-friendly clothes, stationery and street food near the university.", bestTime: "Best time: Afternoons", image: "/images/prayagraj/katra.jpg", alt: "Busy Katra market near Allahabad University" },

  { slug: "banarasi-silk", city: "varanasi", area: "Peeli Kothi & Madanpura", name: "Banarasi Silk Sarees", knownFor: "Zari-woven silk from weaver clusters — ask for the Silk Mark tag.", bestTime: "Best time: Mornings", image: "/images/varanasi/banarasi-silk.jpg", alt: "Banarasi silk sarees with gold zari on a loom" },
  { slug: "vishwanath-gali", city: "varanasi", area: "Vishwanath Gali", name: "Vishwanath Gali", knownFor: "Rudraksha, brass idols, wooden toys and puja items in a narrow temple lane.", bestTime: "Best time: Afternoons", image: "/images/varanasi/vishwanath-gali.jpg", alt: "Narrow lane of small shops near Kashi Vishwanath" },
  { slug: "godowlia-market", city: "varanasi", area: "Godowlia", name: "Godowlia Market", knownFor: "Everything at once: fabric, bangles, paan and sweets near the main ghats.", bestTime: "Best time: Before aarti", image: "/images/varanasi/godowlia.jpg", alt: "Crowded crossroads market at Godowlia, Varanasi" },

  { slug: "ram-path-market", city: "ayodhya", area: "Ram Path", name: "Ram Path Bazaar", knownFor: "Puja items, idols, tulsi malas and souvenirs along the redeveloped temple road.", bestTime: "Best time: Mornings", image: "/images/ayodhya/ram-path.jpg", alt: "Souvenir and puja shops lining Ram Path, Ayodhya" },
  { slug: "hanuman-garhi-sweets", city: "ayodhya", area: "Hanuman Garhi", name: "Temple Lane Sweets", knownFor: "Pedas, laddus and prasad boxes to carry home.", bestTime: "Best time: After darshan", image: "/images/ayodhya/peda.jpg", alt: "Sweet shop near Hanuman Garhi, Ayodhya" },
];

export function shoppingFor(city: ShopItem["city"]) {
  return shopping.filter((s) => s.city === city);
}
