"use client";

import imageCompression from "browser-image-compression";
import { createBrowserSupabase } from "@/lib/supabase/browser";

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];

/**
 * Compress in the browser, then upload to the `blog-images` bucket with the admin's own
 * session — Storage RLS rejects anyone who isn't the admin. Returns the public URL.
 */
export async function uploadBlogImage(file: File): Promise<string> {
  if (!TYPES.includes(file.type)) throw new Error("Please choose a JPG, PNG, WebP, AVIF or GIF image.");
  let toUpload: File = file;
  if (file.type !== "image/gif") {
    toUpload = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 2000, useWebWorker: true, initialQuality: 0.82 });
  }
  if (toUpload.size > MAX_BYTES) throw new Error("Image is larger than 5 MB even after compression.");

  const ext = (toUpload.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
  const d = new Date();
  const path = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${crypto.randomUUID()}.${ext}`;
  const supabase = createBrowserSupabase();
  const { error } = await supabase.storage.from("blog-images").upload(path, toUpload, {
    contentType: toUpload.type,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  return supabase.storage.from("blog-images").getPublicUrl(path).data.publicUrl;
}
