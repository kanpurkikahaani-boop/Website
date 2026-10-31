import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/sections/Breadcrumbs";
import { Section } from "@/components/ui/Section";
import { ImageCard } from "@/components/ui/ImageCard";
import { JsonLd } from "@/components/seo/JsonLd";
import { AuthorAvatar } from "@/components/blog/ArticleSections";
import { absoluteUrl, site } from "@/data/site";
import { cityName } from "@/lib/city-names";
import { getAllAuthors, getAuthor, getPublishedPosts } from "@/lib/posts";
import { buildMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/utils";

export const revalidate = 300;

export async function generateStaticParams() {
  return (await getAllAuthors()).map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: PageProps<"/blogs/author/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const a = await getAuthor(slug);
  if (!a) return { title: "Writer not found", robots: { index: false } };
  return buildMetadata({
    title: `${a.name} — Stories on Kanpur Ki Kahaani`,
    description: `${a.bio || `Read every story by ${a.name}`} Travel journals, festivals and food from Kanpur and nearby cities by ${a.name}.`.slice(0, 160),
    path: `/blogs/author/${a.slug}`,
    ogImage: "/og/blogs",
  });
}

export default async function AuthorPage({ params }: PageProps<"/blogs/author/[slug]">) {
  const { slug } = await params;
  const author = await getAuthor(slug);
  if (!author) notFound();
  const { posts } = await getPublishedPosts({ author: slug });

  return (
    <>
      <Breadcrumbs crumbs={[{ name: "Home", href: "/" }, { name: "Blogs", href: "/blogs" }, { name: author.name }]} />
      <section className="bg-dark">
        <div className="container-site flex flex-col items-center gap-5 py-14 text-center md:flex-row md:text-left">
          <AuthorAvatar author={author} name={author.name} size={96} />
          <div>
            <p className="eyebrow text-accent">Writer</p>
            <h1 className="mt-2 text-[36px] font-bold text-white md:text-[48px]">{author.name}</h1>
            {author.bio && <p className="mt-2 max-w-xl text-cream/80">{author.bio}</p>}
          </div>
        </div>
      </section>
      <Section labelledBy="author-posts">
        <h2 id="author-posts" className="mb-8 text-[28px] font-bold text-primary">
          Stories by {author.name}
        </h2>
        {posts.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-8 text-center">No published stories yet.</p>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <li key={p.slug}>
                <ImageCard
                  image={p.coverUrl ?? "/images/kanpur/blog-cover.jpg"}
                  alt={p.coverAlt ?? p.title}
                  imageLabel={p.title}
                  eyebrow={cityName(p.city) || "Story"}
                  title={p.title}
                  description={p.excerpt}
                  chips={[formatDate(p.publishedAt.slice(0, 10)), `${p.readingMinutes} min read`]}
                  href={`/blogs/${p.slug}`}
                />
              </li>
            ))}
          </ul>
        )}
      </Section>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ProfilePage",
          mainEntity: {
            "@type": "Person",
            name: author.name,
            url: absoluteUrl(`/blogs/author/${author.slug}`),
            ...(author.bio ? { description: author.bio } : {}),
            ...(author.avatarUrl ? { image: author.avatarUrl } : {}),
            sameAs: [author.website, author.instagram].filter(Boolean),
            worksFor: { "@type": "Organization", name: site.name, url: site.url },
          },
        }}
      />
    </>
  );
}
