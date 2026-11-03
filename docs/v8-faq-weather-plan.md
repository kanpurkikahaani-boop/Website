# Plan — v8: keyword-targeted FAQs on every page + Weather page upgrades

## Context
Add a crawlable FAQ section, with FAQPage JSON-LD, to every public page, written around the target keyword list. Upgrade `/weather` so it genuinely answers the weather searches: your location, today strip, hourly forecast, tomorrow card, rain radar, IMD warnings link, last-updated time.

**Constraints found in the audit:**
- **Weather data:** `src/lib/weather.ts` (`useWeather`, Open-Meteo, 30-minute cache) is shared by the home info strip, `/weather` and the city pages.
- **Query parameters already exist:**
  - `/weather` already syncs `?city=` (`useQueryState`);
  - the planner reads `?cities=`;
  - `/news` reads `?genre=weather-environment`;
  - `/events` reads `?city=`.
- **Facts:** answers reuse facts already in `src/data/*`: city distances and drive/train times, best seasons, places, festivals.
- **Network:** this container can't reach Open-Meteo, RainViewer or OSM tiles. That's fine on the live site, because the visitor's browser calls them. Here I test with recorded sample responses in Playwright, intercepting the requests. Leaflet installs from npm.

## Keyword rules I'll follow
- Natural questions only.
- Each keyword at most 3× per page, counting FAQ, headings and meta together; the coverage script warns if exceeded.
- Generic weather terms are localised ("weather today in Kanpur"). "Near me / at my location" appear only in the Use-my-location questions.
- **"itenary" and "wea" appear nowhere** (no visible, alt or hidden text). The coverage script exempts them from coverage and fails if they ever appear in `faqs.ts`.

## Keyword → page mapping

| Keywords | Primary page | Also on |
|---|---|---|
| kanpur, kanpur india, kanpur city | `/` | `/culture-history`, `/tourism`, `/shopping`, `/accommodation` |
| itinerary | `/tourism` | `/`, `/nearby`, city pages |
| culture | `/culture-history` | `/`, `/playlist`, `/blogs`, city pages |
| map | `/tourism` | `/`, `/culture-history`, `/shopping`, `/nearby`, `/accommodation`, city pages |
| weather, weather today, the weather | `/weather` | `/`, city pages, `/outdoor-sports` |
| events, upcoming festival | `/events` | `/`, `/celebrations`, `/food-nightlife`, city pages, `/blogs` |
| news, weather news, weather update | `/news` | `/`, `/weather` |
| kanpur iit | `/campus` | `/`, `/accommodation` |
| night out | `/food-nightlife` | `/`, `/events`, `/campus` |
| rain today, rain forecast | `/weather` | `/outdoor-sports` |
| All other weather terms: tomorrow, radar, live, current/now, temperature, location, report, conditions, information, forecast, feels-like | `/weather` (grouped FAQ) | — |

## Components and files
- **`src/components/faq/FaqSection.tsx`** (server component):
  - beige section, "GOOD TO KNOW" eyebrow, maroon Playfair H2, 760px column;
  - native `<details>`/`<summary>`, first item open; gold "+" rotating to "×"; smooth height animation via CSS `interpolate-size`/`::details-content`, with a reduced-motion fallback; coral focus ring;
  - `id="faq-…"` slugs on each question, plus a small client `CopyLinkButton`;
  - grouped mode: H3 per group with pill links that jump to the groups;
  - outputs its own `FAQPage` JSON-LD (static answers only).
- **`src/components/faq/LiveFaqLine.tsx`** (client): renders the `live` token line under an answer using the shared weather hook. Skeleton while loading; hidden on error. Not included in the JSON-LD.
- **`src/data/faqs.ts`:**
  - typed `FaqItem { id, question, answer, keywords, group?, live? }`, keyed by page;
  - answers use `[text](/link)` markdown, rendered by a tiny safe renderer that allows only internal paths + https links (external links get `rel="noopener noreferrer"`);
  - time-sensitive facts marked `// VERIFY`.
