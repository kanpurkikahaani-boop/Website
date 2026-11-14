import StarterKit from "@tiptap/starter-kit";
import Heading from "@tiptap/extension-heading";
import Image from "@tiptap/extension-image";
import { FontFamily, FontSize, TextStyle } from "@tiptap/extension-text-style";
import Youtube from "@tiptap/extension-youtube";
import { FigureImage } from "./figure";

/** Headings keep an `id` so the article's table of contents can link to them. */
const HeadingWithId = Heading.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      id: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute("id"),
        renderHTML: (attrs: { id?: string | null }) => (attrs.id ? { id: attrs.id } : {}),
      },
    };
  },
}).configure({ levels: [2, 3, 4] });

/**
 * The Tiptap schema shared by the admin editor and server-side HTML rendering.
 * StarterKit (v3) already includes Link and Underline. Internal links open in the same tab;
 * the sanitizer adds target/rel for external ones.
 */
export const blogExtensions = [
  StarterKit.configure({
    heading: false,
    link: {
      openOnClick: false,
      autolink: true,
      protocols: ["http", "https", "mailto"],
      HTMLAttributes: { target: null, rel: null },
    },
  }),
  HeadingWithId,
  // Older posts: a plain image whose `title` doubles as the caption (enrich.ts makes it a figure).
  Image.configure({ HTMLAttributes: { loading: "lazy" } }),
  // New images (v10): figure with editable caption, width, alignment and re-croppable source.
  FigureImage,
  // Fonts and sizes (v10): <span style="font-family / font-size">, limited by the sanitizer.
  TextStyle,
  FontFamily,
  FontSize,
  Youtube.configure({ nocookie: true, modestBranding: true, HTMLAttributes: { class: "kkk-video" } }),
];
