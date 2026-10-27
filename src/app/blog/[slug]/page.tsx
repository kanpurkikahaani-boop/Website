import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Clock } from "lucide-react";
import { Breadcrumbs } from "@/components/sections/Breadcrumbs";
import { ShareButtons } from "@/components/sections/ShareButtons";
import { Section } from "@/components/ui/Section";
import { ImageCard } from "@/components/ui/ImageCard";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { LinkButton } from "@/components/ui/Button";
import { JsonLd } from "@/components/seo/JsonLd";
import { getPost, posts } from "@/data/blog";
import { site, absoluteUrl } from "@/data/site";
import { hasLogo } from "@/lib/assets";
import { buildMetadata } from "@/lib/seo";
import { formatDate, readingTime } from "@/lib/utils";

export const dynamicParams = false;

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return buildMetadata({
    title: `${post.title} | Kanpur Ki Kahaani`,
    description: post.description,
    path: `/blog/${post.slug}`,
    ogImage: `/og/blog-${post.slug}`,
    type: "article",
    publishedTime: post.date,
  });
}

export default async function BlogPostPage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const blocks = post.body.split(/\n\s*\n/).map((b) => b.trim());
  const url = absoluteUrl(`/blog/${post.slug}`);
  const related = post.related.map(getPost).filter((p): p is NonNullable<typeof p> => !!p);
  const minutes = readingTime(post.body);

  return (
    <>
      <article>
        <header className="relative overflow-hidden bg-dark">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-32 -top-40 h-[480px] w-[480px] rounded-full opacity-60 blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(200,144,46,0.38) 0%, rgba(142,43,30,0.22) 45%, transparent 70%)" }}
          />
          <div className="container-site relative max-w-3xl py-14 md:py-20">
            <p className="eyebrow text-accent">Stories · {post.category}</p>
            <h1 className="mt-3 text-[34px] font-bold leading-[1.1] tracking-tight text-white md:text-[52px]">{post.title}</h1>
            <p className="mt-4 text-cream/75">{post.excerpt}</p>
            <p className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-cream/70">
              <span>By {post.author}</span>
              <time dateTime={post.date}>{formatDate(post.date)}</time>
              <span className="inline-flex items-center gap-1.5">
                <Clock size={14} aria-hidden className="text-accent" /> {minutes} min read
              </span>
            </p>
          </div>
        </header>
        <Breadcrumbs crumbs={[{ name: "Home", href: "/" }, { name: "Stories", href: "/#stories" }, { name: post.title }]} />

        <div className="container-site max-w-3xl py-10 md:py-14">
          <div className="relative aspect-[16/9] overflow-hidden rounded-3xl">
            <ImageWithFallback src={post.image} alt={post.alt} label={post.title} sublabel={post.category} fill priority sizes="(min-width: 768px) 720px, 100vw" className="object-cover" />
          </div>
          <ShareButtons className="mt-6" url={url} title={post.title} context={`blog_${post.slug}`} />
          <div className="mt-8 space-y-5 text-[16.5px] leading-[1.8] text-ink/85">
            {blocks.map((b, i) =>
              b.startsWith("## ") ? (
                <h2 key={i} className="pt-4 text-[26px] font-bold leading-tight text-primary">
                  {b.slice(3)}
                </h2>
              ) : (
                <p key={i}>{b}</p>
              ),
            )}
          </div>
          <div className="mt-10 flex flex-col gap-6 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between">
            <ShareButtons url={url} title={post.title} context={`blog_${post.slug}_end`} />
            <LinkButton href="/tourism#planner">Plan your Kanpur trip</LinkButton>
          </div>
        </div>
      </article>

      <Section tone="alt" labelledBy="related-title">
        <p className="eyebrow">Keep reading</p>
        <h2 id="related-title" className="mt-2 mb-8 text-[30px] font-bold text-primary md:text-[36px]">
          Related Posts
        </h2>
        <ul className="grid gap-6 sm:grid-cols-2">
          {related.map((p) => (
            <li key={p.slug}>
              <ImageCard
                image={p.image}
                alt={p.alt}
                imageLabel={p.title}
                eyebrow={p.category}
                title={p.title}
                description={p.excerpt}
                chips={[formatDate(p.date), `${readingTime(p.body)} min read`]}
                href={`/blog/${p.slug}`}
              />
            </li>
          ))}
        </ul>
      </Section>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description: post.description,
          datePublished: post.date,
          dateModified: post.date,
          author: { "@type": "Organization", name: post.author, url: site.url },
          publisher: {
            "@type": "Organization",
            name: site.name,
            logo: { "@type": "ImageObject", url: hasLogo ? absoluteUrl("/brand/logo.png") : absoluteUrl("/icon") },
          },
          image: absoluteUrl(`/og/blog-${post.slug}`),
          mainEntityOfPage: url,
          wordCount: post.body.split(/\s+/).length,
        }}
      />
    </>
  );
}
