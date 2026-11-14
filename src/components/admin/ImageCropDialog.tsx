"use client";

import Cropper from "cropperjs";
import "cropperjs/dist/cropper.css";
import { RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { CropBox } from "@/lib/content/figure";
import { cn } from "@/lib/utils";

export interface CropRequest {
  mode: "insert" | "recrop";
  /** Object URL of a new file, or the stored original's https URL (re-crop). */
  src: string;
  /** Previous crop box, to start from when re-cropping. */
  crop?: CropBox | null;
  /** MIME type of the source, to keep PNG transparency. */
  type?: string;
  alt?: string;
  caption?: string;
}

export interface CropResult {
  blob: Blob;
  crop: CropBox;
  width: number;
  height: number;
  alt: string;
  caption: string;
}

const PRESETS: { label: string; ratio: number | "original" }[] = [
  { label: "Free", ratio: NaN },
  { label: "16:9", ratio: 16 / 9 },
  { label: "4:3", ratio: 4 / 3 },
  { label: "1:1", ratio: 1 },
  { label: "Original", ratio: "original" },
];

const input = "w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-ink focus:border-primary focus:outline-none";
const btn = "rounded-full border border-border px-4 py-2 text-sm font-semibold text-ink hover:border-primary hover:text-primary disabled:opacity-50";
const primaryBtn = "rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-50";

/**
 * Crop step for blog images (v10), using Cropper.js. Free crop or a fixed ratio; the cropped
 * pixels are produced here in the browser (max 2400 px, no AI processing) and uploaded by the
 * caller, so readers download only the cropped file. When inserting, alt text (required) and an
 * optional caption are asked for on the same screen.
 */
export function ImageCropDialog({ request, busy, onCancel, onDone }: { request: CropRequest | null; busy: boolean; onCancel: () => void; onDone: (r: CropResult) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const img = useRef<HTMLImageElement>(null);
  const cropper = useRef<Cropper | null>(null);
  const [preset, setPreset] = useState("Free");
  const [alt, setAlt] = useState("");
  const [caption, setCaption] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (request) {
      dialog.current?.showModal();
      const t = setTimeout(() => {
        setAlt(request.alt ?? "");
        setCaption(request.caption ?? "");
        setPreset("Free");
        setError(null);
        setReady(false);
      }, 0);
      return () => clearTimeout(t);
    }
    dialog.current?.close();
    cropper.current?.destroy();
    cropper.current = null;
  }, [request]);

  useEffect(
    () => () => {
      cropper.current?.destroy();
    },
    [],
  );

  const start = () => {
    if (!img.current || !request) return;
    cropper.current?.destroy();
    const initial = request.crop ?? undefined;
    cropper.current = new Cropper(img.current, {
      viewMode: 1,
      autoCropArea: 1,
      aspectRatio: NaN,
      background: false,
      responsive: true,
      zoomable: false,
      checkCrossOrigin: false,
      ready() {
        if (initial) cropper.current?.setData(initial);
        setReady(true);
      },
    });
  };

  const choose = (label: string, ratio: number | "original") => {
    setPreset(label);
    const c = cropper.current;
    if (!c) return;
    const r = ratio === "original" ? c.getImageData().naturalWidth / c.getImageData().naturalHeight : ratio;
    c.setAspectRatio(r);
  };

  const finish = () => {
    const c = cropper.current;
    if (!c || !request) return;
    if (request.mode === "insert" && !alt.trim()) return setError("Add alt text: describe the photo for people who can't see it.");
    const data = c.getData(true);
    const canvas = c.getCroppedCanvas({ maxWidth: 2400, maxHeight: 2400, imageSmoothingEnabled: true, imageSmoothingQuality: "high" });
    if (!canvas) return setError("Couldn't crop this image. Try another file.");
    const type = request.type === "image/png" ? "image/png" : request.type === "image/webp" ? "image/webp" : "image/jpeg";
    try {
      canvas.toBlob(
        (blob) => {
          if (!blob) return setError("Couldn't create the cropped image.");
          onDone({ blob, crop: { x: data.x, y: data.y, width: data.width, height: data.height }, width: canvas.width, height: canvas.height, alt: alt.trim(), caption: caption.trim() });
        },
        type,
        0.9,
      );
    } catch {
      // A remote original without CORS headers taints the canvas.
      setError("This image can't be re-cropped here (its server doesn't allow it). Insert it again to crop.");
    }
  };

  return (
    <dialog ref={dialog} onCancel={(e) => { e.preventDefault(); if (!busy) onCancel(); }} aria-labelledby="crop-title" className="m-auto w-[min(96vw,760px)] rounded-2xl border border-border bg-surface p-5 backdrop:bg-dark/60 md:p-6">
      {request && (
        <div>
          <h2 id="crop-title" className="text-xl font-bold text-primary">{request.mode === "insert" ? "Crop and add image" : "Crop image"}</h2>
          <p className="mt-1 text-sm text-muted">Drag the box or its corners. Readers only download the cropped part.</p>
          <div className="mt-3 h-[min(52vh,420px)] overflow-hidden rounded-xl bg-dark/90">
            {/* eslint-disable-next-line @next/next/no-img-element -- Cropper.js needs a plain <img> */}
            <img
              ref={img}
              src={request.src}
              alt=""
              crossOrigin={request.src.startsWith("blob:") ? undefined : "anonymous"}
              onLoad={start}
              onError={() => setError("Couldn't load the image.")}
              className="block max-w-full"
            />
          </div>
          <div role="radiogroup" aria-label="Crop shape" className="mt-3 flex flex-wrap items-center gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                role="radio"
                aria-checked={preset === p.label}
                disabled={!ready}
                onClick={() => choose(p.label, p.ratio)}
                className={cn("rounded-full border px-3 py-1.5 text-xs font-semibold", preset === p.label ? "border-primary bg-primary text-white" : "border-border bg-white text-ink hover:border-primary")}
              >
                {p.label}
              </button>
            ))}
            <button type="button" disabled={!ready} onClick={() => { cropper.current?.reset(); choose("Free", NaN); }} className="ml-auto inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-muted hover:text-primary">
              <RotateCcw size={13} aria-hidden /> Reset
            </button>
          </div>
          {request.mode === "insert" && (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="block text-sm font-semibold text-ink">
                Alt text <span className="font-normal text-muted">(required)</span>
                <input value={alt} onChange={(e) => setAlt(e.target.value)} maxLength={200} className={cn(input, "mt-1.5")} placeholder="What the photo shows" />
              </label>
              <label className="block text-sm font-semibold text-ink">
                Caption <span className="font-normal text-muted">(optional, editable later)</span>
                <input value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={240} className={cn(input, "mt-1.5")} placeholder="Shown under the photo" />
              </label>
            </div>
          )}
          {error && <p role="alert" className="mt-3 text-sm text-primary">{error}</p>}
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" disabled={busy} onClick={onCancel} className={btn}>Cancel</button>
            <button type="button" disabled={!ready || busy} onClick={finish} className={primaryBtn}>
              {busy ? "Uploading…" : request.mode === "insert" ? "Insert image" : "Save crop"}
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
