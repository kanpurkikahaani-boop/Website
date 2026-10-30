import assert from "node:assert/strict";
import { classifyCity, classifyGenre } from "../src/lib/news/classify";
import { canonicalUrl, cleanTitle, shortSummary } from "../src/lib/news/normalize";

const cases: [string, string | null, string][] = [
  ["Green Park to host India vs Bangladesh Test match in Kanpur", "kanpur", "sports"],
  ["कानपुर में पुलिस ने चोरी के आरोप में दो को गिरफ्तार किया", "kanpur", "crime-safety"],
  ["Lucknow: CM Yogi chairs cabinet meeting on assembly session", "lucknow", "politics"],
  ["Dense fog and cold wave grip Agra, Taj Mahal visibility low", "agra", "weather-environment"],
  ["Magh Mela 2027: Prayagraj readies sectors on Sangam sands", "prayagraj", "lifestyle-culture"],
  ["वाराणसी में देव दीपावली पर घाटों पर लाखों दीये", "varanasi", "lifestyle-culture"],
  ["Ayodhya Ram Mandir trust announces new darshan timings", "ayodhya", "lifestyle-culture"],
  ["IIT Kanpur placements: record offers this season", "kanpur", "education"],
  ["Sensex closes higher as RBI holds rates", null, "economy"],
  ["Bhutan king visits Delhi", null, "local-news"],
];
for (const [text, city, genre] of cases) {
  assert.equal(classifyCity(text), city, `city for: ${text}`);
  assert.equal(classifyGenre(text), genre, `genre for: ${text}`);
}
assert.equal(classifyCity("anything", "agra"), "agra", "feed default city wins");
assert.equal(classifyGenre("random text", ["Sports"]), "sports", "category hint");
assert.equal(canonicalUrl("http://WWW.Example.com/a/b/?utm_source=x&id=2&fbclid=z#top"), "https://www.example.com/a/b?id=2");
assert.equal(cleanTitle("Big news in Kanpur - Times of India", "Times of India"), "Big news in Kanpur");
assert.equal(shortSummary("<p>" + "word ".repeat(60) + "</p>", "t")!.length <= 141, true);
assert.equal(shortSummary("Big news in Kanpur and more", "Big news in Kanpur"), null);
console.log(`classify/normalize: ${cases.length + 6} assertions passed`);
