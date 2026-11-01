import { createSessionClient } from "@/lib/supabase/server";
import { AuthorCard } from "./AuthorCard";
import { NewAuthor } from "./NewAuthor";

export const metadata = { title: "Authors" };

export default async function AuthorsPage() {
  const db = await createSessionClient();
  const [{ data: authors, error }, { data: posts }] = await Promise.all([
    db!.from("authors").select("*").order("name"),
    db!.from("posts").select("author_id").is("deleted_at", null),
  ]);
  const counts = new Map<string, number>();
  for (const p of posts ?? []) if (p.author_id) counts.set(p.author_id, (counts.get(p.author_id) ?? 0) + 1);
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Admin</p>
          <h1 className="mt-1 text-[32px] font-bold text-primary">Authors</h1>
          <p className="mt-1 text-sm">Writers shown in bylines and on their author pages.</p>
        </div>
        <NewAuthor />
      </div>
      {error && <p role="alert" className="mt-6 text-primary">Couldn&apos;t load authors: {error.message}</p>}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {(authors ?? []).map((a) => (
          <AuthorCard
            key={a.id}
            author={{ id: a.id, slug: a.slug, name: a.name, bio: a.bio ?? "", avatarUrl: a.avatar_url ?? "", website: a.website ?? "", instagram: a.instagram ?? "", title: a.title ?? "", posts: counts.get(a.id) ?? 0 }}
          />
        ))}
      </div>
    </>
  );
}
