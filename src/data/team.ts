import { socials, type SocialPlatform } from "./site";

/**
 * The people behind Kanpur Ki Kahaani (shown on /team). Bios are the team's own words.
 * Links point to OUR brand channels relevant to each role (from site.ts), never invented
 * personal profiles. Add personal profiles later via `personal` — rendered only when filled.
 */
export type TeamLink =
  | { kind: "social"; platform: SocialPlatform }
  | { kind: "text"; label: string; href: string };

export interface TeamMember {
  slug: string;
  name: string;
  role: string;
  photo: string;
  /** CSS object-position that puts the face at the same height in every 4:5 frame. */
  focal: string;
  /** CSS crop-zoom (≥1) toward `focal`, so small or distant faces match the others. Plain cropping, no editing. */
  zoom?: number;
  /** Low-resolution source: never shown wider than this (px), to avoid a blurry upscale. */
  maxPhotoWidth?: number;
  bio: string;
  links: TeamLink[];
  personal?: { linkedin?: string; instagram?: string };
}

export const team: TeamMember[] = [
  {
    slug: "monisha-ms",
    name: "Monisha MS",
    role: "Blog Editor",
    photo: "/images/team/monisha-ms.jpg",
    focal: "50% 18%",
    maxPhotoWidth: 260,
    bio: "As a blog writer for Kanpur Ki Kahaani, I explore and document the city's culture, heritage, lifestyle, and changing landscape. I aim to bring Kanpur's stories to life, highlighting its people, places, traditions, and experiences while offering readers a fresh perspective on the city.",
    links: [{ kind: "text", label: "Read our blogs", href: "/blogs" }],
  },
  {
    slug: "chinmayi-srinivasan",
    name: "Chinmayi Srinivasan",
    role: "Web Designer",
    photo: "/images/team/chinmayi-srinivasan.jpg",
    focal: "50% 18%",
    bio: "Responsible for co-designing and developing the team website, including site structure, navigation, visual layout, content placement, and user experience.",
    links: [],
  },
  {
    slug: "piyusha-taunk",
    name: "Piyusha Taunk",
    role: "Content Strategist",
    photo: "/images/team/piyusha-taunk.jpg",
    focal: "50% 30%",
    bio: "I plan and develop content ideas, identify trends, create engaging content strategies, and ensure posts align with the brand's identity and target audience to improve reach and engagement.",
    links: [],
  },
  {
    slug: "rakshaa-mukesh",
    name: "Rakshaa Mukesh",
    role: "Reddit & Medium Lead",
    photo: "/images/team/rakshaa-mukesh.jpg",
    // Landscape original: height fills the frame; the zoom anchor (y 57%) lifts her eyes to the
    // same height as everyone else's.
    focal: "55% 57%",
    zoom: 1.55,
    bio: "Responsible for leading Kanpur's digital presence on Reddit and Medium, creating engaging content and discussions to build awareness and interest in the city. Focused on leveraging these platforms to showcase Kanpur's culture, attractions, and unique identity to a wider audience.",
    links: [
      { kind: "social", platform: "reddit" },
      { kind: "social", platform: "medium" },
      { kind: "text", label: "Read her stories", href: "/blogs/author/rakshaa-mukesh" },
    ],
  },
  {
    slug: "lakshmi-gayathri",
    name: "Lakshmi Gayathri",
    role: "Instagram & Facebook Lead",
    photo: "/images/team/lakshmi-gayathri.jpg",
    focal: "47% 24%",
    zoom: 1.5,
    bio: "I manage our social media presence, plan engaging content, oversee posting schedules, and develop creative strategies to connect with our audience and showcase our stories.",
    links: [
      { kind: "social", platform: "instagram" },
      { kind: "social", platform: "facebook" },
    ],
  },
  {
    slug: "aksheet-dhanvijay",
    name: "Aksheet Dhanvijay",
    role: "Outreach Lead",
    photo: "/images/team/aksheet-dhanvijay.jpg",
    focal: "50% 20%",
    bio: "Responsible for connecting with influencers and creators to secure collaborations and reposts with appropriate credit, while coordinating with volunteers to participate in reels and promotional content.",
    links: [],
  },
  {
    slug: "kallu-hasika-reddy",
    name: "Kallu Hasika Reddy",
    role: "SEO & Promotions Lead",
    photo: "/images/team/kallu-hasika-reddy.jpg",
    focal: "47% 34%",
    zoom: 1.2,
    bio: "Responsible for improving website visibility through SEO, driving Instagram follower growth, and managing on-ground promotional activities to enhance page awareness.",
    links: [{ kind: "social", platform: "instagram" }],
  },
];

export const socialUrl = (p: SocialPlatform) => socials.find((s) => s.platform === p)!.url;
export const socialLabel = (p: SocialPlatform) => socials.find((s) => s.platform === p)!.label;
export const portraitAlt = (m: TeamMember) => `Portrait of ${m.name}, ${m.role} at Kanpur Ki Kahaani`;
