/** "My Photo (1).JPG" → "my-photo-1" */
export function sanitizeName(name: string) {
  return (
    name
      .replace(/\.[^.]*$/, "")
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "image"
  );
}
