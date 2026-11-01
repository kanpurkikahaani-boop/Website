"use client";

import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import {
  Bold, Heading2, Heading3, History, ImagePlus, Italic, Link2, Link2Off, List, ListOrdered, Minus, Quote, Redo2, Settings2, Underline, Undo2, Video, X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState, useTransition } from "react";
import { createAuthor, isSlugAvailable, savePost } from "@/app/admin/(panel)/blogs/actions";
import { BLOG_CATEGORIES } from "@/lib/blog-categories";
import type { GlossaryItem, KeyFact, PlanItem, ReadingItem } from "@/lib/posts";
import { blogExtensions } from "@/lib/content/extensions";
import { CITY_OPTIONS } from "@/lib/city-names";
import { slugifyTitle, slugRe } from "@/lib/posts-admin-schema";
import { uploadBlogImage } from "@/lib/upload-image";
import { cn } from "@/lib/utils";
import { cleanPastedHtml, DocxImportButton, FocalPicker, HistoryDrawer, ImageDialog, LinkPanel, SeoPreview, TagInput, type SiteRoute } from "./EditorParts";
import { LinkTools } from "./LinkTools";
import { RowsEditor } from "./RowsEditor";

export interface EditorPost {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  contentJson: Record<string, unknown> | null;
  coverUrl: string;
  coverAlt: string;
  coverFocal: string;
  city: string;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  status: "draft" | "published";
  publishedAt: string; // datetime-local value (IST) or ""
  authorId: string;
  category: string;
  standfirst: string;
  titleEmphasis: string;
  pullQuote: string;
  coverCaption: string;
  coverCredit: string;
  keyFacts: KeyFact[];
  furtherReading: ReadingItem[];
  glossary: GlossaryItem[];
  planVisit: PlanItem[];
}

export interface AuthorOption {
  id: string;
  name: string;
}

/** Empty values for the rich fields (new posts). */
export const EMPTY_RICH_FIELDS = {
  authorId: "",
  category: "",
  standfirst: "",
  titleEmphasis: "",
  pullQuote: "",
  coverCaption: "",
  coverCredit: "",
  coverFocal: "",
  keyFacts: [] as KeyFact[],
  furtherReading: [] as ReadingItem[],
  glossary: [] as GlossaryItem[],
  planVisit: [] as PlanItem[],
};

const clean = <T,>(rows: T[]) => rows.filter((r) => Object.values(r as Record<string, string>).some((v) => String(v ?? "").trim())) as T[];

const AUTOSAVE_MS = 20_000;

/** datetime-local (interpreted as IST) → ISO string */
function istToIso(local: string) {
  return local ? new Date(`${local}:00+05:30`).toISOString() : "";
}
const istLabel = (local: string) =>
  new Date(`${local}:00+05:30`).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });

function ago(ms: number) {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  return m < 60 ? `${m} min ago` : `${Math.round(m / 60)} h ago`;
}

type Toast = { kind: "ok" | "error"; text: string } | null;

