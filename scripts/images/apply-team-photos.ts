/**
 * npm run images:team — puts the team-supplied photos (public/images/*, from the
 * "Images for Kanpur Website" folder) on the slides and cards whose titles match their filenames.
 *
 * Each file can fill several image keys: one title used in several places (a hero slide and a
 * card, the home page and a detail page) always gets the same photo. Writes entries into
 * src/data/photos.json; nothing is cropped or re-encoded (framing is CSS object-position). The
 * blur placeholder is a plain 16-px downscale.
 *
 * Files with no matching slide or card are listed in TEAM_UNUSED and left unused.
 */
import { readFileSync, writeFileSync } from "node:fs";
import sharp from "sharp";
import { TEAM_SUPPLIED, type Photo } from "../../src/data/images";
import { collectSlots } from "./slots";

interface Entry {
  file: string;
  /** Original filename in the team's folder. */
  original: string;
  /** Alt text: the card/slide title plus the city. */
  alt: string;
  subject: string;
  keys: string[];
  objectPosition?: string;
  /** Shows the dish/area rather than the exact named business. */
  representative?: boolean;
}

export const TEAM_PHOTOS: Entry[] = [
  // ── Home hero slides (+ the matching cards) ──
  { file: "ganga-ghats-bithor.jpg", original: "Ganga Ghats Bithor.jpg", alt: "Ganga ghats at Bithoor, Kanpur", subject: "The Ganga at Bithoor", keys: ["/images/kanpur/hero-bithoor-ghats.jpg", "/images/kanpur/bithoor-ghats.jpg"] },
  { file: "jk-temple-kanpur-tourism-header.jpg", original: "jk-temple-kanpur-tourism-header.jpg", alt: "JK Temple, Kanpur", subject: "JK Temple (Shri Radhakrishna Mandir)", keys: ["/images/kanpur/hero-jk-temple.jpg", "/images/kanpur/jk-temple.jpg"] },
  { file: "kanpur-memorial-church-1-kanpur-attr-hero.jpg", original: "kanpur-memorial-church-1-kanpur-attr-hero.jfif", alt: "Kanpur Memorial Church (All Souls Church), Kanpur", subject: "Kanpur Memorial Church", keys: ["/images/kanpur/hero-memorial-church.jpg", "/images/kanpur/kanpur-memorial-church.jpg"] },
  { file: "phool-bagh.jpg", original: "phool-bagh.jpg", alt: "Phool Bagh, Kanpur", subject: "Phool Bagh", keys: ["/images/kanpur/hero-phool-bagh.jpg", "/images/kanpur/phool-bagh.jpg"] },
  { file: "beyond-kanpur-other-cities-overview.jpg", original: "Beyond Kanpur (Other Cities Overview).jpg", alt: "Beyond Kanpur — the ghats of Varanasi from above", subject: "Varanasi ghats from the air", keys: ["/images/varanasi/hero-beyond-kanpur.jpg"] },
  // ── Nearby cities: home city cards + city-page heroes ──
  { file: "lucknow.avif", original: "Lucknow.jpg", alt: "Lucknow, Uttar Pradesh — Rumi Darwaza", subject: "Rumi Darwaza, Lucknow", keys: ["/images/lucknow/hero.jpg"] },
  { file: "agra.avif", original: "Agra.jpg", alt: "Agra, Uttar Pradesh — the Taj Mahal at sunrise", subject: "Taj Mahal, Agra", keys: ["/images/agra/hero.jpg"] },
  { file: "prayagraj.avif", original: "Prayagraj.jpg", alt: "Prayagraj, Uttar Pradesh — boats on the river", subject: "Boats at Prayagraj", keys: ["/images/prayagraj/hero.jpg"] },
  { file: "varanasi.avif", original: "Varanasi.jpg", alt: "Varanasi, Uttar Pradesh — the ghats on the Ganga", subject: "Varanasi ghats", keys: ["/images/varanasi/hero.jpg"] },
  { file: "ayodhya.jpg", original: "Ayodhya.jpg", alt: "Ayodhya, Uttar Pradesh — the Saryu riverfront", subject: "Ayodhya riverfront", keys: ["/images/ayodhya/hero.jpg"] },
  // ── Tourism / Culture / Outdoor ──
  { file: "allen-zoo.jpg", original: "Allen Zoo.jpg", alt: "Allen Forest Zoo, Kanpur", subject: "Leopard at Allen Forest Zoo", keys: ["/images/kanpur/allen-forest-zoo.jpg"] },
  { file: "moti-jheel.jpg", original: "moti jheel.jpg", alt: "Moti Jheel, Kanpur", subject: "Moti Jheel", keys: ["/images/kanpur/moti-jheel.jpg"] },
  { file: "nana-rao-park.avif", original: "Nana Rao park.avif", alt: "Nana Rao Park, Kanpur", subject: "Nana Rao Park gate", keys: ["/images/kanpur/nana-rao-park.jpg"] },
  { file: "jajmau.jpg", original: "jajmau.jpg", alt: "Jajmau, Kanpur — the mound above the Ganga", subject: "Jajmau mound and the Ganga", keys: ["/images/kanpur/jajmau-mound.jpg"] },
  { file: "ganga-barrage-kanpur.jpg", original: "Ganga_Barrage_Kanpur.jpg", alt: "Ganga Barrage, Kanpur", subject: "Ganga Barrage at sunset", keys: ["/images/kanpur/ganga-barrage.jpg", "/images/kanpur/barrage-night.jpg"] },
  { file: "blue-world-theme-park.jpg", original: "Blue World Theme Park.jpg", alt: "Blue World Theme Park, Kanpur", subject: "Blue World Theme Park", keys: ["/images/kanpur/blue-world-theme-park.jpg"] },
  { file: "brahmavart-ghat.jpg", original: "brahmavart ghat.jpg", alt: "Brahmavart Ghat, Bithoor", subject: "Brahmavart Ghat", keys: ["/images/kanpur/brahmavart-ghat.jpg"] },
  { file: "lal-imli.jpg", original: "lal imli.jfif", alt: "Lal Imli Mill, Kanpur", subject: "Lal Imli mill and clock tower", keys: ["/images/kanpur/lal-imli-mill.jpg"], objectPosition: "50% 40%" },
  // ── Shopping ──
  { file: "naveen-market.jpg", original: "Naveen Market.jpg", alt: "Naveen Market, Kanpur", subject: "Naveen Market", keys: ["/images/kanpur/naveen-market.jpg"] },
  { file: "sismau-bazar.jpg", original: "Sismau Bazar.jpg", alt: "Sisamau Bazaar, Kanpur", subject: "Shop in Sisamau Bazaar", keys: ["/images/kanpur/sisamau-bazaar.jpg"] },
  { file: "gumti-no-5.jpg", original: "Gumti no 5.jpg", alt: "Gumti No. 5, Kanpur", subject: "Bag stalls at Gumti No. 5", keys: ["/images/kanpur/gumti-no-5.jpg"] },
  { file: "bada-chauraha.jpg", original: "Bada Chauraha.jpg", alt: "Bada Chauraha, Kanpur", subject: "Bada Chauraha at night", keys: ["/images/kanpur/bada-chauraha.jpg"] },
  { file: "arya-nagar-market.avif", original: "Arya Nagar Market.avif", alt: "Arya Nagar Market, Kanpur", subject: "Arya Nagar Market", keys: ["/images/kanpur/arya-nagar-market.jpg"] },
  { file: "jajmau-leather-market.jpg", original: "Jajmau Leather Market.jpg", alt: "Jajmau Leather Market, Kanpur", subject: "Leather bags at Jajmau", keys: ["/images/kanpur/jajmau-leather.jpg"] },
  { file: "z-square-mall.jpg", original: "Z Square Mall.jpg", alt: "Z Square Mall, Kanpur", subject: "Z Square Mall", keys: ["/images/kanpur/z-square.jpg"] },
  // ── Celebrations ──
  { file: "holi.jpg", original: "holi.jpg", alt: "Holi, Kanpur", subject: "Holi colours", keys: ["/images/kanpur/holi.jpg"], representative: true },
  { file: "ganga-mela.webp", original: "ganga mela.webp", alt: "Ganga Mela, Kanpur", subject: "Crowds at the Ganga Mela", keys: ["/images/kanpur/ganga-mela.jpg"], representative: true },
  { file: "durga-puja.jpg", original: "durga puja.avif", alt: "Durga Puja, Kanpur", subject: "Durga Puja pandal idols", keys: ["/images/kanpur/durga-puja.jpg"], representative: true },
  { file: "dev-deepawali.jpg", original: "dev deepawali.jpg", alt: "Dev Deepawali on the ghats", subject: "Dev Deepawali lamps on the ghats", keys: ["/images/kanpur/dev-deepawali.jpg"], representative: true },
  { file: "chattandkartikpurnima.jpg", original: "chattandkartikpurnima.jpg", alt: "Chhath & Kartik Purnima — a lamp on the river", subject: "Lamp offered on the river", keys: ["/images/kanpur/chhath.jpg"], representative: true },
  // ── Food ──
  { file: "thaggu-ke-laddoo.jpg", original: "thaggu ke laddoo.jfif", alt: "Thaggu Ke Laddu, Kanpur", subject: "Thaggu Ke Laddu box", keys: ["/images/kanpur/thaggu-ke-laddu.jpg"] },
  { file: "chaat.avif", original: "chaat.avif", alt: "Chaat, Kanpur", subject: "Plate of chaat", keys: ["/images/kanpur/arya-nagar-chaat.jpg"], representative: true },
  { file: "biriyani-kanpur.avif", original: "biriyani kanpur.avif", alt: "Handi biryani, Kanpur", subject: "Handi biryani", keys: ["/images/kanpur/handi-biryani.jpg"], representative: true },
  { file: "bun-maska.avif", original: "bun maska.avif", alt: "Kulhad chai and bun maska, Kanpur", subject: "Kulhad chai with bun maska", keys: ["/images/kanpur/kulhad-chai.jpg"], representative: true },
  { file: "kachori-subzi-and-jalebi.jpg", original: "kachori subzi and jalebi.jfif", alt: "Kachori-Sabzi & Jalebi, Kanpur", subject: "Kachori, sabzi and jalebi", keys: ["/images/kanpur/kachori-sabzi.jpg"], representative: true },
  // ── Blogs (default cover for posts without their own) ──
  { file: "blog.avif", original: "Blog.jpg", alt: "Notebook, coffee and laptop — Kanpur Ki Kahaani blog", subject: "Writing desk", keys: ["/images/kanpur/blog-cover.jpg"] },
];

