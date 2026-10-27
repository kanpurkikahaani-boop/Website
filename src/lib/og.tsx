import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { hasLogo } from "@/lib/assets";

export const ogSize = { width: 1200, height: 630 };

async function logoDataUrl() {
  if (!hasLogo) return null;
  try {
    const buf = await readFile(join(process.cwd(), "public", "brand", "logo.png"));
    return `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

function Badge({ src, size }: { src: string | null; size: number }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} width={size} height={size} style={{ borderRadius: size }} alt="" />;
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size,
        background: "#E8736B",
        border: `${Math.max(2, size / 40)}px solid #F6DFB5`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#FDF3E7",
        fontSize: size * 0.3,
        fontFamily: "Playfair",
        fontWeight: 700,
        letterSpacing: size * 0.01,
      }}
    >
      KKK
    </div>
  );
}

/** Square icon (favicon / apple-touch / PWA). */
export async function renderIcon(size: number) {
  const src = await logoDataUrl();
  const fonts = src ? [] : [await playfair()];
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "transparent" }}>
        <Badge src={src} size={size} />
      </div>
    ),
    { width: size, height: size, fonts },
  );
}

async function playfair() {
  return {
    name: "Playfair",
    data: await readFile(join(process.cwd(), "src/assets/fonts/PlayfairDisplay-Bold.ttf")),
    weight: 700 as const,
    style: "normal" as const,
  };
}

async function jakarta() {
  return {
    name: "Jakarta",
    data: await readFile(join(process.cwd(), "src/assets/fonts/PlusJakartaSans-Medium.ttf")),
    weight: 500 as const,
    style: "normal" as const,
  };
}

/** Dynamic Open Graph card: dark background, logo on the left, title in Playfair. */
export async function renderOg({ title, eyebrow }: { title: string; eyebrow?: string }) {
  const src = await logoDataUrl();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          background: "#1C1412",
          backgroundImage:
            "radial-gradient(circle at 88% 8%, rgba(200,144,46,0.35), transparent 42%), radial-gradient(circle at 10% 100%, rgba(142,43,30,0.45), transparent 45%)",
          padding: "0 80px",
          gap: 64,
        }}
      >
        <Badge src={src} size={260} />
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ fontFamily: "Jakarta", color: "#C8902E", fontSize: 24, letterSpacing: 6, textTransform: "uppercase" }}>
            {eyebrow ?? "Kanpur Ki Kahaani"}
          </div>
          <div
            style={{
              fontFamily: "Playfair",
              color: "#FFFFFF",
              fontSize: title.length > 48 ? 58 : 70,
              lineHeight: 1.1,
              marginTop: 18,
            }}
          >
            {title}
          </div>
          <div style={{ fontFamily: "Jakarta", color: "rgba(246,233,217,0.75)", fontSize: 26, marginTop: 26 }}>
            The Stories of the Manchester of the East
          </div>
        </div>
      </div>
    ),
    { ...ogSize, fonts: [await playfair(), await jakarta()] },
  );
}