export function PostEditor({ initial, authors: initialAuthors, routes = [] }: { initial: EditorPost; authors: AuthorOption[]; routes?: SiteRoute[] }) {
  const router = useRouter();
  const [authors, setAuthors] = useState(initialAuthors);
  const [newAuthor, setNewAuthor] = useState("");
  const [post, setPost] = useState<EditorPost>(initial);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.id));
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, startSave] = useTransition();
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [toast, setToast] = useState<Toast>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [backup, setBackup] = useState<{ title: string; json: Record<string, unknown>; at: number } | null>(null);
  const idRef = useRef(initial.id);
  const [postId, setPostId] = useState(initial.id);
  const backupKey = initial.id ? `kkk-post-backup-${initial.id}` : null;

  const editor = useEditor({
    extensions: [...blogExtensions, Placeholder.configure({ placeholder: "Start writing the story… (## for a heading, - for a list, > for a quote)" })],
    content: initial.contentJson ?? undefined,
    immediatelyRender: false,
    editorProps: {
      attributes: { class: "prose-kkk article-body min-h-[480px] px-6 py-5 focus:outline-none", "aria-label": "Post body" },
      transformPastedHTML: cleanPastedHtml,
    },
    onUpdate: () => setDirty(true),
  });

  const showToast = (t: Toast) => {
    setToast(t);
    if (t) setTimeout(() => setToast((cur) => (cur === t ? null : cur)), 4000);
  };

  const update = <K extends keyof EditorPost>(key: K, value: EditorPost[K]) => {
    setPost((p) => {
      const next = { ...p, [key]: value };
      if (key === "title" && !slugTouched) next.slug = slugifyTitle(String(value));
      return next;
    });
    setDirty(true);
  };

  const isFuture = Boolean(post.publishedAt) && Date.parse(istToIso(post.publishedAt)) > now && now > 0;
  const liveStatus = post.status === "draft" ? "Draft" : isFuture ? "Scheduled" : "Published";

  const save = useCallback(
    (nextStatus?: "draft" | "published", opts: { quiet?: boolean; preview?: boolean } = {}) =>
      new Promise<boolean>((resolve) => {
        if (!editor) return resolve(false);
        const target = nextStatus ?? post.status;
        if (!slugRe.test(post.slug)) {
          setSlugError("Use lowercase letters, numbers and hyphens");
          setDrawerOpen(true);
          return resolve(false);
        }
        if (target === "published" && post.coverUrl && !post.coverAlt.trim()) {
          setError("Add alt text for the cover image before publishing.");
          setDrawerOpen(true);
          return resolve(false);
        }
        startSave(async () => {
          setError(null);
          const res = await savePost({
            id: idRef.current,
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt,
            contentJson: editor.getJSON() as Record<string, unknown>,
            coverUrl: post.coverUrl,
            coverAlt: post.coverAlt,
            coverFocal: post.coverFocal || null,
            city: (post.city || null) as never,
            tags: post.tags,
            seoTitle: post.seoTitle,
            seoDescription: post.seoDescription,
            status: target,
            publishedAt: istToIso(post.publishedAt) || undefined,
            authorId: post.authorId || null,
            category: post.category,
            standfirst: post.standfirst,
            titleEmphasis: post.titleEmphasis,
            pullQuote: post.pullQuote,
            coverCaption: post.coverCaption,
            coverCredit: post.coverCredit,
            keyFacts: clean(post.keyFacts),
            furtherReading: clean(post.furtherReading),
            glossary: clean(post.glossary),
            planVisit: clean(post.planVisit),
          });
          if (!res.ok) {
            setError(res.error);
            if (!opts.quiet) showToast({ kind: "error", text: res.error });
            return resolve(false);
          }
          setDirty(false);
          setLastSaved(Date.now());
          setPost((p) => ({ ...p, status: target }));
          if (backupKey) localStorage.removeItem(backupKey);
          if (!opts.quiet) {
            const future = post.publishedAt && Date.parse(istToIso(post.publishedAt)) > Date.now();
            showToast({
              kind: "ok",
              text:
                target === "draft"
                  ? post.status === "published" ? "Unpublished — it's a draft again." : "Draft saved."
                  : future ? `Scheduled for ${istLabel(post.publishedAt)} IST.`
                  : post.status === "published" ? "Updated — the live post now shows your changes." : "Published — it's live on the site.",
            });
          }
          if (!idRef.current) {
            idRef.current = res.id;
            setPostId(res.id);
            router.replace(`/admin/blogs/${res.id}/edit`);
          }
          if (opts.preview) window.open(`/admin/blogs/${res.id}/preview`, "_blank", "noopener");
          resolve(true);
        });
      }),
    [editor, post, router, backupKey],
  );

  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  // "Saved · 2s ago" ticker.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 2000);
    return () => clearInterval(t);
  }, []);

  // Autosave every 20 s (and on blur, below). Drafts save to the server. Live/scheduled posts are
  // backed up in this browser only — so half-finished edits never go live by themselves.
  const autosave = useCallback(() => {
    if (!dirty || !editor || post.title.trim().length < 3) return;
    if (post.status === "draft") void saveRef.current("draft", { quiet: true });
    else if (backupKey) {
      try {
        localStorage.setItem(backupKey, JSON.stringify({ title: post.title, json: editor.getJSON(), at: Date.now() }));
      } catch {
        /* storage full or blocked — nothing to do */
      }
    }
  }, [dirty, editor, post.status, post.title, backupKey]);
  useEffect(() => {
    const t = setInterval(autosave, AUTOSAVE_MS);
    return () => clearInterval(t);
  }, [autosave]);
  useEffect(() => {
    if (!editor) return;
    editor.on("blur", autosave);
    return () => {
      editor.off("blur", autosave);
    };
  }, [editor, autosave]);

  // Offer to restore a browser backup of unsaved edits to a live post.
  useEffect(() => {
    if (!backupKey) return;
    const t = setTimeout(() => {
      try {
        const raw = localStorage.getItem(backupKey);
        if (raw) setBackup(JSON.parse(raw));
      } catch {
        /* storage blocked — nothing to restore */
      }
    }, 0);
    return () => clearTimeout(t);
  }, [backupKey]);

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  async function checkSlug() {
    if (!slugRe.test(post.slug)) return setSlugError("Use lowercase letters, numbers and hyphens");
    const free = await isSlugAvailable(post.slug, idRef.current);
    setSlugError(free ? null : "That slug is already used by another post.");
  }

  async function upload(file: File) {
    setUploading(true);
    setError(null);
    try {
      return await uploadBlogImage(file, "blog-images", idRef.current);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
      return null;
    } finally {
      setUploading(false);
    }
  }

  const slugChangedAfterPublish = initial.status === "published" && initial.slug && post.slug !== initial.slug;
  const titleLen = (post.seoTitle || post.title).length;
  const descLen = post.seoDescription.length;
  const savedText = saving ? "Saving…" : dirty ? "Unsaved changes" : lastSaved && now ? `Saved · ${ago(now - lastSaved)}` : initial.id ? "All changes saved" : "Not saved yet";

  const publishLabel = post.status === "draft" ? (isFuture ? "Schedule" : "Publish") : isFuture ? "Update schedule" : "Update";

  const settings = (
    <div className="space-y-4">
      <Section title="Publish" open>
        <p className="text-sm">
          Status:{" "}
          <strong className={cn(liveStatus === "Published" ? "text-[#21603a]" : liveStatus === "Scheduled" ? "text-[#1d4a8f]" : "text-accent-ink")}>{liveStatus}</strong>
        </p>
        <p aria-live="polite" className={cn("mt-0.5 text-xs", dirty ? "text-primary" : "text-muted")}>{savedText}</p>
        {error && <p role="alert" className="mt-2 rounded-lg bg-primary-soft px-3 py-2 text-sm text-primary">{error}</p>}
        <Field label="Publish date & time (IST)" htmlFor="post-date" className="mt-3" hint={isFuture ? "A future time schedules the post — it goes live automatically." : "Leave empty to publish now."}>
          <input id="post-date" type="datetime-local" value={post.publishedAt} onChange={(e) => update("publishedAt", e.target.value)} className={inputCls} />
        </Field>
        <div className="mt-4 grid gap-2">
          <button type="button" disabled={saving || post.title.trim().length < 3} onClick={() => save("published")} className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60">
            {publishLabel}
          </button>
          {post.status === "published" ? (
            <button type="button" disabled={saving} onClick={() => save("draft")} className={secondaryBtn}>Unpublish (back to draft)</button>
          ) : (
            <button type="button" disabled={saving || post.title.trim().length < 3} onClick={() => save("draft")} className={secondaryBtn}>Save draft</button>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button type="button" disabled={saving || post.title.trim().length < 3} onClick={() => save(undefined, { preview: true })} className={secondaryBtn}>Preview ↗</button>
            <button type="button" onClick={() => setHistoryOpen(true)} className={cn(secondaryBtn, "inline-flex items-center justify-center gap-1.5")}>
              <History size={14} aria-hidden /> History
            </button>
          </div>
        </div>
      </Section>

      <Section title="Basics" open>
        <Field label="Author" htmlFor="post-author">
          <select id="post-author" value={post.authorId} onChange={(e) => update("authorId", e.target.value)} className={inputCls}>
            <option value="">Kanpur Ki Kahaani (no writer)</option>
            {authors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <div className="mt-2 flex gap-2">
            <input aria-label="New writer's name" value={newAuthor} onChange={(e) => setNewAuthor(e.target.value)} placeholder="Add a writer…" className={inputCls + " py-2"} />
            <button
              type="button"
              disabled={!newAuthor.trim()}
              onClick={async () => {
                const r = await createAuthor({ name: newAuthor });
                if (!r.ok) return setError(r.error);
                setAuthors((l) => [...l, { id: r.id, name: r.name }].sort((a, b) => a.name.localeCompare(b.name)));
                update("authorId", r.id);
                setNewAuthor("");
              }}
              className="shrink-0 rounded-full border border-border px-3 text-xs font-semibold text-ink hover:border-primary disabled:opacity-50"
            >
              Add author
            </button>
          </div>
        </Field>
        <Field label="Category" htmlFor="post-category">
          <select id="post-category" value={post.category} onChange={(e) => update("category", e.target.value)} className={inputCls}>
            <option value="">— none —</option>
            {BLOG_CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="City" htmlFor="post-city">
          <select id="post-city" value={post.city} onChange={(e) => update("city", e.target.value)} className={inputCls}>
            <option value="">— none —</option>
            {CITY_OPTIONS.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Tags" htmlFor="post-tags" hint="Press Enter or comma after each tag (max 10).">
          <TagInput id="post-tags" tags={post.tags} onChange={(t) => update("tags", t)} />
        </Field>
        <Field label="Excerpt" htmlFor="post-excerpt" hint={`${post.excerpt.length}/320 — shown on story cards`}>
          <textarea id="post-excerpt" rows={3} maxLength={320} value={post.excerpt} onChange={(e) => update("excerpt", e.target.value)} className={inputCls} />
        </Field>
      </Section>

      <Section title="URL" open>
        <Field label="Slug" htmlFor="post-slug" hint={`kanpurkikahaani.site/blogs/${post.slug || "…"}`} error={slugError}>
          <input
            id="post-slug"
            value={post.slug}
            onChange={(e) => {
              setSlugTouched(true);
              update("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"));
            }}
            onBlur={checkSlug}
            className={inputCls}
          />
        </Field>
        {slugChangedAfterPublish && (
          <p role="status" className="mt-2 rounded-lg bg-accent-soft px-3 py-2 text-xs text-ink">
            This post is already published. Changing the URL is fine — the old address <strong>/blogs/{initial.slug}</strong> will redirect here (301) automatically.
          </p>
        )}
      </Section>

      <Section title="Cover image" open={!post.coverUrl}>
        {post.coverUrl && <FocalPicker src={post.coverUrl} value={post.coverFocal} onChange={(v) => update("coverFocal", v)} />}
        <input
          id="post-cover"
          type="file"
          aria-label="Upload cover image"
          accept="image/jpeg,image/png,image/webp"
          disabled={uploading}
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const url = await upload(f);
            if (url) {
              update("coverUrl", url);
              update("coverFocal", "");
            }
            e.target.value = "";
          }}
          className="mt-2 block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-primary-soft file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary"
        />
        <p className="mt-1 text-xs text-muted">JPG, PNG or WebP. Resized to 2400 px in your browser; 5 MB max.</p>
        <Field label="Alt text (required)" htmlFor="post-cover-alt" hint="Describe what the photo shows" error={post.coverUrl && !post.coverAlt.trim() ? "Needed before publishing" : null}>
          <input id="post-cover-alt" value={post.coverAlt} onChange={(e) => update("coverAlt", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Caption" htmlFor="post-cover-caption" hint="Say “Representative image” unless the photo really is from the place.">
          <input id="post-cover-caption" value={post.coverCaption} onChange={(e) => update("coverCaption", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Credit" htmlFor="post-cover-credit" hint="e.g. Photo: Name, CC BY-SA 4.0, via Wikimedia Commons">
          <input id="post-cover-credit" value={post.coverCredit} onChange={(e) => update("coverCredit", e.target.value)} className={inputCls} />
        </Field>
      </Section>

      <Section title="SEO">
        <Field
          label="SEO title"
          htmlFor="post-seo-title"
          hint={<span className={cn(titleLen > 60 && "text-primary")}>{post.seoTitle.length}/60 ideal{!post.seoTitle && " — uses the title when empty"}</span>}
        >
          <input id="post-seo-title" maxLength={100} value={post.seoTitle} onChange={(e) => update("seoTitle", e.target.value)} className={inputCls} />
        </Field>
        <Field
          label="Meta description"
          htmlFor="post-seo-desc"
          hint={<span className={cn(descLen > 160 ? "text-primary" : descLen >= 150 ? "text-[#21603a]" : "")}>{descLen}/160 — aim for 150–160</span>}
        >
          <textarea id="post-seo-desc" rows={3} maxLength={170} value={post.seoDescription} onChange={(e) => update("seoDescription", e.target.value)} className={inputCls} />
        </Field>
        <SeoPreview title={post.seoTitle || post.title} description={post.seoDescription || post.excerpt} slug={post.slug} />
      </Section>

      <Section title="Links">
        <LinkTools
          editor={editor}
          boxes={{
            planVisit: clean(post.planVisit).length,
            glossary: clean(post.glossary).length,
            furtherReading: clean(post.furtherReading).length,
            tags: post.tags.length,
            headings: (editor?.getJSON().content ?? []).filter((n) => n.type === "heading" && n.attrs?.level === 2).length,
            hasAuthor: Boolean(post.authorId),
          }}
        />
      </Section>

      <Section title="Article extras">
        <Field label="Title emphasis" htmlFor="post-emph" hint="A phrase from the title shown in gold italics, e.g. “Everyone Must Experience”.">
          <input id="post-emph" value={post.titleEmphasis} onChange={(e) => update("titleEmphasis", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Pull quote" htmlFor="post-pull" hint="Quote one of the author's own sentences; shown after the introduction.">
          <textarea id="post-pull" rows={3} maxLength={400} value={post.pullQuote} onChange={(e) => update("pullQuote", e.target.value)} className={inputCls} />
        </Field>
        <RowsEditor<KeyFact & Record<string, string>>
          title="At a glance (key facts)"
          rows={post.keyFacts as (KeyFact & Record<string, string>)[]}
          empty={{ label: "", value: "" }}
          fields={[{ key: "label", label: "Label (e.g. When)", wide: true }, { key: "value", label: "Value", wide: true }]}
          onChange={(rows) => update("keyFacts", rows)}
        />
        <RowsEditor<PlanItem & Record<string, string>>
          title="Plan your visit"
          hint="https:// or an internal /path."
          rows={post.planVisit as (PlanItem & Record<string, string>)[]}
          empty={{ group: "", label: "", url: "" }}
          fields={[{ key: "group", label: "Group (e.g. Getting here)", wide: true }, { key: "label", label: "Link text", wide: true }, { key: "url", label: "URL", wide: true }]}
          onChange={(rows) => update("planVisit", rows)}
        />
        <RowsEditor<GlossaryItem & Record<string, string>>
          title="Glossary"
          rows={post.glossary as (GlossaryItem & Record<string, string>)[]}
          empty={{ term: "", definition: "", url: "", source: "" }}
          fields={[{ key: "term", label: "Term", wide: true }, { key: "definition", label: "Definition", wide: true }, { key: "url", label: "Learn-more URL", wide: true }, { key: "source", label: "Source name", wide: true }]}
          onChange={(rows) => update("glossary", rows)}
        />
        <RowsEditor<ReadingItem & Record<string, string>>
          title="Further reading & sources"
          rows={post.furtherReading as (ReadingItem & Record<string, string>)[]}
          empty={{ title: "", url: "", publisher: "" }}
          fields={[{ key: "title", label: "Title", wide: true }, { key: "url", label: "URL", wide: true }, { key: "publisher", label: "Publisher", wide: true }]}
          onChange={(rows) => update("furtherReading", rows)}
        />
      </Section>
    </div>
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      {/* ── Writing canvas ── */}
      <div className="min-w-0" onBlurCapture={(e) => e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement ? autosave() : undefined}>
        {backup && (
          <div role="status" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-accent-soft px-4 py-3 text-sm">
            <span>This browser kept unsaved edits from {new Date(backup.at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", timeStyle: "short", dateStyle: "medium" })}.</span>
            <span className="flex gap-2">
              <button
                type="button"
                className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white"
                onClick={() => {
                  editor?.commands.setContent(backup.json, { emitUpdate: true });
                  update("title", backup.title);
                  setBackup(null);
                }}
              >
                Restore them
              </button>
              <button type="button" className="rounded-full border border-border px-3 py-1 text-xs font-semibold" onClick={() => { if (backupKey) localStorage.removeItem(backupKey); setBackup(null); }}>
                Discard
              </button>
            </span>
          </div>
        )}
        <div className="rounded-2xl border border-border bg-white">
          <div className="px-6 pt-6">
            <label htmlFor="post-title" className="sr-only">Title</label>
            <textarea
              id="post-title"
              rows={2}
              value={post.title}
              onChange={(e) => update("title", e.target.value.replace(/\n/g, " "))}
              placeholder="Title"
              className="w-full resize-none border-0 bg-transparent font-display text-[34px] font-bold leading-tight text-ink placeholder:text-muted/60 focus:outline-none md:text-[42px]"
            />
            <label htmlFor="post-standfirst" className="sr-only">Standfirst</label>
            <textarea
              id="post-standfirst"
              rows={2}
              maxLength={320}
              value={post.standfirst}
              onChange={(e) => update("standfirst", e.target.value)}
              placeholder="Standfirst — one or two sentences under the title (optional)"
              className="mt-1 w-full resize-none border-0 bg-transparent text-[19px] leading-relaxed text-muted placeholder:text-muted/60 focus:outline-none"
            />
          </div>
          <div className="sticky top-0 z-10 border-y border-border bg-bg">
            <Toolbar editor={editor} onImage={(f) => setPendingImage(f)} uploading={uploading} onLink={() => setLinkOpen((o) => !o)} linkOpen={linkOpen} />
            {linkOpen && editor && <LinkPanel editor={editor} routes={routes} onClose={() => setLinkOpen(false)} />}
          </div>
          <EditorContent editor={editor} />
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <DocxImportButton editor={editor} onError={(m) => showToast({ kind: "error", text: m })} onImported={() => showToast({ kind: "ok", text: "Word document imported. Check headings and links, then save." })} />
          <p className="text-xs text-muted">Tip: paste from Word or Google Docs — headings, bold, italics and links are kept; fonts and colours are dropped.</p>
        </div>
      </div>

      {/* ── Settings: sidebar on desktop, drawer on mobile ── */}
      <aside
        aria-label="Post settings"
        className={cn(
          "lg:block",
          drawerOpen ? "fixed inset-0 z-[70] overflow-y-auto bg-bg-alt p-4 pb-24" : "hidden",
        )}
      >
        <div className="mb-3 flex items-center justify-between lg:hidden">
          <h2 className="text-lg font-bold text-primary">Post settings</h2>
          <button type="button" onClick={() => setDrawerOpen(false)} aria-label="Close settings" className="rounded-full p-2 hover:bg-primary-soft"><X size={18} aria-hidden /></button>
        </div>
        {settings}
      </aside>
      <button
        type="button"
        onClick={() => setDrawerOpen(true)}
        className="fixed bottom-5 right-5 z-[60] inline-flex items-center gap-2 rounded-full bg-dark px-5 py-3 text-sm font-semibold text-cream shadow-lg lg:hidden"
      >
        <Settings2 size={16} aria-hidden /> Settings · {liveStatus}
      </button>

      <ImageDialog
        file={pendingImage}
        uploading={uploading}
        onCancel={() => setPendingImage(null)}
        onInsert={async (alt, caption) => {
          if (!pendingImage || !editor) return;
          const url = await upload(pendingImage);
          setPendingImage(null);
          if (url) editor.chain().focus().setImage({ src: url, alt, title: caption || undefined }).run();
        }}
      />
      <HistoryDrawer
        postId={postId}
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onRestored={(title, content) => {
          editor?.commands.setContent(content as Record<string, unknown>, { emitUpdate: false });
          setPost((p) => ({ ...p, title }));
          setDirty(false);
          setLastSaved(Date.now());
          showToast({ kind: "ok", text: "Older version restored." });
        }}
      />
      {toast && (
        <div role={toast.kind === "error" ? "alert" : "status"} className={cn("fixed bottom-20 left-1/2 z-[90] -translate-x-1/2 rounded-full px-5 py-3 text-sm font-semibold shadow-lg lg:bottom-6", toast.kind === "ok" ? "bg-dark text-cream" : "bg-primary text-white")}>
          {toast.text}
        </div>
      )}
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-ink focus:border-primary focus:outline-none";
const secondaryBtn = "rounded-full border border-border bg-white px-4 py-2.5 text-sm font-semibold text-ink hover:border-primary disabled:opacity-60";

function Section({ title, open = false, children }: { title: string; open?: boolean; children: React.ReactNode }) {
  return (
    <details open={open} className="group rounded-2xl border border-border bg-surface">
      <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-3.5 text-xs font-bold uppercase tracking-[0.14em] text-accent-ink">
        {title}
        <span aria-hidden className="transition-transform group-open:rotate-180">▾</span>
      </summary>
      <div className="space-y-4 px-5 pb-5">{children}</div>
    </details>
  );
}

function Field({ label, htmlFor, hint, error, className, children }: { label: string; htmlFor: string; hint?: React.ReactNode; error?: string | null; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-ink/80">{label}</label>
      {children}
      {error ? <p role="alert" className="mt-1 text-xs text-primary">{error}</p> : hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

function Toolbar({ editor, onImage, uploading, onLink, linkOpen }: { editor: Editor | null; onImage: (f: File) => void; uploading: boolean; onLink: () => void; linkOpen: boolean }) {
  const fileId = useId();
  if (!editor) return <div className="h-11" />;
  const c = () => editor.chain().focus();
  const items: { label: string; icon: typeof Bold; run: () => void; active?: boolean; disabled?: boolean }[] = [
    { label: "Heading 2", icon: Heading2, run: () => c().toggleHeading({ level: 2 }).run(), active: editor.isActive("heading", { level: 2 }) },
    { label: "Heading 3", icon: Heading3, run: () => c().toggleHeading({ level: 3 }).run(), active: editor.isActive("heading", { level: 3 }) },
    { label: "Bold", icon: Bold, run: () => c().toggleBold().run(), active: editor.isActive("bold") },
    { label: "Italic", icon: Italic, run: () => c().toggleItalic().run(), active: editor.isActive("italic") },
    { label: "Underline", icon: Underline, run: () => c().toggleUnderline().run(), active: editor.isActive("underline") },
    { label: "Bullet list", icon: List, run: () => c().toggleBulletList().run(), active: editor.isActive("bulletList") },
    { label: "Numbered list", icon: ListOrdered, run: () => c().toggleOrderedList().run(), active: editor.isActive("orderedList") },
    { label: "Quote", icon: Quote, run: () => c().toggleBlockquote().run(), active: editor.isActive("blockquote") },
    { label: "Add or edit link", icon: Link2, run: onLink, active: linkOpen || editor.isActive("link") },
    { label: "Remove link", icon: Link2Off, run: () => c().extendMarkRange("link").unsetLink().run(), disabled: !editor.isActive("link") },
    { label: uploading ? "Uploading…" : "Image", icon: ImagePlus, run: () => document.getElementById(fileId)?.click(), disabled: uploading },
    {
      label: "YouTube video",
      icon: Video,
      run: () => {
        const url = window.prompt("YouTube video URL");
        if (url && /^https:\/\/(www\.)?(youtube\.com|youtu\.be)\//.test(url.trim())) editor.commands.setYoutubeVideo({ src: url.trim() });
        else if (url) window.alert("Please paste a youtube.com or youtu.be link.");
      },
    },
    { label: "Divider", icon: Minus, run: () => c().setHorizontalRule().run() },
    { label: "Undo", icon: Undo2, run: () => c().undo().run(), disabled: !editor.can().undo() },
    { label: "Redo", icon: Redo2, run: () => c().redo().run(), disabled: !editor.can().redo() },
  ];
  return (
    <div role="toolbar" aria-label="Formatting" className="flex flex-wrap gap-0.5 p-1.5">
      {items.map((it) => (
        <button
          key={it.label}
          type="button"
          title={it.label}
          aria-label={it.label}
          aria-pressed={it.active ?? undefined}
          disabled={it.disabled}
          onClick={it.run}
          className={cn("inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink hover:bg-primary-soft disabled:opacity-40", it.active && "bg-primary text-white hover:bg-primary")}
        >
          <it.icon size={17} aria-hidden />
        </button>
      ))}
      <input
        id={fileId}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) onImage(f);
        }}
      />
    </div>
  );
}
