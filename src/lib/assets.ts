import manifest from "@/generated/assets.json";

const available = new Set<string>(manifest.images);

/** True once `public/brand/logo.png` exists (re-scanned on every dev/build). */
export const hasLogo: boolean = manifest.hasLogo;

/** True if the image file is present in /public. */
export function imageExists(src: string): boolean {
  return available.has(src);
}
