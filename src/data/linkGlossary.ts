/**
 * Keyword → link map used by the editor's "Suggest links" button. Each entry lists the phrases
 * (English, transliterations and Hindi) that should link to one destination. Suggestions are only
 * ever shown for approval — nothing is inserted automatically.
 * Add entries freely; keep destinations authoritative (government, UNESCO, Wikipedia, Britannica)
 * or our own pages.
 */
export interface GlossaryLink {
  terms: string[];
  url: string;
  type: "internal" | "external";
}

const ext = (terms: string[], url: string): GlossaryLink => ({ terms, url, type: "external" });
const int = (terms: string[], url: string): GlossaryLink => ({ terms, url, type: "internal" });

export const linkGlossary: GlossaryLink[] = [
  // Festivals & rituals
  ext(["Navaratri", "Navratri", "Navarathri", "नवरात्रि"], "https://en.wikipedia.org/wiki/Navaratri"),
  ext(["Durga Puja", "दुर्गा पूजा"], "https://en.wikipedia.org/wiki/Durga_Puja"),
  ext(["Garba", "गरबा"], "https://ich.unesco.org/en/RL/garba-of-gujarat-01962"),
  ext(["Ghatasthapana", "घटस्थापना"], "https://en.wikipedia.org/wiki/Ghatasthapana"),
  ext(["Dhunuchi Naach", "Dhunuchi dance", "Dhunuchi Nach"], "https://en.wikipedia.org/wiki/Dhunuchi_dance"),
  ext(["Dhak", "Dhaks", "ढाक"], "https://en.wikipedia.org/wiki/Dhak_(instrument)"),
  ext(["Maha Ashtami", "Durga Ashtami", "अष्टमी"], "https://en.wikipedia.org/wiki/Durga_Ashtami"),
  ext(["Maha Navami", "नवमी"], "https://en.wikipedia.org/wiki/Maha_Navami"),
  ext(["Sandhi Puja", "Sandhi puja"], "https://en.wikipedia.org/wiki/Sandhi_Puja"),
  ext(["Kanya Pujan", "Kanya Puja", "कन्या पूजन"], "https://en.wikipedia.org/wiki/Kanya_Puja"),
  ext(["Sindoor Khela", "Sindhoor Khela", "सिंदूर खेला"], "https://en.wikipedia.org/wiki/Sindoor_Khela"),
  ext(["muhurat", "muhurta", "मुहूर्त"], "https://en.wikipedia.org/wiki/Muhurta"),
  ext(["Akhand Jyoti", "Akhand Jyothi", "अखंड ज्योति"], "https://en.wikipedia.org/wiki/Eternal_flame"),
  ext(["diya", "diyas", "दीया"], "https://en.wikipedia.org/wiki/Diya_(lamp)"),
  ext(["Diwali", "Deepavali", "दीपावली"], "https://en.wikipedia.org/wiki/Diwali"),
  ext(["Holi", "होली"], "https://en.wikipedia.org/wiki/Holi"),
  ext(["Chhath", "छठ"], "https://en.wikipedia.org/wiki/Chhath"),
  ext(["Dev Deepawali", "Dev Diwali"], "https://en.wikipedia.org/wiki/Dev_Deepawali"),
  // Deities
  ext(["Goddess Durga", "Durga", "दुर्गा"], "https://en.wikipedia.org/wiki/Durga"),
  ext(["Goddess Lakshmi", "Lakshmi", "लक्ष्मी"], "https://en.wikipedia.org/wiki/Lakshmi"),
  // Food
  ext(["chaat", "chaats", "चाट"], "https://en.wikipedia.org/wiki/Chaat"),
  ext(["kuttu", "kuttu flour", "buckwheat", "कुट्टू"], "https://en.wikipedia.org/wiki/Buckwheat"),
  ext(["sabudana", "sago", "साबूदाना"], "https://en.wikipedia.org/wiki/Tapioca_pearl"),
  ext(["sabudana tikki", "sabudana tikkis", "sabudana vada"], "https://en.wikipedia.org/wiki/Sabudana_vada"),
  ext(["halwa", "हलवा"], "https://en.wikipedia.org/wiki/Halva"),
  ext(["black chana", "kala chana"], "https://en.wikipedia.org/wiki/Kala_chana"),
  ext(["kachori", "कचौड़ी"], "https://en.wikipedia.org/wiki/Kachori"),
  ext(["kulfi", "कुल्फी"], "https://en.wikipedia.org/wiki/Kulfi"),
  ext(["falahari", "falahar", "फलाहारी"], "https://en.wikipedia.org/wiki/Fasting_in_Hinduism"),
  // Clothing & culture
  ext(["Chaniya Choli", "Chaniya Cholis", "ghagra choli"], "https://en.wikipedia.org/wiki/Ghagra_choli"),
  ext(["chunri", "chunari", "dupatta", "चुनरी"], "https://en.wikipedia.org/wiki/Dupatta"),
  ext(["vermilion", "sindoor", "सिंदूर"], "https://en.wikipedia.org/wiki/Sindoor"),
  ext(["Bengali architecture"], "https://en.wikipedia.org/wiki/Bengal_temple_architecture"),
  // Places (outside Kanpur)
  ext(["Kolkata", "कोलकाता"], "https://en.wikipedia.org/wiki/Kolkata"),
  ext(["Gujarat", "गुजरात"], "https://www.gujarattourism.com/"),
  // Our own pages
  int(["Kanpur", "कानपुर"], "/culture-history"),
  int(["street food", "food trail", "street markets"], "/food-nightlife"),
  int(["shopping", "bazaar", "bazaars"], "/shopping"),
  int(["temples", "local temples"], "/tourism?filter=temple"),
  int(["industrial history", "Manchester of the East"], "/culture-history#timeline"),
  int(["events", "garba nights"], "/events"),
  int(["Bithoor", "बिठूर"], "/tourism#bithoor-ghats"),
  int(["Lucknow", "लखनऊ"], "/cities/lucknow"),
  int(["Varanasi", "Banaras", "Kashi", "वाराणसी"], "/cities/varanasi"),
  int(["Prayagraj", "Allahabad", "प्रयागराज"], "/cities/prayagraj"),
  int(["Ayodhya", "अयोध्या"], "/cities/ayodhya"),
  int(["Agra", "आगरा"], "/cities/agra"),
  int(["celebrations", "festivals"], "/celebrations"),
  int(["playlist", "music"], "/playlist"),
];
