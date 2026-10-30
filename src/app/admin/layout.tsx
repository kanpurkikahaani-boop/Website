import type { Metadata } from "next";

// Admin pages depend on the visitor's session: always render per request, never cache.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin | Kanpur Ki Kahaani" },
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return <div className="bg-bg-alt">{children}</div>;
}