- **`cityFaqs(city)`** in the same file, built from `cities.ts` + `places.ts`, so each city's answers are specific.
- **`src/lib/seo.ts`:** `faqJsonLd(items)` (plain-text answers with markdown links stripped, identical to the visible text).
- **`/faq` page:** all FAQs grouped by page, category pills, client-side search box over server-rendered content (works without JS), each group linking to its page. JSON-LD covers only home + blogs + team. Added to the footer ("FAQs") and the sitemap.
- **Placement:** after the main content, before the newsletter band/footer. On city pages, before "Explore Other Cities".
- **Pages (17):** `/`, `/tourism`, `/culture-history`, `/celebrations`, `/food-nightlife`, `/shopping`, `/outdoor-sports`, `/nearby`, `/cities/[slug]` ×5, `/events`, `/weather`, `/news`, `/accommodation`, `/campus`, `/blogs`, `/team`, `/playlist`.

## Questions per page
Wording as in your brief, lightly refined; 40–90 words each, each with at least one internal link.
- **Home (9):**
  - Where is Kanpur, India, and why is it called the "Manchester of the East"?
  - What is Kanpur city famous for?
  - How do I plan a 1–3 day Kanpur itinerary?
  - Is there a map of the top places to visit in Kanpur?
  - What's the weather like in Kanpur today? *(live todaySummary)*
  - What events and upcoming festivals are happening in Kanpur?
  - Where can I read the latest Kanpur news?
  - Where is IIT Kanpur and how far is it from the city centre? *(VERIFY distance)*
  - Where can I go for a good night out in Kanpur?
- **Tourism (7):** best 1-day itinerary · what a 2–3 day itinerary should include · how the planner works · map of tourist places · best weather for sightseeing · adding Lucknow/Agra/Varanasi · getting around Kanpur city.
- **Culture & History (5):** culture of Kanpur · history of Kanpur, India (Cawnpore, 1857, mills) · heritage sites + map · languages spoken · best festival for culture (→ `/celebrations` + Navaratri blog).
- **Celebrations (5):** next upcoming festival (→ `/events`) · biggest festivals · Ganga Mela · when Navaratri/Durga Puja happen (→ blog) · festival events & tickets.
- **Food & Night Life (5):** night out · famous street food · late-night food · cafes · night-out events this week.
- **Shopping (4):** best markets in Kanpur city · leather goods · best time for markets · map of shopping streets.
- **Outdoor & Sports (5):** Green Park events · parks and ghats for a morning out · will rain affect plans today (*live rainChanceToday*) · boating on the Ganga (point to official/local operators; no invented prices) · best season (the weather).
- **Nearby (5):** best weekend trips · map of cities around Kanpur · multi-city itinerary (→ `/tourism?cities=…#planner`) · distances (from `cities.ts`) · weather in each city before travel (→ `/weather?city=`).
- **City pages (6 each, ×5, from `cities.ts`):**
  - What is {City} famous for?
  - A 1–2 day {City} itinerary
  - Weather today and best time to visit (*live*, → `/weather?city=`)
  - How to reach {City} from Kanpur
  - Events and upcoming festivals (→ `/events?city=`)
  - Map of {City}'s top places
- **Events (6):** this week · next upcoming festival · night-out events · how often updated (daily) · booking via BookMyShow · nearby-city events.
- **Weather (20, grouped):**
  - **Today & right now:** weather today (*todaySummary*) · current temperature (*currentTemp*) · rain today (*rainChanceToday*) · today's conditions & report.
  - **Tomorrow:** forecast for tomorrow (*tomorrowSummary*) · rain tomorrow (*rainChanceTomorrow*).
  - **Radar & rain:** live rain radar · forecast/radar accuracy.
  - **Your location:** weather at my location · temperature and rain at my location · tomorrow at my location · do you store my location (no).
  - **Forecasts, updates & sources:** how far ahead · updates & data source (Open-Meteo, 30 min) · weather news & IMD warnings (→ IMD + `/news?genre=weather-environment`) · what "feels like" means.
  - **Seasons:** best weather to visit · summer heat & monsoon timing · winter fog and trains/flights.
