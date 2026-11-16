/** npm run test:google — link formats, query rules and the (mocked) place-ID resolver. No network. */
import assert from "node:assert/strict";
import { food } from "../../src/data/food";
import { allPlaces } from "../../src/data/places";
import { shopping } from "../../src/data/shopping";
import { stays } from "../../src/data/stays";
import { directionsUrl, imagesUrl, mapsUrl } from "../../src/lib/googleLinks";
import { foodLinks, placeLinks, routeLinks, shopLinks, stayLinks } from "../../src/lib/googleQueries";
import { resolveOne } from "./resolve-place-ids";

let n = 0;
const t = async (name: string, fn: () => void | Promise<void>) => {
  await fn();
  n++;
  console.log(`✓ ${name}`);
};

async function main() {
  await t("URL formats match Google's documented Maps URLs + Images tab", () => {
    assert.equal(mapsUrl("JK Temple, Kanpur"), "https://www.google.com/maps/search/?api=1&query=JK+Temple%2C+Kanpur");
    assert.equal(mapsUrl("x", "ChIJ123"), "https://www.google.com/maps/search/?api=1&query=x&query_place_id=ChIJ123");
    assert.equal(imagesUrl("JK Temple Kanpur"), "https://www.google.com/search?q=JK+Temple+Kanpur&udm=2");
    assert.equal(directionsUrl({ origin: "Kanpur", destination: "Ayodhya", waypoints: ["Lucknow"] }), "https://www.google.com/maps/dir/?api=1&origin=Kanpur&destination=Ayodhya&waypoints=Lucknow");
  });
  await t("ambiguous names always carry the right city", () => {
    const jk = allPlaces.find((p) => p.slug === "jk-temple")!;
    assert.equal(placeLinks(jk).mapsQuery, "JK Temple, Sarvodaya Nagar, Kanpur, Uttar Pradesh");
    assert.equal(placeLinks(jk).imagesQuery, "JK Temple Kanpur");
    const moti = allPlaces.find((p) => /moti jheel/i.test(p.name))!;
    assert.match(placeLinks(moti).mapsQuery, /Moti Jheel.*Kanpur, Uttar Pradesh$/);
    const chowk = shopping.find((s) => s.name === "Chowk")!;
    assert.equal(shopLinks(chowk).mapsQuery, `Chowk, ${chowk.area === "Chowk" ? "" : `${chowk.area}, `}Lucknow, Uttar Pradesh`);
    const civil = stays.find((s) => s.area === "Civil Lines" && s.city === "prayagraj")!;
    assert.equal(stayLinks(civil).mapsQuery, "Civil Lines, Prayagraj, Uttar Pradesh");
  });
  await t("sample listings link to the dish/area, never the made-up name", () => {
    const sample = food.find((f) => f.sample && f.city === "kanpur")!;
    const g = foodLinks(sample);
    assert.ok(!g.mapsQuery.includes(sample.name), g.mapsQuery);
    assert.equal(g.needsReview, true);
    for (const s of stays) assert.ok(!stayLinks(s).mapsQuery.includes(s.name));
    const thaggu = food.find((f) => f.name === "Thaggu Ke Laddu")!;
    assert.equal(foodLinks(thaggu).mapsQuery, "Thaggu Ke Laddu, Bada Chauraha, Kanpur, Uttar Pradesh");
  });
  await t("circuits are directions through every stop", () => {
    const r = routeLinks("Ram Path", ["lucknow", "ayodhya"]);
    assert.equal(r.mapsUrl, "https://www.google.com/maps/dir/?api=1&origin=Kanpur%2C+Uttar+Pradesh&destination=Ayodhya%2C+Uttar+Pradesh&waypoints=Lucknow%2C+Uttar+Pradesh");
  });
  await t("place-ID resolver: good match kept, wrong city flagged, key only in the header", async () => {
    let seen: RequestInit | undefined;
    const fake = (body: unknown) => (async (_u: RequestInfo | URL, init?: RequestInit) => {
      seen = init;
      return new Response(JSON.stringify(body), { status: 200 });
    }) as typeof fetch;
    const ok = await resolveOne("JK Temple, Sarvodaya Nagar, Kanpur, Uttar Pradesh", "JK Temple", "Kanpur", "KEY-123", fake({ places: [{ id: "ChIJok", displayName: { text: "J K Temple" }, formattedAddress: "Sarvodaya Nagar, Kanpur, Uttar Pradesh 208005, India" }] }));
    assert.equal(ok?.flagged, false);
    assert.equal((seen!.headers as Record<string, string>)["X-Goog-Api-Key"], "KEY-123");
    assert.ok(!String(seen!.body).includes("KEY-123"));
    const bad = await resolveOne("Chowk, Lucknow", "Chowk", "Lucknow", "K", fake({ places: [{ id: "ChIJbad", displayName: { text: "Chowk" }, formattedAddress: "Chowk, Varanasi, Uttar Pradesh" }] }));
    assert.equal(bad?.flagged, true);
  });
  console.log(`\n${n} passed`);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
