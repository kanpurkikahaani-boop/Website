"use client";

import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import {
  Bold, Heading2, Heading3, ImagePlus, Italic, Link2, List, ListOrdered, Minus, Quote, Redo2, Underline, Undo2, Video,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState, useTransition } from "react";
import { createAuthor, isSlugAvailable, savePost } from "@/app/admin/(panel)/blogs/actions";
import { BLOG_CATEGORIES } from "@/lib/blog-categories";
import type { GlossaryItem, KeyFact, PlanItem, ReadingItem } from "@/lib/posts";
import { LinkTools } from "./LinkTools";
import { RowsEditor } from "./RowsEditor";
import { blogExtensions } from "@/lib/content/extensions";
import { CITY_OPTIONS } from "@/lib/city-names";
import { slugifyTitle, slugRe } from "@/lib/posts-admin-schema";
import { uploadBlogImage } from "@/lib/upload-image";
import { cn } from "@/lib/utils";

export interface EditorPost {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  contentJson: Record<string, unknown> | null;
  coverUrl: string;
  coverAlt: string;
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
  keyFacts: [] as KeyFact[],
  furtherReading: [] as ReadingItem[],
  glossary: [] as GlossaryItem[],
  planVisit: [] as PlanItem[],
};

const clean = <T extends Record<string, string>>(rows: T[]) => rows.filter((r) => Object.values(r).some((v) => v.trim()));

const AUTOSAVE_MS = 30_000;

/** datetime-local (interpreted as IST) → ISO string */
function istToIso(local: string) {
  return local ? new Date(`${local}:00+05:30`).toISOString() : "";
}

