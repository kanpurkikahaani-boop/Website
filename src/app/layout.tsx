import type { Metadata, Viewport } from "next";
import { Noto_Serif_Devanagari, Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Logo } from "@/components/layout/Logo";
import { SkipLink } from "@/components/layout/SkipLink";
import { TopBar } from "@/components/layout/TopBar";
import { MobilePlanFab } from "@/components/layout/MobilePlanFab";
import { Analytics } from "@/components/seo/Analytics";
import { site } from "@/data/site";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const notoDeva = Noto_Serif_Devanagari({
  variable: "--font-noto-deva",
  subsets: ["devanagari"],
  weight: ["500", "600"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — Things to Do in Kanpur & Weekend Trips Nearby`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.name }],
  keywords: [
    "Kanpur tourism",
    "things to do in Kanpur",
    "places to visit in Kanpur",
    "Kanpur street food",
    "weekend trips from Kanpur",
    "Uttar Pradesh travel guide",
  ],
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#1C1412",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN" className={`${playfair.variable} ${jakarta.variable} ${notoDeva.variable}`}>
      <body className="flex min-h-screen flex-col">
        <SkipLink />
        <TopBar />
        <Navbar logo={<Logo />} />
        <main id="main" tabIndex={-1} className="flex-1 outline-none">
          {children}
        </main>
        <Footer />
        <MobilePlanFab />
        <Analytics />
      </body>
    </html>
  );
}
