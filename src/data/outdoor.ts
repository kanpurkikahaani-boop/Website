import type { ImagePath } from "./types";

export interface OutdoorSpot {
  slug: string;
  type: string;
  name: string;
  description: string;
  area: string;
  image: ImagePath;
  alt: string;
}

export const outdoor: OutdoorSpot[] = [
  { slug: "green-park-stadium", type: "Cricket stadium", name: "Green Park Stadium", description: "One of India's oldest Test venues, home to roaring crowds since the 1950s — catch a match day if you can.", area: "Civil Lines", image: "/images/kanpur/green-park-stadium.jpg", alt: "Floodlit cricket ground at Green Park Stadium, Kanpur" },
  { slug: "allen-forest-zoo", type: "Forest zoo", name: "Allen Forest Zoo", description: "Long woodland walks among tigers, rhinos and deer, with a boating lake in the middle.", area: "Nawabganj", image: "/images/kanpur/allen-forest-zoo.jpg", alt: "Forest walking trail inside Allen Forest Zoo" },
  { slug: "moti-jheel-promenade", type: "Lake promenade", name: "Moti Jheel Promenade", description: "Kanpur's favourite jogging loop at dawn and family hangout by dusk, ringed by lawns and food stalls.", area: "Benajhabar", image: "/images/kanpur/moti-jheel.jpg", alt: "Lakeside walking path at Moti Jheel" },
  { slug: "bithoor-boating", type: "Riverfront & boating", name: "Bithoor Riverfront", description: "Row out on the Ganga from the ghats of Bithoor — magical at sunrise, peaceful at any hour.", area: "Bithoor", image: "/images/kanpur/bithoor-boating.jpg", alt: "Rowing boats on the Ganga at Bithoor" },
  { slug: "nana-rao-park", type: "Urban park", name: "Nana Rao Park", description: "Wide lawns, old trees and walking tracks in the heart of the city, with a toy train for kids.", area: "Phool Bagh", image: "/images/kanpur/nana-rao-park.jpg", alt: "Green lawns and trees in Nana Rao Park" },
  { slug: "multi-sport-arena", type: "Multi-sport arena", name: "Kamla Club Sports Grounds", description: "Tennis, swimming and squash in a historic members' club setting — day passes for guests on request.", area: "Civil Lines", image: "/images/kanpur/sports-arena.jpg", alt: "Outdoor tennis courts at a sports club" }, // VERIFY guest access
];
