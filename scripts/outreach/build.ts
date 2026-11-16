/**
 * npm run outreach:kit → reports/outreach/outreach-kit.html + reports/outreach/targets.csv
 *
 * A ready-to-send link-building kit built from the site's own data: who to contact, why they
 * would link, which of our pages to point them to, and a filled-in message (English + Hindi for
 * press and local places). Nothing is sent from here: the team sends from its own email and
 * accounts. Contact details are left blank unless we already hold the organisation's official
 * website in our data (no invented URLs or emails). Sample listings are never contacted.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { institutions } from "../../src/data/campus";
import { food } from "../../src/data/food";
import { directoryCandidates } from "../../src/data/newsSources";
import { kanpurPlaces } from "../../src/data/places";
import { shopping } from "../../src/data/shopping";
import { CANONICAL_SITE_URL } from "../../src/data/site";

const U = (p: string) => `${CANONICAL_SITE_URL}${p}`;
const PRESS = U("/press");

export interface Target {
  category: "Press" | "Colleges" | "Featured places" | "Profiles & directories" | "Communities";
  name: string;
  website: string;
  why: string;
  linkTo: string;
  subject: string;
  message: string;
  messageHi?: string;
  needsAccount?: boolean;
}

const SIGN = "\n\nWarm regards,\n[Your name]\nKanpur Ki Kahaani · " + CANONICAL_SITE_URL + "\n[Phone / Instagram]";

function pressTarget(name: string, website: string, cityDesk: boolean): Target {
  return {
    category: "Press",
    name,
    website,
    why: cityDesk ? "City desk: local story angle, links to local guides." : "National outlet: pitch only with a strong, timely hook.",
    linkTo: `${U("/celebrations")} · ${U("/guides/distances-from-kanpur")} · ${U("/culture-history")}`,
    subject: "Story idea: Kanpur's festivals and forgotten heritage, with ready-to-use data",
    message:
      `Hello ${name} team,\n\nWe run Kanpur Ki Kahaani (${CANONICAL_SITE_URL}), a free, independent guide to Kanpur's history, food, festivals and the cities around it.\n\n` +
      `Ahead of the coming festival season, a few things your readers may find useful, all free to quote with a link:\n` +
      `• Kanpur's festival calendar, including Ganga Mela and its 1942 freedom-struggle story: ${U("/celebrations")}\n` +
      `• Distances, drive and train times from Kanpur to 5 nearby cities (CSV included, CC BY 4.0): ${U("/guides/distances-from-kanpur")}\n` +
      `• A timeline of Kanpur from Jajmau to the mill era: ${U("/culture-history")}\n\n` +
      `Our press kit (descriptions, logo, photos credits): ${PRESS}\nHappy to give quotes or local context for any Kanpur story.` + SIGN,
    messageHi:
      `नमस्ते ${name} टीम,\n\nहम "कानपुर की कहानी" (${CANONICAL_SITE_URL}) चलाते हैं — कानपुर के इतिहास, खान-पान, त्योहारों और आसपास के शहरों की एक मुफ़्त, स्वतंत्र गाइड।\n\n` +
      `त्योहारों के मौसम से पहले, ये पेज आपके पाठकों के काम आ सकते हैं (लिंक के साथ उद्धृत करने के लिए स्वतंत्र):\n` +
      `• कानपुर के त्योहार, गंगा मेला और 1942 की उसकी कहानी सहित: ${U("/celebrations")}\n` +
      `• कानपुर से 5 शहरों की दूरी, सड़क और ट्रेन का समय (CSV सहित): ${U("/guides/distances-from-kanpur")}\n` +
      `• जाजमऊ से मिलों के दौर तक कानपुर का इतिहास: ${U("/culture-history")}\n\n` +
      `प्रेस किट: ${PRESS}\nकिसी भी कानपुर स्टोरी के लिए हम स्थानीय जानकारी या कोट देने को तैयार हैं।\n\nधन्यवाद,\n[आपका नाम]\nकानपुर की कहानी`,
  };
}

function collegeTarget(name: string, website: string): Target {
  return {
    category: "Colleges",
    name,
    website,
    why: "Featured on our Campus page; .ac.in links carry high trust. Ask for a listing on a student-resources, alumni or club page.",
    linkTo: U("/campus"),
    subject: `${name} is featured on Kanpur Ki Kahaani's student guide`,
    message:
      `Hello,\n\n${name} is featured on our free student guide to Kanpur: ${U("/campus")}. It covers campuses, student areas, getting around and live city weather and events, aimed at students moving to Kanpur.\n\n` +
      `If it would help your incoming students, we'd be grateful if you could add it to a student-resources, hostel, alumni or club page. ` +
      `A "Featured on Kanpur Ki Kahaani" badge and short descriptions are at ${PRESS}#badges-title.\n\nIf anything about ${name} on our page needs correcting, just reply and we'll fix it.` + SIGN,
  };
}

function placeTarget(name: string, area: string, section: string, path: string): Target {
  return {
    category: "Featured places",
    name,
    website: "",
    why: `Featured in ${section}. Featured places link back more often than anyone else (website, Instagram bio link, Google Business Profile "website" or posts).`,
    linkTo: U(path),
    subject: `${name} is featured on Kanpur Ki Kahaani`,
    message:
      `Hello,\n\n${name} (${area}) is featured in our guide to Kanpur: ${U(path)}.\n\n` +
      `If you have a website or social page, you're welcome to add our "Featured on Kanpur Ki Kahaani" badge, or simply share the link. The badge code is here: ${PRESS}#badges-title\n\n` +
      `If anything about ${name} on our page is out of date, reply and we'll correct it.` + SIGN,
    messageHi:
      `नमस्ते,\n\n${name} (${area}) को हमारी कानपुर गाइड में शामिल किया गया है: ${U(path)}\n\n` +
      `अगर आपकी वेबसाइट या सोशल पेज है, तो आप हमारा "Featured on Kanpur Ki Kahaani" बैज लगा सकते हैं या यह लिंक शेयर कर सकते हैं। बैज कोड: ${PRESS}#badges-title\n\n` +
      `अगर हमारे पेज पर कोई जानकारी पुरानी है, तो बताइए, हम सुधार देंगे।\n\nधन्यवाद,\n[आपका नाम]\nकानपुर की कहानी`,
  };
}

const PROFILE_DESC =
  "Kanpur Ki Kahaani tells the stories of Kanpur, India: its history, heritage, food and festivals, plus local news, events, live weather, blogs and nearby trips.";

function profile(name: string, how: string): Target {
  return {
    category: "Profiles & directories",
    name,
    website: "",
    why: how,
    linkTo: CANONICAL_SITE_URL,
    subject: "(profile, no email)",
    message: `Name: Kanpur Ki Kahaani\nWebsite: ${CANONICAL_SITE_URL}\nCategory: Travel / local guide\nCity: Kanpur, Uttar Pradesh, India\n\nShort description:\n${PROFILE_DESC}\n\nLogo and longer descriptions: ${PRESS}`,
    needsAccount: true,
  };
}

const community = (name: string, how: string, linkTo: string): Target => ({
  category: "Communities",
  name,
  website: "",
  why: how,
  linkTo,
  subject: "(answer, no email)",
  message: `Answer the question fully in your own words first. Then, only if it genuinely adds something, add one line such as:\n"We keep a free table of distances and train times from Kanpur here: ${U("/guides/distances-from-kanpur")}"\n\nNever post the same link in several threads, and follow each community's self-promotion rules.`,
  needsAccount: true,
});

export function buildTargets(): Target[] {
  const t: Target[] = [];

  // Press: newspapers we already list (official homepages from our verified news directory).
  for (const d of directoryCandidates) t.push(pressTarget(d.name, d.url, !d.group.startsWith("national")));

  // Colleges on the Campus page (official sites only where our data has them).
  for (const i of institutions) t.push(collegeTarget(i.name, i.url ?? ""));

  // Real places and businesses we feature (never sample listings).
  for (const p of kanpurPlaces) t.push(placeTarget(p.name, p.area, "Tourism: places to visit", "/tourism"));
  for (const f of food.filter((x) => x.city === "kanpur" && !x.sample)) t.push(placeTarget(f.name, f.area, "Food & Night Life", "/food-nightlife"));
  for (const s of shopping.filter((x) => x.city === "kanpur")) t.push(placeTarget(s.name, s.area, "Shopping Streets (market associations / big stores)", "/shopping"));
  t.push(placeTarget("Kanpur Bengali Club", "Kanpur", "the Navaratri guide", "/blogs/navaratri-in-kanpur"));

  // Profiles and directories (each needs an account: the team creates them).
  t.push(profile("Google Business Profile", "Shows in Google Maps and search for our name; the website field is a link Google trusts."));
  t.push(profile("Bing Places for Business", "Same as Google Business Profile, for Bing and partners."));
  t.push(profile("IndiBlogger", "Indian blog directory; submit the RSS feed " + U("/rss.xml") + "."));
  t.push(profile("Tripoto", "Indian travel community: post a trip story (e.g. a weekend from Kanpur) linking to the matching guide."));
  t.push(profile("LinkedIn company page", "Company page with website field; share every new story."));
  t.push(profile("Pinterest business account", "Pin every blog cover and guide; each pin links to the page."));
  t.push(profile("Quora Space: Kanpur travel", "A Space of our own, sharing guides; profile link to the site."));
  t.push(profile("Dev.to, Hashnode, Blogger, WordPress.com, Tumblr", "Already built: add the keys in admin → Syndication; every copy links back with a canonical link."));
  t.push(profile("Medium", "Use Medium's “Import a story” with each post URL so it keeps the canonical link."));
  t.push(profile("Wikimedia Commons", "Upload the team's OWN photos of Kanpur under a free licence, crediting Kanpur Ki Kahaani; never upload photos we don't own."));

  // Communities: answer real questions only.
  t.push(community("Reddit (Kanpur and India travel communities)", "Search for Kanpur trip and weekend questions; answer, and link only when a guide answers it.", U("/guides/distances-from-kanpur")));
  t.push(community("Quora (Kanpur questions)", "Questions like “Best places to visit near Kanpur?” get long-term traffic.", U("/nearby")));
  t.push(community("Wikipedia (Kanpur articles)", "Only cite our page where it is the best available source for a fact, and follow Wikipedia's conflict-of-interest rules (disclose, or suggest on the Talk page).", U("/culture-history")));

  return t;
}

// ---------- output ----------
const cell = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function main() {
  const targets = buildTargets();
  mkdirSync("reports/outreach", { recursive: true });

  const head = ["Category", "Name", "Website", "Contact (fill in)", "Why they would link", "Our page to link", "Subject", "Message (English)", "Message (Hindi)", "Needs our account", "Status", "Date sent", "Link earned (URL)"];
  const rows = targets.map((x) => [x.category, x.name, x.website, "", x.why, x.linkTo, x.subject, x.message, x.messageHi ?? "", x.needsAccount ? "Y" : "", "Not started", "", ""]);
  writeFileSync("reports/outreach/targets.csv", [head, ...rows].map((l) => l.map(cell).join(",")).join("\n") + "\n");

  const cats = [...new Set(targets.map((x) => x.category))];
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Outreach kit — Kanpur Ki Kahaani</title>
<style>
:root{--maroon:#8e2b1e;--ink:#1c1412;--muted:#6b5d57;--bg:#fcf8f4;--alt:#f5eee7;--border:#e8dccf;--ok:#2f6b3a}
*{box-sizing:border-box}body{font:14px/1.5 system-ui,sans-serif;color:var(--ink);background:var(--bg);margin:0;padding:16px;max-width:1100px;margin-inline:auto}
h1{color:var(--maroon);margin:0 0 4px}.sum{color:var(--muted);margin:0 0 12px}
.plan{background:#fff;border:1px solid var(--border);border-radius:12px;padding:12px 16px;margin-bottom:14px}.plan li{margin:3px 0}
.bar{position:sticky;top:0;background:var(--bg);padding:8px 0;display:flex;gap:8px;flex-wrap:wrap;z-index:2;align-items:center}
input[type=search],select{padding:8px 10px;border:1px solid var(--border);border-radius:8px;font:inherit;min-width:0}
h2{margin:22px 0 8px;font-size:17px;color:var(--maroon)}
.card{background:#fff;border:1px solid var(--border);border-radius:12px;padding:12px 14px;margin-bottom:10px}
.card.done{opacity:.55}.card h3{margin:0;font-size:15px;display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.tag{font-size:11px;background:var(--alt);border-radius:99px;padding:2px 8px;color:var(--muted)}
.muted{color:var(--muted);font-size:13px;margin:4px 0}a{color:var(--maroon);word-break:break-all}
details{margin-top:6px}summary{cursor:pointer;color:var(--maroon);font-weight:600}
pre{white-space:pre-wrap;background:var(--alt);border-radius:8px;padding:10px;font:13px/1.5 system-ui,sans-serif;margin:6px 0}
button{font:inherit;font-size:13px;border:1px solid var(--maroon);color:var(--maroon);background:#fff;border-radius:99px;padding:5px 12px;cursor:pointer;min-height:36px}
button:hover{background:var(--maroon);color:#fff}.row{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:6px}
select.st{min-height:36px}
</style></head><body>
<h1>Outreach kit</h1>
<p class="sum">${targets.length} targets · generated ${new Date().toISOString().slice(0, 10)} from the site's own data (npm run outreach:kit). Messages are filled in: replace [Your name] and send from the team's own email or account. Status is saved in this browser only; record earned links in the team sheet (targets.csv).</p>
<div class="plan"><strong>Weekly routine (about 2 hours)</strong><ol>
<li>Send 5–10 messages: 2 featured places, 1–2 colleges, 1 city news desk (more before Holi / Ganga Mela, Navaratri–Durga Puja, Dev Deepawali).</li>
<li>Set up 1–2 profiles until the list is done (Google Business Profile first).</li>
<li>Answer 2–3 genuine Reddit/Quora questions; link only when our guide answers it.</li>
<li>Publish a story and cross-post it from admin → Syndication.</li>
<li>Monthly: check Moz Link Explorer and Search Console → Links; note new linking sites in the sheet.</li></ol></div>
<div class="bar"><input id="q" type="search" placeholder="Filter by name…" aria-label="Filter by name"><select id="c" aria-label="Category"><option value="">All categories</option>${cats.map((c) => `<option>${esc(c)}</option>`).join("")}</select><select id="s" aria-label="Status filter"><option value="">Any status</option><option>Not started</option><option>Sent</option><option>Replied</option><option>Link earned</option><option>No / skip</option></select><span id="n" class="muted"></span></div>
${cats
  .map(
    (c) => `<section data-cat="${esc(c)}"><h2>${esc(c)}</h2>${targets
      .filter((x) => x.category === c)
      .map((x, i) => {
        const id = `${c}-${i}-${x.name}`.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        return `<article class="card" data-id="${id}" data-name="${esc(x.name.toLowerCase())}"><h3>${esc(x.name)}${x.needsAccount ? ' <span class="tag">needs our account</span>' : ""}</h3>
<p class="muted">${esc(x.why)}</p>
${x.website ? `<p class="muted">Website: <a href="${esc(x.website)}" target="_blank" rel="noopener noreferrer">${esc(x.website)}</a> (find the contact or editor email there)</p>` : ""}
<p class="muted">Point them to: ${x.linkTo.split(" · ").map((l) => `<a href="${esc(l)}" target="_blank" rel="noopener noreferrer">${esc(l.replace(CANONICAL_SITE_URL, "") || "/")}</a>`).join(" · ")}</p>
<details><summary>Message${x.subject.startsWith("(") ? "" : `: “${esc(x.subject)}”`}</summary><pre>${esc(x.message)}</pre>${x.messageHi ? `<pre lang="hi">${esc(x.messageHi)}</pre>` : ""}</details>
<div class="row">${x.subject.startsWith("(") ? "" : `<button data-copy="${esc(x.subject)}">Copy subject</button>`}<button data-copy="${esc(x.message)}">Copy message</button>${x.messageHi ? `<button data-copy="${esc(x.messageHi)}">हिंदी कॉपी करें</button>` : ""}
<select class="st" aria-label="Status for ${esc(x.name)}"><option>Not started</option><option>Sent</option><option>Replied</option><option>Link earned</option><option>No / skip</option></select></div></article>`;
      })
      .join("\n")}</section>`,
  )
  .join("\n")}
<script>
const KEY="kkk-outreach-status";let st={};try{st=JSON.parse(localStorage.getItem(KEY)||"{}")}catch{}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(st))}catch{}};
document.querySelectorAll(".card").forEach(c=>{const s=c.querySelector(".st");if(st[c.dataset.id])s.value=st[c.dataset.id];c.classList.toggle("done",s.value==="Link earned"||s.value==="No / skip");
s.addEventListener("change",()=>{st[c.dataset.id]=s.value;save();c.classList.toggle("done",s.value==="Link earned"||s.value==="No / skip");f()})});
document.querySelectorAll("[data-copy]").forEach(b=>b.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(b.dataset.copy);const t=b.textContent;b.textContent="Copied ✓";setTimeout(()=>b.textContent=t,1200)}catch{}}));
const q=document.getElementById("q"),c=document.getElementById("c"),s=document.getElementById("s"),n=document.getElementById("n");
function f(){const v=q.value.toLowerCase();let k=0;document.querySelectorAll("section[data-cat]").forEach(sec=>{let any=false;sec.querySelectorAll(".card").forEach(card=>{const ok=(!v||card.dataset.name.includes(v))&&(!c.value||sec.dataset.cat===c.value)&&(!s.value||card.querySelector(".st").value===s.value);card.hidden=!ok;if(ok){any=true;k++}});sec.hidden=!any});n.textContent=k+" shown"}
[q,c,s].forEach(e=>e.addEventListener("input",f));f();
</script></body></html>`;
  writeFileSync("reports/outreach/outreach-kit.html", html);
  const by = cats.map((c) => `${c} ${targets.filter((x) => x.category === c).length}`).join(" · ");
  console.log(`outreach kit: ${targets.length} targets (${by}) → reports/outreach/`);
}

main();
