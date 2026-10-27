import type { City, NearbyCitySlug } from "./types";

/**
 * The five neighbouring cities promoted as trips from Kanpur.
 * Distances, drive/train times and airports are approximate. // VERIFY before publishing.
 */
export const kanpurInfo = {
  name: "Kanpur",
  hindi: "कानपुर",
  lat: 26.4499,
  lon: 80.3319,
  mapPos: { x: 40, y: 50 },
};

export const cities: City[] = [
  {
    slug: "lucknow",
    name: "Lucknow",
    hindi: "लखनऊ",
    tagline: "The City of Nawabs",
    shortIntro: "Imambaras, kebabs and chikankari — Awadh's graceful capital is the easiest weekend trip from Kanpur.",
    metaDescription:
      "Plan a Kanpur to Lucknow trip: Bara Imambara, Rumi Darwaza, galouti kebabs and chikankari shopping, with train and road times and a 1–2 day itinerary.",
    about: [
      "Lucknow wears its history lightly and politely — this is the city of 'pehle aap', where even the traffic seems to have manners after a plate of galouti kebabs. The Nawabs of Awadh made it a capital of poetry, music and architecture in the 18th and 19th centuries, and their monuments still dominate the old city around Husainabad.",
      "Just 90-odd kilometres up the road, it's the natural first hop from Kanpur: start at the Bara Imambara's beamless hall, lose yourself in the Bhool Bhulaiya, stand beneath the Rumi Darwaza at sunset, then go 'ganjing' along Hazratganj. Save room — Lucknow's kitchens are why most people come back.",
    ],
    distanceKm: 90, // VERIFY
    driveTime: "1.5–2 hrs",
    trainTime: "1.5–2 hrs",
    fastestWay: "Road via NH-27 or intercity train",
    nearestAirport: "Chaudhary Charan Singh Intl (LKO)",
    bestTime: "October – March",
    bestFor: "Monuments, Awadhi food, chikankari",
    lat: 26.8467,
    lon: 80.9462,
    heroImage: "/images/lucknow/hero.jpg",
    heroAlt: "Rumi Darwaza and the old city skyline of Lucknow at sunset",
    aboutImage: "/images/lucknow/about.jpg",
    aboutAlt: "Arched corridors inside the Bara Imambara complex, Lucknow",
    gettingThere: [
      {
        mode: "train",
        title: "By Train",
        body: "Dozens of daily trains link Kanpur Central (CNB) and Lucknow Charbagh (LKO) — Shatabdi, intercity and MEMU services take 1.5–2 hours.",
      },
      {
        mode: "road",
        title: "By Road",
        body: "Around 90 km via NH-27; allow 1.5–2 hours. UPSRTC buses run every few minutes from Jhakarkati and Rawatpur bus stands.",
      },
      {
        mode: "air",
        title: "By Air",
        body: "Lucknow's Chaudhary Charan Singh International Airport (LKO) is the region's main hub — it is also the closest international airport to Kanpur.",
      },
    ],
    itinerary: {
      oneDay: [
        {
          title: "A Nawabi day",
          stops: [
            { time: "Morning", title: "Bara Imambara & Bhool Bhulaiya", note: "Leave Kanpur by 7 am; hire a licensed guide for the maze." },
            { time: "Midday", title: "Chota Imambara & Rumi Darwaza", note: "Walk the Husainabad heritage zone; lunch on kebabs in Aminabad or Chowk." },
            { time: "Afternoon", title: "The Residency", note: "Shaded ruins and a small 1857 museum." },
            { time: "Evening", title: "Hazratganj stroll", note: "Chikankari shopping, kulfi, then drive back to Kanpur." },
          ],
        },
      ],
      twoDay: [
        {
          title: "Day 1 · Old Lucknow",
          stops: [
            { time: "Morning", title: "Bara Imambara & Bhool Bhulaiya", note: "Arrive by train and head straight to Husainabad." },
            { time: "Afternoon", title: "Chota Imambara & Rumi Darwaza", note: "Lunch on galouti kebabs and sheermal in Chowk." },
            { time: "Evening", title: "Chowk food walk", note: "Biryani, makhan malai (winter) and kulfi." },
          ],
        },
        {
          title: "Day 2 · New Lucknow",
          stops: [
            { time: "Morning", title: "The Residency", note: "Go early while it's cool and quiet." },
            { time: "Afternoon", title: "Aminabad chikankari", note: "Compare hand-embroidered pieces before you buy." },
            { time: "Evening", title: "Ambedkar Memorial Park & Hazratganj", note: "Sunset by the Gomti, then the evening train home." },
          ],
        },
      ],
    },
    mapPos: { x: 60, y: 14 },
    dayTrip: true,
  },
  {
    slug: "agra",
    name: "Agra",
    hindi: "आगरा",
    tagline: "The City of the Taj",
    shortIntro: "Sunrise at the Taj Mahal, the red walls of Agra Fort and Akbar's ghost city at Fatehpur Sikri.",
    metaDescription:
      "Plan a Kanpur to Agra trip: Taj Mahal at sunrise, Agra Fort, Fatehpur Sikri, petha and marble inlay, with train and road times and a 1–2 day itinerary.",
    about: [
      "Agra needs no introduction, but it rewards a slower look. Beyond the Taj Mahal — which really does change colour from dawn pink to noon white to evening gold — the city holds three UNESCO World Heritage Sites and some of the finest Mughal craftsmanship anywhere.",
      "From Kanpur it's a longer haul, best done with an overnight stay: arrive in the evening, catch the Taj at sunrise (it's closed on Fridays), spend the afternoon inside Agra Fort, and watch the sun set from Mehtab Bagh across the Yamuna. Add a morning at Fatehpur Sikri if you have the time.",
    ],
    distanceKm: 280, // VERIFY
    driveTime: "4.5–5 hrs",
    trainTime: "4–5 hrs",
    fastestWay: "Train to Agra Cantt / Agra Fort",
    nearestAirport: "Agra Airport (AGR) — limited flights",
    bestTime: "October – March",
    bestFor: "Mughal monuments, marble inlay",
    lat: 27.1767,
    lon: 78.0081,
    heroImage: "/images/agra/hero.jpg",
    heroAlt: "The Taj Mahal reflected in its long water channel at dawn",
    aboutImage: "/images/agra/about.jpg",
    aboutAlt: "Marble jaali screens inside Agra Fort overlooking the Yamuna",
    gettingThere: [
      {
        mode: "train",
        title: "By Train",
        body: "Several daily trains connect Kanpur Central with Agra Fort and Agra Cantt stations; the journey takes roughly 4–5 hours.",
      },
      {
        mode: "road",
        title: "By Road",
        body: "About 280 km. The Agra–Lucknow Expressway (via its Kanpur-side link) is the smoothest drive — around 4.5–5 hours.",
      },
      {
        mode: "air",
        title: "By Air",
        body: "Agra Airport (AGR) has limited flights; most travellers fly into Delhi or Lucknow and continue by road or rail.",
      },
    ],
    itinerary: {
      oneDay: [
        {
          title: "The Taj in a day",
          stops: [
            { time: "Sunrise", title: "Taj Mahal", note: "Take an overnight train or leave Kanpur at 3 am. Closed Fridays." },
            { time: "Midday", title: "Agra Fort", note: "Two hours inside the citadel; lunch on Mughlai in Sadar." },
            { time: "Afternoon", title: "Itmad-ud-Daulah", note: "The 'Baby Taj' — quiet and exquisite." },
            { time: "Evening", title: "Mehtab Bagh sunset", note: "Taj views across the river, then petha shopping before the train back." },
          ],
        },
      ],
      twoDay: [
        {
          title: "Day 1 · The Taj & the Fort",
          stops: [
            { time: "Sunrise", title: "Taj Mahal", note: "Reach Agra the previous night so you're at the gate by 6 am." },
            { time: "Afternoon", title: "Agra Fort", note: "Lunch in Sadar Bazaar first." },
            { time: "Evening", title: "Mehtab Bagh", note: "Sunset across the Yamuna; dinner of bedai and jalebi." },
          ],
        },
        {
          title: "Day 2 · Fatehpur Sikri",
          stops: [
            { time: "Morning", title: "Fatehpur Sikri", note: "40 km out — Buland Darwaza and Salim Chishti's tomb." },
            { time: "Afternoon", title: "Itmad-ud-Daulah", note: "Back in town for the 'Baby Taj'." },
            { time: "Evening", title: "Marble inlay & petha shopping", note: "Then the evening train to Kanpur." },
          ],
        },
      ],
    },
    mapPos: { x: 8, y: 22 },
    dayTrip: false,
  },
  {
    slug: "prayagraj",
    name: "Prayagraj",
    hindi: "प्रयागराज",
    tagline: "Where three rivers meet",
    shortIntro: "Boat out to the Triveni Sangam, walk through the freedom struggle at Anand Bhawan and eat kachoris in Loknath.",
    metaDescription:
      "Plan a Kanpur to Prayagraj trip: Triveni Sangam boat rides, Anand Bhawan, Magh Mela and kachori-sabzi, with train and road times and a 1–2 day itinerary.",
    about: [
      "Prayagraj — long known as Allahabad — sits where the muddy Ganga meets the green Yamuna and, in belief, the hidden Saraswati. That confluence, the Triveni Sangam, has drawn pilgrims for thousands of years and hosts the Magh Mela every January–February and the vast Kumbh Mela in its cycle.",
      "It's also a city of ideas: the Nehru family's Anand Bhawan, a historic university and the park where Chandrashekhar Azad made his final stand. About 200 km down the highway from Kanpur, it's an easy overnight — or the first stop on a longer Ganga trail to Varanasi.",
    ],
    distanceKm: 200, // VERIFY
    driveTime: "3.5–4 hrs",
    trainTime: "2–3 hrs",
    fastestWay: "Train (Vande Bharat / Shatabdi-class services)",
    nearestAirport: "Prayagraj Airport (IXD)",
    bestTime: "October – March (Magh Mela: Jan – Feb)",
    bestFor: "Sangam, pilgrimage, history",
    lat: 25.4358,
    lon: 81.8463,
    heroImage: "/images/prayagraj/hero.jpg",
    heroAlt: "Pilgrim boats gathered at the Triveni Sangam at dawn, Prayagraj",
    aboutImage: "/images/prayagraj/about.jpg",
    aboutAlt: "Anand Bhawan museum in Prayagraj",
    gettingThere: [
      {
        mode: "train",
        title: "By Train",
        body: "Kanpur–Prayagraj is a busy main-line route; fast trains cover it in 2–3 hours to Prayagraj Junction (PRYJ).",
      },
      {
        mode: "road",
        title: "By Road",
        body: "Roughly 200 km via NH-19 through Fatehpur — about 3.5–4 hours by car or UPSRTC bus.",
      },
      {
        mode: "air",
        title: "By Air",
        body: "Prayagraj Airport (IXD) at Bamrauli has domestic connections to major metros.",
      },
    ],
    itinerary: {
      oneDay: [
        {
          title: "Sangam & the city of ideas",
          stops: [
            { time: "Morning", title: "Triveni Sangam boat ride", note: "Take an early train; boats leave from near the fort." },
            { time: "Midday", title: "Allahabad Fort & Akshayavat", note: "Then kachori-sabzi in Loknath." },
            { time: "Afternoon", title: "Anand Bhawan", note: "Nehru family home and freedom-struggle museum." },
            { time: "Evening", title: "Chandrashekhar Azad Park", note: "A stroll before the train back to Kanpur." },
          ],
        },
      ],
      twoDay: [
        {
          title: "Day 1 · The Sangam",
          stops: [
            { time: "Morning", title: "Triveni Sangam", note: "Dawn boat ride to the confluence." },
            { time: "Afternoon", title: "Allahabad Fort & Akshayavat", note: "Lunch in the old city." },
            { time: "Evening", title: "Loknath food lanes", note: "Kachori, jalebi and lassi." },
          ],
        },
        {
          title: "Day 2 · History walk",
          stops: [
            { time: "Morning", title: "Anand Bhawan", note: "Arrive at opening time." },
            { time: "Afternoon", title: "Khusro Bagh", note: "Mughal tombs in a quiet garden." },
            { time: "Evening", title: "Chandrashekhar Azad Park", note: "Then onward to Varanasi or back to Kanpur." },
          ],
        },
      ],
    },
    mapPos: { x: 64, y: 90 },
    dayTrip: false,
  },
  {
    slug: "varanasi",
    name: "Varanasi",
    hindi: "वाराणसी",
    tagline: "The eternal city on the Ganga",
    shortIntro: "Ganga Aarti at Dashashwamedh, a sunrise boat past the ghats, Kashi Vishwanath and the silk looms of Banaras.",
    metaDescription:
      "Plan a Kanpur to Varanasi trip: Ganga Aarti, Kashi Vishwanath, a sunrise boat ride, Sarnath and Banarasi silk, with train and road times and a 2-day plan.",
    about: [
      "Older than history, older than tradition, older even than legend — Mark Twain's line still fits Varanasi. Kashi, Banaras, Varanasi: by any name it's one of the world's oldest living cities, its ghats stepping down to the Ganga in an unbroken arc of temples, palaces, bathers and boats.",
      "Give it at least two days from Kanpur. Catch the evening aarti at Dashashwamedh Ghat, rise early for Subah-e-Banaras at Assi and a boat ride along the ghats, queue for darshan at Kashi Vishwanath, then escape to Sarnath where the Buddha first taught. Dev Deepawali, on Kartik Purnima, is the year's headline night.",
    ],
    distanceKm: 330, // VERIFY
    driveTime: "5–6 hrs",
    trainTime: "4–6 hrs",
    fastestWay: "Train to Varanasi Jn / Banaras",
    nearestAirport: "Lal Bahadur Shastri Intl (VNS)",
    bestTime: "October – March (Dev Deepawali in Nov)",
    bestFor: "Ghats, aarti, silk, spirituality",
    lat: 25.3176,
    lon: 82.9739,
    heroImage: "/images/varanasi/hero.jpg",
    heroAlt: "Lamps and crowds on the Varanasi ghats during the evening Ganga Aarti",
    aboutImage: "/images/varanasi/about.jpg",
    aboutAlt: "Boats moored beneath the ghats of Varanasi in morning light",
    gettingThere: [
      {
        mode: "train",
        title: "By Train",
        body: "Many trains run Kanpur Central → Varanasi Junction (BSB) or Banaras (BSBS); the fastest take about 4 hours, most 5–6.",
      },
      {
        mode: "road",
        title: "By Road",
        body: "About 330 km via Prayagraj on NH-19 — 5–6 hours. Break the drive at the Sangam for a two-city trip.",
      },
      {
        mode: "air",
        title: "By Air",
        body: "Lal Bahadur Shastri International Airport (VNS) at Babatpur is about 25 km from the ghats.",
      },
    ],
    itinerary: {
      oneDay: [
        {
          title: "A day in Kashi",
          stops: [
            { time: "Sunrise", title: "Assi Ghat & boat ride", note: "Arrive on an overnight train; Subah-e-Banaras at dawn." },
            { time: "Morning", title: "Shri Kashi Vishwanath Dham", note: "Lockers for phones near the gates." },
            { time: "Afternoon", title: "Sarnath", note: "Dhamek Stupa and the Archaeological Museum." },
            { time: "Evening", title: "Dashashwamedh Ganga Aarti", note: "Watch from the steps or a boat, then the night train home." },
          ],
        },
      ],
      twoDay: [
        {
          title: "Day 1 · Ghats & aarti",
          stops: [
            { time: "Afternoon", title: "Walk the ghats", note: "From Assi north towards Dashashwamedh, with chai stops." },
            { time: "Evening", title: "Dashashwamedh Ganga Aarti", note: "Reach by 6 pm for a good spot." },
            { time: "Night", title: "Kachori-sabzi & lassi", note: "Old-city food lanes near Godowlia." },
          ],
        },
        {
          title: "Day 2 · Temples & Sarnath",
          stops: [
            { time: "Sunrise", title: "Boat ride along the ghats", note: "The softest light of the day." },
            { time: "Morning", title: "Shri Kashi Vishwanath Dham", note: "Then a walk through the galis." },
            { time: "Afternoon", title: "Sarnath", note: "Buddhist ruins and museum." },
            { time: "Evening", title: "Banarasi silk shopping", note: "Buy from reputed weavers' showrooms." },
          ],
        },
      ],
    },
    mapPos: { x: 92, y: 74 },
    dayTrip: false,
  },
  {
    slug: "ayodhya",
    name: "Ayodhya",
    hindi: "अयोध्या",
    tagline: "The city of Shri Ram",
    shortIntro: "The new Ram Mandir, Hanuman Garhi, evening aarti on the Saryu and the glow of Deepotsav.",
    metaDescription:
      "Plan a Kanpur to Ayodhya trip: the Ram Janmabhoomi Mandir, Hanuman Garhi, Saryu aarti and Deepotsav, with train and road times and a 1–2 day itinerary.",
    about: [
      "Ayodhya, on the banks of the Saryu, is revered as the birthplace of Lord Ram and is one of the seven sacred cities of Hinduism. Its narrow lanes are lined with hundreds of temples and maths, and the grand Shri Ram Janmabhoomi Mandir — consecrated in January 2024 — has transformed it into one of India's most visited pilgrim towns.",
      "From Kanpur, it's about four hours by road (often via Lucknow). Climb to Hanuman Garhi first, as tradition asks, then visit Ram Lalla, Kanak Bhawan and the ghats. Stay for the Saryu aarti — or plan around Deepotsav at Diwali, when lakhs of diyas line Ram ki Paidi.",
    ],
    distanceKm: 220, // VERIFY
    driveTime: "~4 hrs",
    trainTime: "4–5 hrs",
    fastestWay: "Road via Lucknow (NH-27)",
    nearestAirport: "Maharishi Valmiki Intl (AYJ)",
    bestTime: "October – March (Deepotsav at Diwali)",
    bestFor: "Pilgrimage, ghats, Deepotsav",
    lat: 26.7922,
    lon: 82.1998,
    heroImage: "/images/ayodhya/hero.jpg",
    heroAlt: "Diyas glowing along the Saryu ghats of Ayodhya during Deepotsav",
    aboutImage: "/images/ayodhya/about.jpg",
    aboutAlt: "Temple spires above the lanes of Ayodhya",
    gettingThere: [
      {
        mode: "train",
        title: "By Train",
        body: "Ayodhya Dham Junction (AYC) is served by trains from Kanpur, many via Lucknow — about 4–5 hours.",
      },
      {
        mode: "road",
        title: "By Road",
        body: "Roughly 220 km via Lucknow on NH-27 — around 4 hours. Combine with Lucknow for the 'Ram Path' circuit.",
      },
      {
        mode: "air",
        title: "By Air",
        body: "Maharishi Valmiki International Airport (AYJ) opened in 2023 with domestic flights to major cities.",
      },
    ],
    itinerary: {
      oneDay: [
        {
          title: "Darshan & the Saryu",
          stops: [
            { time: "Morning", title: "Hanuman Garhi", note: "Leave Kanpur by 5 am; climb the 76 steps first." },
            { time: "Late morning", title: "Shri Ram Janmabhoomi Mandir", note: "Allow 2–3 hours for security and darshan." },
            { time: "Afternoon", title: "Kanak Bhawan", note: "Then a simple thali lunch near the temple." },
            { time: "Evening", title: "Saryu Ghat Aarti", note: "Lamps on the river before the drive back." },
          ],
        },
      ],
      twoDay: [
        {
          title: "Day 1 · Temples",
          stops: [
            { time: "Morning", title: "Hanuman Garhi", note: "Arrive early to beat queues." },
            { time: "Midday", title: "Shri Ram Janmabhoomi Mandir", note: "Carry minimal belongings." },
            { time: "Evening", title: "Saryu Ghat Aarti", note: "Followed by a stroll along Ram ki Paidi." },
          ],
        },
        {
          title: "Day 2 · Ghats & lanes",
          stops: [
            { time: "Morning", title: "Guptar Ghat", note: "Peaceful riverside temples." },
            { time: "Afternoon", title: "Kanak Bhawan & temple lanes", note: "Peda and kachori for the road." },
            { time: "Evening", title: "Ram ki Paidi", note: "Light show, then head home via Lucknow." },
          ],
        },
      ],
    },
    mapPos: { x: 88, y: 24 },
    dayTrip: false,
  },
];

export function getCity(slug: string) {
  return cities.find((c) => c.slug === slug);
}

export const citySlugs = cities.map((c) => c.slug) as NearbyCitySlug[];
