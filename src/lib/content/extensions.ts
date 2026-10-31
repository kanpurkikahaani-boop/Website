import StarterKit from "@tiptap/starter-kit";
import Heading from "@tiptap/extension-heading";
import Image from "@tiptap/extension-image";
import Youtube from "@tiptap/extension-youtube";

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
  // `title` doubles as the caption (rendered as <figcaption>).
  Image.configure({ HTMLAttributes: { loading: "lazy" } }),
  Youtube.configure({ nocookie: true, modestBranding: true, HTMLAttributes: { class: "kkk-video" } }),
];
