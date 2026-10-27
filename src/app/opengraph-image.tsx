import { renderOg, ogSize } from "@/lib/og";

export const alt = "Kanpur Ki Kahaani — The Stories of the Manchester of the East";
export const size = ogSize;
export const contentType = "image/png";

export default function OpengraphImage() {
  return renderOg({ title: "Kanpur Ki Kahaani", eyebrow: "Kanpur · Uttar Pradesh · India" });
}
