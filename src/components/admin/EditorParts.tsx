"use client";

import type { Editor } from "@tiptap/react";
import { FileUp, History, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { listRevisions, restoreRevision, type RevisionSummary } from "@/app/admin/(panel)/blogs/actions";
import { isExternalHref } from "@/lib/content/enrich";
import { cn } from "@/lib/utils";

export interface SiteRoute {
  href: string;
  label: string;
}

const input = "w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-ink focus:border-primary focus:outline-none";
const btn = "rounded-full border border-border px-4 py-2 text-sm font-semibold text-ink hover:border-primary hover:text-primary disabled:opacity-50";
const primaryBtn = "rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-50";

/* ── Paste from Word / Google Docs ─────────────────────────────────────────── */

/**
 * Keep headings, bold, italics, lists and links; drop fonts, colours, classes and Office junk.
 * Google Docs marks bold/italic with inline styles, so those become <strong>/<em> first.
 */
export function cleanPastedHtml(html: string): string {
  if (typeof DOMParser === "undefined") return html;
  const doc = new DOMParser().parseFromString(html.replace(/<!--[\s\S]*?-->/g, ""), "text/html");
  // Google Docs wraps everything in <b style="font-weight:normal" id="docs-internal-guid-…">
  doc.querySelectorAll('b[id^="docs-internal-guid"]').forEach((b) => b.replaceWith(...b.childNodes));
  doc.querySelectorAll<HTMLElement>("span, font").forEach((el) => {
    const style = el.getAttribute("style") ?? "";
    let node: Node = doc.createDocumentFragment();
    (node as DocumentFragment).append(...el.childNodes);
    if (/font-style:\s*italic/i.test(style)) {
      const em = doc.createElement("em");
      em.append(node);
      node = em;
    }
    if (/font-weight:\s*(bold|[6-9]00)/i.test(style)) {
      const strong = doc.createElement("strong");
      strong.append(node);
      node = strong;
    }
    if (/text-decoration[^;]*underline/i.test(style) && !el.closest("a")) {
      const u = doc.createElement("u");
      u.append(node);
      node = u;
    }
    el.replaceWith(node);
  });
  doc.querySelectorAll("o\\:p, meta, style, script, link, xml").forEach((el) => el.remove());
  doc.querySelectorAll<HTMLElement>("*").forEach((el) => {
    for (const attr of [...el.attributes]) {
      const keep = (el.tagName === "A" && attr.name === "href") || (el.tagName === "IMG" && ["src", "alt"].includes(attr.name));
      if (!keep) el.removeAttribute(attr.name);
    }
  });
  return doc.body.innerHTML;
}

/* ── Import a .docx with mammoth ───────────────────────────────────────────── */

export function DocxImportButton({ editor, onError, onImported }: { editor: Editor | null; onError: (m: string) => void; onImported: () => void }) {
  const id = useId();
  const [busy, setBusy] = useState(false);
  return (
    <>
      <button type="button" disabled={!editor || busy} onClick={() => document.getElementById(id)?.click()} className={cn(btn, "inline-flex items-center gap-2")}>
        <FileUp size={15} aria-hidden /> {busy ? "Importing…" : "Import .docx"}
      </button>
      <input
        id={id}
        type="file"
        accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f || !editor) return;
          if (f.size > 10 * 1024 * 1024) return onError("That Word file is over 10 MB.");
          if (!editor.isEmpty && !window.confirm("Replace the current body with the Word document?")) return;
          setBusy(true);
          try {
            const mammoth = await import("mammoth/mammoth.browser");
            const { value } = await mammoth.convertToHtml(
              { arrayBuffer: await f.arrayBuffer() },
              // Word headings → our H2/H3; images are skipped (upload them with alt text instead).
              { styleMap: ["p[style-name='Title'] => h2:fresh", "p[style-name='Heading 1'] => h2:fresh", "p[style-name='Heading 2'] => h2:fresh", "p[style-name='Heading 3'] => h3:fresh"], convertImage: mammoth.images.imgElement(async () => ({ src: "" })) },
            );
            editor.commands.setContent(cleanPastedHtml(value.replace(/<img[^>]*>/g, "")), { emitUpdate: true });
            onImported();
          } catch {
            onError("Couldn't read that Word file. Is it a .docx (not .doc)?");
          } finally {
            setBusy(false);
          }
        }}
      />
    </>
  );
}

