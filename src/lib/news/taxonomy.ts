/** Cities and genres for the news aggregator, with English + Hindi keyword dictionaries. */

export const NEWS_CITIES = ["kanpur", "lucknow", "agra", "prayagraj", "varanasi", "ayodhya"] as const;
export type NewsCity = (typeof NEWS_CITIES)[number];

export const CITY_LABELS: Record<NewsCity, { en: string; hi: string }> = {
  kanpur: { en: "Kanpur", hi: "कानपुर" },
  lucknow: { en: "Lucknow", hi: "लखनऊ" },
  agra: { en: "Agra", hi: "आगरा" },
  prayagraj: { en: "Prayagraj", hi: "प्रयागराज" },
  varanasi: { en: "Varanasi", hi: "वाराणसी" },
  ayodhya: { en: "Ayodhya", hi: "अयोध्या" },
};

export const CITY_KEYWORDS: Record<NewsCity, string[]> = {
  kanpur: ["kanpur", "cawnpore", "bithoor", "jajmau", "kalyanpur", "green park stadium", "iit kanpur", "कानपुर", "बिठूर", "जाजमऊ"],
  lucknow: ["lucknow", "hazratganj", "gomti nagar", "लखनऊ", "हजरतगंज", "गोमतीनगर"],
  agra: ["agra", "taj mahal", "fatehpur sikri", "आगरा", "ताजमहल", "ताज महल", "फतेहपुर सीकरी"],
  prayagraj: ["prayagraj", "allahabad", "sangam", "magh mela", "kumbh", "प्रयागराज", "इलाहाबाद", "संगम", "माघ मेला", "कुंभ"],
  varanasi: ["varanasi", "banaras", "benares", "kashi", "sarnath", "bhu", "वाराणसी", "बनारस", "काशी", "सारनाथ"],
  ayodhya: ["ayodhya", "faizabad", "ram mandir", "ram temple", "अयोध्या", "फैजाबाद", "फैज़ाबाद", "राम मंदिर"],
};

export const GENRES = [
  { slug: "local-news", label: "Local News" },
  { slug: "politics", label: "Politics" },
  { slug: "business", label: "Business" },
  { slug: "economy", label: "Economy" },
  { slug: "sports", label: "Sports" },
  { slug: "entertainment", label: "Entertainment" },
  { slug: "education", label: "Education" },
  { slug: "crime-safety", label: "Crime & Safety" },
  { slug: "lifestyle-culture", label: "Lifestyle & Culture" },
  { slug: "weather-environment", label: "Weather & Environment" },
] as const;
export type Genre = (typeof GENRES)[number]["slug"];
export const GENRE_SLUGS = GENRES.map((g) => g.slug) as Genre[];
export const DEFAULT_GENRE: Genre = "local-news";

export function genreLabel(slug: string) {
  return GENRES.find((g) => g.slug === slug)?.label ?? "Local News";
}

/** Order matters: the first genre with the most hits wins; ties go to the earlier genre. */
export const GENRE_KEYWORDS: Record<Exclude<Genre, "local-news">, string[]> = {
  "crime-safety": ["police", "arrest", "murder", "theft", "robbery", "crime", "fir", "accident", "fraud", "rape", "shot", "killed", "court", "jail", "पुलिस", "गिरफ्तार", "हत्या", "चोरी", "लूट", "अपराध", "हादसा", "दुर्घटना", "ठगी", "मुकदमा"],
  politics: ["election", "bjp", "congress", "samajwadi", "bsp", "minister", "mla", "mp ", "chief minister", "yogi", "akhilesh", "assembly", "poll", "vote", "चुनाव", "भाजपा", "कांग्रेस", "सपा", "बसपा", "मंत्री", "विधायक", "सांसद", "मुख्यमंत्री", "योगी", "अखिलेश", "विधानसभा"],
  sports: ["cricket", "match", "stadium", "green park", "ipl", "tournament", "football", "hockey", "athlete", "olympic", "kabaddi", "wrestling", "क्रिकेट", "मैच", "स्टेडियम", "खेल", "टूर्नामेंट", "खिलाड़ी", "कुश्ती"],
  economy: ["gdp", "inflation", "budget", "economy", "economic", "rbi", "gst", "tax", "investment", "exports", "अर्थव्यवस्था", "महंगाई", "बजट", "जीएसटी", "निवेश", "निर्यात"],
  business: ["company", "startup", "industry", "factory", "leather", "tannery", "market", "shares", "business", "trade", "mall", "उद्योग", "कारोबार", "व्यापार", "कंपनी", "फैक्ट्री", "चमड़ा", "बाजार"],
  education: ["school", "college", "university", "exam", "student", "iit", "board result", "admission", "neet", "jee", "teacher", "स्कूल", "कॉलेज", "विश्वविद्यालय", "परीक्षा", "छात्र", "शिक्षक", "प्रवेश"],
  entertainment: ["film", "movie", "actor", "actress", "bollywood", "music", "concert", "web series", "singer", "फिल्म", "अभिनेता", "अभिनेत्री", "बॉलीवुड", "गायक", "संगीत"],
  "lifestyle-culture": ["festival", "mela", "diwali", "holi", "deepotsav", "aarti", "temple", "mandir", "darshan", "pilgrim", "devotee", "food", "heritage", "tourism", "culture", "art", "त्योहार", "मेला", "दीपावली", "होली", "दीपोत्सव", "आरती", "मंदिर", "दर्शन", "श्रद्धालु", "पर्यटन", "संस्कृति"],
  "weather-environment": ["weather", "rain", "monsoon", "heatwave", "cold wave", "fog", "pollution", "aqi", "flood", "ganga", "temperature", "climate", "मौसम", "बारिश", "मानसून", "लू", "शीतलहर", "कोहरा", "प्रदूषण", "बाढ़", "तापमान"],
};

/** Map common feed section/category names onto our genres. */
export const CATEGORY_HINTS: [RegExp, Genre][] = [
  [/sport|cricket|खेल/i, "sports"],
  [/politic|election|राजनीति|चुनाव/i, "politics"],
  [/econom|अर्थ/i, "economy"],
  [/business|market|company|industry|कारोबार|व्यापार/i, "business"],
  [/educat|career|exam|शिक्षा|करियर/i, "education"],
  [/entertain|bollywood|movie|मनोरंजन/i, "entertainment"],
  [/crime|अपराध|क्राइम/i, "crime-safety"],
  [/lifestyle|culture|festival|religion|धर्म|लाइफस्टाइल/i, "lifestyle-culture"],
  [/weather|environment|मौसम|पर्यावरण/i, "weather-environment"],
];
