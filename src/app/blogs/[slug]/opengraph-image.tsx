import { cityName } from "@/lib/city-names";
import { renderOg, ogSize } from "@/lib/og";
import { getPostBySlug } from "@/lib/posts";

export const size = ogSize;
export const contentType = "image/png";
export const alt = "Kanpur Ki Kahaani story";
export const revalidate = 300;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  const place = cityName(post?.city);
  return renderOg({ title: post?.title ?? "Kanpur Ki Kahaani", eyebrow: `Stories${place ? ` · ${place}` : ""}` });
}
