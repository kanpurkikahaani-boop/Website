import { notFound } from "next/navigation";
import { ogPages } from "@/data/og-pages";
import { renderOg } from "@/lib/og";

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(ogPages).map((slug) => ({ slug }));
}

export async function GET(_req: Request, ctx: RouteContext<"/og/[slug]">) {
  const { slug } = await ctx.params;
  const page = ogPages[slug];
  if (!page) notFound();
  return renderOg(page);
}