export function PostEditor({ initial, authors: initialAuthors }: { initial: EditorPost; authors: AuthorOption[] }) {
  const [authors, setAuthors] = useState(initialAuthors);
  const [newAuthor, setNewAuthor] = useState("");
  const router = useRouter();
  const [post, setPost] = useState<EditorPost>(initial);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.id));
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, startSave] = useTransition();
  const idRef = useRef(initial.id);

  const editor = useEditor({
    extensions: [...blogExtensions, Placeholder.configure({ placeholder: "Start writing the story…" })],
    content: initial.contentJson ?? undefined,
    immediatelyRender: false,
    editorProps: { attributes: { class: "prose-kkk min-h-[420px] px-5 py-4 focus:outline-none", "aria-label": "Post body" } },
    onUpdate: () => setDirty(true),
  });

  const update = <K extends keyof EditorPost>(key: K, value: EditorPost[K]) => {
    setPost((p) => {
      const next = { ...p, [key]: value };
      if (key === "title" && !slugTouched) next.slug = slugifyTitle(String(value));
      return next;
    });
    setDirty(true);
  };

  const save = useCallback(
    (nextStatus?: "draft" | "published", opts: { quiet?: boolean; preview?: boolean } = {}) =>
      new Promise<boolean>((resolve) => {
        if (!editor) return resolve(false);
        const target = nextStatus ?? post.status;
        if (!slugRe.test(post.slug)) {
          setSlugError("Use lowercase letters, numbers and hyphens");
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
            keyFacts: clean(post.keyFacts as unknown as Record<string, string>[]) as unknown as KeyFact[],
            furtherReading: clean(post.furtherReading as unknown as Record<string, string>[]) as unknown as ReadingItem[],
            glossary: clean(post.glossary as unknown as Record<string, string>[]) as unknown as GlossaryItem[],
            planVisit: clean(post.planVisit as unknown as Record<string, string>[]) as unknown as PlanItem[],
          });
          if (!res.ok) {
            setError(res.error);
            return resolve(false);
          }
          setDirty(false);
          setPost((p) => ({ ...p, status: target }));
          setStatus(
            `${opts.quiet ? "Autosaved" : target === "published" ? "Published" : "Saved"} at ${new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`,
          );
          if (!idRef.current) {
            idRef.current = res.id;
            router.replace(`/admin/blogs/${res.id}/edit`);
          }
          if (opts.preview) window.open(`/admin/blogs/${res.id}/preview`, "_blank", "noopener");
          resolve(true);
        });
      }),
    [editor, post, router],
  );

  // Autosave drafts every 30s when there are unsaved changes. Published posts are never autosaved,
  // so half-finished edits don't go live.
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  }, [save]);
  useEffect(() => {
    const t = setInterval(() => {
      if (dirty && post.status === "draft" && post.title.trim().length >= 3) void saveRef.current("draft", { quiet: true });
    }, AUTOSAVE_MS);
    return () => clearInterval(t);
  }, [dirty, post.status, post.title]);

  // Warn before leaving with unsaved changes
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

  const descLen = post.seoDescription.length;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="min-w-0 space-y-5">
        <Field label="Title" htmlFor="post-title">
          <input id="post-title" value={post.title} onChange={(e) => update("title", e.target.value)} className={inputCls + " text-lg font-semibold"} placeholder="A story worth telling" />
        </Field>
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
        <Field label="Excerpt" htmlFor="post-excerpt" hint={`${post.excerpt.length}/320 — shown on cards and in search results`}>
          <textarea id="post-excerpt" rows={2} maxLength={320} value={post.excerpt} onChange={(e) => update("excerpt", e.target.value)} className={inputCls} />
        </Field>

        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          <Toolbar editor={editor} onImage={upload} uploading={uploading} />
          <EditorContent editor={editor} />
        </div>

        <LinkTools
          editor={editor}
          boxes={{
            planVisit: clean(post.planVisit as unknown as Record<string, string>[]).length,
            glossary: clean(post.glossary as unknown as Record<string, string>[]).length,
            furtherReading: clean(post.furtherReading as unknown as Record<string, string>[]).length,
            tags: post.tags.length,
            headings: (editor?.getJSON().content ?? []).filter((n) => n.type === "heading" && n.attrs?.level === 2).length,
            hasAuthor: Boolean(post.authorId),
          }}
        />

        <fieldset className="space-y-4 rounded-2xl border border-border bg-surface p-5">
          <legend className="px-1 text-xs font-bold uppercase tracking-[0.14em] text-accent-ink">Article details</legend>
          <div className="grid gap-4 sm:grid-cols-2">
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
          </div>
          <Field label="Standfirst" htmlFor="post-standfirst" hint="Shown under the title. Defaults to the excerpt.">
            <textarea id="post-standfirst" rows={2} maxLength={320} value={post.standfirst} onChange={(e) => update("standfirst", e.target.value)} className={inputCls} />
          </Field>
          <Field label="Title emphasis (optional)" htmlFor="post-emph" hint="A phrase from the title to show in gold italics, e.g. “Everyone Must Experience”.">
            <input id="post-emph" value={post.titleEmphasis} onChange={(e) => update("titleEmphasis", e.target.value)} className={inputCls} />
          </Field>
          <Field label="Pull quote" htmlFor="post-pull" hint="Quote one of the author's own sentences; shown after the introduction.">
            <textarea id="post-pull" rows={2} maxLength={400} value={post.pullQuote} onChange={(e) => update("pullQuote", e.target.value)} className={inputCls} />
          </Field>
        </fieldset>

        <RowsEditor<KeyFact & Record<string, string>>
          title="At a glance (key facts)"
          hint="Site-written summary box shown after the introduction."
          rows={post.keyFacts as (KeyFact & Record<string, string>)[]}
          empty={{ label: "", value: "" }}
          fields={[{ key: "label", label: "Label (e.g. When)" }, { key: "value", label: "Value" }]}
          onChange={(rows) => update("keyFacts", rows)}
        />
        <RowsEditor<PlanItem & Record<string, string>>
          title="Plan your visit"
          hint="Grouped links in the sidebar card. Use https:// or an internal /path."
          rows={post.planVisit as (PlanItem & Record<string, string>)[]}
          empty={{ group: "", label: "", url: "" }}
          fields={[{ key: "group", label: "Group (e.g. Getting here)" }, { key: "label", label: "Link text" }, { key: "url", label: "URL", wide: true }]}
          onChange={(rows) => update("planVisit", rows)}
        />
        <RowsEditor<GlossaryItem & Record<string, string>>
          title="Glossary"
          hint="One-line definitions written by the site, each with a “Learn more” link."
          rows={post.glossary as (GlossaryItem & Record<string, string>)[]}
          empty={{ term: "", definition: "", url: "", source: "" }}
          fields={[{ key: "term", label: "Term" }, { key: "source", label: "Source name" }, { key: "definition", label: "Definition", wide: true }, { key: "url", label: "Learn-more URL", wide: true }]}
          onChange={(rows) => update("glossary", rows)}
        />
        <RowsEditor<ReadingItem & Record<string, string>>
          title="Further reading & sources"
          rows={post.furtherReading as (ReadingItem & Record<string, string>)[]}
          empty={{ title: "", url: "", publisher: "" }}
          fields={[{ key: "title", label: "Title" }, { key: "publisher", label: "Publisher" }, { key: "url", label: "URL", wide: true }]}
          onChange={(rows) => update("furtherReading", rows)}
        />
      </div>

      <aside className="space-y-5">
        <div className="space-y-5">
          <div className="rounded-2xl border border-border bg-surface p-5">
            <p className="text-sm">
              Status: <strong className={post.status === "published" ? "text-[#21603a]" : "text-accent-ink"}>{post.status === "published" ? "Published" : "Draft"}</strong>
              {dirty && <span className="ml-2 text-xs text-primary">• unsaved changes</span>}
            </p>
            <p aria-live="polite" className="mt-1 min-h-4 text-xs text-muted">{saving ? "Saving…" : status}</p>
            {error && <p role="alert" className="mt-2 rounded-lg bg-primary-soft px-3 py-2 text-sm text-primary">{error}</p>}
            <div className="mt-4 grid gap-2">
              <button type="button" disabled={saving} onClick={() => save("published")} className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60">
                {post.status === "published" ? "Update published post" : "Publish"}
              </button>
              <button type="button" disabled={saving} onClick={() => save("draft")} className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-ink hover:border-primary disabled:opacity-60">
                {post.status === "published" ? "Unpublish & save as draft" : "Save draft"}
              </button>
              <button type="button" disabled={saving} onClick={() => save(undefined, { preview: true })} className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-ink hover:border-primary disabled:opacity-60">
                Save & preview ↗
              </button>
            </div>
            <Field label="Publish date (IST)" htmlFor="post-date" className="mt-4">
              <input id="post-date" type="datetime-local" value={post.publishedAt} onChange={(e) => update("publishedAt", e.target.value)} className={inputCls} />
            </Field>
          </div>

          <div className="space-y-4 rounded-2xl border border-border bg-surface p-5">
            <Field label="Cover image" htmlFor="post-cover">
              {post.coverUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- admin preview of an uploaded file
                <img src={post.coverUrl} alt="" className="mb-2 aspect-[16/9] w-full rounded-xl object-cover" />
              )}
              <input
                id="post-cover"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                disabled={uploading}
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const url = await upload(f);
                  if (url) update("coverUrl", url);
                  e.target.value = "";
                }}
                className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-primary-soft file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary"
              />
            </Field>
            <Field label="Cover caption" htmlFor="post-cover-caption" hint="Say “Representative image” unless the photo really is from the place.">
              <input id="post-cover-caption" value={post.coverCaption} onChange={(e) => update("coverCaption", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Photo credit" htmlFor="post-cover-credit" hint="e.g. Photo: Name, CC BY-SA 4.0, via Wikimedia Commons">
              <input id="post-cover-credit" value={post.coverCredit} onChange={(e) => update("coverCredit", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Cover alt text" htmlFor="post-cover-alt" hint="Describe what the photo shows">
              <input id="post-cover-alt" value={post.coverAlt} onChange={(e) => update("coverAlt", e.target.value)} className={inputCls} />
            </Field>
            <Field label="City" htmlFor="post-city">
              <select id="post-city" value={post.city} onChange={(e) => update("city", e.target.value)} className={inputCls}>
                <option value="">— none —</option>
                {CITY_OPTIONS.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Tags" htmlFor="post-tags" hint="Comma-separated, e.g. food, street-food">
              <input
                id="post-tags"
                defaultValue={post.tags.join(", ")}
                onBlur={(e) =>
                  update("tags", [...new Set(e.target.value.split(",").map((t) => t.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-")).filter(Boolean))].slice(0, 10))
                }
                className={inputCls}
              />
            </Field>
          </div>

          <div className="space-y-4 rounded-2xl border border-border bg-surface p-5">
            <Field label="SEO title" htmlFor="post-seo-title" hint={`${post.seoTitle.length}/100 — defaults to the title`}>
              <input id="post-seo-title" maxLength={100} value={post.seoTitle} onChange={(e) => update("seoTitle", e.target.value)} className={inputCls} />
            </Field>
            <Field
              label="Meta description"
              htmlFor="post-seo-desc"
              hint={<span className={cn(descLen > 160 ? "text-primary" : descLen >= 150 ? "text-[#21603a]" : "")}>{descLen}/160 — aim for 150–160</span>}
            >
              <textarea id="post-seo-desc" rows={3} maxLength={170} value={post.seoDescription} onChange={(e) => update("seoDescription", e.target.value)} className={inputCls} />
            </Field>
          </div>
        </div>
      </aside>
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-ink focus:border-primary focus:outline-none";

function Field({ label, htmlFor, hint, error, className, children }: { label: string; htmlFor: string; hint?: React.ReactNode; error?: string | null; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-bold uppercase tracking-[0.14em] text-accent-ink">{label}</label>
      {children}
      {error ? <p role="alert" className="mt-1 text-xs text-primary">{error}</p> : hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

function Toolbar({ editor, onImage, uploading }: { editor: Editor | null; onImage: (f: File) => Promise<string | null>; uploading: boolean }) {
  const fileId = useId();
  if (!editor) return <div className="h-11 border-b border-border bg-bg" />;
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
    {
      label: "Link",
      icon: Link2,
      active: editor.isActive("link"),
      run: () => {
        const prev = editor.getAttributes("link").href as string | undefined;
        const url = window.prompt("Link URL (https://…). Leave empty to remove.", prev ?? "https://");
        if (url === null) return;
        if (!url.trim()) return c().extendMarkRange("link").unsetLink().run();
        if (!/^(https?:\/\/|mailto:)/.test(url.trim())) return window.alert("Links must start with https://, http:// or mailto:");
        c().extendMarkRange("link").setLink({ href: url.trim() }).run();
      },
    },
    { label: uploading ? "Uploading…" : "Image", icon: ImagePlus, run: () => document.getElementById(fileId)?.click(), disabled: uploading },
    {
      label: "YouTube video",
      icon: Video,
      run: () => {
        const url = window.prompt("YouTube video URL");
        if (url) editor.commands.setYoutubeVideo({ src: url.trim() });
      },
    },
    { label: "Divider", icon: Minus, run: () => c().setHorizontalRule().run() },
    { label: "Undo", icon: Undo2, run: () => c().undo().run(), disabled: !editor.can().undo() },
    { label: "Redo", icon: Redo2, run: () => c().redo().run(), disabled: !editor.can().redo() },
  ];
  return (
    <div role="toolbar" aria-label="Formatting" className="sticky top-0 z-10 flex flex-wrap gap-0.5 border-b border-border bg-bg p-1.5">
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
        accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          const alt = window.prompt("Describe the image (alt text)") ?? "";
          const url = await onImage(f);
          if (url) editor.chain().focus().setImage({ src: url, alt }).run();
        }}
      />
    </div>
  );
}
