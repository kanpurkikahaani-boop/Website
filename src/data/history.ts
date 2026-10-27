import type { ImagePath } from "./types";

export interface Era {
  era: string;
  title: string;
  description: string;
}

/** Kanpur Through the Ages — vertical timeline on /culture-history */
export const timeline: Era[] = [
  { era: "Ancient", title: "Ancient Jajmau", description: "Excavations at the Jajmau mound reveal settlements stretching back well over two millennia on the Ganga's banks." },
  { era: "Medieval", title: "Bithoor's Sacred Age", description: "Bithoor grows as a pilgrimage seat tied to Valmiki's ashram and the legends of Lav and Kush." },
  { era: "1778", title: "Rise of Cawnpore", description: "The East India Company moves a garrison to the village of Kanhpur, and 'Cawnpore' becomes a strategic cantonment." },
  { era: "1857", title: "The Siege of Cawnpore", description: "Nana Saheb's forces besiege the British entrenchment; the uprising and its brutal aftermath scar the city's memory." },
  { era: "1880s–1940s", title: "Manchester of the East", description: "Cotton and woollen mills — Elgin, Muir, Lal Imli — turn Kanpur into north India's industrial powerhouse." },
  { era: "1959", title: "Leather Capital & Education Hub", description: "IIT Kanpur is founded in 1959 while Jajmau's tanneries make the city a global leather exporter." },
  { era: "Today", title: "Metro City Reimagined", description: "A new metro line, a revived riverfront and a startup scene write the next chapter of the Kahaani." },
];

export interface Landmark {
  slug: string;
  era: string;
  name: string;
  description: string;
  image: ImagePath;
  alt: string;
}

export const landmarks: Landmark[] = [
  { slug: "kanpur-memorial-church", era: "1875", name: "Kanpur Memorial Church", description: "Red-brick Lombardic-Gothic church raised in memory of those killed in 1857, with memorial tablets inside.", image: "/images/kanpur/kanpur-memorial-church.jpg", alt: "Red-brick Kanpur Memorial Church" },
  { slug: "jk-temple", era: "1960", name: "JK Temple", description: "A modern marble temple by the JK family that fuses Nagara spires with mid-century design.", image: "/images/kanpur/jk-temple.jpg", alt: "Marble spires of JK Temple, Kanpur" },
  { slug: "jajmau-mound", era: "Ancient", name: "Jajmau Mound", description: "An archaeological tell where pottery and coins trace the city's story back to antiquity.", image: "/images/kanpur/jajmau-mound.jpg", alt: "Archaeological mound at Jajmau" },
  { slug: "lal-imli-mill", era: "1876", name: "Lal Imli Mill", description: "The clock-towered woollen mill whose blankets once warmed an empire — an icon of the Manchester of the East.", image: "/images/kanpur/lal-imli-mill.jpg", alt: "Red-brick clock tower of the Lal Imli woollen mill" },
  { slug: "brahmavart-ghat", era: "Sacred", name: "Brahmavart Ghat, Bithoor", description: "Revered as the place where Brahma began creation; pilgrims still bathe here at dawn.", image: "/images/kanpur/brahmavart-ghat.jpg", alt: "Brahmavart Ghat on the Ganga at Bithoor" },
  { slug: "phool-bagh", era: "Colonial era", name: "Phool Bagh", description: "Formerly Queen's Park, now home to the Ganesh Shankar Vidyarthi memorial and a city museum.", image: "/images/kanpur/phool-bagh.jpg", alt: "Phool Bagh garden on Mall Road" },
];
