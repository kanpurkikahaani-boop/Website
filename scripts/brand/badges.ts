/**
 * npm run brand:badges — "Featured on Kanpur Ki Kahaani" badges for other sites to link with
 * (v11). Writes public/badges/featured-{light,dark}.{svg,png}. The logo is embedded (small PNG,
 * base64) so the SVG works when hot-linked or downloaded. Only resizing, no image generation.
 */
import { writeFileSync } from "node:fs";
import sharp from "sharp";

async function main() {
  const logo = await sharp("public/brand/logo.png").resize(88, 88).png({ compressionLevel: 9 }).toBuffer();
  const href = `data:image/png;base64,${logo.toString("base64")}`;
  const themes = {
    light: { bg: "#FFFFFF", border: "#8E2B1E", eyebrow: "#855A14", text: "#8E2B1E" },
    dark: { bg: "#1C1412", border: "#C8902E", eyebrow: "#E3B25C", text: "#FBF4EA" },
  };
  for (const [name, t] of Object.entries(themes)) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="240" height="64" viewBox="0 0 240 64" role="img" aria-label="Featured on Kanpur Ki Kahaani">
  <title>Featured on Kanpur Ki Kahaani</title>
  <rect x="1" y="1" width="238" height="62" rx="12" fill="${t.bg}" stroke="${t.border}" stroke-width="2"/>
  <image x="10" y="10" width="44" height="44" href="${href}" xlink:href="${href}"/>
  <text x="64" y="27" font-family="Helvetica, Arial, sans-serif" font-size="10" font-weight="700" letter-spacing="1.6" fill="${t.eyebrow}">FEATURED ON</text>
  <text x="64" y="47" font-family="Georgia, 'Times New Roman', serif" font-size="18" font-weight="700" fill="${t.text}">Kanpur Ki Kahaani</text>
</svg>
`;
    writeFileSync(`public/badges/featured-${name}.svg`, svg);
    await sharp(Buffer.from(svg), { density: 192 }).png().toFile(`public/badges/featured-${name}.png`);
    console.log(`✓ public/badges/featured-${name}.svg / .png`);
  }
}
main();
