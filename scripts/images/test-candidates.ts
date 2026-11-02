/** npm run test:images — filter rules for photo candidates, run offline against fixtures. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dedupe, filterCandidates, fromCommons, fromPexels, fromUnsplash, hamming, queriesFor } from "./candidates";

const fx = (n: string) => JSON.parse(readFileSync(`tests/fixtures/images/${n}`, "utf8"));
const commons = fromCommons(fx("commons.json"));
const { kept, rejected } = filterCandidates(commons, { minWidth: 1200, landscape: true });
const why = (t: string) => rejected.find((r) => r.candidate.title.includes(t))?.reasons.join("; ") ?? "";

assert.deepEqual(kept.map((c) => c.title), ["File:FIXTURE good landscape.jpg"], "only the good Commons file survives");
assert.match(why("non-commercial"), /licence "CC BY-NC 2.0" not allowed/);
assert.match(why("ai.jpg"), /AI \/ non-photo keyword/);
assert.match(why("small"), /800px wide < 1200px/);
assert.match(why("portrait"), /not landscape/);
assert.match(why("upscaled"), /AI \/ non-photo keyword: "Upscaled"/i);
const good = kept[0];
assert.equal(good.author, "Fixture Photographer");
assert.equal(good.authorUrl, "https://commons.example.test/wiki/User:Fixture");
assert.equal(good.license, "CC BY-SA 4.0");
assert.equal(good.captureDate, "2018-11-07 18:02:11");

const un = filterCandidates(fromUnsplash(fx("unsplash.json")), { minWidth: 2400, landscape: true });
assert.deepEqual(un.kept.map((c) => c.id), ["fixtureU1"]);
assert.equal(un.kept[0].camera, "Canon EOS 80D");
assert.equal(un.kept[0].downloadLocation, "https://api.unsplash.com/photos/fixtureU1/download?ixid=1");
assert.match(un.rejected[0].reasons.join(";"), /not landscape|Digital art/i);

const px = filterCandidates(fromPexels(fx("pexels.json")), { minWidth: 1200, landscape: true });
assert.deepEqual(px.kept.map((c) => c.id), ["101"]);
assert.match(px.rejected[0].reasons.join(";"), /watermark\/text keyword/);

assert.equal(hamming("ffff000000000000", "ffff000000000001"), 1);
const d = dedupe([
  { ...good, id: "a", width: 2000, height: 1300, hash: "ffff000000000000" },
  { ...good, id: "b", width: 4000, height: 2600, hash: "ffff000000000003" },
  { ...good, id: "c", width: 3000, height: 2000, hash: "0000ffffffff0000" },
]);
assert.deepEqual(d.map((c) => c.id), ["b", "c"], "near-duplicate dropped, larger copy kept");

const q = queriesFor({ adjacentTitle: "JK Temple", city: "kanpur", brief: "White marble spires of JK Temple, Kanpur, at dusk" }, "जे के मंदिर कानपुर");
assert.deepEqual(q.text, ["JK Temple Kanpur", "White marble spires of JK Temple", "जे के मंदिर कानपुर"]);
assert.deepEqual(q.categories, ["Category:JK Temple, Kanpur", "Category:JK Temple"]);

console.log("images: candidate filters — 22 assertions passed");