/* ── Link panel: internal autocomplete + new-tab toggle ────────────────────── */

export function LinkPanel({ editor, routes, onClose }: { editor: Editor; routes: SiteRoute[]; onClose: () => void }) {
  const current = editor.getAttributes("link") as { href?: string; target?: string | null };
  const [href, setHref] = useState(current.href ?? "");
  const [newTab, setNewTab] = useState(current.target === "_blank");
  const [error, setError] = useState<string | null>(null);
  const listId = useId();
  const external = isExternalHref(href.trim());
  const matches = useMemo(() => {
    const q = href.trim().toLowerCase();
    if (!q || external || q.startsWith("mailto:")) return [];
    return routes.filter((r) => r.href.toLowerCase().includes(q) || r.label.toLowerCase().includes(q)).slice(0, 8);
  }, [href, routes, external]);

  const apply = (value = href) => {
    const url = value.trim();
    if (!url) return remove();
    if (!/^(https?:\/\/|mailto:|\/(?!\/)|#)/.test(url)) return setError("Use https://…, an internal /path, or mailto:");
    editor.chain().focus().extendMarkRange("link").setLink({ href: url, target: isExternalHref(url) || newTab ? "_blank" : null }).run();
    onClose();
  };
  const remove = () => {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    onClose();
  };

  return (
    <div role="group" aria-label="Edit link" className="border-b border-border bg-white p-3">
      <div className="flex flex-wrap items-start gap-2">
        <div className="relative min-w-[240px] flex-1">
          <label htmlFor={`${listId}-url`} className="sr-only">Link address</label>
          <input
            id={`${listId}-url`}
            autoFocus
            value={href}
            onChange={(e) => {
              setHref(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                apply();
              }
              if (e.key === "Escape") onClose();
            }}
            placeholder="Paste https://… or type a page name, e.g. tourism"
            className={input}
            aria-autocomplete="list"
            aria-controls={listId}
          />
          {matches.length > 0 && (
            <ul id={listId} role="listbox" className="absolute inset-x-0 top-full z-20 mt-1 max-h-60 overflow-y-auto rounded-xl border border-border bg-white py-1 shadow-lg">
              {matches.map((r) => (
                <li key={r.href} role="option" aria-selected={false}>
                  <button type="button" onClick={() => apply(r.href)} className="flex w-full items-baseline justify-between gap-3 px-3 py-1.5 text-left text-sm hover:bg-primary-soft">
                    <span className="font-medium text-ink">{r.label}</span>
                    <span className="text-xs text-muted">{r.href}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <label className={cn("flex items-center gap-2 py-2.5 text-sm", external && "text-muted")}>
          <input type="checkbox" checked={external || newTab} disabled={external} onChange={(e) => setNewTab(e.target.checked)} />
          Open in new tab{external && " (always, for other websites)"}
        </label>
        <button type="button" onClick={() => apply()} className={primaryBtn}>Apply</button>
        {current.href && <button type="button" onClick={remove} className={btn}>Remove link</button>}
        <button type="button" onClick={onClose} aria-label="Close link editor" className="rounded-full p-2 text-muted hover:text-primary"><X size={16} aria-hidden /></button>
      </div>
      {error && <p role="alert" className="mt-1.5 text-xs text-primary">{error}</p>}
    </div>
  );
}

/* ── Image dialog: alt text required, optional caption ─────────────────────── */

export function ImageDialog({ file, onCancel, onInsert, uploading }: { file: File | null; onCancel: () => void; onInsert: (alt: string, caption: string) => void; uploading: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [alt, setAlt] = useState("");
  const [caption, setCaption] = useState("");
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => {
    if (file) ref.current?.showModal();
    else ref.current?.close();
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [file, preview]);
  return (
    <dialog ref={ref} onCancel={onCancel} aria-labelledby="img-dialog-title" className="m-auto w-[min(92vw,480px)] rounded-2xl border border-border bg-surface p-6 backdrop:bg-dark/50">
      <form
        method="dialog"
        onSubmit={(e) => {
          e.preventDefault();
          if (alt.trim()) onInsert(alt.trim(), caption.trim());
        }}
      >
        <h2 id="img-dialog-title" className="text-xl font-bold text-primary">Add image</h2>
        {/* eslint-disable-next-line @next/next/no-img-element -- local preview before upload */}
        {preview && <img src={preview} alt="" className="mt-3 max-h-56 w-full rounded-xl object-contain" />}
        <label className="mt-4 block text-sm font-semibold text-ink">
          Alt text <span className="font-normal text-muted">(required — describe the photo for people who can&apos;t see it)</span>
          <input value={alt} onChange={(e) => setAlt(e.target.value)} required maxLength={200} className={cn(input, "mt-1.5")} />
        </label>
        <label className="mt-3 block text-sm font-semibold text-ink">
          Caption <span className="font-normal text-muted">(optional, shown under the photo — add the credit here)</span>
          <input value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={240} className={cn(input, "mt-1.5")} placeholder="Representative image — Photo: Name, CC BY-SA 4.0" />
        </label>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className={btn}>Cancel</button>
          <button type="submit" disabled={!alt.trim() || uploading} className={primaryBtn}>{uploading ? "Uploading…" : "Insert image"}</button>
        </div>
      </form>
    </dialog>
  );
}

/* ── Tag chips ─────────────────────────────────────────────────────────────── */

export const normaliseTag = (t: string) => t.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);

export function TagInput({ id, tags, onChange }: { id: string; tags: string[]; onChange: (tags: string[]) => void }) {
  const [draft, setDraft] = useState("");
  const add = (raw: string) => {
    const t = raw.split(",").map(normaliseTag).filter(Boolean);
    if (t.length) onChange([...new Set([...tags, ...t])].slice(0, 10));
    setDraft("");
  };
  return (
    <div className="flex flex-wrap gap-1.5 rounded-xl border border-border bg-white p-2 focus-within:border-primary">
      {tags.map((t) => (
        <span key={t} className="inline-flex items-center gap-1 rounded-full bg-bg-alt px-2.5 py-1 text-xs font-medium text-ink">
          #{t}
          <button type="button" aria-label={`Remove tag ${t}`} onClick={() => onChange(tags.filter((x) => x !== t))} className="text-muted hover:text-primary">
            <X size={12} aria-hidden />
          </button>
        </span>
      ))}
      <input
        id={id}
        value={draft}
        onChange={(e) => (e.target.value.endsWith(",") ? add(e.target.value) : setDraft(e.target.value))}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add(draft);
          } else if (e.key === "Backspace" && !draft && tags.length) onChange(tags.slice(0, -1));
        }}
        onBlur={() => draft && add(draft)}
        placeholder={tags.length ? "" : "Type a tag, press Enter"}
        className="min-w-[120px] flex-1 border-0 px-1 py-1 text-sm focus:outline-none"
      />
    </div>
  );
}

/* ── Cover focal point ─────────────────────────────────────────────────────── */

export function FocalPicker({ src, value, onChange }: { src: string; value: string; onChange: (v: string) => void }) {
  const [x, y] = (value || "50% 50%").split(" ").map((v) => parseInt(v, 10));
  return (
    <div>
      <button
        type="button"
        aria-label="Click the most important part of the photo"
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const px = Math.round(((e.clientX - r.left) / r.width) * 100);
          const py = Math.round(((e.clientY - r.top) / r.height) * 100);
          onChange(`${Math.min(100, Math.max(0, px))}% ${Math.min(100, Math.max(0, py))}%`);
        }}
        className="relative block w-full cursor-crosshair overflow-hidden rounded-xl"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- admin preview of an uploaded file */}
        <img src={src} alt="" className="w-full" />
        <span aria-hidden className="absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-primary shadow" style={{ left: `${x}%`, top: `${y}%` }} />
      </button>
      <p className="mt-1 text-xs text-muted">Focal point {value || "50% 50%"} — click the photo to keep that part in view when it&apos;s cropped.</p>
      {/* eslint-disable-next-line @next/next/no-img-element -- crop preview */}
      <img src={src} alt="" className="mt-2 aspect-[16/9] w-full rounded-lg object-cover" style={{ objectPosition: value || "50% 50%" }} />
    </div>
  );
}

/* ── Google result preview ─────────────────────────────────────────────────── */

export function SeoPreview({ title, description, slug }: { title: string; description: string; slug: string }) {
  const t = title.length > 60 ? `${title.slice(0, 57)}…` : title;
  const d = description.length > 160 ? `${description.slice(0, 157)}…` : description;
  return (
    <div className="rounded-xl border border-border bg-white p-3 font-sans" aria-label="Google result preview">
      <p className="text-xs text-[#4d5156]">kanpurkikahaani.site › blogs › {slug || "…"}</p>
      <p className="mt-0.5 text-[17px] leading-snug text-[#1a0dab]">{t || "SEO title"}</p>
      <p className="mt-0.5 text-[13px] leading-snug text-[#4d5156]">{d || "Meta description…"}</p>
    </div>
  );
}

/* ── Revision history drawer ───────────────────────────────────────────────── */

export function HistoryDrawer({ postId, open, onClose, onRestored }: { postId?: string; open: boolean; onClose: () => void; onRestored: (title: string, content: unknown) => void }) {
  const [items, setItems] = useState<RevisionSummary[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!open || !postId) return;
    let live = true;
    listRevisions(postId).then((r) => live && setItems(r));
    return () => {
      live = false;
    };
  }, [open, postId]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex justify-end bg-dark/40" onClick={onClose}>
      <aside role="dialog" aria-modal="true" aria-labelledby="history-title" onClick={(e) => e.stopPropagation()} className="h-full w-[min(100vw,400px)] overflow-y-auto bg-surface p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 id="history-title" className="flex items-center gap-2 text-xl font-bold text-primary"><History size={18} aria-hidden /> History</h2>
          <button type="button" onClick={onClose} aria-label="Close history" className="rounded-full p-2 hover:bg-primary-soft"><X size={18} aria-hidden /></button>
        </div>
        <p className="mt-1 text-sm">Every save that changes the title or text is kept (last 50). Restoring keeps the current version in history too.</p>
        {error && <p role="alert" className="mt-3 text-sm text-primary">{error}</p>}
        {!postId ? (
          <p className="mt-6 text-sm">Save the post once to start its history.</p>
        ) : items === null ? (
          <p className="mt-6 text-sm">Loading…</p>
        ) : items.length === 0 ? (
          <p className="mt-6 text-sm">No earlier versions yet.</p>
        ) : (
          <ol className="mt-4 space-y-2">
            {items.map((r, i) => (
              <li key={r.id} className="rounded-xl border border-border p-3 text-sm">
                <p className="font-semibold text-ink">{r.title}</p>
                <p className="text-xs text-muted">
                  {new Date(r.savedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })}
                  {r.savedBy ? ` · ${r.savedBy}` : ""}
                  {i === 0 ? " · latest" : ""}
                </p>
                {i > 0 && (
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={async () => {
                      if (!window.confirm("Restore this version? The current text is saved in history first.")) return;
                      setBusy(r.id);
                      setError(null);
                      const res = await restoreRevision(postId, r.id);
                      setBusy(null);
                      if (!res.ok) return setError(res.error);
                      onRestored(res.title ?? r.title, res.contentJson);
                      onClose();
                    }}
                    className={cn(btn, "mt-2 py-1 text-xs")}
                  >
                    {busy === r.id ? "Restoring…" : "Restore this version"}
                  </button>
                )}
              </li>
            ))}
          </ol>
        )}
      </aside>
    </div>
  );
}
