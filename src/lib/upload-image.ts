"use client";

import imageCompression from "browser-image-compression";

const TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * Compress in the browser (max 2400 px, no AI processing), then send to /admin/api/upload, which
 * checks the admin session and uploads with it. Returns the public URL.
 */
export async function uploadBlogImage(file: File, bucket: "blog-images" | "event-images" = "blog-images", postId?: string): Promise<string> {
  if (!TYPES.includes(file.type)) throw new Error("Please choose a JPG, PNG or WebP image.");
  const compressed = await imageCompression(file, { maxSizeMB: 2, maxWidthOrHeight: 2400, useWebWorker: true, initialQuality: 0.85, fileType: file.type });
  const named = new File([compressed], file.name, { type: compressed.type || file.type });
  if (named.size > 5 * 1024 * 1024) throw new Error("Image is larger than 5 MB even after compression.");
  const body = new FormData();
  body.set("file", named);
  body.set("bucket", bucket);
  if (postId) body.set("postId", postId);
  const res = await fetch("/admin/api/upload", { method: "POST", body, credentials: "same-origin" });
  const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!res.ok || !json.url) throw new Error(json.error ?? "Upload failed. Please sign in again and retry.");
  return json.url;
}
