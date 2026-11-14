import { mergeAttributes, Node } from "@tiptap/core";

/** Crop box in the original image's pixels (Cropper.js `getData()` shape, rounded). */
export interface CropBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type FigureAlign = "left" | "center" | "right";

export interface FigureAttrs {
  /** The cropped file shown to readers. */
  src: string;
  alt: string;
  /** Width as a % of the text column (25–100). */
  width: number;
  align: FigureAlign;
  /** The uncropped upload, so the crop can be changed later. Never shown to readers. */
  originalSrc: string | null;
  crop: CropBox | null;
  naturalWidth: number | null;
  naturalHeight: number | null;
}

export const clampWidth = (w: unknown) => {
  const n = Math.round(Number(w));
  return Number.isFinite(n) ? Math.min(100, Math.max(20, n)) : 100;
};
const asAlign = (a: unknown): FigureAlign => (a === "left" || a === "right" ? a : "center");

/** Classes + inline width shared by the server HTML and the editor's node view. */
export function figureLayout(attrs: Pick<FigureAttrs, "width" | "align">) {
  const width = clampWidth(attrs.width);
  const sized = width < 100;
  return {
    className: `kkk-figure align-${asAlign(attrs.align)}${sized ? " is-sized" : ""}`,
    style: sized ? `width: ${width}%` : undefined,
    width,
  };
}

const num = (v: string | null) => (v && /^\d+$/.test(v) ? Number(v) : null);

/**
 * Block image with an editable caption (v10): <figure><img><figcaption>…</figcaption></figure>.
 * The caption is real text inside the node, so it can be edited in place after inserting.
 * Width / alignment render as a class + `width: N%`; the original upload and crop box are kept in
 * the document (data-* attributes, which the sanitizer drops from the published HTML) so the
 * image can be re-cropped later. Readers only ever load `src`, the cropped file.
 */
export const FigureImage = Node.create({
  name: "figureImage",
  group: "block",
  content: "inline*",
  marks: "bold italic link",
  draggable: true,
  isolating: true,
  defining: true,

  addAttributes() {
    return {
      src: { default: "" },
      alt: { default: "" },
      width: { default: 100 },
      align: { default: "center" },
      originalSrc: { default: null },
      crop: { default: null },
      naturalWidth: { default: null },
      naturalHeight: { default: null },
    };
  },

  parseHTML() {
    return [
      {
        tag: "figure[data-kkk-image]",
        contentElement: "figcaption",
        getAttrs: (el: HTMLElement) => {
          const img = el.querySelector("img");
          if (!img?.getAttribute("src")) return false;
          let crop: CropBox | null = null;
          try {
            crop = el.dataset.crop ? (JSON.parse(el.dataset.crop) as CropBox) : null;
          } catch {
            crop = null;
          }
          return {
            src: img.getAttribute("src"),
            alt: img.getAttribute("alt") ?? "",
            width: clampWidth(el.dataset.width ?? 100),
            align: asAlign(el.dataset.align),
            originalSrc: el.dataset.originalSrc ?? null,
            crop,
            naturalWidth: num(img.getAttribute("width")),
            naturalHeight: num(img.getAttribute("height")),
          };
        },
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const a = node.attrs as FigureAttrs;
    const { className, style, width } = figureLayout(a);
    const figure = mergeAttributes(
      { class: className, "data-kkk-image": "", "data-width": String(width), "data-align": asAlign(a.align) },
      style ? { style } : {},
      a.originalSrc ? { "data-original-src": a.originalSrc } : {},
      a.crop ? { "data-crop": JSON.stringify(a.crop) } : {},
      // Keep attributes other extensions may add, minus ours (rendered above).
      Object.fromEntries(Object.entries(HTMLAttributes).filter(([k]) => !(k in a))),
    );
    const img: Record<string, string> = { src: a.src, alt: a.alt ?? "", loading: "lazy" };
    if (a.naturalWidth && a.naturalHeight) Object.assign(img, { width: String(a.naturalWidth), height: String(a.naturalHeight) });
    return ["figure", figure, ["img", img], ["figcaption", { class: "kkk-caption" }, 0]];
  },
});