- **News (5):** latest news today · update frequency · weather news & updates · filtering by city/topic · which sources.
- **Accommodation (4):** best area in Kanpur city · stay near IIT Kanpur · near Kanpur Central · map of stay areas.
- **Campus (5):** where IIT Kanpur is + how to get there (→ iitk.ac.in) · can visitors enter (→ official site; no invented rules) · main colleges · student night out · weather across the academic year.
- **Blogs (3):** who writes (→ `/team`) · topics (culture, upcoming festival) · new stories by email.
- **Team (3):** who's behind KKK · how to collaborate · where to follow.
- **Playlist (3):** what it is · music that reflects Kanpur's culture · listening on Spotify.
- **Fact-checking:** I'll use only facts in the codebase or widely established ones (e.g. Kanpur on the Ganga; the 1857 siege of Cawnpore; textile/leather "Manchester of the East"; IIT Kanpur founded 1959 in Kalyanpur). Anything time-sensitive or approximate gets `// VERIFY`. No prices, phone numbers or rules invented; official sources are pointed to instead.

## Weather page upgrades (`/weather`)
1. **`src/lib/weather.ts`, extended:**
   - adds `hourly=temperature_2m,precipitation_probability,weather_code` and `daily=precipitation_probability_max,sunrise,sunset,uv_index_max` with `forecast_days=7`;
   - new fields on `WeatherData` (backwards compatible for the home strip and city pages);
   - cache key now includes the version.
2. **Use my location** (pin button by the city pills):
   - `navigator.geolocation` only on click;
   - Open-Meteo reverse geocoding for the place name, falling back to "Your location";
   - coordinates live only in memory and are sent only to Open-Meteo by the browser, never to our servers;
   - `localStorage` keeps just the choice `kkk-weather-use-location=1`, in try/catch;
   - on deny or unavailable: a friendly message and Kanpur.
3. **Today strip:** high/low, rain chance, sunrise/sunset, UV, humidity, wind, feels like.
4. **Hourly row (next 24h):** horizontally scrollable — time, icon, °C, rain %.
5. **Tomorrow card:** "Tomorrow in {place}" with summary, high/low and rain chance.
6. **Live rain radar:**
   - `RainRadar` loaded with `next/dynamic` (`ssr:false`) only when scrolled near; Leaflet + CSS lazy-loaded so first paint isn't affected;
   - OSM tiles + RainViewer frames from `weather-maps.json`, with play/pause over the past ~2h;
   - attribution "Radar © RainViewer · © OpenStreetMap contributors";
   - if RainViewer fails: radar hidden, link to IMD radar.
   - Terms: OSM tile usage policy (low traffic, attribution, valid referer) and RainViewer's free-API terms are noted in SETUP.md. I can't open those pages from here, so they're marked VERIFY there.
7. **Notices:** "For official weather warnings, see IMD ↗" (https://mausam.imd.gov.in), and "Last updated {time IST} · refreshes every 30 minutes".
8. **Live FAQ lines** via `LiveFaqLine` (same hook, same city as the page's selection).
9. **Metadata, heading and URL:**
   - your title and description;
   - a static H2 "Kanpur weather right now" above the card;
   - `?city=` stays in sync (already implemented).

## Keyword coverage check
`scripts/seo/faq-coverage.ts` (`npm run seo:faq`) → `reports/faq-keyword-coverage.md`:
- per keyword: the pages and questions that cover it — fails if uncovered, except "wea"/"itenary";
- per page: FAQ count, keyword uses — warns above 3, counting question + answer + page title/description;
- warnings for answers under 40 or over 100 words, or with no internal link;
- fails if a misspelling appears.
- Added to `prebuild` in warning mode: always exits 0 there, prints its warnings.

## Verification
- Build, lint, typecheck, `seo:faq`, `images:verify`; `test:e2e` stays green.
- **New Playwright `tests/faq-weather.spec.ts`** with mocked Open-Meteo, reverse geocoding and RainViewer:
  - **FAQs:** each FAQ page has the section in server HTML (fetched with JS disabled); JSON-LD text matches the visible answers; deep link `#faq-…` opens the item.
  - **Weather:**
    - "Use my location", allow and deny paths;
    - hourly row, tomorrow card, rain chance, sunrise/sunset;
    - radar renders, and falls back to the IMD link when RainViewer fails;
    - `?city=` preselects;
    - live FAQ line shows the mocked values, and is hidden on API failure;
    - no coordinates sent to our own origin (request log check).
- Lighthouse mobile on `/`, `/weather`, `/tourism` (target ≥ 90).
- Screenshots of the FAQ on Home, Weather and Varanasi at 375px and 1280px → `reports/screenshots/`.
- Commit, push to `main`, confirm the Vercel deploy.
