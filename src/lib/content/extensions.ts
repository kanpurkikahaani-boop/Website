import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Youtube from "@tiptap/extension-youtube";

/**
 * The Tiptap schema shared by the admin editor and server-side HTML rendering.
 * StarterKit (v3) already includes Link and Underline.
 */
export const blogExtensions = [
  StarterKit.configure({
    heading: { levels: [2, 3, 4] },
    link: {
      openOnClick: false,
      autolink: true,
      protocols: ["http", "https", "mailto"],
      HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
    },
  }),
  Image.configure({ HTMLAttributes: { loading: "lazy" } }),
  Youtube.configure({ nocookie: true, modestBranding: true, HTMLAttributes: { class: "kkk-video" } }),
];
