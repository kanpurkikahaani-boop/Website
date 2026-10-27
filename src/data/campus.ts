import type { Institution } from "./types";

export const institutions: Institution[] = [
  { slug: "iit-kanpur", area: "Kalyanpur", name: "IIT Kanpur", description: "Founded in 1959, one of India's premier engineering and research institutes, with a sprawling green campus and its own airstrip.", programmes: ["B.Tech", "M.Tech", "PhD", "MBA"], url: "https://www.iitk.ac.in" },
  { slug: "hbtu", area: "Nawabganj", name: "Harcourt Butler Technical University", description: "Established in 1921, renowned for chemical, oil and food technology — one of the oldest technical schools in north India.", programmes: ["B.Tech", "M.Tech", "MCA"], url: "https://hbtu.ac.in" },
  { slug: "gsvm", area: "Swaroop Nagar", name: "GSVM Medical College", description: "Ganesh Shankar Vidyarthi Memorial Medical College, a leading government medical college attached to LLR (Hallett) Hospital.", programmes: ["MBBS", "MD/MS", "Nursing"] },
  { slug: "csjmu", area: "Kalyanpur", name: "Chhatrapati Shahu Ji Maharaj University", description: "The state university affiliating hundreds of colleges, with a busy campus offering arts, science, law and management.", programmes: ["BA/BSc", "LLB", "MBA", "B.Pharm"], url: "https://csjmu.ac.in" },
  { slug: "christ-church-college", area: "Mall Road", name: "Christ Church College", description: "Founded in 1866, one of the oldest colleges in the region, known for its historic campus and strong humanities faculty.", programmes: ["BA", "BSc", "BCom"] },
  { slug: "dav-college", area: "Civil Lines", name: "DAV College", description: "A long-established postgraduate college with large arts, commerce and law departments and a lively student culture.", programmes: ["BA", "BCom", "LLB", "MA"] },
];

export const studentTips = [
  { title: "Getting around", body: "The Kanpur Metro and shared e-rickshaws cover most routes cheaply; a monthly metro smart card saves money. For IIT and Kalyanpur, campus autos run from the main gate." },
  { title: "Budget food", body: "Kakadeo and Swaroop Nagar are the student kitchens of Kanpur: ₹60 thalis, kulhad chai, bun-maska and late-night maggi points within a few lanes." },
  { title: "Study spots", body: "Try the CSJMU central library, the quiet corners of Tilak Nagar's cafés, or the early-morning lawns at Phool Bagh before the city wakes." },
  { title: "Weekend plans", body: "Sunrise at Bithoor ghats (an hour's ride), a Green Park match day, or a day trip to Lucknow for kebabs and the Bara Imambara — back by night on an intercity train." },
];
