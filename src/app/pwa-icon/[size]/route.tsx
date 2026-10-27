import { notFound } from "next/navigation";
import { renderIcon } from "@/lib/og";

export const dynamicParams = false;

export function generateStaticParams() {
  return [{ size: "192" }, { size: "512" }];
}

export async function GET(_req: Request, ctx: RouteContext<"/pwa-icon/[size]">) {
  const { size } = await ctx.params;
  if (size !== "192" && size !== "512") notFound();
  return renderIcon(Number(size));
}
