"use client";

import { NodeViewContent, NodeViewWrapper, type ReactNodeViewProps } from "@tiptap/react";
import { AlignCenter, AlignLeft, AlignRight, Crop, Trash2, Type } from "lucide-react";
import { useRef, useState } from "react";
import { clampWidth, figureLayout, type FigureAlign, type FigureAttrs } from "@/lib/content/figure";
import { cn } from "@/lib/utils";

export interface FigureOptions {
  onRecrop: (pos: number, attrs: FigureAttrs) => void;
}

const WIDTHS = [25, 50, 75, 100];
const ALIGNS: { value: FigureAlign; label: string; icon: typeof AlignLeft }[] = [
  { value: "left", label: "Align left", icon: AlignLeft },
  { value: "center", label: "Centre", icon: AlignCenter },
  { value: "right", label: "Align right", icon: AlignRight },
];

/**
 * Editor view of a blog image (v10): the same <figure> classes as the published page, plus a small
 * toolbar (width presets, alignment, crop, alt text, remove), a drag handle to resize, and the
 * caption as editable text underneath.
 */
export function FigureView({ node, updateAttributes, deleteNode, selected, editor, getPos, extension }: ReactNodeViewProps) {
  const attrs = node.attrs as FigureAttrs;
  const [dragWidth, setDragWidth] = useState<number | null>(null);
  const figRef = useRef<HTMLElement>(null);
  const layout = figureLayout({ width: dragWidth ?? attrs.width, align: attrs.align });
  const editable = editor.isEditable;
  const emptyCaption = node.content.size === 0;

  const startResize = (e: React.PointerEvent, side: "left" | "right") => {
    e.preventDefault();
    const fig = figRef.current;
    const column = fig?.parentElement;
    if (!fig || !column) return;
    const startX = e.clientX;
    const startPx = fig.getBoundingClientRect().width;
    const columnPx = column.clientWidth;
    // A centred image grows on both sides, so the pointer moves half as far per pixel of width.
    const factor = (attrs.align === "center" ? 2 : 1) * (side === "left" ? -1 : 1);
    let last = attrs.width;
    const move = (ev: PointerEvent) => {
      const px = startPx + (ev.clientX - startX) * factor;
      last = clampWidth(Math.round(((px / columnPx) * 100) / 5) * 5);
      setDragWidth(last);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      setDragWidth(null);
      updateAttributes({ width: last });
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return (
    <NodeViewWrapper
      as="figure"
      ref={figRef}
      className={cn(layout.className, "group/fig relative", selected && "is-selected")}
      style={layout.style ? { width: `${layout.width}%` } : undefined}
      data-kkk-image=""
    >
      <div contentEditable={false} className="relative" data-drag-handle>
        {/* eslint-disable-next-line @next/next/no-img-element -- editor canvas mirrors the published <img> */}
        <img src={attrs.src} alt={attrs.alt} width={attrs.naturalWidth ?? undefined} height={attrs.naturalHeight ?? undefined} draggable={false} className={cn(selected && "outline outline-3 outline-offset-2 outline-primary")} />
        {editable && (
          <>
            <div
              role="toolbar"
              aria-label="Image options"
              className={cn(
                "absolute left-1/2 top-2 z-10 -translate-x-1/2 flex-wrap items-center justify-center gap-0.5 rounded-xl bg-dark/90 p-1 text-cream shadow-lg",
                selected ? "flex" : "hidden group-hover/fig:flex group-focus-within/fig:flex",
              )}
            >
              {WIDTHS.map((w) => (
                <button key={w} type="button" aria-pressed={layout.width === w} title={`Width ${w}%`} onClick={() => updateAttributes({ width: w })} className={cn("rounded-lg px-2 py-1 text-xs font-semibold hover:bg-white/15", layout.width === w && "bg-accent text-dark hover:bg-accent")}>
                  {w}%
                </button>
              ))}
              <span aria-hidden className="mx-0.5 h-5 w-px bg-cream/30" />
              {ALIGNS.map((a) => (
                <button key={a.value} type="button" aria-label={a.label} title={a.label} aria-pressed={attrs.align === a.value} onClick={() => updateAttributes({ align: a.value })} className={cn("rounded-lg p-1.5 hover:bg-white/15", attrs.align === a.value && "bg-accent text-dark hover:bg-accent")}>
                  <a.icon size={15} aria-hidden />
                </button>
              ))}
              <span aria-hidden className="mx-0.5 h-5 w-px bg-cream/30" />
              <button type="button" title="Crop" aria-label="Crop image" onClick={() => typeof getPos === "function" && (extension.options as FigureOptions).onRecrop(getPos() ?? 0, attrs)} className="rounded-lg p-1.5 hover:bg-white/15">
                <Crop size={15} aria-hidden />
              </button>
              <button
                type="button"
                title={`Alt text: ${attrs.alt || "(none)"}`}
                aria-label="Edit alt text"
                onClick={() => {
                  const next = window.prompt("Alt text — describe the photo for people who can't see it", attrs.alt);
                  if (next !== null) updateAttributes({ alt: next.trim().slice(0, 200) });
                }}
                className="rounded-lg p-1.5 hover:bg-white/15"
              >
                <Type size={15} aria-hidden />
              </button>
              <button type="button" title="Remove image" aria-label="Remove image" onClick={() => deleteNode()} className="rounded-lg p-1.5 hover:bg-primary">
                <Trash2 size={15} aria-hidden />
              </button>
            </div>
            {(["left", "right"] as const).map((side) => (
              <span
                key={side}
                role="separator"
                aria-label={`Resize image (${layout.width}% wide)`}
                title="Drag to resize"
                onPointerDown={(e) => startResize(e, side)}
                className={cn(
                  "absolute top-1/2 z-10 h-12 w-2.5 -translate-y-1/2 cursor-ew-resize touch-none rounded-full border-2 border-white bg-primary shadow",
                  side === "left" ? "-left-1" : "-right-1",
                  selected ? "block" : "hidden group-hover/fig:block",
                )}
              />
            ))}
            {dragWidth !== null && <span className="absolute bottom-2 right-2 rounded bg-dark/80 px-2 py-0.5 text-xs font-semibold text-cream">{dragWidth}%</span>}
          </>
        )}
      </div>
      <div className="relative">
        {emptyCaption && editable && (
          <span contentEditable={false} aria-hidden className="pointer-events-none absolute inset-x-0 top-0 mt-[0.6em] text-center text-[0.8em] italic text-muted/60">
            Add a caption (optional)
          </span>
        )}
        <NodeViewContent<"figcaption"> as="figcaption" className="kkk-caption" />
      </div>
    </NodeViewWrapper>
  );
}
