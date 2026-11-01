import { NextResponse } from "next/server";
import { ForbiddenError, requireAdmin } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { sanitizeName } from "@/lib/admin/file-names";

export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * POST multipart {file, bucket, postId?} — admin only, same origin only. Uploads with the admin's
 * own session, so Storage RLS is the final check. Blog images go to blog-images/{postId}/….
 */
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!origin || !host || new URL(origin).host !== host) return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof ForbiddenError) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    throw e;
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const bucket = form?.get("bucket") === "event-images" ? "event-images" : "blog-images";
  const postId = String(form?.get("postId") ?? "");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file received." }, { status: 400 });
  const ext = TYPES[file.type];
  if (!ext) return NextResponse.json({ error: "Please choose a JPG, PNG or WebP image." }, { status: 415 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Image is larger than 5 MB." }, { status: 413 });

  const folder = bucket === "blog-images" ? (UUID.test(postId) ? postId : "unsorted") : new Date().toISOString().slice(0, 7).replace("-", "/");
  const path = `${folder}/${sanitizeName(file.name)}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  const supabase = await createSessionClient();
  const { error } = await supabase!.storage.from(bucket).upload(path, file, { contentType: file.type, cacheControl: "31536000", upsert: false });
  if (error) return NextResponse.json({ error: `Upload failed: ${error.message}` }, { status: 400 });
  return NextResponse.json({ url: supabase!.storage.from(bucket).getPublicUrl(path).data.publicUrl, path });
}