/** In the folder but no slide or card has a matching title. */
export const TEAM_UNUSED = ["accomodation.avif", "campus-life.jpg", "events.jpg", "news.avif", "weather.avif"];

async function main() {
  const manifest: Record<string, Photo> = JSON.parse(readFileSync("src/data/photos.json", "utf8"));
  const slotKeys = new Set(collectSlots().map((s) => s.currentImage));
  for (const e of TEAM_PHOTOS) {
    const file = `public/images/${e.file}`;
    const meta = await sharp(file).metadata();
    const tiny = await sharp(file).resize(16).jpeg({ quality: 50 }).toBuffer();
    for (const key of e.keys) {
      if (!slotKeys.has(key)) throw new Error(`${e.file}: ${key} is not an image key used by any slide or card`);
      manifest[key] = {
        src: `/images/${e.file}`,
        width: meta.width!,
        height: meta.height!,
        alt: e.alt,
        caption: e.representative ? `Representative image — ${e.subject}` : undefined,
        objectPosition: e.objectPosition ?? "50% 50%",
        blurDataURL: `data:image/jpeg;base64,${tiny.toString("base64")}`,
        subject: e.subject,
        representative: !!e.representative,
        source: "team-supplied",
        license: TEAM_SUPPLIED,
        changes: e.original.endsWith(".jfif") ? "Renamed (.jfif → .jpg); otherwise unchanged" : e.original === "durga puja.avif" ? "Converted AVIF → JPEG (the AVIF could not be decoded by the image optimiser); no other changes" : "Renamed; otherwise unchanged",
        aiCheck: `Supplied by the team as "${e.original}"`,
        credit: true,
      };
    }
  }
  const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync("src/data/photos.json", JSON.stringify(sorted, null, 2) + "\n");
  console.log(`images:team — ${TEAM_PHOTOS.length} photos on ${TEAM_PHOTOS.reduce((n, e) => n + e.keys.length, 0)} image keys; unused: ${TEAM_UNUSED.join(", ")}`);
}

if (process.argv[1]?.endsWith("apply-team-photos.ts")) main();
